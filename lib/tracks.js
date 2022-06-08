const DEFAULT_COVER_PATH = `../data/covers/default.png`;

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
                album: metadata.common.album,
                duration: metadata.format.duration,
                cover: await music_metadata.selectCover(metadata.common.picture),
            });
        })()
    });
}

function getAlbumCover(file_path) {
    console.log('getAlbumCover()', file_path);
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
        img.src = DEFAULT_COVER_PATH;
    }
}

function highlightTrack() {
    var track_rows = document.querySelectorAll("tr:not(.header)");
    console.log('highlightTrack()', now_playing_index, 'of', track_rows.length);
    for (let i = 0; i < track_rows.length; i++) {
        if (now_playing_index == i) {
            track_rows[i].classList.add('playing');
        } else {
            track_rows[i].classList.remove('playing');
        }
    }
}

const TRACKLIST_HEADERS = ['Title', 'Artist', 'Album', 'Year', 'Genres', 'Duration', ' '];
const TRACKLIST_CLASSES = ['title', 'artist', 'album', 'year', 'genres', 'duration', 'buttons'];

const ALBUMLIST_HEADERS = ['Cover', 'Name', 'Artist', 'Tracks', 'Duration'];
const ALBUMLIST_CLASSES = ['album_cover', 'album_name', 'album_artist', 'album_track_count', 'album_duration'];

const PLAYLIST_HEADERS = ['Cover', 'Title', 'Track count'];
const PLAYLIST_CLASSES = ['album_cover', 'title', 'track_count'];


function displayTracklistHeader(data = TRACKLIST_HEADERS, columns = TRACKLIST_CLASSES) {
    var table = document.getElementById('tracklist');
    var row = document.createElement('tr');
    row.classList.add('header');
    var cell = null;
    for (let i = 0; i < data.length; i++) {
        cell = document.createElement('th');
        cell.classList.add(columns[i]);
        cell.innerText = data[i];
        row.appendChild(cell);
    }
    table.appendChild(row);
}

function displayAlbumsHeader() {
    displayTracklistHeader(ALBUMLIST_HEADERS, ALBUMLIST_CLASSES);
}

function displayPlaylistHeader() {
    displayTracklistHeader(PLAYLIST_HEADERS, PLAYLIST_CLASSES);
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

function formatDuration(duration) {
    minutes = Math.floor(duration / 60);
    seconds = Math.floor(duration % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`
}

async function loadAllTracks(dir) {
    all_track_paths = [];
    return new Promise(resolve => {
        glob(`${dir}/**/*.mp3`, function (error, files) {
            for (file_path of files) {
                try {
                    all_track_paths.push(file_path.replace(dir, ''));
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
                    var data = await getTrackDetails(file_path);
                    var album_id = [data.artist, data.album].join(' - ');
                    if (album_id in paths) {
                        paths[album_id].duration += data.duration;
                        paths[album_id].tracks.push(file_path);
                    } else {
                        paths[album_id] = {
                            cover: data.cover,
                            artist: data.artist,
                            name: data.album,
                            duration: data.duration,
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