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
    audio.onended = function() {
        nextAudio();
    }; 
    audio.src = track_paths[now_playing_index];
    div.appendChild(audio);
    highlightTrack();
    displayAlbumCover(track_paths[now_playing_index]);
    displayTrackName(track_paths[now_playing_index]);
}

function loadAudio() {
    audio.src = track_paths[now_playing_index];
    playAudio();
    highlightTrack();
    displayAlbumCover(track_paths[now_playing_index]);
    displayTrackName(track_paths[now_playing_index]);
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
    audio.play();
}

function pauseAudio() {
    audio.pause();
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