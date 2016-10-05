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

function QRScannerEngine() {
  var statusFlags = {
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

  var generateStatusResponse = function () {
    let response = {};
    for (let property in statusFlags) {
      response[property] = statusFlags[property] ? '1' : '0';
    }
    return new Promise.wrap(response);
  }

  this.getStatus = function () {
    return generateStatusResponse();
  }

  this.prepare = function () {



  }

  this.useCamera = function () {
  }

  this.show = function () {
  }

  this.hide = function () {
  }

  this.scan = function () {
  }

  this.cancelScan = function () {
  }

  this.pausePreview = function () {
  }

  this.resumePreview = function () {
  }

  //on Lumia devices, light functionality may be disabled while plugged in
  this.enableLight = function () {

  }

  this.disableLight = function () {
  }

  this.openSettings = function () {
    return Promise.wrapError(errorTypes.OPEN_SETTINGS_UNAVAILABLE);
  }

  this.destroy = function () {
  }

}

module.exports = function () {
  return new QRScannerEngine();
};
