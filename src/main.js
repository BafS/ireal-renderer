import demoPlaylist from '../DemoPlaylist.html?raw'
import { Renderer, Transposer } from './renderer.js';
import { Parser, Playlist } from './parser.js';

window.addEventListener("load", async () => {

	var playlist;
	var options = {
		minor: "minus",
		transpose: 0,
		useH: false,
		hilite: true
	};

	function makePlaylist(text) {
		playlist = new Playlist(text);
		var lbHtml = "";
		var chordsHtml = "";
		for (var i = 0; i < playlist.songs.length; i++) {
			lbHtml += `<option value="${i}">${playlist.songs[i].title}</option>`;
			chordsHtml += `<div id="song-${i}"></div>`;
		}
		document.getElementById("songs").innerHTML = lbHtml;
		document.getElementById("chords").innerHTML = chordsHtml;
	}

	/**
	* Render a song into the container "#song-index".
	* @param {int} index - the song index
	*/
	function renderSong(index) {
		let song = playlist.songs[index];
		let r = new Renderer();
		const parser = new Parser(song);
		const transpose = new Transposer();
		parser.parse(song);
		song = transpose.transpose(song, options);
		let container = document.getElementById("song-" + index);
		container.innerHTML = `<h3>${song.title} (${song.key
			.replace(/b/g, "\u266d")
			.replace(/#/g, "\u266f")})</h3><h5>${song.composer}</h5>`;
		r.render(song, container, options);
	}

	function renderSelected() {
		let selected = document.getElementById("songs").options;
		selected = [...selected].filter(option => option.selected).map(el => +el.value);
		for (let i = 0; i < playlist.songs.length; i++) {
			if (selected.includes(i))
				renderSong(i);
			else
				document.getElementById(`song-${i}`).innerHTML = "";
		}
	}

	document.getElementById("songs").addEventListener("change", () => renderSelected());

	const minorElements = document.querySelectorAll('[name="minor"]');
	for (let i = 0; i < minorElements.length; i++) {
		minorElements[i].addEventListener("click", (ev) => {
			let mode = ev.target.id;
			options.minor = mode;
			renderSelected();
		});
	}

	document.getElementById("ui-useh").addEventListener("click", ev => {
		options.useH = ev.target.checked;
		renderSelected();
	});

	document.getElementById("ui-hilite").addEventListener("click", ev => {
		options.hilite = ev.target.checked;
		renderSelected();
	});

	document.getElementById("ui-transpose").addEventListener("input", ev => {
		options.transpose = +ev.target.value;
		renderSelected();
	});
	document.getElementById("ui-transpose").addEventListener("change", ev => {
		options.transpose = +ev.target.value;
		renderSelected();
	});

	document.getElementById("ui-fontsize").addEventListener("input", ev => {
		document.getElementById("chords").style.fontSize = ev.target.value + "pt";
	});
	document.getElementById("ui-fontsize").addEventListener("change", ev => {
		document.getElementById("chords").style.fontSize = ev.target.value + "pt";
	});

	document.getElementById("ui-file").addEventListener("change", ev => {
		let f = ev.target.files[0];
		let reader = new FileReader();
		reader.addEventListener("loadend", () => {
			if (reader.error)
				alert(`Cannot read file ${f.name}: ${reader.error}`);
			else
				makePlaylist(reader.result);
		});
		reader.readAsText(f, "utf-8");
	});

	// Did the import of our DemoPlaylist.html file work?
	let el = document.querySelectorAll('link[rel="import"]');
	if (el.length)
		makePlaylist(el[0].import.body.innerHTML);
	else {
		makePlaylist(demoPlaylist);
  }
});
