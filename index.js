import { compile_expr, run_expr } from './eval.js'
import translate_from_to from './translator.js'
import format_message from './format.js'
import dotenv from 'dotenv'
dotenv.config()

import { REST, Routes, Client, GatewayIntentBits, AttachmentBuilder } from 'discord.js'

const print = console.log

const commands = [
    {
        name: 'ping',
        description: 'Replies with pong!',
        message: 'Pong!',
    },
    {
        name: 'print',
        description: 'Print a given message',
        options: [
            {
                name: 'message',
                type: 3,
                required: true,
                description: 'The message'
            }
        ],
        message: "'%1'",
    },
    {
        name: 'whoami',
        description: 'Print your name with tag',
        message: `Of course you are '%sender'`
    },
    {
        name: 'help',
        description: 'List the available commands',
        message: 'The available commands are: %help'
    },
    {
        name: 'about',
        description: 'Give you a link to the about channel',
        message: `About channel: <#${process.env.GUILD_ABOUT_CHANNEL}>`
    },
    {
        name: 'chad',
        description: 'CALL THE CHAD',
        message: '%adm hey a random guy is calling you! Do you wanna punish him?'
    },
    {
        name: 'addcmd',
        description: 'Add a new command',
        options: [
            {
                name: 'name',
                type: 3,
                required: true,
                description: 'Command name'
            },
            {
                name: 'message',
                type: 3,
                required: true,
                description: 'The message that the command is gonna print'
            }
        ],
        message: 'Command added: `%1`'
    },
    {
        name: 'delcmd',
        description: 'Remove given command',
        options: [
            {
                name: 'name',
                type: 3,
                required: true,
                description: 'The name of the command to be removed'
            }
        ],
        message: 'Command removed: `%1`'
    },
    {
        name: 'eval',
        description: 'Evaluate a given expression',
        options: [
            {
                name: 'expression',
                type: 3,
                required: true,
                description: 'The expression to be evaluated'
            }
        ],
        message: 'Evaluating expression...'
    },
    {
        name: 'translate',
        description: 'Translate from a language to another',
        options: [
            {
                name: 'from',
                type: 3,
                required: true,
                description: 'Input language'
            },
            {
                name: 'to',
                type: 3,
                required: true,
                description: 'Output language'
            },
            {
                name: 'text',
                type: 3,
                required: true,
                description: 'Text to be translated'
            }
        ],
        message: 'Translating text...'
    },
    {
        name: 'meme',
        description: 'Send a meme',
        message: 'Sending meme...'
    }
]

const nonslash_commands = []

/// FUNCTIONS

function generate_command_object(name, message) {
    return {
        name: name,
        message: message
    }
}

/// ADD SLASH COMMANDS

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function refresh_slash_commands() {
    try {
        print('Started refreshing application (/) commands.');
  
        await rest.put(Routes.applicationCommands(process.env.DISCORD_ID), { body: commands });
  
        print('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
}

refresh_slash_commands();

/// HANDLE SLASH COMMANDS

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.on('ready', () => {
    print(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    for (let cmdi in commands) {
        let cmd = commands[cmdi]
        if (interaction.commandName === cmd.name) {
            let args = []
            interaction.options.data.forEach((value) => {
                args.push(value.value);
            });

            let permissionerror = false;

            /// THINGS TO BE EXECUTED BEFORE THE COMMAND MESSAGE

            if (cmd.name === 'addcmd') {
                if (interaction.user.id === process.env.GUILD_ADM) {
                    nonslash_commands.push(generate_command_object(args[0], args[1]));
                } else {
                    permissionerror = true;
                }
            } else if (cmd.name === 'delcmd') {
                if (interaction.user.id === process.env.GUILD_ADM) {
                    for (let command in nonslash_commands) {
                        if (nonslash_commands[command].name == args[0]) {
                            nonslash_commands.splice(command, 1);
                            break;
                        }
                    }
                } else {
                    permissionerror = true;
                }
            }

            /// REPLY WITH THE COMMAND MESSAGE

            if (permissionerror) {
                await interaction.reply(`Only <@${process.env.GUILD_ADM}> XD`);
            } else {
                await interaction.reply(
                    format_message(
                        cmd.message,
                        args,
                        interaction.user.tag,
                        commands,
                        nonslash_commands,
                        process.env.GUILD_ADM
                    )
                );
            }

            /// THINGS TO BE EXECUTED AFTER THE COMMAND MESSAGE

            if (cmd.name === 'eval') {
                try {
                    await interaction.channel.send(args[0] + ' => ' + run_expr(compile_expr(args[0])));
                } catch (err) {
                    await interaction.channel.send('Error evaluating expression: ' + err);
                }
            } else if (cmd.name === 'translate') {
                try {
                    await interaction.channel.send(args[2] + ' -> ' + await translate_from_to(args[0], args[1], args
                    [2]));
                } catch (err) {
                    await interaction.channel.send('Error translating message: ' + err);
                }
            } else if (cmd.name === 'meme') {
                fetch("https://api.humorapi.com/memes/random?api-key=" + process.env.HUMOR_API_URL)
                      .then((response) => {
                          return response.json()
                      })
                      .then((json) => {
                          interaction.channel.send(json.url);
                      });
            }
        }
    }
});

client.on('messageCreate', async (msg) => {
    if (msg.author.id === client.user.id) return;

    if (msg.content.startsWith('!')) {
        let args = msg.content.split(' ');
        args[0] = args[0].substring(0, 0) + args[0].substring(1, args[0].length);

        for (let cmdi in nonslash_commands) {
            let cmd = nonslash_commands[cmdi];

            if (cmd.name === args[0]) {
                args.splice(0, 1);

                await msg.channel.send(
                    format_message(
                        cmd.message,
                        args,
                        msg.author.tag,
                        commands,
                        nonslash_commands,
                        process.env.GUILD_ADM
                    )
                );
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);