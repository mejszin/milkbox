const { ipcRenderer } = require('electron')

// var createPlayer = require('web-audio-player');
// https://www.npmjs.com/package/web-audio-player

var audio = null;

function createPlayer() {
    if (audio != null) { return }
    // <audio controls></audio>
    var div = document.getElementById('player')
    audio = document.createElement('audio');
    audio.setAttribute('controls', '');
    audio.onplay  = function() { playAudio() }; 
    audio.onpause = function() { pauseAudio() }; 
    audio.onended = function() {
        incrementPlayCounter();
        nextAudio();
    }; 
    audio.src = path.join(config.music.src, now_playing_tracks[now_playing_index]);
    div.appendChild(audio);
    highlightTrack();
    displayAlbumCover(now_playing_tracks[now_playing_index]);
    displayTrackName(now_playing_tracks[now_playing_index]);
    if (!has_initially_synced_playing) {
        setPlayingAPI(now_playing_tracks[now_playing_index]);
    }
    setPausedAPI('true');
}

function loadAudio() {
    console.log('loadAudio()');
    audio.src = path.join(config.music.src, now_playing_tracks[now_playing_index]);
    audio.play();
    highlightTrack();
    displayAlbumCover(now_playing_tracks[now_playing_index]);
    displayTrackName(now_playing_tracks[now_playing_index]);
    setPlayingAPI(now_playing_tracks[now_playing_index]);
    playAudio();
}

function previousAudio() {
    now_playing_index -= 1;
    loadAudio();
}

function nextAudio() {
    now_playing_index += 1;
    loadAudio();
}

function playAudio() {
    console.log('playAudio()');
    audio.play();
    setPausedAPI('false');
}

function pauseAudio() {
    console.log('pauseAudio()');
    audio.pause();
    setPausedAPI('true');
}

function skipToAudio(index) {
    now_playing_index = index;
    loadAudio();
}

ipcRenderer.on('shortcut', (event, payload) => {
    if (payload == 'MediaPlayPause') {
        if (audio == null) {
            loadAudio()
        } else {
            audio.paused ? playAudio() : pauseAudio();
        }
    }
    if (payload == 'MediaNextTrack') {
        nextAudio();
    }
    if (payload == 'MediaPreviousTrack') {
        previousAudio();
    }
});