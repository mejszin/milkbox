const STATISTICS_PATH = './data/statistics.json';

function strToKey(str) {
    console.log('strToKey()', str);
    return str.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").split(' ').join('_');
}

function incrementPlayCounter() {
    // TODO: Use metadata to send API call, keep track on user object
    (async () => {
        const file_path = path.join(config.music.src, now_playing_tracks[now_playing_index]);
        const metadata = await music_metadata.parseFile(file_path);
        const artist = strToKey(metadata.common.artist);
        const track = strToKey(metadata.common.title);
        fs.exists(STATISTICS_PATH, function(exists) {
            if (exists) {
                fs.readFile(STATISTICS_PATH, function readFileCallback(err, data) {
                    if (err) {
                        console.log('incrementPlayCounter()', err);
                    } else {
                        obj = JSON.parse(data);
                        if (artist in obj.playback.artists) {
                            if (track in obj.playback.artists[artist]) {
                                // Both artist and track exists
                                obj.playback.artists[artist].tracks[track].listens += 1;
                            } else {
                                // Artist exists but not track
                                obj.playback.artists[artist].tracks[track] = {
                                    listens: 1
                                }
                            }
                        } else {
                            // Neither artist nor track exists
                            obj.playback.artists[artist] = {
                                tracks: {
                                    [track]: {
                                        listens: 1
                                    }
                                }
                            }
                        }
                        let json = JSON.stringify(obj);
                        fs.writeFile(STATISTICS_PATH, json, function (err, data) {
                            if (err) {
                                console.log('incrementPlayCounter()', err);
                            }
                        });
                    }
                });
            } else {
                // File doesn't exist
                console.log('incrementPlayCounter()', STATISTICS_PATH, 'does not exist');
            }
        });
    })()
}