export class iRealParser {
	/**
	 * The parser cracks up the music string at song.music into several objects, 
	 * one for each cell. iReal Pro works with rows of 16 cell each. The result
	 * is stored at song.cells.
	 * 
	 * Each object has the following properties:
	 *
	 * chord: if non-null, a chord object with these properties:
	 *   note      - the base note (also blank, W = invisible root, p/x/r - pause/bar repeat/double-bar repeat, n - no chord)
	 *   modifiers - the modifiers, like 7, + o etc (string)
	 *   over      - if non-null, another chord object for the under-note
	 *   alternate - if non-null another chord object for the alternate chord 
	 * annots: annotations, a string of:
	 *  *x  - section, like *v, *I, *A, *B etc
	 *  Nx  - repeat bots (N1, N2 etc)
	 *  Q   - coda
	 *  S   - segno
	 *  Txx - measure (T44 = 4/4 etc, but T12 = 12/8)
	 *  U   - END
	 *  f   - fermata
	 *  l   - (letter l) normal notes
	 *  s   - small notes
	 * comments: an array of comment strings
	 * bars: bar specifiers, a string of:
	 *  | - single vertical bar, left
	 *  [ - double bar, left
	 *  ] - double bar, right
	 *  { - repeat bar, left
	 *  } - repeat bar, right
	 *  Z - end bar, right
	 * spacer - a number indicating the number of vertical spacers above this cell
	 * 
	 * @param {Song} song
	 * @returns {undefined}
	 */
	parse(song) {
		var text = song.music;
		var arr = [], headers = [], comments = [];
		var i;
		text = text.trimRight();
		while(text) {
			var found = false;
			for (i = 0; i < iRealParser.regExps.length; i++) {
				var match = iRealParser.regExps[i].exec(text);
				if (match) {
					found = true;
					if (match.length <= 2) {
						match = match[0];
						arr.push(match);
						text = text.substr(match.length);
					}
					else {
						// a chord
						arr.push(match);
						text = text.substr(match[0].length);
					}
					break;
				}
			}
			if (!found) {
				// ignore the comma separator
				if (text[0] !== ',')
					arr.push(text[0]);
				text = text.substr(1);
			}
		}
//		console.log(arr);
		// pass 2: extract prefixes, suffixes, annotations and comments
		var out = [];
		var obj = this.newToken(out);
		var prevobj = null;
		for (i = 0; i < arr.length; i++) {
			var token = arr[i];
			if (token instanceof Array) {
				obj.chord = this.parseChord(token);
				token = " ";
			}
			switch (token[0]) {
				case '{':	// open repeat
				case '[':	// open double bar
					obj.bars = token; token = null; break;
				case '|':	// single bar - close previous and open this
					if (prevobj) { prevobj.bars += ')'; prevobj = null; }
					obj.bars = '('; token = null; break;
				case ']':	// close double bar
				case '}':	// close repeat
				case 'Z':	// ending double bar
					if (prevobj) { prevobj.bars += token; prevobj = null; }
					token = null; break;
				case 'n':	// N.C.
					obj.chord = new iRealChord(token[0]);
					break;
				case ',':	token = null; break; // separator
				case 'S':	// segno
				case 'T':	// time measurement
				case 'Q':	// coda
				case 'N':	// repeat
				case 'U':	// END
				case 's':	// small
				case 'l':	// normal
				case 'f':	// fermata
				case '*': obj.annots.push(token); token = null; break;
				case 'Y': obj.spacer++; token = null; prevobj = null; break;
				case 'r':
				case 'x':
				case 'W':
					obj.chord = new iRealChord(token);
					break;
				case '<': 
					token = token.substr(1, token.length-2);
					obj.comments.push(token); 
					token = null; break;
				default:
			}
			if (token && i < arr.length-1) {
				prevobj = obj;		// so we can add any closing barline later
				obj = this.newToken(out);
			}
		}
//		console.log(out);
		song.cells = out;
	}

    parseChord(match) {
		var note = match[1] || " ";
		var modifiers = match[2] || "";
		var comment = match[3] || "";
		if (comment)
			modifiers += comment.substr(1, comment.length-2);
		var over = match[4] || "";
		if (over[0] === '/')
			over = over.substr(1);
		var alternate = match[5] || null;
		if (alternate) {
			match = iRealParser.chordRegex.exec(alternate.substr(1, alternate.length-2));
			if (!match)
				alternate = null;
			else
				alternate = this.parseChord(match);			
		}
		// empty cell?
		if (note === " " && !alternate && !over)
			return null;
		if (over) {
			var offset = (over[1] === '#' || over[1] === 'b') ? 2 : 1;
			over = new iRealChord(over.substr(0, offset), over.substr(offset), null, null);
		}
		else
			over = null;
		modifiers = modifiers.replace(/b/g, "\u266d").replace(/#/g, "\u266f");	// convert to proper flat and sharp
		return new iRealChord(note, modifiers, over, alternate);
	}

    newToken(arr) {
		var obj = new iRealToken;
		arr.push(obj);
		return obj;
	}
}

class iRealToken {
	constructor() {
		this.annots = [];
		this.comments = [];
		this.bars = "";
		this.spacer = 0;
		this.chord = null;
	}
}

class iRealChord {
	constructor(note, modifiers = "", over = null, alternate = null) {
		this.note = note;
		this.modifiers = modifiers;
		this.over = over;
		this.alternate = alternate;
	}
}

/**
 * The RegExp for a complete chord. The match array contains:
 * 1 - the base note
 * 2 - the modifiers (+-ohd0123456789 and su for sus)
 * 3 - any comments (may be e.g. add, sub, or private stuff)
 * 4 - the "over" part starting with a slash
 * 5 - the top chord as (chord)
 * @type RegExp
 */
iRealParser.chordRegex = /^([A-Gxnr][b#]?)((?:sus|alt|add|[\+\-\^\dhob#])*)(\*.+?\*)*(\/[A-G][#b]?)?(\(.*?\))?/;
iRealParser.chordRegex2 = /^([ Wp])()()(\/[A-G][#b]?)?(\(.*?\))?/;	// need the empty captures to match chordRegex

iRealParser.regExps = [
	/^\*[a-zA-Z]/,							// section
	/^T\d\d/,								// time measurement
	/^N./,									// repeat marker
	/^<.*?>/,								// comments
	iRealParser.chordRegex,				// chords
	iRealParser.chordRegex2,				// space, W and p (with optional alt chord)
];
