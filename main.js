const { app, BrowserWindow } = require('electron')
const path = require('path')
require('electron-reload')(__dirname);


function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        fullscreen: true,
        alwaysOnTop: true,
        autoHideMenuBar: true,
        kiosk :true,
        center: true,
        titleBarStyle: 'hidden',
        webPreferences: {
            //preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('www/index.html');
}

app.whenReady().then(() => {
    createWindow();
})

app.on('window-all-closed', function () {
    app.quit();
})