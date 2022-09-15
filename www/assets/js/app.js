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
let obj_counter = 1;

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
  let _type = args['type'] ?? '';
  btn_reset.classList.remove('hidden');

  let model_id = Date.now() + Math.random();

  if (_type == GLTF_SAVED || _type == DRACO_SAVED) {

    let viewerDiv = document.createElement("div");
    viewerDiv.classList.add('model');
    document.getElementById('viewers').prepend(viewerDiv);

    viewerDiv.innerHTML = '<div class="info"><p class="num">'+obj_counter+'</p><h2>' + args['label'] + '</h2><p>' + args['name'] + '</p>' +
      '<p>' + args['filesize'] + '</p></div>' +
      '<model-viewer id="' + model_id + '" class="model-viewer" src="' + args['path'] + '" poster="" id="reveal" loading="eager" reveal="auto" camera-controls touch-action="pan-y" auto-rotate shadow-intensity="1" alt="loaded model"></model-viewer>';

    if (args['type'] == DRACO_SAVED) {
      obj_counter ++;
      viewerDiv.classList.add('closer');      

      setTimeout(() => {
        let Data = {
          type: '',
        };
        createViewer(null, '');
      }, 1500);
    }
    else {      
      regularGltfPath = args['path'];
      //viewerDiv.innerHTML += '<model-viewer id="hidden_' + model_id + '" class="model-viewer canvas" poster="" src="' + regularGltfPath + '" id="reveal" reveal="auto" loading="eager" touch-action="pan-y" shadow-intensity="1" alt="loaded model"></model-viewer>';
      /* document.getElementById('viewers').innerHTML += '<model-viewer id="hidden_' + model_id + '" class="model-viewer canvas" poster="" src="' + regularGltfPath + '" id="reveal" reveal="auto" loading="eager" touch-action="pan-y" shadow-intensity="1" alt="loaded model"></model-viewer>';
      let modelViewer = document.getElementById('hidden_' + model_id);

      modelViewer.addEventListener('load', function () {
        console.log("hidden loaded");
        let data = modelViewer.toBlob({
          idealAspect: true
        }).then(function (imgdata) {
          setTimeout(() => {
            saveBlob(imgdata, filename, model_id);
          }, 1500);
        });
      }); */
    }
  }
  else {
    document.getElementById('viewers').innerHTML += '<model-viewer id="hidden_' + model_id + '" class="model-viewer canvas" poster="" src="' + regularGltfPath + '" id="reveal" reveal="auto" loading="eager" touch-action="pan-y" shadow-intensity="1" alt="loaded model"></model-viewer>';
    let modelViewer = document.getElementById('hidden_' + model_id);

    modelViewer.addEventListener('load', function () {
      console.log("hidden loaded");
      let data = modelViewer.toBlob({
        idealAspect: true
      }).then(function (imgdata) {
        setTimeout(() => {
          saveBlob(imgdata, filename, model_id);
        }, 1500);
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
      /*       setTimeout(() => {
              ipcRenderer.send(SAVE_DRACO, filename);
            }, 1500); */
    }
  }
  reader.readAsArrayBuffer(blob);

  var element = document.getElementById('hidden_' + model_id);
  element.parentNode.removeChild(element);

  btn_reset.classList.remove('disabled');
  btn_convert.classList.remove('disabled');
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
