var api_album_cache = {};

async function setPausedAPI(status = 'true') {
    var url = new URL(`${config.api.url}/setPaused`);
    url.searchParams.append('application_id', config.application.id);
    url.searchParams.append('status', status);
    console.log(url);
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.send();
}

async function setPlayingAPI(track_path) {
    getTrackDetails(track_path).then((details) => {
        var url = new URL(`${config.api.url}/setPlaying`);
        url.searchParams.append('application_id', config.application.id);
        url.searchParams.append('artist', details.artist);
        url.searchParams.append('track', details.title);
        url.searchParams.append('album', details.album);
        url.searchParams.append('collection', (now_playing_playlist_name == null) ? details.album : now_playing_playlist_name);
        console.log(url);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.send();
    });   
}

function getAlbumGenresAPI(artist_name, album_name) {
    return new Promise(resolve => {
        // Respond with cached album if exists
        if (album_name in api_album_cache) { 
            resolve(api_album_cache[album_name].genres)
        }
        // Otherwise create and open HTTP request
        var xhr = new XMLHttpRequest();
        var url = new URL(`${config.api.url}/getAlbum`);
        url.searchParams.append('application_id', config.application.id);
        url.searchParams.append('artist', artist_name);
        url.searchParams.append('album', album_name);
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function () {
            if(xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status == 200) {
                    var album_data = JSON.parse(xhr.responseText);
                    api_album_cache[album_name] = album_data;
                    resolve(album_data.genres);
                } else {
                    api_album_cache[album_name] = [];
                    resolve([]);
                }
            }
        };
        xhr.send();
    });
}