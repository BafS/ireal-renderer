/* 
 * iRealRenderer
 * 
 * Render any iReal Pro song into an HTML container element.
 */

export class iRealRenderer {
	constructor() {
		this.transposeFlat = [
			"C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B",
			"C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"
		];
		this.transposeSharp = [
			"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
			"C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
		];
		this.cells = [];
		// This is set to true if the renderer is to render as a web component.
		// It inhibits the creation of a <irr-chords>tag because the tag is
		// already created as a web component. For now, just ignore the setting.
		this.isComponent = false;
	}
	
	////////////////////////////////////////////////////////////////////////////

	/**
	 * Transpose a song. Use the following options:
	 * 
	 * transpose: 
	 *   a value between -6 and 15 as halftones
	 * minor:
	 *   small - convert Bb- to bb
	 *   m     - convert Bb- to Bbm
	 * useH:
	 *   use H for B chords
	 * @param {type} song
	 * @param {type} options
	 * @returns {undefined}
	 */
	transpose(song, options) {
		song = Object.assign({}, song);
		if (song.cells)
			song.cells = song.cells.slice(0);
		var chord = { note: song.key, modifiers:"", over: null, alternate: null };
		if (chord.note.endsWith("-")) {
			chord.note = song.key.substr(0, song.key.length-1);
			chord.modifiers = "-";
		}
		options.transpose += song.transpose;
		this.transposeChord(chord, options);
		song.key = chord.note + chord.modifiers;
		if (song.cells)
			song.cells = song.cells.map(el => {
				if (el.chord)
					this.transposeChord(el.chord, options);
				return el;
			});
		options.transpose -= song.transpose;
		return song;
	}
		
	/**
	 * Transpose the given chord; use the given options.
	 * @param {Object} chord
	 * @param {Object} options
	 * @returns {String}
	 */
	transposeChord(chord, options) {
		var arr = this.transposeFlat;
		var i = arr.indexOf(chord.note);
		if (i < 0) {
			arr = this.transposeSharp;
			i = arr.indexOf(chord.note);
		}
		if (i >= 0) {
			i += (options.transpose % 12);
			if (i < 0)
				i += 12;
			chord.note = arr[i];
			if (options.useH && chord.note === "B")
				chord.note = "H";
		}
		if (chord.modifiers.includes("-")) {
			switch (options.minor) {
				case "small":
					var note = chord.note[0].toLowerCase();
					if (chord.note[1])
						note += chord.note[1];
					chord.note = note;
					chord.modifiers = chord.modifiers.replace("-", "");
					break;
				case "m":
					chord.modifiers = chord.modifiers.replace("-", "m");
					break;
			}
		}
		if (chord.alternate)
			this.transposeChord(chord.alternate, options);
		if (chord.over)
			this.transposeChord(chord.over, options);
	}
	
	////////////////////////////////////////////////////////////////////////////
	
	/**
	 * Render the parsed array.
	 * @param {Song} song - with attached cells property
	 * @param {Element} container - HTML container element to render into (appends)
	 * @param {Object} options - render annots, comments etc in red if hilite property is set
	 * @returns {undefined}
	 */
	render(song, container, options = {}) {
		if (!song.cells)
			return;
		var hilite = options.hilite || false;
		if (!this.isComponent) {
			var table = document.createElement("irr-chords");
			if (hilite)
				table.setAttribute("hilite", "");
			container.appendChild(table);
		}
		else
			table = container;
		this.cell = -1;
		this.closebar = false;
		this.small = false;
		this.hilite = hilite;
		
		for (var i = 0; i < song.cells.length; i++) {
			var cell = song.cells[i];
			if (this.cell < 0 || this.cell === 15)
				this.nextRow(table, cell.spacer);
			else
				this.cell++;
			var html = "";
			if (cell.annots.length)
				html += this.annotHtml(cell.annots);
			if (cell.comments.length)
				html += this.commentHtml(cell.comments);
			html += this.cellHtml(cell);
			var el = this.cells[this.cell];
			var cls = "";
			if (this.small)
				cls += "small";
			if (cell.comments.length)
				cls += " irr-comment";
			if (cls)
				el.setAttribute("class", cls.trim());
			el.innerHTML = html;
			this.closebar = cell.bars.indexOf(')') >= 0;
		}
	}
	
	////////////////////////////////////////////////////////////////////////////
	
	// Private methods
	
	cellHtml(data) {
		let html = "";
		if (data.chord) html = this.chordHtml(data.chord);
		for (var i = 0; i < data.bars.length; i++) {
			let c = data.bars[i];
			let cls = iRealRenderer.classes[c];
			switch(c) {
				case '(':
				case '[':
				case '{':
					html = `<irr-lbar class="${cls}"></irr-lbar>` + html; break;
				//case ')':	// not handled here, only at end of line below
				case ']':
				case '}':
				case 'Z':
					html = `<irr-rbar class="${cls}"></irr-rbar>` + html; break;
			}
		}
		if (!html)
			return html;
		return `<irr-chord>${html}</irr-chord>`;
	}
		
	chordHtml(chord) {
		if (typeof chord === "string") {
			chord = iRealParser.chordRegex.exec(chord);
			if (!chord)
				return;
		}
		var html = this.baseChordHtml(chord);
		var { alternate, over } = chord;
		if (over)
			html += `<irr-over>${this.baseChordHtml(over)}</irr-over>`;
		if (alternate) 
			html = `<irr-chord>${this.chordHtml(alternate)}</irr-chord>` + html;
		return html;
	}
	
	baseChordHtml(chord) {
		var { note, modifiers } = chord;
		if (note === "W")
			note = `<irr-char class="irr-root Root"></irr-char>`;
		if (note === "p")
			note = `<irr-char class="Repeated-Figure1"></irr-char>`;
		if (["x", "r", "n"].includes(note)) {
			// 1-bar repeat, 2-bar repeat, and no-chord
			note = `<irr-char class="${iRealRenderer.classes[note]}"></irr-char>`;
		}
		var sup = "";
		switch(note[1]) {
			case 'b': sup = "<sup>\u266d</sup>"; note = note[0]; break;
			case '#': sup = "<sup>\u266f</sup>"; note = note[0]; break;
		}
		if (modifiers)
			modifiers = `<sub>${modifiers.replace("^", "\u25B3").replace("h", "\u00D8")}</sub>`;
		return `${note}${sup}${modifiers}`;
	}
	
	/**
	 * Render an annotation.
	 * @param {type} annots
	 * @returns {undefined}
	 */
	annotHtml(annots) {
		var t = "";
		for (var i = 0; i < annots.length; i++) {
			var annot = annots[i];
			var s;
			switch(annot[0]) {
				case '*':	// section
					s = annot[1];
					switch(s) {
						case "i": s = "In"; break;
					}
					t += `<irr-section>${s}</irr-section>`;
					break;
				case 'N':	// repeat bracket
					t += `<irr-repeat>${annot[1]}</irr-repeat>`; break;
				case 'f':	// fermata
				case 'Q':	// coda
				case 'S':	// segno
					t += `<irr-annot class="${iRealRenderer.classes[annot[0]]}"></irr-annot>`; break;
					break;
				case 'T':	// measure: Txx, where T12 is 12/8
					var m1 = annot.charCodeAt(1) - 48;
					var m2 = annot.charCodeAt(2) - 48;
					if (m1 === 1 && m2 === 2)
						m1 = 12, m2 = 8;
					s = `<irr-measure><span class="Measure-${m1}-Low"></span><br/><span class="Measure-${m2}-High"></span></irr-measure>`;
					t = s + t;
					break;
				case 's':
					this.small = true; break;
				case 'l':
					this.small = false; break;
			}
		}
		return t;
	}
	
	commentHtml(comments) {
		var cell = this.cells[this.cell];
		var style = getComputedStyle(cell);
		var top = parseInt(style.height) + parseInt(style["margin-top"]);
		var html = "";
		for (var i = 0; i < comments.length; i++) {
			var c = comments[i];
			var offset = 0;
			if (c[0] === '*') {
				offset = (c.charCodeAt(1) - 48) * 10 + (c.charCodeAt(2) - 48);
				c = c.substr(3);
			}
			// assume that 1 unit is = 1/20 em
			offset /= 20;
			html += `<irr-comment style="margin-top:${-offset}em">${c}</irr-comment>`;
		}
		return html;
	}
	
	nextRow(table, spacer) {
		this.checkIfNeedsLastBar();
		// insert a spacer
		if (spacer) {
			var spc = document.createElement("irr-spacer");
			spc.setAttribute("style", `height:${spacer*10}px`);
			table.appendChild(spc);
		}
		this.cells = [];
		for (let i = 0; i < 16; i++) {
			var cell  = document.createElement("irr-cell");
			this.cells.push(cell);
			table.appendChild(cell);
		}
		
		this.cell = 0;
	}

	/**
	 * Check if the current cell is the last cell of a row, and if it
	 * needs a closing bar. This is true if there has been an opening
	 * bar in the last 4 cells.
	 */
	checkIfNeedsLastBar() {
		if (this.cell !== 15)
			return;
		if (!this.closebar)
			return;
		let curCell = this.cells[this.cell];
		var bar = document.createElement("irr-rbar");
		bar.classList.add("Single-Barline");
		curCell.insertBefore(bar, curCell.firstChild);	// must insert, not append, for correct positioning
	}
}

iRealRenderer.cssPrefix = "";

iRealRenderer.classes = {
	'(': "Single-Barline",
	')': "Single-Barline",
	'[': "Double-Barline",
	']': "Double-Barline",
	"?Z0": "Final-Barline",
	'Z': "Reverse-Final-Barline",
	'{': "Left-Repeat-Sign",
	'}': "Right-Repeat-Sign",
	"?DS": "Dal-Segno",
	"?DC": "Da-Capo",
	n: "No-Chord",
	f: "Fermata",
	S: "Segno",
	Q: "Coda",
	"?Q": "Codetta",
	W: "Root",
	"?W": "Root-Filled",
	p: "Repeated-Figure1",
	x: "Repeated-Figure2",
	r: "Repeated-Figure3",
	"?r4": "Repeated-Figure4",
	"0L": "Measure-0-Low",
	"1L": "Measure-1-Low",
	"2L": "Measure-2-Low",
	"3L": "Measure-3-Low",
	"4L": "Measure-4-Low",
	"5L": "Measure-5-Low",
	"6L": "Measure-6-Low",
	"7L": "Measure-7-Low",
	"8L": "Measure-8-Low",
	"9L": "Measure-9-Low",
	"10L": "Measure-10-Low",
	"11L": "Measure-11-Low",
	"12L": "Measure-12-Low",
	"0H": "Measure-0-High",
	"1H": "Measure-1-High",
	"2H": "Measure-2-High",
	"3H": "Measure-3-High",
	"4H": "Measure-4-High",
	"5H": "Measure-5-High",
	"6H": "Measure-6-High",
	"7H": "Measure-7-High",
	"8H": "Measure-8-High",
	"9H": "Measure-9-High",
	"10H": "Measure-10-High",
	"11H": "Measure-11-High",
	"12H": "Measure-12-High"
};
