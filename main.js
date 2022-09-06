const { app, ipcMain, BrowserWindow } = require('electron')
//const path = require('path')
const savepath = require('path').join(require('os').homedir(), 'Desktop')
require('electron-reload')(__dirname);

/* 3d compression */
const gltfPipeline = require("gltf-pipeline");
const fsExtra = require("fs-extra");
const obj2gltf = require("obj2gltf");
const fs = require("fs");


function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        /* fullscreen: true,
        alwaysOnTop: true,
        autoHideMenuBar: true,
        titleBarStyle: 'hidden', 
        kiosk :true,*/
        center: true,

        webPreferences: {
            //preload: path.join(__dirname, 'preload.js')
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    console.log(savepath);
    win.loadFile('www/index.html');
}

function convertToGltf(args,page) {
    obj2gltf(args['file']).then(function (gltf) {
        const data = Buffer.from(JSON.stringify(gltf));
        var filenamegltf = args['filename'];
        fs.writeFileSync(savepath+"/"+filenamegltf+"-regular.gltf", data);
        page.send('mainprocess-response', "GLTF done");

        compressWithDraco(filenamegltf,page);
    });  
}

function compressWithDraco(filename,page) {

    const processGltf = gltfPipeline.processGltf;
    const gltf = fsExtra.readJsonSync(savepath+"/"+filename+"-regular.gltf");
    const options = {
        dracoOptions: {
            compressionLevel: 10,
        },
    };
    processGltf(gltf, options).then(function (results) {
        fsExtra.writeJsonSync(savepath+"/"+filename+"-draco_compressed.gltf", results.gltf);
        page.send('mainprocess-response', "GLTF Draco done");
    });
}

app.whenReady().then(() => {
    createWindow();
})

app.on('window-all-closed', function () {
    app.quit();
})

// Attach listener in the main process with the given ID
ipcMain.on('request-mainprocess-action', (event, arg) => {
    console.log(
        arg
    );
    convertToGltf(arg, event.sender);    
});