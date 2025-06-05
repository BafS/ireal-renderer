/**
 * Get a tempo from the style.
 * @param {string} style
 * @returns {number} The tempo
 */
export function tempoFromStyle(style) {
    const normalizedStyle = style
        .replace('–', '')
        .replace('-', '')
        .replace(':', '')
        .replace('/', '')
        .replace('Ballad', 'Ballad Swing')
        .replace('Waltz', 'Medium Swing')
        .replace('Medium Slow', 'Slow Rock')
        .replace(/ Latin$/, '')
        .replace(/ Pop$/, '')
        .trim()
    ;

    const sylesToTempo = {
        "Afro 128": 110,
        "Ballad Double Time Feel": 60,
        "Ballad Even": 60,
        "Ballad Melodic": 60,
        "Ballad Swing": 60,
        "Blue Note": 120,
        "Bossa Nova": 140,
        "BossaSwing": 160,
        "Doo Doo Cats": 160,
        "Even 8ths": 140,
        "Even 8ths Open": 140,
        "Even 16ths": 90,
        "Guitar Trio": 140,
        "Gypsy Jazz": 180,
        "Latin": 180,
        "LatinSwing": 180,
        "Long Notes": 80,
        "Medium Swing": 120,
        "Medium Up Swing": 160,
        "Medium Up Swing 2": 160,
        "New Orleans Swing": 180,
        "Second Line": 180,
        "Slow Swing": 80,
        "Swing TwoFour": 180,
        "Trad Jazz": 200,
        "Up Tempo Swing": 240,
        "Up Tempo Swing 2": 240,

        "Argentina Tango": 130,
        "Brazil Bossa Acoustic": 140,
        "Brazil Bossa Electric": 120,
        "Brazil Samba": 200,
        "Cuba Bolero": 90,
        "Cuba Cha Cha Cha": 110,
        "Cuba Son Montuno 23": 160,
        "Cuba Son Montuno 32": 160,

        "Bluegrass": 220,
        "Country": 180,
        "Disco": 120,
        "Funk": 140,
        "Glam Funk": 115,
        "House": 120,
        "Reggae": 90,
        "Rock": 115,
        "Rock 12/8": 75,
        "RnB": 95,
        "Shuffle": 130,
        "Slow Rock": 70,
        "Smooth": 85,
        "Soul": 95,
        "Virtual Funk": 90,
    };

    return sylesToTempo[normalizedStyle] || 0;
}
