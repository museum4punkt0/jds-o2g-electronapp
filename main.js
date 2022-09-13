const { app, ipcMain, BrowserWindow } = require('electron')
const path = require('path')
const savepath = require('path').join(require('os').homedir(), 'Desktop')
require('electron-reload')(__dirname);

/* MSGS */
const GLTF_SAVED = "GLTF fertig"
const GLTF_DRACO_SAVED = "GLTF Draco fertig";
const IMG_SAVED = 'Vorschaubild fertig';

/* 3d compression */
const gltfPipeline = require("gltf-pipeline");
const fsExtra = require("fs-extra");
const obj2gltf = require("obj2gltf");
const fs = require("fs");


function createWindow() {
    const win = new BrowserWindow({
        width: 1900,
        height: 1300,
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
        page.send('mainprocess-response', GLTF_SAVED);

        let Data = {
            label: "Regular GLTF",
            name: filenamegltf,
            filesize: datasize,
            path: savepath + "/" + filenamegltf + "/" + filenamegltf + "-regular.gltf",
            closer: false
        };

        page.send('mainprocess-objpath', Data);

        compressWithDraco(filenamegltf, page);
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
        page.send('mainprocess-response', GLTF_DRACO_SAVED);

        let Data = {
            label: "Draco compressed GLTF",
            name: filename,
            filesize: datasize,
            path: savepath + "/" + filename + "/" + filename + "-draco_compressed.gltf",
            closer: true
        };
        page.send('mainprocess-objpath', Data);
    });
}

function writeFileSyncRecursive(filename, content = '') {
    fs.mkdirSync(path.dirname(filename), { recursive: true })
    fs.writeFileSync(filename, content)
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
    fsExtra.outputFile(savepath + "/" + name + '/' + name + '-preview.png', buffer, err => {
        if (err) {
            event.sender.send('ERROR_FILE', err.message)
        } else {
            event.sender.send('request-previewimg-saved', IMG_SAVED)
        }
    })
});