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

let timeoutfeedback;
var btn_convert;
var btn_reset;
let regularGltfPath;
let filename;

function initialize() {
  btn_convert = document.getElementById('convert');
  btn_reset = document.getElementById('reset');

  btn_convert.addEventListener('click', () => {
    let file_field = document.getElementById("objfile");

    if (file_field.files.length == 0) {
      setFeedback(NO_FILES_SELECTED);
      return;
    }

    btn_convert.classList.add('disabled');
    filename = removeExtension(file_field.files[0].name);

    let Data = {
      file: file_field.files[0].path,
      filename: filename
    };

    ipcRenderer.send(SAVE_GLTF, Data);
  });

  btn_reset.addEventListener('click', () => {
    document.getElementById('viewers').innerHTML = "";

    let form = document.getElementById('form-obj');
    form.reset();
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

function createViewer(event, args) {
  btn_reset.classList.remove('hidden');

  let model_id = Date.now() + Math.random();

  let viewerDiv = document.createElement("div");
  viewerDiv.classList.add('model');
  viewerDiv.innerHTML = '<h2>' + args['label'] + '</h2><p>' + args['name'] + '</p>' +
    '<p>' + args['filesize'] + '</p>' +
    '<model-viewer id="' + model_id + '" class="model-viewer" src="' + args['path'] + '" id="reveal" loading="eager" camera-controls touch-action="pan-y" auto-rotate shadow-intensity="1" alt="loaded model"></model-viewer>';


  document.getElementById('viewers').appendChild(viewerDiv);
  regularGltfPath = args['path'];

  if (args['closer']) {
    viewerDiv.classList.add('closer');
    btn_convert.classList.remove('disabled');
  }
  else {
    viewerDiv.innerHTML += '<model-viewer id="hidden_' + model_id + '" class="model-viewer canvas" src="' + args['path'] + '" id="reveal" loading="eager" camera-controls touch-action="pan-y" shadow-intensity="1" alt="loaded model"></model-viewer>';
    const modelViewer = document.getElementById('hidden_' + model_id);

    modelViewer.addEventListener('load', function () {
      let data = modelViewer.toBlob({
        idealAspect: true
      }).then(function (imgdata) {
        saveBlob(imgdata, args['name']);
        var element = document.getElementById('hidden_' + model_id);
        element.parentNode.removeChild(element);
      });
    });
  }
}

function saveBlob(blob, fileName) {
  let reader = new FileReader();
  reader.onload = function () {
    if (reader.readyState == 2) {
      var buffer = Buffer.from(reader.result);
      ipcRenderer.send(SAVE_IMG, fileName, buffer);
      console.log(`Saving ${JSON.stringify({ fileName, size: blob.size })}`);
    }
  }
  reader.readAsArrayBuffer(blob);
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


window.onload = initialize;
