const { ipcRenderer } = require("electron");
//const mainProcess = app.require('./main.js');

let timeoutfeedback;

var btn_convert;


function initialize() {
  btn_convert = document.getElementById('convert');
  btn_convert.addEventListener('click', () => {
    let file_field = document.getElementById("objfile");
    if (file_field.files.length == 0) {
      setFeedback("No files selected");
      return;
    }

    console.log("yes");

    let Data = {
      file: file_field.files[0].path,
      filename: removeExtension(file_field.files[0].name)
    };

    ipcRenderer.send('request-mainprocess-action', Data);

    // Add the event listener for the response from the main process
    ipcRenderer.on('mainprocess-response', (event, arg) => {
      console.log(arg); // prints "Hello World!"
      setFeedback(arg);
    });
  });

}

function removeExtension(filename) {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
}


function setFeedback(message) {
  clearTimeout(timeoutfeedback);
  timeoutfeedback = setTimeout(resetFeedback, 2000);
  document.getElementById('feedback').innerHTML = message;
}
function resetFeedback() {
  document.getElementById('feedback').innerHTML = "";
}

function quit() {
  app.quit();
}


window.onload = initialize;
