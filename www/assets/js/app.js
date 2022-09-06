let serverURL;
let STATION_ID;

const COUNTER_MAX = 45;
let counter = COUNTER_MAX;
let interval;
let timeoutfeedback;

let countdown_el;


function initialize() {

  handleStationID();

  serverURL = window.localStorage.serverURL;
  document.getElementById('server').innerHTML = serverURL;

  if (!serverURL) serverURL = '';

  //document.getElementById('input__server').value = serverURL;

  countdown_el = document.getElementById('countdown');
  countdown_el.innerHTML = counter;

  document.getElementById('load').addEventListener('click', async () => {
    load();
  })

  document.getElementById('save').addEventListener('click', async () => {
    saveServer();
  })

  document.getElementById('stopTimer').addEventListener('click', async () => {
    stopTimer();
  })

  document.getElementById('saveID').addEventListener('click', async () => {
    saveID();
  })

  document.getElementById('generateID').addEventListener('click', async () => {
    generateID();
  })

  document.getElementById('input__server').addEventListener('input', function (ev) {
    checkInput(ev.target);
  });
  document.getElementById('input__id').addEventListener('input', function (ev) {
    checkInput(ev.target);
  });

  checkInput(document.getElementById('input__server'));
  checkInput(document.getElementById('input__id'));

  interval = setInterval(function () {
    tick()
  }, 1000);
}

function stopTimer() {
  clearInterval(interval);
  countdown_el.innerHTML = "-";
}

function handleStationID() {
  STATION_ID = window.localStorage.STATION_ID;
  if (!STATION_ID) {
    generateID();
  }
  document.getElementById('header__station_id').innerHTML = STATION_ID;
}

function generateID() {
  var newID = STATION_ID = (+new Date).toString(36);
  //STATION_ID = (+new Date).toString(36);
  //window.localStorage.setItem('STATION_ID', STATION_ID);
  document.getElementById('input__id').value = newID;
  document.getElementById('saveID').disabled = false;
}

function saveID() {
  //serverURL = document.getElementById('input__server').value;
  STATION_ID = document.getElementById('input__id').value;
  //window.localStorage.setItem('serverURL', serverURL);
  window.localStorage.setItem('STATION_ID', STATION_ID);
  document.getElementById('input__id').value = "";
  document.getElementById('header__station_id').innerHTML = STATION_ID;

  setFeedback("Station ID saved!");
}

function saveServer() {
  serverURL = document.getElementById('input__server').value;
  window.localStorage.setItem('serverURL', serverURL);
  document.getElementById('server').innerHTML = serverURL;
  document.getElementById('input__server').value = "";
  setFeedback("Server URL saved!");
}

function checkInput(input) {
  var target_btn = document.getElementById(input.getAttribute('data-target'));
  var val = input.value;
  if (val && String(val).length >= 3) {
    target_btn.disabled = false;
  }
  else {
    target_btn.disabled = true;
  }
}

function tick() {
  countdown_el.innerHTML = counter;

  if (counter == 0) {
    load();
  }

  counter--;
}

function setFeedback(message) {
  clearTimeout(timeoutfeedback);
  timeoutfeedback = setTimeout(resetFeedback, 2000);
  document.getElementById('feedback').innerHTML = message;
}
function resetFeedback() {
  document.getElementById('feedback').innerHTML = "";
}

function load() {
  let url = serverURL.replace(/\/+$/, '') + "/" + STATION_ID;

  clearInterval(interval);

  if (isValidURL(url)) {
    try {
      preloadURL(url);
    }
    catch (e) {
      console.log('wrong');
    }
  }
  else {
    setFeedback("URL was not valid!");
    counter = COUNTER_MAX;
    interval = setInterval(function () {
      tick()
    }, 1000);
  }

}


function isValidURL(url) {
  var res = url.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
  return (res !== null)
}

function preloadURL(url) {
  fetch(url)
    .then(manageErrors) // call function to handle errors
    .then(function (response) {

      window.location.replace(url);
    }).catch(function (error) {
      setFeedback("Your ID is not registered on the given server, or the server is offline!");
      counter = COUNTER_MAX;
      interval = setInterval(function () {
        tick()
      }, 1000);

      console.log('Error Code   : ' + error.status);
      console.log('Error Reason : ' + error.statusText);
    });
}

function manageErrors(response) {
  if (!response.ok) {
    const responseError = {
      statusText: response.statusText,
      status: response.status
    };
    throw (responseError);
  }
  return response;
}

function quit() {
  app.quit();
}


window.onload = initialize;
