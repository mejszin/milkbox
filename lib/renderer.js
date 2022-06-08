function displayCloudModal() {
    ipcRenderer.send('show-cloud-menu');
}

function clearHeader() {
    var row = document.querySelectorAll('.header');
    row.innerHTML = '';
}

function clearTracklist() {
    var table = document.getElementById('tracklist');
    table.innerHTML = '';
}

var display_state = '';

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
    if ((display_state != 'TRACKS') && (display_state != 'COLLECTION')) { return }
    table.appendChild(row);
}

async function addAlbum(index, data, track_paths) {
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
    if ((display_state != 'ALBUMS')) { return }
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
    if ((display_state != 'PLAYLISTS')) { return }
    table.appendChild(row);
}


async function displayTracks(track_paths, playlist = null) {
    var total_duration = 0;
    var i = 0;
    for (file_path of track_paths) {
        if ((display_state != 'TRACKS') && (display_state != 'COLLECTION')) { return }
        const metadata = await music_metadata.parseFile(path.join(config.music.src, file_path));
        var genres = await getAlbumGenresAPI(metadata.common.artist, metadata.common.album);
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
        if (display_state != 'PLAYLISTS') { return }
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
        if (display_state != 'ALBUMS') { return }
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

async function displayTracksPage() {
    display_state = 'TRACKS';
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
    display_state = 'COLLECTION';
    clearHeader();
    clearTracklist();
    displayTracklistHeader();
    now_playing_tracks = track_paths;
    now_playing_index = 0;
    now_playing_playlist_name = playlist;
    displayTracks(track_paths, playlist);
}

async function displayAlbumsPage() {
    display_state = 'ALBUMS';
    clearHeader();
    clearTracklist();
    displayAlbumsHeader();
    loadAllAlbums(config.music.src).then((albums) => {
        displayAlbums(albums);
    });
}

async function displayPlaylistsPage() {
    display_state = 'PLAYLISTS';
    clearHeader();
    clearTracklist();
    displayPlaylistHeader();
    loadPlaylists().then((playlists) => {
        displayPlaylists(playlists);
    });
}

displayTracksPage();
setStatisticsAPI();