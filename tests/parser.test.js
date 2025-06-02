import test from 'ava';
import fs from 'fs';
import { iRealParser, Playlist } from '../src/ireal-parser.js';

/**
 * @param {string} filename
 * @returns {string}
 */
function readContent(filename) {
    return fs.readFileSync(`tests/fixtures/${filename}`, 'utf8');
};

test('Parse playlist info with a single song', t => {
    const playlist = new Playlist(readContent('Bright Size Life.html'));

    t.is(playlist.songs.length, 1);
    t.is(playlist.songs[0].title, 'Bright Size Life');
    t.is(playlist.songs[0].composer, 'Pat Metheny');
    t.is(playlist.songs[0].key, 'D');
    t.is(playlist.songs[0].style, 'Even 8ths');
    t.is(playlist.songs[0].transpose, 0);
    t.is(playlist.songs[0].repeats, 3);
    t.is(playlist.songs[0].bpm, 0); // Fixme
});

test('Parse playlist info with multiple songs', t => {
    const playlist = new Playlist(readContent('DemoPlaylist.html'));

    t.is(playlist.name, 'Demo');
    t.is(playlist.songs.length, 4);
    t.is(playlist.songs[0].title, 'As Time Goes By');
    t.is(playlist.songs[0].composer, 'Herman Hupfeld');
    t.is(playlist.songs[0].style, 'Ballad');
    t.is(playlist.songs[0].key, 'Eb');
    t.is(playlist.songs[0].transpose, 0);
    t.is(playlist.songs[0].repeats, 3);
    t.is(playlist.songs[0].bpm, 0);

    t.is(playlist.songs[1].title, 'Rock 1');
    t.is(playlist.songs[1].composer, 'Exercise');
    t.is(playlist.songs[0].style, 'Ballad');
    t.is(playlist.songs[1].key, 'A-');
    t.is(playlist.songs[1].transpose, 0);
    t.is(playlist.songs[1].repeats, 3);
    t.is(playlist.songs[1].bpm, 0);

    t.is(playlist.songs[2].title, 'Odd Meter 9-4');
    t.is(playlist.songs[2].key, 'G');
    t.is(playlist.songs[2].repeats, 3);

    t.is(playlist.songs[3].title, 'Ballad 3');
    t.is(playlist.songs[3].composer, 'Exercise');
    t.is(playlist.songs[3].key, 'C-');
});

test('Parses a song', t => {
    const playlist = new Playlist(readContent('Bright Size Life.html'));

    var song = playlist.songs[0];
    const parser = new iRealParser(song);
    parser.parse(song);

    // Cells with chords, annotations, comments, or spacers
    const mainCells = song.cells.filter(cell =>
        cell.chord !== null || cell.annots.length > 0 || cell.comments.length > 0 || cell.spacer > 0
    );

    t.is(mainCells.length, 34);
    t.is(mainCells[0].chord.note, 'G');
    t.is(mainCells[0].annots[0], '*A');
    t.is(mainCells[0].annots[1], 'T44'); // 4/4 time signature

    t.is(mainCells[1].chord.note, 'x'); // empty cell

    t.is(mainCells[2].chord.note, 'Bb');
    t.is(mainCells[2].chord.modifiers, '^7♯11');
    t.is(mainCells[2].bars, '(');

    t.is(mainCells[3].chord.note, 'x');

    t.is(mainCells[3].chord.modifiers, '');

    t.is(mainCells[4].chord.note, 'D');

    t.is(mainCells[32].chord.note, 'G');
    t.is(mainCells[32].chord.over.note, 'A');
    t.is(mainCells[32].chord.over.modifiers, '');

    t.is(mainCells[33].chord.note, 'D');
});

test('Parses songs in a playlist', t => {
    const playlist = new Playlist(readContent('DemoPlaylist.html'));
    t.is(playlist.songs.length, 4);

    var song = playlist.songs[3];
    const parser = new iRealParser(song);
    parser.parse(song);
    t.is(playlist.songs.length, 4);

    // Cells with chords, annotations, comments, or spacers
    const mainCells = song.cells.filter(cell =>
        cell.chord !== null || cell.annots.length > 0 || cell.comments.length > 0 || cell.spacer > 0
    );

    t.is(mainCells.length, 53);
    t.is(mainCells[0].chord.note, 'C');
    t.is(mainCells[0].annots[0], '*A');
    t.is(mainCells[0].annots[1], 'T44'); // 4/4 time signature

    t.is(mainCells[1].chord.note, 'D');
    t.is(mainCells[1].chord.modifiers, 'h7');
    t.is(mainCells[1].chord.alternate.note, 'C');
    t.is(mainCells[1].chord.alternate.modifiers, '-^7');
    t.is(mainCells[1].annots.length, 0);
    t.is(mainCells[1].spacer, 0);
    t.is(mainCells[1].bars, '(');
});
