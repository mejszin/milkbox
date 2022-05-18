require('@electron/remote/main').initialize()

const { app, BrowserWindow, globalShortcut, ipcMain, net } = require('electron');
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
    mainWindow.toggleDevTools()
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

    mainWindow.on('close', async function() {
        console.log("Closing");
        await setPaused();
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
        height: 146,
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
    cloudMenuModal = new BrowserWindow({ 
        width: 160,
        height: 110,
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
    cloudMenuModal.loadFile('html/cloud_menu.html')
    setAliasModal = new BrowserWindow({ 
        width: 160,
        height: 62,
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
    setAliasModal.loadFile('html/set_alias.html')
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

function loadPlaylists() {
    return new Promise(resolve => {
        var data = JSON.parse(fs.readFileSync('./data/playlists.json', 'utf8'));
        resolve(data);
    });
}

function addTrackToPlaylist(track_path, playlist_name) {
    loadPlaylists().then((playlists) => {
        for (var playlist of playlists) {
            if (playlist.name == playlist_name) {
                playlist.tracks.push(track_path.replace(config.music.src, ''));
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
                var index = playlist.tracks.indexOf(track_path.replace(config.music.src, ''));
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

function setPaused() {
    return new Promise(resolve => {
        var url = `${config.api.url}/setPaused`;
        var header = { params: { application_id: config.application.id, status: 'true' } };
        axios.get(url, header).then(function (response) {
            resolve(response.status == '200');
        });
    });
}

function newApplicationId() {
    return new Promise(resolve => {
        var url = `${config.api.url}/newApplicationId`;
        axios.get(url).then(function (response) {
            resolve(response.status == '200' ? response.data.application_id : 0);
        });
    });
}

async function assignApplicationId(application_id) {
    var url = `${config.api.url}/applicationId`;
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
    var url = `${config.api.url}/setAlbum`;
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

async function setAlias(alias) {
    var url = `${config.api.url}/setAlias`;
    var params = {
        application_id: config.application.id,
        alias: alias
    }
    axios.get(url, { params: params }).then(async function (response) {
        console.log(response.status, response.data);
    })
}

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

ipcMain.on('show-submit-album', (event, payload) => {
    recenterModal(submitAlbumModal);
    submitAlbumModal.show();
});

ipcMain.on('submit-album', (event, payload) => {
    console.log(payload.artist, payload.album, payload.year, payload.genres);
    submitAlbum(payload.artist, payload.album, payload.year, payload.genres);
    submitAlbumModal.hide();
});

ipcMain.on('cancel-submit-album', (event, payload) => {
    submitAlbumModal.hide();
});

ipcMain.on('show-cloud-menu', (event, payload) => {
    recenterModal(cloudMenuModal);
    cloudMenuModal.show();
});

ipcMain.on('hide-cloud-menu', (event, payload) => {
    cloudMenuModal.hide();
});

ipcMain.on('open-forum', (event, payload) => {
    var url = config.forum.url + "/?application_id=" + config.application.id;
    require('electron').shell.openExternal(url);
});

ipcMain.on('show-set-alias', (event, payload) => {
    recenterModal(setAliasModal);
    setAliasModal.show();
});

ipcMain.on('set-alias', (event, payload) => {
    console.log(payload.alias);
    setAlias(payload.alias);
    setAliasModal.hide();
});

ipcMain.on('hide-set-alias', (event, payload) => {
    setAliasModal.hide();
});

ipcMain.on('post-json', (event, payload) => {
    console.log(payload.endpoint, payload.body);
    let requestApi = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        protocol: 'https:',
        hostname: 'milkbox.club',
        port: 443,
        path: '/api' + payload.endpoint
    };
    const request = net.request(requestApi);
    request.on('response', (response) => {
        console.log(`STATUS: ${response.statusCode}`);
        response.on('error', (error) => {
            console.log(`ERROR: ${JSON.stringify(error)}`);
        })
    });
    request.end(payload.body);
});