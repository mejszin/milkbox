require('@electron/remote/main').initialize()

const { app, BrowserWindow, globalShortcut } = require('electron');

const createWindow = () => {
    const window = new BrowserWindow({
        width: 1000,
        height: 480,
        frame: false,
        titleBarStyle: "hidden",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    })
//  window.toggleDevTools()
    window.loadFile('html/index.html')
    // Keyboard Shortcuts
    globalShortcut.register('MediaPlayPause', () => {
        window.webContents.send('shortcut', 'MediaPlayPause');
    });
    globalShortcut.register('MediaNextTrack', () => {
        window.webContents.send('shortcut', 'MediaNextTrack');
    }); 
    globalShortcut.register('MediaPreviousTrack', () => {
        window.webContents.send('shortcut', 'MediaPreviousTrack');
    });

    window.on('close', function() {
        console.log("Closing");
    });
}

app.whenReady().then(() => {
    createWindow()
})

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') {
        app.quit();
    }
});