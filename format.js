function isNumeric(str) {
    if (typeof str != "string") return false;
    return !isNaN(str) &&
           !isNaN(parseFloat(str));
}

export default function format_message(message, args, user, commands, nonslash_commands, adm) {
    let final_message = "";

    let ci = 0;
    while (ci < message.length) {
        let c = message[ci];

        if (c === "%") {
            ci += 1; c = message[ci];

            let chartoappend = ""
            let format = "";
            while (ci < message.length) {
                c = message[ci];
                if (c === ' ' || c === '"' || c === "'" || c === '`') {
                    chartoappend = c;
                    break;
                }

                format += c;

                ci += 1;
            }

            if (isNumeric(format)) {
                let num = (Number(format) - 1);
                if (!(num < 0) && num <= args.length) {
                    final_message += args[num];
                } else {
                    final_message += '%' + format;
                }
            } else if (format === 'sender') {
                final_message += user;
            } else if (format === 'help') {
                for (let cmdi in commands) {
                    let cmd = commands[cmdi];
                    final_message += '/' + cmd.name;
                    final_message += ' ';
                }

                for (let cmdi in nonslash_commands) {
                    if (cmdi != 0) {
                        final_message += ' ';
                    }

                    let cmd = nonslash_commands[cmdi];
                    final_message += '!' + cmd.name;
                }
            } else if (format === 'adm') {
                final_message += '<@' + adm + '>';
            } else {
                final_message += '%' + format;
            }

            final_message += chartoappend;
        } else {
            final_message += c;
        }

        ci += 1;
    }

    return final_message;
}