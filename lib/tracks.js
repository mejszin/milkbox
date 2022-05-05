var glob = require('glob');
const music_metadata = require('music-metadata');

var all_track_paths = [];
var now_playing_tracks = [];
var all_albums = {};
var now_playing_index = 0;

function getArtistAlbum(file_path) {
    return new Promise(resolve => {
        (async () => {
            const metadata = await music_metadata.parseFile(file_path);
            resolve(`${metadata.common.artist} - ${metadata.common.album}`);
        })()
    });
}

function displayTrackName(file_path) {
    (async () => {
        const metadata = await music_metadata.parseFile(file_path);
        var track_name = `${metadata.common.artist} - ${metadata.common.title}`;
        var marquee = document.getElementById('now-playing');
        marquee.innerText = track_name;
    })();
}

function displayAlbumCover(file_path) {
    (async () => {
        const {common} = await music_metadata.parseFile(file_path);
        const picture = music_metadata.selectCover(common.picture);
        var img = document.getElementById('albumcover');
        img.src = `data:${picture.format};base64,${picture.data.toString('base64')}`;
    })();
}

function highlightTrack() {
    var table = document.getElementById('tracklist');
    for (let i = 0; i < table.children.length; i++) {
        if (now_playing_index == i) {
            table.children[i].classList.add('playing');
        } else {
            table.children[i].classList.remove('playing');
        }
    }
}

function displayTracklistHeader() {
    var table = document.getElementById('tracklist-header')
    var row = document.createElement('tr');
    var cell = null;
    const data = [
        'Title', 'Artist', 'Album', 'Year', 'Genres', 'Duration',
    ]
    const columns = [
        'title', 'artist', 'album', 'year', 'genres', 'duration',
    ]
    for (let i = 0; i < data.length; i++) {
        cell = document.createElement('td');
        cell.classList.add(columns[i]);
        cell.innerText = data[i];
        row.appendChild(cell);
    }
    table.appendChild(row);
}

function displayAlbumsHeader() {
    var table = document.getElementById('tracklist-header')
    var row = document.createElement('tr');
    var cell = null;
    const data = [
        'Title', 'Track count',
    ]
    const columns = [
        'title', 'track_count',
    ]
    for (let i = 0; i < data.length; i++) {
        cell = document.createElement('td');
        cell.classList.add(columns[i]);
        cell.innerText = data[i];
        row.appendChild(cell);
    }
    table.appendChild(row);
}

function displayPlaylistHeader() {
    var table = document.getElementById('tracklist-header')
    var row = document.createElement('tr');
    var cell = null;
    const data = [
        'Title', 'Track count',
    ]
    const columns = [
        'title', 'track_count',
    ]
    for (let i = 0; i < data.length; i++) {
        cell = document.createElement('td');
        cell.classList.add(columns[i]);
        cell.innerText = data[i];
        row.appendChild(cell);
    }
    table.appendChild(row);
}

function addTrack(index, data) {
    var table = document.getElementById('tracklist')
    var row = document.createElement('tr');
    row.onclick = function() { skipToAudio(index) };
    var cell = null;
    const columns = [
        'title', 'artist', 'album', 'year', 'genres', 'duration',
    ]
    for (let i = 0; i < data.length; i++) {
        cell = document.createElement('td');
        cell.classList.add(columns[i]);
        cell.innerText = data[i];
        row.appendChild(cell);
    }
    table.appendChild(row);
}

function addAlbum(index, data, track_paths) {
    var table = document.getElementById('tracklist')
    var row = document.createElement('tr');
    row.onclick = function() { displayTrackPage(track_paths) };
    var cell = null;
    const columns = [
        'title', 'track_count',
    ]
    for (let i = 0; i < data.length; i++) {
        cell = document.createElement('td');
        cell.classList.add(columns[i]);
        cell.innerText = data[i];
        row.appendChild(cell);
    }
    table.appendChild(row);
}

function addPlaylist(index, data, track_paths) {
    var table = document.getElementById('tracklist')
    var row = document.createElement('tr');
    row.onclick = function() { displayTrackPage(track_paths) };
    var cell = null;
    const columns = [
        'title', 'track_count',
    ]
    for (let i = 0; i < data.length; i++) {
        cell = document.createElement('td');
        cell.classList.add(columns[i]);
        cell.innerText = data[i];
        row.appendChild(cell);
    }
    table.appendChild(row);
}

function formatDuration(duration) {
    minutes = Math.floor(duration / 60);
    seconds = Math.floor(duration % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`
}

async function displayTracks(track_paths) {
    var total_duration = 0;
    var i = 0;
    for (file_path of track_paths) {
        const metadata = await music_metadata.parseFile(file_path);
        var genres = await getArtistGenres(metadata.common.artist);
        genres = (genres == undefined) ? '' : genres.slice(0, 2).join(', ');
        total_duration += metadata.format.duration;
        if (i == 0) { createPlayer() }
        addTrack(
            i, [
            metadata.common.title,                     // Title
            metadata.common.artist,                    // Artist
            metadata.common.album,                     // Album
            metadata.common.year,                      // Year
            genres,                                    // Genres
            formatDuration(metadata.format.duration),  // Duration
        ]);
        i += 1;
    }
    // Footer information
    var td = document.getElementById('total-tracks');
    td.innerText = `${track_paths.length} tracks`;
    td = document.getElementById('total-duration');
    td.innerText = `${Math.floor(total_duration / 60)} minutes`;
}

async function displayPlaylists(playlists) {
    var i = 0;
    for (playlist of playlists) {
        addPlaylist(
            i, [
            playlist.name,           // Title
            playlist.tracks.length,  // Track count
        ], playlist.tracks);
        i += 1;
    }
    // Footer information
    var td = document.getElementById('total-tracks');
    td.innerText = `${playlists.length} playlists`;
    td = document.getElementById('total-duration');
    td.innerText = `0 minutes`;
}

async function displayAlbums(albums) {
    var i = 0;
    Object.keys(albums).forEach(function (album_name) {
        addAlbum(
            i, [
            album_name,                 // Title
            albums[album_name].length,  // Track count
        ], albums[album_name]);
        i += 1;
    });
    // Footer information
    var td = document.getElementById('total-tracks');
    td.innerText = `${Object.keys(albums).length} albums`;
    td = document.getElementById('total-duration');
    td.innerText = `0 minutes`;
}

async function loadAllTracks(dir) {
    all_track_paths = [];
    return new Promise(resolve => {
        glob(`${dir}/**/*.mp3`, function (error, files) {
            for (file_path of files) {
                try {
                    all_track_paths.push(file_path);
                } catch (error) {
                    // ...
                    console.log(`Could not import ${file_path}`);
                    console.log(error.message, error.stack);
                }
            }
            resolve(all_track_paths);
        })
    });
}

function loadAllAlbums(dir) {
    var paths = {};
    return new Promise(resolve => {
        glob(`${dir}/**/*.mp3`, async function (error, files) {
            for (file_path of files) {
                try {
                    album_artist = await getArtistAlbum(file_path);
                    if (album_artist in paths) {
                        paths[album_artist].push(file_path);
                    } else {
                        paths[album_artist] = [file_path];
                    }
                } catch (error) {
                    // ...
                    console.log(`Could not import ${file_path}`);
                    console.log(error.message, error.stack);
                }
            }
            resolve(paths);
        });
    });
}

async function loadPlaylists() {
    return new Promise(resolve => {
        var data = JSON.parse(fs.readFileSync('./playlists.json', 'utf8'));
        resolve(data);
    });
}

function clearHeader() {
    var table = document.getElementById('tracklist-header');
    table.innerHTML = '';
}

function clearTracklist() {
    var table = document.getElementById('tracklist');
    table.innerHTML = '';
}

async function displayAllTracks() {
    clearHeader();
    clearTracklist();
    displayTracklistHeader();
    loadAllTracks('../../music').then((track_paths) => {
        now_playing_tracks = track_paths;
        now_playing_index = 0;
        displayTracks(track_paths);
    });
}

async function displayTrackPage(track_paths) {
    clearHeader();
    clearTracklist();
    displayTracklistHeader();
    now_playing_tracks = track_paths;
    now_playing_index = 0;
    displayTracks(track_paths);
}

async function displayAllAlbums() {
    clearHeader();
    clearTracklist();
    displayAlbumsHeader();
    loadAllAlbums('../../music').then((albums) => {
        displayAlbums(albums);
    });
}

async function displayAllPlaylists() {
    clearHeader();
    clearTracklist();
    displayPlaylistHeader();
    loadPlaylists().then((playlists) => {
        displayPlaylists(playlists);
    });
}