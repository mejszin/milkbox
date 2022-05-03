var glob = require('glob');
const music_metadata = require('music-metadata');

var track_paths = [];
var now_playing_index = 0;

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

function addTracklistHeader() {
    var table = document.getElementById('tracklist-header')
    var row = document.createElement('tr');
    var cell = null;
    const data = [
        "Title", "Artist", "Album", "Year", "Track", "Duration"
    ]
    const columns = [
        'title', 'artist', 'album', 'year', 'track_no', 'duration',
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
        'title', 'artist', 'album', 'year', 'track_no', 'duration',
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

function loadTracks(dir) {
    glob(`${dir}/**/*.*`, async function (error, files) {
        for (file_path of files) {
            try {
                const metadata = await music_metadata.parseFile(file_path);
                console.log(metadata);
                addTrack(
                    track_paths.length, [
                    metadata.common.title,
                    metadata.common.artist,
                    metadata.common.album,
                    metadata.common.year,
                    `#${metadata.common.track.no}`,
                    formatDuration(metadata.format.duration),
                ]);
                track_paths.push(file_path);
                if (track_paths.length == 1) { createPlayer() }
            } catch (error) {
                // ...
            }
        }
    })
}

addTracklistHeader()
loadTracks('../../music');