var glob = require('glob');
var ini = require('ini');
var path = require('path');

const music_metadata = require('music-metadata');

var all_track_paths = [];
var now_playing_tracks = [];
var now_playing_index = 0;
var now_playing_playlist_name = '';

const config = ini.parse(fs.readFileSync('./data/config.ini', 'utf-8'));

function getArtistAlbum(file_path) {
    return new Promise(resolve => {
        (async () => {
            const metadata = await music_metadata.parseFile(path.join(config.music.src, file_path));
            resolve([metadata.common.artist, metadata.common.album]);
        })()
    });
}

function getTrackDuration(file_path) {
    return new Promise(resolve => {
        (async () => {
            const metadata = await music_metadata.parseFile(path.join(config.music.src, file_path));
            resolve(metadata.format.duration);
        })()
    });
}

function displayTrackName(file_path) {
    (async () => {
        const metadata = await music_metadata.parseFile(path.join(config.music.src, file_path));
        var track_name = `${metadata.common.artist} - ${metadata.common.title}`;
        var marquee = document.getElementById('now-playing');
        marquee.innerText = track_name;
    })();
}

function getTrackDetails(file_path) {
    return new Promise(resolve => {
        (async () => {
            const metadata = await music_metadata.parseFile(path.join(config.music.src, file_path));
            resolve({
                title: metadata.common.title,
                artist: metadata.common.artist,
                album: metadata.common.album
            });
        })()
    });
}

function getAlbumCover(file_path) {
    return new Promise(resolve => {
        (async () => {
            const {common} = await music_metadata.parseFile(path.join(config.music.src, file_path));
            resolve(music_metadata.selectCover(common.picture));
        })()
    });
}

async function displayAlbumCover(file_path) {
    var img = document.getElementById('albumcover');
    try {
        var picture = await getAlbumCover(file_path);
        img.src = `data:${picture.format};base64,${picture.data.toString('base64')}`;
    } catch {
        img.src = `../data/covers/default.png`;
    }
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
        'Title', 'Artist', 'Album', 'Year', 'Genres', 'Duration', ' ',
    ]
    const columns = [
        'title', 'artist', 'album', 'year', 'genres', 'duration', 'buttons',
    ]
    for (let i = 0; i < data.length; i++) {
        cell = document.createElement('td');
        cell.classList.add(columns[i]);
        cell.innerText = data[i];
        row.appendChild(cell);
    }
    table.appendChild(row);
}

async function postTrack(track_path) {
    getTrackDetails(track_path).then((details) => {
        var title = encodeURIComponent(details.title);
        var artist = encodeURIComponent(details.artist);
        var album = encodeURIComponent(details.album);
        var application_id = config.application.id;
        if (now_playing_playlist_name == null) {
            var collection = encodeURIComponent(details.album);
        } else {
            var collection = now_playing_playlist_name;
        }
        var queryString = `application_id=${application_id}&track=${title}&artist=${artist}&collection=${collection}`;
        var url = `http://vault.machin.dev/api/setPlaying?${queryString}`;
        console.log(url);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.send();
    });   
}

function displayAlbumsHeader() {
    var table = document.getElementById('tracklist-header');
    var row = document.createElement('tr');
    var cell = null;
    const data = [
        'Cover', 'Name', 'Artist', 'Tracks', 'Duration',
    ]
    const columns = [
        'album_cover', 'album_name', 'album_artist', 'album_track_count', 'album_duration',
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
        'Cover', 'Title', 'Track count',
    ]
    const columns = [
        'album_cover', 'title', 'track_count',
    ]
    for (let i = 0; i < data.length; i++) {
        cell = document.createElement('td');
        cell.classList.add(columns[i]);
        cell.innerText = data[i];
        row.appendChild(cell);
    }
    table.appendChild(row);
}

function addTrackToPlaylist(track_path) {
    ipcRenderer.send('add-track-to-playlist', {
        track: track_path
    });
}

function removeTrackFromPlaylist(playlist, track_path) {
    ipcRenderer.send('remove-track-from-playlist', {
        playlist: playlist,
        track: track_path
    });
}

function addTrack(index, data, playlist = null) {
    var table = document.getElementById('tracklist')
    var row = document.createElement('tr');
    var cell = null;
    const columns = [
        'title', 'artist', 'album', 'year', 'genres', 'duration', 'buttons',
    ]
    for (let i = 0; i < data.length + 1; i++) {
        cell = document.createElement('td');
        cell.classList.add(columns[i]);
        if (i < data.length) {
            cell.innerText = data[i];
            cell.onclick = function() { skipToAudio(index) };
        } else {
            var icon = document.createElement('i');
            icon.classList.add('fa-solid', 'fa-bars'); // fa-folder-plus
            icon.onclick = function() { addTrackToPlaylist(now_playing_tracks[index]) }
            cell.appendChild(icon);
            if (playlist != null) {
                icon = document.createElement('i');
                icon.classList.add('fa-solid', 'fa-remove');
                icon.onclick = function() { 
                    removeTrackFromPlaylist(playlist, now_playing_tracks[index]);
                    row.remove();
                }
                cell.appendChild(icon);
            }
        }
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
        'album_cover', 'album_name', 'album_artist', 'album_track_count', 'album_duration',
    ]
    for (let i = 0; i < data.length; i++) {
        cell = document.createElement('td');
        cell.classList.add(columns[i]);
        if (columns[i] == 'album_cover') {
            var img = document.createElement('img');
            img.src = `data:${data[i].format};base64,${data[i].data.toString('base64')}`;
            cell.appendChild(img);
        } else {
            cell.innerText = data[i];
        }
        row.appendChild(cell);
    }
    table.appendChild(row);
}

function addPlaylist(index, data, track_paths) {
    var table = document.getElementById('tracklist')
    var row = document.createElement('tr');
    console.log(data[1]);
    row.onclick = function() { displayTrackPage(track_paths, data[1]) };
    var cell = null;
    const columns = [
        'album_cover', 'title', 'track_count',
    ]
    for (let i = 0; i < data.length; i++) {
        cell = document.createElement('td');
        cell.classList.add(columns[i]);
        if (columns[i] == 'album_cover') {
            var img = document.createElement('img');
            img.src = `../data/covers/${data[i]}`;
            cell.appendChild(img);
        } else {
            cell.innerText = data[i];
        }
        row.appendChild(cell);
    }
    table.appendChild(row);
}

function formatDuration(duration) {
    minutes = Math.floor(duration / 60);
    seconds = Math.floor(duration % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`
}

async function displayTracks(track_paths, playlist = null) {
    var total_duration = 0;
    var i = 0;
    for (file_path of track_paths) {
        const metadata = await music_metadata.parseFile(path.join(config.music.src, file_path));
        var genres = await getAlbumGenres(metadata.common.artist, metadata.common.album);
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
        ], playlist);
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
                playlist.cover,          // Cover
                playlist.name,           // Title
                playlist.tracks.length,  // Track count
            ], playlist.tracks
        );
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
                albums[album_name].cover,                    // Cover
                albums[album_name].name,                     // Name
                albums[album_name].artist,                   // Artist
                albums[album_name].tracks.length,            // Track count
                formatDuration(albums[album_name].duration)  // Duration
            ], albums[album_name].tracks
        );
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
                    var cover = await getAlbumCover(file_path);
                    var album_artist = await getArtistAlbum(file_path);
                    var album_id = album_artist.join(' - ');
                    var duration = await getTrackDuration(file_path);
                    if (album_id in paths) {
                        paths[album_id].duration += duration;
                        paths[album_id].tracks.push(file_path);
                    } else {
                        paths[album_id] = {
                            cover: cover,
                            artist: album_artist[0],
                            name: album_artist[1],
                            duration: duration,
                            tracks: [file_path]
                        };
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
        var data = JSON.parse(fs.readFileSync('./data/playlists.json', 'utf8'));
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

async function displayTracksPage() {
    clearHeader();
    clearTracklist();
    displayTracklistHeader();
    loadAllTracks(config.music.src).then((track_paths) => {
        now_playing_tracks = track_paths;
        now_playing_index = 0;
        now_playing_playlist_name = null;
        displayTracks(track_paths);
    });
}

async function displayTrackPage(track_paths, playlist = null) {
    clearHeader();
    clearTracklist();
    displayTracklistHeader();
    now_playing_tracks = track_paths;
    now_playing_index = 0;
    now_playing_playlist_name = playlist;
    displayTracks(track_paths, playlist);
}

async function displayAlbumsPage() {
    clearHeader();
    clearTracklist();
    displayAlbumsHeader();
    loadAllAlbums(config.music.src).then((albums) => {
        displayAlbums(albums);
    });
}

async function displayPlaylistsPage() {
    clearHeader();
    clearTracklist();
    displayPlaylistHeader();
    loadPlaylists().then((playlists) => {
        displayPlaylists(playlists);
    });
}