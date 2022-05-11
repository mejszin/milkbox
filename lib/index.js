require('@electron/remote/main').initialize()

const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const ini = require('ini');
const axios = require('axios');

var config = ini.parse(fs.readFileSync('./data/config.ini', 'utf-8'));

var mainWindow = null;
var selectPlaylistModal = null;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 480,
        frame: false,
        titleBarStyle: "hidden",
        icon: path.join(__dirname, "../data/images/carton.png"),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    })
    // mainWindow.toggleDevTools()
    mainWindow.loadFile('html/index.html')
    // Keyboard Shortcuts
    globalShortcut.register('MediaPlayPause', () => {
        mainWindow.webContents.send('shortcut', 'MediaPlayPause');
    });
    globalShortcut.register('MediaNextTrack', () => {
        mainWindow.webContents.send('shortcut', 'MediaNextTrack');
    }); 
    globalShortcut.register('MediaPreviousTrack', () => {
        mainWindow.webContents.send('shortcut', 'MediaPreviousTrack');
    });

    mainWindow.on('close', function() {
        console.log("Closing");
    });
}

const createModals = () => {
    selectPlaylistModal = new BrowserWindow({ 
        width: 240,
        height: 60,
        parent: mainWindow, 
        modal: true, 
        show: false,
        titleBarStyle: "hidden",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });
    selectPlaylistModal.loadFile('html/select_playlist.html')
    submitAlbumModal = new BrowserWindow({ 
        width: 240,
        height: 148,
        parent: mainWindow, 
        modal: true, 
        show: false,
        titleBarStyle: "hidden",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });
    submitAlbumModal.loadFile('html/submit_album.html')
}

app.whenReady().then(() => {
    createWindow()
    createModals()
})

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') {
        app.quit();
    }
});

function recenterModal(modal) {
    try {
        var modalBounds = modal.webContents.getOwnerBrowserWindow().getBounds();
        var mainBounds = mainWindow.webContents.getOwnerBrowserWindow().getBounds();
        modal.setPosition(
            mainBounds.x + ((mainBounds.width  - modalBounds.width ) / 2),
            mainBounds.y + ((mainBounds.height - modalBounds.height) / 2)
        );
    } catch (error) {
        console.log(error.message);
    }
}

var selected_track_path = null;

ipcMain.on('add-track-to-playlist', (event, payload) => {
    selected_track_path = payload.track;
    recenterModal(selectPlaylistModal);
    selectPlaylistModal.show();
});

ipcMain.on('remove-track-from-playlist', (event, payload) => {
    selected_track_path = payload.track;
    removeTrackFromPlaylist(selected_track_path, payload.playlist);
});

ipcMain.on('selected-playlist', (event, payload) => {
    addTrackToPlaylist(selected_track_path, payload.playlist);
    selectPlaylistModal.hide();
});

ipcMain.on('cancel-select-playlist', (event, payload) => {
    selectPlaylistModal.hide();
});

ipcMain.on('submit-album', (event, payload) => {
    console.log(payload.artist, payload.album, payload.year, payload.genres);
    submitAlbum(payload.artist, payload.album, payload.year, payload.genres);
    submitAlbumModal.hide();
});

ipcMain.on('cancel-submit-album', (event, payload) => {
    submitAlbumModal.hide();
});

async function loadPlaylists() {
    return new Promise(resolve => {
        var data = JSON.parse(fs.readFileSync('./data/playlists.json', 'utf8'));
        resolve(data);
    });
}

function addTrackToPlaylist(track_path, playlist_name) {
    loadPlaylists().then((playlists) => {
        for (var playlist of playlists) {
            if (playlist.name == playlist_name) {
                playlist.tracks.push(track_path);
            }
        }
        const json = JSON.stringify(playlists);
        fs.writeFile('./data/playlists.json', json, function(err) {
            if (err) { console.log(err) }
        });
    });
}

function removeTrackFromPlaylist(track_path, playlist_name) {
    loadPlaylists().then((playlists) => {
        for (var playlist of playlists) {
            if (playlist.name == playlist_name) {
                var index = playlist.tracks.indexOf(track_path);
                if (index !== -1) {
                    playlist.tracks.splice(index, 1);
                }
            }
        }
        const json = JSON.stringify(playlists);
        fs.writeFile('./data/playlists.json', json, function(err) {
            if (err) { console.log(err) }S
        });
    });
}

function newApplicationId() {
    return new Promise(resolve => {
        var url = `https://vault.machin.dev/api/newApplicationId`;
        axios.get(url).then(function (response) {
            resolve(response.status == '200' ? response.data.application_id : 0);
        });
    });
}

async function assignApplicationId(application_id) {
    var url = `https://vault.machin.dev/api/applicationId`;
    axios.get(url, { params: { application_id: application_id } }).then(async function (response) {
        if (response.status == '200') {
            if (response.data.exists == false) {
                application_id = await newApplicationId()
                console.log(`Assigned application_id=${application_id}`);
                config.application.id = application_id;
                fs.writeFileSync('./config.ini', ini.stringify(config))
            }
        }
    })
}

assignApplicationId(config.application.id);

async function submitAlbum(artist, album, year, genres) {
    var url = `https://vault.machin.dev/api/setAlbum`;
    var params = {
        application_id: config.application.id,
        artist: artist,
        album: album,
        year: year,
        genres: genres
    }
    axios.get(url, { params: params }).then(async function (response) {
        console.log(response.status, response.data);
    })
}