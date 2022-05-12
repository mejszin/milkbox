const { combinedDisposable } = require('custom-electron-titlebar/build/common/lifecycle');
const fs = require('fs');
const { ipcRenderer } = require('electron');

function selectPlaylist() {
  var select = document.getElementById('playlist-select');
  ipcRenderer.send('selected-playlist', {
    playlist: select.value
  });
}

function cancelSelect() {
  ipcRenderer.send('cancel-select-playlist', {});
}

async function loadPlaylists() {
    return new Promise(resolve => {
        var data = JSON.parse(fs.readFileSync('./data/playlists.json', 'utf8'));
        resolve(data);
    });
}

loadPlaylists().then((playlists) => {
    var select = document.getElementById('playlist-select');
    var option = null;
    for (var playlist of playlists) {
        option = document.createElement('option');
        option.value = playlist.name;
        option.innerText = playlist.name;
        select.appendChild(option);
    }
});