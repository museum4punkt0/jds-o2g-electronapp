const { app, ipcMain, BrowserWindow } = require('electron')
const path = require('path')
const savepath = require('path').join(require('os').homedir(), 'Desktop')
require('electron-reload')(__dirname);

/* Events */
const SAVE_GLTF = "save-gltf";
const SAVE_DRACO = "save-draco";
const SAVE_IMG = "save-img";

const GLTF_SAVED = 'gltf-saved';
const DRACO_SAVED = 'draco-saved';
const IMG_SAVED = 'img-saved';

const MSG = 'new-msg'

/* MSGS */
const MSG_GLTF_SAVED = "GLTF fertig"
const MSG_GLTF_DRACO_SAVED = "GLTF Draco fertig";
const MSG_IMG_SAVED = 'Vorschaubild fertig';

/* 3d compression */
const gltfPipeline = require("gltf-pipeline");
const fsExtra = require("fs-extra");
const obj2gltf = require("obj2gltf");
const fs = require("fs");


function createWindow() {
    const win = new BrowserWindow({
        width: 1600,
        height: 900,
        autoHideMenuBar: true,
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
        let datasize = getDatasize(data);
        var filenamegltf = args['filename'];
        writeFileSyncRecursive(savepath + "/" + filenamegltf + "/" + filenamegltf + "-regular.gltf", data);        

        let Data = {
            type: GLTF_SAVED,
            label: "Regular GLTF",
            name: filenamegltf,
            filesize: datasize,
            path: savepath + "/" + filenamegltf + "/" + filenamegltf + "-regular.gltf"
        };

        page.send(GLTF_SAVED, Data);
        page.send(MSG, MSG_GLTF_SAVED);

        setTimeout(() => {
            compressWithDraco(filenamegltf, page);
        }, 1000);
        
    });
}

function compressWithDraco(filename, page) {
    const processGltf = gltfPipeline.processGltf;
    const gltf = fsExtra.readJsonSync(savepath + "/" + filename + "/" + filename + "-regular.gltf");

    const options = {
        dracoOptions: {
            compressionLevel: 5,
        },
    };

    processGltf(gltf, options).then(function (results) {
        const datasize = getDatasize(JSON.stringify(results.gltf)); 
        fsExtra.writeJsonSync(savepath + "/" + filename + "/" + filename + "-draco_compressed.gltf", results.gltf);        

        let Data = {
            type: DRACO_SAVED,
            label: "Draco compressed GLTF",
            name: filename,
            filesize: datasize,
            path: savepath + "/" + filename + "/" + filename + "-draco_compressed.gltf"
        };
        
        page.send(DRACO_SAVED, Data);
        page.send(MSG, MSG_GLTF_DRACO_SAVED);
    });
}

function writeFileSyncRecursive(filename, content = '') {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, content);
}

function getDatasize(filestream) {
    let datasize = Buffer.byteLength(filestream);
    datasize = datasize / 1000000;
    datasize = datasize.toFixed(2) + "MB";
    return datasize;
}

app.whenReady().then(() => {
    createWindow();
})

app.on('window-all-closed', function () {
    app.quit();
})


ipcMain.on(SAVE_GLTF, (event, arg) => {
    console.log(
        arg
    );
    convertToGltf(arg, event.sender);
});


/* ipcMain.on(SAVE_DRACO, (event, arg) => {
    console.log(
        arg
    );
    compressWithDraco(arg, event.sender);
}); */

ipcMain.on(SAVE_IMG, (event, name, buffer) => {
    fsExtra.outputFile(savepath + "/" + name + '/' + name + '-preview.png', buffer, err => {
        if (err) {
            event.sender.send('ERROR_FILE', err.message)
        } else {
            event.sender.send(MSG, MSG_IMG_SAVED)
        }
    })
});