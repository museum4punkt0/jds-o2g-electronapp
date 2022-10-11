const { ipcRenderer } = require("electron");

const NO_FILES_SELECTED = "Keine Datei vorhanden!";

/* Events */
const SAVE_GLTF = "save-gltf";
const SAVE_DRACO = "save-draco";
const SAVE_IMG = "save-img";

const GLTF_SAVED = 'gltf-saved';
const DRACO_SAVED = 'draco-saved';
const IMG_SAVED = 'img-saved';

const MSG = 'new-msg'

const SHADOW_INTENSITY = 1;
const EXPOSURE = 9;
const ENV_IMG = 'neutral'; // neutral or legacy


const roll = document.querySelector('#roll');
const pitch = document.querySelector('#pitch');
const yaw = document.querySelector('#yaw');
const shadow = document.querySelector('#shadow');
const exposure = document.querySelector('#exposure');
const frame = document.querySelector('#frame');
const edit_controls = document.querySelector('#edit_controls');

let timeoutfeedback;
var btn_convert;
var btn_reset;
var btn_resetprevs;
var btn_toConvert;
var btn_toView;
var toolsC;
var toolsV;
var viewersArea;
var previewersArea;
var dropzone;
let regularGltfPath;
let filename;
let obj_counter = 1;

function initialize() {
  fileUploadStyling();

  btn_toConvert = document.getElementById('toConvert');
  btn_toView = document.getElementById('toView');

  btn_convert = document.getElementById('convert');
  btn_reset = document.getElementById('reset');
  btn_resetprevs = document.getElementById('resetprevs');

  toolsC = document.querySelector('.tools.convert');
  toolsV = document.querySelector('.tools.view');

  viewersArea = document.getElementById('viewers');
  previewersArea = document.getElementById('previewers');

  dropzone = document.getElementById('dropzone');

  btn_toConvert.addEventListener('click', () => {
    switchToConvert();
  });

  btn_toView.addEventListener('click', () => {
    switchToView();
  });

  btn_convert.addEventListener('click', () => {
    let file_field = document.getElementById("objfile");

    if (file_field.files.length == 0) {
      setFeedback(NO_FILES_SELECTED);
      return;
    }

    btn_convert.classList.add('disabled');
    btn_reset.classList.add('disabled');
    filename = removeExtension(file_field.files[0].name);

    let Data = {
      file: file_field.files[0].path,
      filename: filename
    };

    ipcRenderer.send(SAVE_GLTF, Data);
  });

  btn_reset.addEventListener('click', () => {
    document.getElementById('viewers').innerHTML = "";

    obj_counter = 1;

    let form = document.getElementById('form-obj');
    form.reset();
    var input = document.getElementById('objfile');
    var label = input.nextElementSibling;
    label.innerHTML = 'OBJ Datei auswählen';
  });

  btn_resetprevs.addEventListener('click', () => {
    document.getElementById('previewers').innerHTML = "";
    btn_resetprevs.classList.add('hidden');
  });


  shadow.addEventListener('input', () => {
    updateShadow();
  });
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

  frame.addEventListener('click', () => {
    modelViewerTransform.updateFraming();
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

function switchToConvert() {
  console.log("to convert");
  btn_toView.classList.remove('hidden');
  btn_toConvert.classList.add('hidden');

  toolsC.classList.remove('hidden')
  toolsV.classList.add('hidden');

  viewersArea.classList.remove('hidden')
  previewersArea.classList.add('hidden');
}

function switchToView() {
  console.log("to view");
  btn_toConvert.classList.remove('hidden');
  btn_toView.classList.add('hidden');

  toolsV.classList.remove('hidden')
  toolsC.classList.add('hidden');

  previewersArea.classList.remove('hidden')
  viewersArea.classList.add('hidden');
}

function dropHandler(ev) {
  // Prevent default behavior (Prevent file from being opened)
  ev.preventDefault();

  if (ev.dataTransfer.items) {
    // Use DataTransferItemList interface to access the file(s)
    [...ev.dataTransfer.items].forEach((item, i) => {
      // If dropped items aren't files, reject them
      if (item.kind === 'file') {
        const file = item.getAsFile();
        var _name = file.name;
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
      var _name = file.name;
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

function dragOverHandler(ev) {
  ev.preventDefault();
  dropzone.classList.add('hover');
}
function dragOutHandler(ev) {
  ev.preventDefault();
  dropzone.classList.remove('hover');
}

function createPreviewer(path, name, filesize) {
  btn_resetprevs.classList.remove('hidden');

  filesize = filesize.toFixed(2) + "MB";
  let model_id = Date.now() + Math.random() * 100;
  let previewerDiv = document.createElement("div");
  previewerDiv.classList.add('model');
  document.getElementById('previewers').prepend(previewerDiv);

  let bods = document.body;
  bods.classList.add('reset');
  previewerDiv.innerHTML = '<div class="info"><h2>' + name + '</h2>' +
    '<p>' + filesize + '</p></div>' +
    '<model-viewer id="' + model_id + '" class="model-viewer" poster="" src="' + path + '" loading="eager" reveal="auto" camera-controls touch-action="pan-y" auto-rotate environment-image="' + ENV_IMG + '" exposure="' + EXPOSURE + '" shadow-intensity="' + SHADOW_INTENSITY + '" alt="loaded model"></model-viewer>';

  let modelViewer = document.getElementById(model_id);
  modelViewer.addEventListener('load', function () {
    bods.classList.remove('reset');
  });
}



function createViewer(event, args) {
  let _type = args['type'] ?? '';
  btn_reset.classList.remove('hidden');

  let model_id = Date.now() * 10000 + Math.random();

  if (_type == GLTF_SAVED || _type == DRACO_SAVED) {

    let viewerDiv = document.createElement("div");
    viewerDiv.classList.add('model');
    document.getElementById('viewers').prepend(viewerDiv);

    viewerDiv.innerHTML = '<div class="info"><p class="num">' + obj_counter + '</p><h2>' + args['label'] + '</h2><p>' + args['name'] + '</p>' +
      '<p>' + args['filesize'] + '</p>' +
      '<button id="btnExport_' + model_id + '" onclick="exportGLB(this)">neu Exportieren</button>' +
      '<button id="btnEdit_' + model_id + '" onclick="editObject(this)">Editieren</button></div>' +
      '<model-viewer id="' + model_id + '" class="model-viewer" src="' + args['path'] + '" id="reveal" loading="eager" reveal="auto" camera-controls touch-action="pan-y" auto-rotate shadow-intensity="' + SHADOW_INTENSITY + '" alt="loaded model"></model-viewer>';

    if (args['type'] == DRACO_SAVED) {
      obj_counter++;
      viewerDiv.classList.add('closer');

      setTimeout(() => {
        let Data = {
          type: '',
        };
        createViewer(null, '');
      }, 100);
    }
    else {
      regularGltfPath = args['path'];
    }
  }
  else {
    // exporter of png
    document.getElementById('viewers').innerHTML += '<model-viewer id="hidden_' + model_id + '" class="model-viewer snapshot" poster="" src="' + regularGltfPath + '" id="reveal" reveal="auto" loading="eager" touch-action="pan-y" exposure="' + EXPOSURE + '" shadow-intensity="' + SHADOW_INTENSITY + '" alt="loaded model"></model-viewer>';
    let modelViewer = document.getElementById('hidden_' + model_id);

    modelViewer.addEventListener('load', function () {
      console.log("hidden loaded");
      let data = modelViewer.toBlob({
        idealAspect: true
      }).then(function (imgdata) {
        setTimeout(() => {
          saveBlob(imgdata, filename, model_id);
        }, 100);
      });
    });
  }
}

function saveBlob(blob, fileName, model_id) {
  let reader = new FileReader();
  reader.onload = function () {
    if (reader.readyState == 2) {
      var buffer = Buffer.from(reader.result);
      ipcRenderer.send(SAVE_IMG, fileName, buffer);
    }
  }
  reader.readAsArrayBuffer(blob);

  var element = document.getElementById('hidden_' + model_id);
  element.parentNode.removeChild(element);

  btn_reset.classList.remove('disabled');
  btn_convert.classList.remove('disabled');
}

function fileUploadStyling() {
  let input = document.querySelectorAll("input[type=file]");
  for (let i = 0; i < input.length; i++) {
    var inputFile = input[i];
    inputFile.addEventListener('change', function (e) {
      var label = this.nextElementSibling;
      label.innerHTML = this.files[0].name + ' ausgewählt ...';
    });
  }
}

function removeExtension(filename) {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
}

function setFeedback(message) {
  clearTimeout(timeoutfeedback);
  timeoutfeedback = setTimeout(resetFeedback, 2000);
  document.getElementById('feedback').innerHTML = message;
  document.getElementById('feedback').classList.add('show');
}
function resetFeedback() {
  document.getElementById('feedback').classList.remove('show');
}

function quit() {
  app.quit();
}




async function exportGLB(target) {
  console.log(target);
  let elID = target.id.split('_')[1];
  console.log(elID);
  const modelViewer = document.getElementById(elID);
  const glTF = await modelViewer.exportScene();
  const file = new File([glTF], "export-" + Date.now() + Math.random() + ".gltf");
  const link = document.createElement("a");
  link.download = file.name;
  link.href = URL.createObjectURL(file);
  link.click();
}
let modelViewerTransform;
const updateOrientation = () => {
  modelViewerTransform.orientation = `${roll.value}deg ${pitch.value}deg ${yaw.value}deg`;
};

const updateExposure = () => {
  modelViewerTransform.exposure = parseFloat(exposure.value);
};
const updateShadow = () => {
  modelViewerTransform.shadowIntensity = `${shadow.value}`;
};

function editObject(target) {
  let elID = target.id.split('_')[1];

  edit_controls.classList.add('active');

  if (modelViewerTransform)
    modelViewerTransform.classList.remove('active');

  modelViewerTransform = document.getElementById(elID);
  modelViewerTransform.classList.add('active');
}



window.onload = initialize;
