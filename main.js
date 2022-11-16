const { app, ipcMain, BrowserWindow } = require('electron')
const path = require('path')
const savepath = require('path').join(require('os').homedir(), 'Desktop')
require('electron-reload')(__dirname);

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
const MSG_GLTF_COMP_SAVED = "GLTF fertig"
const MSG_GLTF_DRACO_SAVED = "GLTF Draco fertig";
const MSG_IMG_SAVED = 'Vorschaubild fertig';


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
        var path = savepath + "/O2G-temp/" + filenamegltf + "/" + filenamegltf + ".gltf"
        writeFileSyncRecursive(path, data);

        let Data = {
            type: GLTF_SAVED,
            label: "Regular GLTF",
            name: filenamegltf,
            filesize: datasize,
            path: path
        };

        page.send(GLTF_SAVED, Data);
        page.send(MSG, MSG_GLTF_SAVED);

        /* setTimeout(() => {
            compressWithDraco(filenamegltf, page);
        }, 1000); */

    });
}

function compressWithDraco(oriName, exposureValue, page) {
    let oriPath = savepath + "/" + oriName + "/" + oriName + "-regular_%_exposure="+exposureValue+".glb";

    const options = {
        dracoOptions: {
            compressionLevel: 5,
        },
    };

    

    // because application/octet-stream and not /json
    const glbToGltf = gltfPipeline.glbToGltf;    
    const gltf = fsExtra.readFileSync(oriPath); 
    
    //const processGltf = gltfPipeline.processGltf;
    //const gltf = fsExtra.readJsonSync(oriPath);

    //processGltf(gltf, options).then(function (results) {
    glbToGltf(gltf, options).then(function (results) {
        const datasize = getDatasize(JSON.stringify(results.gltf));
        let path = savepath + "/" + oriName + "/" + oriName + "-draco_compressed_%_exposure="+exposureValue+".gltf";
        fsExtra.writeJsonSync(path, results.gltf);

        let Data = {
            type: DRACO_SAVED,
            label: "Draco compressed GLTF",
            name: oriName,
            regularFileName: oriName + "-regular_%_exposure="+exposureValue+".glb",
            filesize: datasize,
            path: path,
            oriPath: oriPath
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

ipcMain.on(SAVE_GLTF, (event, arg) => {
    console.log(
        arg
    );
    convertToGltf(arg, event.sender);
});

ipcMain.on(SAVE_IMG, (event, name, buffer) => {
    fsExtra.outputFile(savepath + "/" + name + '/' + name + '-preview.png', buffer, err => {
        if (err) {
            event.sender.send('ERROR_FILE', err.message)
        } else {
            event.sender.send(MSG, MSG_IMG_SAVED)
        }
    });
});

ipcMain.on(SAVE_GLTF_COMP, (event, oriName, exposureValue, buffer) => {
    console.log(
        oriName
    );
    //compressWithDraco(arg, event.sender);
    fsExtra.outputFile(savepath + "/" + oriName + '/' + oriName + "-regular_%_exposure="+exposureValue+".glb", buffer, err => {
        if (err) {
            event.sender.send('ERROR_FILE', err.message)
        } else {
            event.sender.send(MSG, MSG_GLTF_COMP_SAVED)
        }
    });

    setTimeout(() => {
        compressWithDraco(oriName, exposureValue, event.sender);
    }, 1000);

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