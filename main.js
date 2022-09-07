const { app, ipcMain, BrowserWindow } = require('electron')
const path = require('path')
const savepath = require('path').join(require('os').homedir(), 'Desktop')
require('electron-reload')(__dirname);

/* 3d compression */
const gltfPipeline = require("gltf-pipeline");
const fsExtra = require("fs-extra");
const obj2gltf = require("obj2gltf");
const fs = require("fs");


function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 900,
        //titleBarStyle: 'hidden', 
        autoHideMenuBar: true,
        /* fullscreen: true,
        alwaysOnTop: true,
                
        kiosk :true,*/
        center: true,

        webPreferences: {
            //preload: path.join(__dirname, 'preload.js')
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.loadFile('www/index.html');
}



function convertToGltf(args, page) {
    obj2gltf(args['file']).then(function (gltf) {
        const data = Buffer.from(JSON.stringify(gltf));
        var filenamegltf = args['filename'];
        //fs.writeFileSync(savepath + "/" + filenamegltf + "/"+ filenamegltf + "-regular.gltf", data);
        writeFileSyncRecursive(savepath + "/" + filenamegltf + "/"+ filenamegltf + "-regular.gltf", data);
        page.send('mainprocess-response', "GLTF created");

        let Data = {
            label: "Regular GLTF",
            name: filenamegltf,
            path: savepath + "/" + filenamegltf + "/"+ filenamegltf + "-regular.gltf",
            closer: false
        };

        page.send('mainprocess-objpath', Data);

        compressWithDraco(filenamegltf,page);
    });
}

function writeFileSyncRecursive(filename, content = '') {
    fs.mkdirSync(path.dirname(filename), {recursive: true})
    fs.writeFileSync(filename, content)
}

function compressWithDraco(filename, page) {
    const processGltf = gltfPipeline.processGltf;
    const gltf = fsExtra.readJsonSync(savepath+"/" + filename + "/"+ filename +"-regular.gltf");
    const options = {
        dracoOptions: {
            compressionLevel: 1,
        },
    };
    processGltf(gltf, options).then(function (results) {
        fsExtra.writeJsonSync(savepath + "/" + filename +"/"+ filename + "-draco_compressed.gltf", results.gltf);
        page.send('mainprocess-response', "GLTF Draco created");

        let Data = {
            label: "Draco compressed GLTF",
            name: filename,
            path: savepath + "/" + filename +"/"+ filename + "-draco_compressed.gltf",
            closer: true
        };
        page.send('mainprocess-objpath', Data);
    });
}

app.whenReady().then(() => {
    createWindow();
})

app.on('window-all-closed', function () {
    app.quit();
})


ipcMain.on('request-gltf', (event, arg) => {
    console.log(
        arg
    );
    convertToGltf(arg, event.sender);
});


ipcMain.on('request-gltf-draco', (event, arg) => {
    console.log(
        arg
    );
    compressWithDraco(arg, event.sender);
});

ipcMain.on('request-previewimg', (event, name, buffer) => {
    fsExtra.outputFile(savepath+"/"+ name + '/' + name + '-preview.png', buffer, err => {
        if (err) {
            event.sender.send('ERROR_FILE', err.message)
        } else {
            event.sender.send('request-previewimg-saved', 'Preview image saved')
        }
    })
});