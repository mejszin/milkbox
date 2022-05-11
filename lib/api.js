var api_album_cache = {};

function getAlbumGenres(artist_name, album_name) {
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