const Promise = WinJS.Promise;

const errorTypes = {
  UNEXPECTED_ERROR: 0,
  CAMERA_ACESS_DENIED: 1,
  CAMERA_ACCESS_RESTRICTED: 2,
  BACK_CAMERA_UNAVAILABLE: 3,
  FRONT_CAMERA_UNAVAILABLE: 4,
  CAMERA_UNAVAILABLE: 5,
  SCAN_CANCELED: 6,
  LIGHT_UNAVAILABLE: 7,
  OPEN_SETTINGS_UNAVAILABLE: 8
};

function QRScanner() {
  this._statusFlags = {
    prepared: false,
    authorized: false,
    denied: false,
    restricted: false,
    scanning: false,
    previewing: false,
    showing: false,
    lightEnabled: false,
    canOpenSettings: false,
    canEnableLight: false,
    canChangeCamera: false
  };
}

QRScanner.prototype._generateStatusResponse = function () {
  let response = {};
  for (let property in this._statusFlags) {
    response[property] = this._statusFlags[property] ? '1' : '0';
  }
  return new Promise.wrap(response);
}

function getStatus() {
  return this._generateStatusResponse();
}

function prepare(successCallback, errorCallback, strInput) {
  return this._generateStatusResponse();
}

function show(successCallback, errorCallback, strInput) {
}

function hide(successCallback, errorCallback, strInput) {
}

function scan(successCallback, errorCallback, strInput) {
}

function cancelScan(successCallback, errorCallback, strInput) {
}

function pausePreview(successCallback, errorCallback, strInput) {
}

function resumePreview(successCallback, errorCallback, strInput) {
}

//on Lumia devices, light functionality may be disabled while plugged in
function enableLight(successCallback, errorCallback, strInput) {

}

function disableLight(successCallback, errorCallback, strInput) {
}

function openSettings(successCallback, errorCallback, strInput) {
  return Promise.wrapError(errorTypes.OPEN_SETTINGS_UNAVAILABLE);
}

function destroy(successCallback, errorCallback, strInput) {
}

module.exports = QRScanner;