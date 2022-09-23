import translate from 'translate'

export default async function translate_from_to(from, to, text) {
    translate.from = from;
    translate.engine = 'google';

    let translated = null;
    try {
        translated = await translate(text, to);
    } catch (err) {
        throw err;
    }

    return translated;
}