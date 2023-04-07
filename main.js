const { app, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const savepath = require('path').join(require('os').homedir(), 'Desktop');
require('electron-reload')(__dirname);

const WORKING_FOLDER = new Date().toJSON().slice(0, 10).replace(/-/g, '') + '-JDS';

/* 3d compression */
const gltfPipeline = require("gltf-pipeline");
const fsExtra = require("fs-extra");
const obj2gltf = require("obj2gltf");
const fs = require("fs");

/* Events */
const SAVE_GLTF = "save-gltf";
const SAVE_GLTF_COMP = "save-gltf-compressed";
const SAVE_DRACO = "save-draco";
const SAVE_IMG = "save-img";

const GLTF_SAVED = 'gltf-saved';
const DRACO_SAVED = 'draco-saved';
const IMG_SAVED = 'img-saved';

const MSG = 'new-msg'

/* MSGS */
const MSG_GLTF_SAVED = "OBJ zu GLTF geladen"
const MSG_GLTF_REGULAR_SAVED = "GLTF fertig"
const MSG_GLTF_DRACO_SAVED = "GLTF Draco fertig";
const MSG_IMG_SAVED = 'Vorschaubild fertig';

/* File naming */
const SUFFIX_REGULAR = '--NORM';
const SUFFIX_COMPRESSED = '--COMP';
const SUFFIX_IMG_PREVIEW = '--PREVIEW';
const SUFFIX_EXPOSURE = '_&_exp='


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

    console.log(WORKING_FOLDER);

    win.loadFile('www/index.html');
}

function convertToGltf(args, page) {
    obj2gltf(args['file']).then(function (gltf) {
        const data = Buffer.from(JSON.stringify(gltf));
        let datasize = getDatasize(data);
        var filenamegltf = args['filename'];
        var path = savepath + "/O2G-temp/" + filenamegltf + "/" + filenamegltf + ".gltf"
        writeFileSyncRecursive(path, data);

        let Data = {
            type: GLTF_SAVED,
            label: "Temp GLTF",
            name: filenamegltf,
            filesize: datasize,
            path: path,
        };

        page.send(GLTF_SAVED, Data);
        page.send(MSG, MSG_GLTF_SAVED);
    });
}

function compressWithDraco(oriName, exposureValue, page) {
    let oriPath = savepath + "/" + WORKING_FOLDER + "/" + oriName + SUFFIX_REGULAR + SUFFIX_EXPOSURE + exposureValue + ".glb";

    const options = {
        dracoOptions: {
            compressionLevel: 5,
        },
    };

    // readFileSync -> because application/octet-stream and not /json
    const glbToGltf = gltfPipeline.glbToGltf;
    const gltf = fsExtra.readFileSync(oriPath);
    glbToGltf(gltf, options).then(function (results) {
        const datasize = getDatasize(JSON.stringify(results.gltf));
        let path = savepath + "/" + WORKING_FOLDER + "/" + oriName + SUFFIX_COMPRESSED + SUFFIX_EXPOSURE + exposureValue + ".gltf";
        fsExtra.writeJsonSync(path, results.gltf);

        let Data = {
            type: DRACO_SAVED,
            label: "Draco compressed GLTF",
            name: oriName,
            regularFileName: oriName + SUFFIX_REGULAR + SUFFIX_EXPOSURE + exposureValue + ".glb",
            filesize: datasize,
            path: path,
            oriPath: oriPath,
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


/**
 * 
 *  THREAD EVENTS
 * 
 */

// save temporary GTLF (convert selected OBJ to GLTF so it can be displayed)
ipcMain.on(SAVE_GLTF, (event, arg) => {
    console.log(
        arg
    );
    convertToGltf(arg, event.sender);
});

// save previewimage blob
ipcMain.on(SAVE_IMG, (event, name, exposureValue, buffer) => {
    fsExtra.outputFile(savepath + "/" + WORKING_FOLDER + '/' + name + SUFFIX_IMG_PREVIEW + SUFFIX_EXPOSURE + exposureValue + '.png', buffer, err => {
        if (err) {
            event.sender.send('ERROR_FILE', err.message)
        } else {
            event.sender.send(MSG, MSG_IMG_SAVED)
        }
    });
});

// save regular GLB before saving DRACO version
ipcMain.on(SAVE_GLTF_COMP, (event, oriName, exposureValue, buffer) => {
    console.log(
        oriName
    );

    // dont empty folder anymore
    let dir = savepath + "/" + WORKING_FOLDER;
    //fs.rmSync(dir, { recursive: true, force: true });

    fs.mkdirSync(dir + '/upload_erledigt', { recursive: true });

    fsExtra.outputFile(dir + '/' + oriName + SUFFIX_REGULAR + SUFFIX_EXPOSURE + exposureValue + ".glb", buffer, err => {
        if (err) {
            event.sender.send('ERROR_FILE', err.message);
        } else {
            event.sender.send(MSG, MSG_GLTF_REGULAR_SAVED);

            // save DRACO
            setTimeout(() => {
                compressWithDraco(oriName, exposureValue, event.sender);
            }, 1000);
        }
    });
});

/**
 * 
 *  APP EVENTS
 * 
 */

app.whenReady().then(() => {
    createWindow();
})

app.on('window-all-closed', () => {
    // quit app if all windows closed, in case it is mac
    app.quit();
})

app.on('will-quit', () => {
    // delete temp files before quitting
    let dir = savepath + '/O2G-temp'
    fs.rmSync(dir, { recursive: true, force: true });
})