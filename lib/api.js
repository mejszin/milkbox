var api_album_cache = {};
// Flag to insure first track played is posted
var has_initially_synced_playing = false;

async function setPausedAPI(status = 'true') {
    let url = new URL(`${config.api.url}/setPaused`);
    url.searchParams.append('application_id', config.application.id);
    url.searchParams.append('status', status);
    console.log('/setPaused', url);
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.send();
}

async function setPlayingAPI(track_path) {
    getTrackDetails(track_path).then((details) => {
        let url = new URL(`${config.api.url}/setPlaying`);
        url.searchParams.append('application_id', config.application.id);
        url.searchParams.append('artist', details.artist);
        url.searchParams.append('track', details.title);
        url.searchParams.append('album', details.album);
        url.searchParams.append('collection', (now_playing_playlist_name == null) ? details.album : now_playing_playlist_name);
        url.searchParams.append('paused', audio.paused);
        console.log('/setPlaying', url);
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.send();
    });   
}

function getAlbumGenresAPI(artist_name, album_name) {
    return new Promise(resolve => {
        // Respond with cached album if exists
        if (album_name in api_album_cache) {
            // console.log('getAlbumGenresAPI()', album_name, 'using cached genres');
            resolve(api_album_cache[album_name].genres);
        } else {
            // Otherwise create and open HTTP request
            let url = new URL(`${config.api.url}/getAlbum`);
            url.searchParams.append('application_id', config.application.id);
            url.searchParams.append('artist', artist_name);
            url.searchParams.append('album', album_name);
            console.log('getAlbumGenresAPI()', artist_name, album_name, '/getAlbum', url);
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onreadystatechange = function () {
                if(xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status == 200) {
                        var album_data = JSON.parse(xhr.responseText);
                        api_album_cache[album_name] = album_data;
                        resolve(album_data.genres);
                    } else {
                        api_album_cache[album_name] = {
                            genres: []
                        };
                        resolve([]);
                    }
                }
            };
            xhr.send();
        }
    });
}

function setTopGenresAPI() {
    getGenreListens(5).then((data) => {
        ipcRenderer.send('post-json', {
            endpoint: `/setTopGenres?application_id=${config.application.id}`,
            body: JSON.stringify(data)
        })
    });
}

function setTopArtistsAPI() {
    getArtistListens(5).then((data) => {
        ipcRenderer.send('post-json', {
            endpoint: `/setTopArtists?application_id=${config.application.id}`,
            body: JSON.stringify(data)
        })
    });
}

function setTopTracksAPI() {
    getTrackListens(5).then((data) => {
        ipcRenderer.send('post-json', {
            endpoint: `/setTopTracks?application_id=${config.application.id}`,
            body: JSON.stringify(data)
        })
    });
}

function setStatisticsAPI() {
    setTopGenresAPI();
    setTopArtistsAPI();
    setTopTracksAPI();
}