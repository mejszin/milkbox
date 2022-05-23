const STATISTICS_PATH = './data/statistics.json';

function strToKey(str) {
    // console.log('strToKey()', str);
    return str.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(' ').join('_');
}

function getTrackListens(length = null) {
    return new Promise(resolve => {
        fs.exists(STATISTICS_PATH, function(exists) {
            if (exists) {
                var list = [];
                var listens = null;
                fs.readFile(STATISTICS_PATH, function readFileCallback(err, data) {
                    if (err) {
                        // console.log('getTrackListens()', err);
                    } else {
                        obj = JSON.parse(data);
                        // console.log(obj);
                        for (var artist of Object.keys(obj.playback.artists)) {
                            for (var track of Object.keys(obj.playback.artists[artist].tracks)) {
                                listens = obj.playback.artists[artist].tracks[track].listens;
                                // console.log('getTrackListens()', artist, track, listens)
                                list.push({
                                    artist: artist,
                                    track: track,
                                    listens: listens
                                });
                            }
                        }
                    }
                    var sorted_list = list.sort(function(a, b) {
                        return b.listens - a.listens;
                    })
                    resolve(length == null ? sorted_list : sorted_list.slice(0, length));
                });
            } else {
                // console.log('getTrackListens()', STATISTICS_PATH, 'does not exist');
                resolve([]);
            }
        })
    });
}

function getArtistListens(length = null) {
    return new Promise(resolve => {
        fs.exists(STATISTICS_PATH, function(exists) {
            if (exists) {
                var list = [];
                var listens = null;
                fs.readFile(STATISTICS_PATH, function readFileCallback(err, data) {
                    if (err) {
                        // console.log('getArtistListens()', err);
                    } else {
                        obj = JSON.parse(data);
                        // console.log(obj);
                        for (var artist of Object.keys(obj.playback.artists)) {
                            listens = 0
                            for (var track of Object.keys(obj.playback.artists[artist].tracks)) {
                                listens += obj.playback.artists[artist].tracks[track].listens;
                            }
                            // console.log('getArtistListens()', artist, listens)
                            list.push({
                                artist: artist,
                                listens: listens
                            });
                        }
                    }
                    var sorted_list = list.sort(function(a, b) {
                        return b.listens - a.listens;
                    })
                    resolve(length == null ? sorted_list : sorted_list.slice(0, length));
                });
            } else {
                // console.log('getArtistListens()', STATISTICS_PATH, 'does not exist');
                resolve([]);
            }
        })
    });
}

function getGenreListens(length = null) {
    return new Promise(resolve => {
        fs.exists(STATISTICS_PATH, function(exists) {
            if (exists) {
                var list = [];
                var listens = null;
                var is_included = null;
                fs.readFile(STATISTICS_PATH, function readFileCallback(err, data) {
                    if (err) {
                        // console.log('getGenreListens()', err);
                    } else {
                        obj = JSON.parse(data);
                        // console.log(obj);
                        for (var artist of Object.keys(obj.playback.artists)) {
                            for (var track of Object.keys(obj.playback.artists[artist].tracks)) {
                                if ('genres' in obj.playback.artists[artist].tracks[track]) {
                                    obj.playback.artists[artist].tracks[track].genres.forEach(genre => {
                                        listens = obj.playback.artists[artist].tracks[track].listens;
                                        // console.log('getGenreListens()', artist, track, genre, listens);
                                        is_included = false;
                                        list.forEach(entry => {
                                            if (entry.genre == genre) {
                                                is_included = true;
                                                entry.listens += listens;
                                            }
                                        });
                                        if (!is_included) {
                                            list.push({
                                                genre: genre,
                                                listens: listens
                                            })
                                        }
                                    });
                                }
                            }
                        }
                    }
                    var sorted_list = list.sort(function(a, b) {
                        return b.listens - a.listens;
                    })
                    resolve(length == null ? sorted_list : sorted_list.slice(0, length));
                });
            } else {
                // console.log('getGenreListens()', STATISTICS_PATH, 'does not exist');
                resolve([]);
            }
        })
    });
}

function incrementListens() {
    // TODO: Use metadata to send API call, keep track on user object
    (async () => {
        const file_path = path.join(config.music.src, now_playing_tracks[now_playing_index]);
        const metadata = await music_metadata.parseFile(file_path);
        const artist = strToKey(metadata.common.artist);
        const track = strToKey(metadata.common.title);
        const genres = await getAlbumGenresAPI(metadata.common.artist, metadata.common.album);
        console.log('incrementListens()', artist, track, genres);
        fs.exists(STATISTICS_PATH, function(exists) {
            if (exists) {
                fs.readFile(STATISTICS_PATH, function readFileCallback(err, data) {
                    if (err) {
                        // console.log('incrementListens()', err);
                    } else {
                        obj = JSON.parse(data);
                        if (artist in obj.playback.artists) {
                            if (track in obj.playback.artists[artist].tracks) {
                                // Both artist and track exists
                                obj.playback.artists[artist].tracks[track].listens += 1;
                            } else {
                                // Artist exists but not track
                                obj.playback.artists[artist].tracks[track] = {
                                    genres: genres,
                                    listens: 1
                                }
                            }
                        } else {
                            // Neither artist nor track exists
                            obj.playback.artists[artist] = {
                                tracks: {
                                    [track]: {
                                        genres: genres,
                                        listens: 1
                                    }
                                }
                            }
                        }
                        let json = JSON.stringify(obj);
                        fs.writeFile(STATISTICS_PATH, json, function (err, data) {
                            if (err) {
                                // console.log('incrementListens()', err);
                            }
                        });
                    }
                });
            } else {
                // File doesn't exist
                // console.log('incrementListens()', STATISTICS_PATH, 'does not exist');
            }
        });
    })()
}

// DEBUG

// getGenreListens().then(data => // console.log(data));
// getArtistListens().then(data => // console.log(data));
// getTrackListens().then(data => // console.log(data));