const { ipcRenderer } = require("electron");

const NO_FILES_SELECTED = "Keine Datei vorhanden!";
const SUFFIX_EXPOSURE = '_&_exp='

/* Events */
const SAVE_GLTF = "save-gltf";
const SAVE_GLTF_COMP = "save-gltf-compressed";
const SAVE_DRACO = "save-draco";
const SAVE_IMG = "save-img";
const GLTF_SAVED = 'gltf-saved';
const DRACO_SAVED = 'draco-saved';
const IMG_SAVED = 'img-saved';
const MSG = 'new-msg'

/* model-viewer */
const SHADOW_INTENSITY = 0.1;
const ENV_IMG = 'neutral'; // neutral or legacy

const roll = document.querySelector('#roll');
const pitch = document.querySelector('#pitch');
const yaw = document.querySelector('#yaw');
const exposure = document.querySelector('#exposure');
const edit_controls = document.querySelector('#edit_controls');

let timeoutfeedback;
let btn_reset;
let btn_resetprevs;
let btn_toConvert;
let btn_toView;
let toolsC;
let toolsV;
let viewersAreaConvert;
let viewersAreaView;
let dropzone;
let regularGltfPath;
let screenshotExposure;
let filename;
let obj_counter = 1;

let currentModelViewer;
let updateFrameTimer;

/**
 * Init the app
 */
function initialize() {

  startUploadListener();

  // btns that switch between convert and view
  btn_toConvert = document.getElementById('toConvert');
  btn_toView = document.getElementById('toView');

  // rest btns in convert and view
  btn_reset = document.getElementById('reset');
  btn_resetprevs = document.getElementById('resetprevs');

  // tools area (bottom) in convert and view
  toolsC = document.querySelector('.tools.convert');
  toolsV = document.querySelector('.tools.view');

  // area that gets populated with models in convert and view
  viewersAreaConvert = document.getElementById('viewers');
  viewersAreaView = document.getElementById('previewers');

  // dropzone in view
  dropzone = document.getElementById('dropzone');

  btn_toConvert.addEventListener('click', () => {
    switchToConvert();
  });

  btn_toView.addEventListener('click', () => {
    switchToView();
  });

  btn_reset.addEventListener('click', () => {
    btn_reset.classList.add('disabled');

    document.querySelector('.tools.convert').appendChild(edit_controls);
    edit_controls.classList.remove('active');
    document.getElementById('viewers').innerHTML = "";

    obj_counter = 1;

    let form = document.getElementById('form-obj');
    form.reset();
    let input = document.getElementById('objfile');
    let label = input.nextElementSibling;
    label.innerHTML = 'OBJ Datei auswählen';
  });

  btn_resetprevs.addEventListener('click', () => {
    document.getElementById('previewers').innerHTML = "";
    btn_resetprevs.classList.add('disabled');
  });

  ipcRenderer.on(MSG, (event, arg) => {
    setFeedback(arg);
  });
  ipcRenderer.on(GLTF_SAVED, (event, args) => {
    createViewer(event, args);
  });
  ipcRenderer.on(DRACO_SAVED, (event, args) => {
    createViewer(event, args);
  });
}

/**
 * Switches to Convert area
 */
function switchToConvert() {
  btn_toView.classList.remove('hidden');
  btn_toConvert.classList.add('hidden');

  toolsC.classList.remove('hidden')
  toolsV.classList.add('hidden');

  viewersAreaConvert.classList.remove('hidden')
  viewersAreaView.classList.add('hidden');
}

/**
 * Switches to View area
 */
function switchToView() {
  btn_toConvert.classList.remove('hidden');
  btn_toView.classList.add('hidden');

  toolsV.classList.remove('hidden')
  toolsC.classList.add('hidden');

  viewersAreaView.classList.remove('hidden')
  viewersAreaConvert.classList.add('hidden');
}

/**
 * Listener for input file. It is restyled so we
 * can show a message inside
 */
function startUploadListener() {
  let inputFile = document.getElementById("objfile");

  if (inputFile) {
    inputFile.addEventListener('change', function (e) {
      let label = this.nextElementSibling;

      if (this.files[0]) {
        label.innerHTML = this.files[0].name + ' ausgewählt ...';
        handleFileChange();
      }
    });
  }
}

/**
 * Handles a file change to update messages and automatically
 * sends the data to the mainjs to handle the OBJ
 * @returns void
 */
function handleFileChange() {
  let file_field = document.getElementById("objfile");

  if (file_field.files.length == 0) {
    setFeedback(NO_FILES_SELECTED);
    return;
  }

  btn_reset.classList.add('disabled');
  filename = getTimeStamp() + '_' + removeExtension(file_field.files[0].name);

  let Data = {
    file: file_field.files[0].path,
    filename: filename
  };

  ipcRenderer.send(SAVE_GLTF, Data);
}

/**
 * Handles the drop event in the view area to display the droped files
 * @param {Event} ev 
 */
function dropHandler(ev) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    [...ev.dataTransfer.items].forEach((item, i) => {
      // If dropped items aren't files, reject them
      if (item.kind === 'file') {
        const file = item.getAsFile();
        let _name = file.name;
        if (_name.includes('.gltf') || _name.includes('.glb')) {
          createPreviewer(file.path, file.name, file.size / 1000000);
        }
        else {
          setFeedback("Nur GLTF und GLB sind erlaubt! <br>" + file.name);
        }
      }
    });
  } else {
    // Use DataTransfer interface to access the file(s)
    [...ev.dataTransfer.files].forEach((file, i) => {
      let _name = file.name;
      if (_name.includes('.gltf')) {
        createPreviewer(file.path, file.name, file.size / 1000000);
      }
      else {
        setFeedback("Nur GLTF ist erlaubt! <br>" + file.name);
      }
    });
  }

  dropzone.classList.remove('hover');
}

/**
 * Mouse drag over handler for dropzone
 * (gets called from html)
 * @param {Event} ev 
 */
function dragOverHandler(ev) {
  ev.preventDefault();
  dropzone.classList.add('hover');
}

/**
 * Mouse drag out handler for dropzone
 * (gets called from html)
 * @param {Event} ev 
 */
function dragOutHandler(ev) {
  ev.preventDefault();
  dropzone.classList.remove('hover');
}

/**
 * Creates a model-viewer element in View.
 * @param {string} path 
 * @param {string} name 
 * @param {number} filesize 
 */
function createPreviewer(path, name, filesize) {
  btn_resetprevs.classList.remove('disabled');

  let model_id = Date.now() + Math.random() * 100;
  let previewerDiv = document.createElement("div");
  let exposure = removeExtension(name);

  filesize = filesize.toFixed(2) + "MB";
  exposure = exposure.split(SUFFIX_EXPOSURE).pop();
  previewerDiv.classList.add('model');
  document.getElementById('previewers').prepend(previewerDiv);

  previewerDiv.innerHTML = '<div class="info"><h2>' + name + '</h2>' +
    '<p>' + filesize + '</p></div>' +
    '<model-viewer id="' + model_id + '" class="model-viewer" poster="" src="' + path + '?' + new Date() + '" loading="eager" reveal="auto" camera-controls touch-action="pan-y" auto-rotate environment-image="' + ENV_IMG + '" exposure="' + exposure + '" shadow-intensity="' + SHADOW_INTENSITY + '" alt="loaded model"></model-viewer>';

}

/**
 * Creates a model-viewer element in Convert. Depending
 * on the type passed in the arguments if either creates
 * the initial viewer for the temp GTLF, bypasses creating
 * the Draco compressed viewer (not needed in the new version)
 * or creates a viewer for the thumbnail generation, which is
 * not visible and quite large so the thumbnail has a good quality
 * (see CSS of 'spanshot')
 * @param {Event} event 
 * @param {Array} args 
 */
function createViewer(event, args) {
  let _type = args['type'] ?? '';
  btn_reset.classList.remove('disabled');

  let model_id = Date.now() * 10000 + Math.random();

  /* temp GLTF has been saved after OBJ -> GLTF
  and we display the temp GLTF*/
  if (_type == GLTF_SAVED) {
    let viewerDiv = document.createElement("div");
    viewerDiv.classList.add('model');
    document.getElementById('viewers').prepend(viewerDiv);

    viewerDiv.innerHTML = '<div class="info"><p class="num">' + obj_counter + '</p><h2>' + args['label'] + '</h2><p>' + args['name'] + '</p>' +
      '<p>' + args['filesize'] + '</p>' +
      '<button class="btn" id="btnExport_' + model_id + '" onclick="exportGLB(this)">Dateien generieren</button>' +
      '<button class="btn" id="btnEdit_' + model_id + '" onclick="editObject(this)">Editieren</button></div>' +
      '<model-viewer id="' + model_id + '" class="model-viewer" src="' + args['path'] + '?' + new Date() + '" id="reveal" loading="eager" reveal="auto" shadow-intensity="' + SHADOW_INTENSITY + '" alt="loaded model"></model-viewer>';

    let input = document.getElementById('objfile');
    let label = input.nextElementSibling;
    label.innerHTML = 'OBJ Datei auswählen';
    btn_reset.classList.remove('disabled');
    obj_counter++;
  }
  /* DRACO GLTF has been saved after GLB was saved
  (triggered by button and handled by model-viewer itself)
  and we dont display anything but wait and trigger another viewer*/
  else if (_type == DRACO_SAVED) {
    regularGltfPath = args['oriPath'];
    screenshotExposure = removeExtension(args['regularFileName']);
    screenshotExposure = screenshotExposure.split(SUFFIX_EXPOSURE).pop();

    setTimeout(() => {
      let data = {
        type: '',
        oriName: args['name'],
      };
      createViewer(null, data);
    }, 500);
  }
  /* After DRACO was saved it triggers another viewer and we create a large viewer
  to create a snapshot/thumbnail of the 3D object inside this viewer that will have
  good quality due to the size of the viewer. It has a max size of 1000 x 1000px
  which is enough (see CSS)*/
  else {
    // exporter of png
    document.getElementById('img-generator-area').innerHTML += '<model-viewer id="hidden_' + model_id + '" class="model-viewer snapshot" src="' + regularGltfPath + '?' + new Date() + '" exposure="' + screenshotExposure + '" id="reveal" reveal="auto" loading="eager" shadow-intensity="0" alt="loaded model"></model-viewer>';

    let modelViewer = document.getElementById('hidden_' + model_id);
    modelViewer.addEventListener('load', function () {
      setTimeout(() => {
        let data = modelViewer.toBlob({ //model-viewer function toBlob()
          idealAspect: true
        }).then(function (imgdata) {
          setTimeout(() => {
            saveImageBlob(imgdata, args['oriName'], model_id);
          }, 300);
        });
      }, 300);

    });
  }
}

/**
 * 'Saves' the GLB blob by passing it to the electron ipcMain
 * to handle the actual file writing.
 * @param {Blob} blob 
 * @param {string} oriName 
 * @param {string} exposureValue 
 */
function saveGLTFBlob(blob, oriName, exposureValue) {
  let reader = new FileReader();
  reader.onload = function () {
    if (reader.readyState == 2) {
      let buffer = Buffer.from(reader.result);
      ipcRenderer.send(SAVE_GLTF_COMP, oriName, exposureValue, buffer);
    }
  }
  reader.readAsArrayBuffer(blob);
}

/**
 * 'Saves' the image blob by passing it to the electron ipcMain
 * to handle the actual file writing. Then removes the
 * large viewer we created for the snapshot
 * @param {Blob} blob 
 * @param {string} fileName 
 * @param {string} model_id 
 */
function saveImageBlob(blob, fileName, model_id) {
  console.log(filename);
  let reader = new FileReader();
  reader.onload = function () {
    if (reader.readyState == 2) {
      let buffer = Buffer.from(reader.result);
      ipcRenderer.send(SAVE_IMG, fileName, screenshotExposure, buffer);
    }
  }

  reader.readAsArrayBuffer(blob);

  btn_reset.classList.remove('disabled');

  let element = document.getElementById('hidden_' + model_id);
  element.parentNode.removeChild(element);
}

/**
 * Creates some visual feedback with messages
 * @param {string} message 
 */
function setFeedback(message) {
  clearTimeout(timeoutfeedback);
  timeoutfeedback = setTimeout(resetFeedback, 2000);
  document.getElementById('feedback').innerHTML = message;
  document.getElementById('overlay').classList.add('show');
}

/**
 * Hides the visual feedback
 */
function resetFeedback() {
  document.getElementById('overlay').classList.remove('show');
}

/****
 * 
 * MODEL VIEWER EDIT FUNCTIONS
 * 
 */

exposure.addEventListener('input', () => {
  updateExposure();
});

roll.addEventListener('input', () => {
  updateOrientation();
});
pitch.addEventListener('input', () => {
  updateOrientation();
});
yaw.addEventListener('input', () => {
  updateOrientation();
});

/**
 * Opens the Edit Tools inside the targeted viewer element
 * to get some context and edit the targeted model.
 * (gets triggered by button in each Convert viewer
 * element, see injected html)
 * @param {HTMLElement} target 
 */
function editObject(target) {
  const parent = target.parentNode;
  parent.appendChild(edit_controls);
  edit_controls.classList.add('active');

  let elID = target.id.split('_')[1];

  if (currentModelViewer)
    currentModelViewer.classList.remove('active');

  currentModelViewer = document.getElementById(elID);
  currentModelViewer.classList.add('active');

  let orientation = currentModelViewer.orientation;
  orientation = orientation.split(' ');
  roll.value = orientation[0].replace('deg', '');
  pitch.value = orientation[1].replace('deg', '');
  yaw.value = orientation[2].replace('deg', '');
  exposure.value = currentModelViewer.exposure;
}

/**
 * Updates the 3D model depending on the rotations set.
 * After a short delay reframes the model since some
 * rotations might cause overflow
 */
const updateOrientation = () => {
  currentModelViewer.orientation = `${roll.value}deg ${pitch.value}deg ${yaw.value}deg`;

  clearTimeout(updateFrameTimer);
  updateFrameTimer = setTimeout(() => {
    currentModelViewer.updateFraming();
  }, 500);

};

/**
 * Updates the exposure of the 3D model.
 */
const updateExposure = () => {
  currentModelViewer.exposure = parseFloat(exposure.value);
};

/**
 * Triggers the whole export by first sending the Blob
 * that model-viewer creates to the ipcMain which then
 * keeps generating the DRACO GLTF and then blob of the
 * thumbnail in a back and forth between app and main thread.
 * (gets triggered by button in each Convert viewer
 * element, see injected html) 
 * @param {HTMLElement} target 
 */
async function exportGLB(target) {
  let elID = target.id.split('_')[1];
  let modelViewer = document.getElementById(elID);
  let originalName = extractFilename(modelViewer.getAttribute('src'));
  let exposure = String(modelViewer.exposure);

  const glTF = await modelViewer.exportScene(); // model-viewer function, Blob of type "application/octet-stream" or "application/json"
  saveGLTFBlob(glTF, originalName, exposure);
}


/*************
*
* HELPERS
*
*************/

/**
 * Helper function to remove the extension from the file name
 * @param {string} filename 
 * @returns 
 */
function removeExtension(filename) {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
}

/**
 * Extracts file name from a path
 * @param {string} path 
 * @returns 
 */
function extractFilename(path) {
  const pathArray = path.split("/");
  const lastIndexSlash = pathArray.length - 1;
  const fullname = pathArray[lastIndexSlash];
  return fullname.split('.').slice(0, -1).join('.');
};

/**
 * Creates a timestamp in the format HHMMSS
 * @returns {string}
 */
function getTimeStamp() {
  let timestamp = new Date();
  return getTwoDigitNumbers(timestamp.getHours()) + getTwoDigitNumbers(timestamp.getMinutes()) + getTwoDigitNumbers(timestamp.getSeconds());
}

/**
 * Creates 2 decimal digits
 * @param {nubmer} num 
 * @returns 
 */
function getTwoDigitNumbers(num) {
  if (num < 10)
    return '0' + num;
  else
    return String(num);
}

// START APP
window.onload = initialize;
