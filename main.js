const { app, ipcMain, BrowserWindow } = require('electron')
const FileSaver = require('file-saver');
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
        fs.writeFileSync(savepath + "/" + filenamegltf + "-regular.gltf", data);
        page.send('mainprocess-response', "GLTF created");

        let Data = {
            label: "Regular GLTF",
            name: filenamegltf,
            path: savepath + "/" + filenamegltf + "-regular.gltf",
            closer: false
        };

        page.send('mainprocess-objpath', Data);

        compressWithDraco(filenamegltf,page);
    });
}

function savePreviewImg(args, page){
    console.log("saving image");
    var filename = args['filename'];
    //fs.writeFileSync(savepath + "/" + filename, args['file']);

    FileSaver.saveAs(args['file'],savepath + "/" + filename);
   // fs.createWriteStream(savepath + "/" + filename).write(args['file']);

    page.send('mainprocess-response', "Preview image created"); 
}

function compressWithDraco(filename, page) {
    const processGltf = gltfPipeline.processGltf;
    const gltf = fsExtra.readJsonSync(savepath+"/"+filename+"-regular.gltf");
    //const gltf = fsExtra.readJsonSync(args['file']);
    const options = {
        dracoOptions: {
            compressionLevel: 1,
        },
    };
    processGltf(gltf, options).then(function (results) {
        fsExtra.writeJsonSync(savepath + "/" + filename + "-draco_compressed.gltf", results.gltf);
        page.send('mainprocess-response', "GLTF Draco created");

        let Data = {
            label: "Draco compressed GLTF",
            name: filename,
            path: savepath + "/" + filename + "-draco_compressed.gltf",
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

// Attach listener in the main process with the given ID
ipcMain.on('request-gltf', (event, arg) => {
    console.log(
        arg
    );
    convertToGltf(arg, event.sender);
});

/* // Attach listener in the main process with the given ID
ipcMain.on('request-previewimg', (event, arg) => {
    console.log(
        arg
    );
    savePreviewImg(arg, event.sender);
}); */

// Attach listener in the main process with the given ID
ipcMain.on('request-gltf-draco', (event, arg) => {
    console.log(
        arg
    );
    compressWithDraco(arg, event.sender);
});



ipcMain.on('request-previewimg', (event, path, buffer) => {
    fsExtra.outputFile(savepath+"/"+path, buffer, err => {
        if (err) {
            event.sender.send('ERROR_FILE', err.message)
        } else {
            event.sender.send('request-previewimg-saved', savepath+"/"+path)
        }
    })
});