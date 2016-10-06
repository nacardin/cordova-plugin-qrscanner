  const VideoCapture = require('./VideoCapture');
  const Document = require('./Document');

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

  const cameraTypes = {
    BACK: 0,
    FRONT: 1
  };

function QRScannerEngine() {
  var self = this;

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

  let availableCameras;
  let currentCameraType;
  let currentVideoCapture;
  let currentDocument = Document();

  function generateStatusResponse() {
    let response = {};
    for (let property in statusFlags) {
      response[property] = statusFlags[property] ? '1' : '0';
    }
    return Promise.wrap(response);
  }

  function init() {
    if (!statusFlags.prepared) {
      return VideoCapture.getCameras().then(function (cameras) {
        availableCameras = cameras;
        return initCamera(cameraTypes.BACK).then(function () {
          statusFlags.prepared = true;
          statusFlags.authorized = true;
        }, function (error) {
          if (error.message.indexOf('Access is denied') > -1) {
            statusFlags.denied = true;
            return Promise.wrapError(errorTypes.CAMERA_ACESS_DENIED);
          }
          return Promise.wrapError(errorTypes.UNEXPECTED_ERROR);
        });
      });
    }
    return Promise.wrap();
  }

  function initCamera(cameraType) {
    if (currentCameraType !== cameraType) {
      if (availableCameras.back && availableCameras.front) {
        statusFlags.canChangeCamera = true;
      }
      if (cameraType === cameraTypes.FRONT && !availableCameras.front) {
        cameraType = cameraTypes.BACK;
      }
      currentVideoCapture = new VideoCapture(cameraType ? availableCameras.front.id : availableCameras.back.id);
      return currentVideoCapture.canEnableLight().then(function (canEnableLight) {
        statusFlags.canEnableLight = canEnableLight;
        currentCameraType = cameraType;
      });
    }
    return Promise.wrap();
  }

  function createPreview() {
    return init().then(function () {
      return currentVideoCapture.getUrl().then(function (videoUrl) {
        currentDocument.createPreview(videoUrl);
      });
    });
  }

  self.getStatus = function () {
    return init().then(generateStatusResponse);
  }

  self.prepare = function () {
    return init().then(generateStatusResponse);
  }

  self.useCamera = function (inputStr) {
    let cameraType = parseInt(inputStr)
    return initCamera(cameraType).then(function () {
      return generateStatusResponse();
    });
  }

  self.show = function () {
    return createPreview().then(function () {
      currentDocument.showPreview();
      statusFlags.showing = true;
      return generateStatusResponse();
    });
  }

  self.hide = function () {
    currentDocument.hidePreview();
    statusFlags.showing = false;
    return generateStatusResponse();
  }

  self.scan = function () {
  }

  self.cancelScan = function () {
  }

  self.pausePreview = function () {
  }

  self.resumePreview = function () {
  }

  //on Lumia devices, light functionality may be disabled while plugged in
  self.enableLight = function () {
    return init().then(function () {
      if (statusFlags.lightEnabled) {
        return generateStatusResponse();
      }

      return currentVideoCapture.enableLight().then(function (lightEnabled) {
        statusFlags.lightEnabled = lightEnabled;

        if (!statusFlags.lightEnabled) {
          return Promise.wrapError(errorTypes.LIGHT_UNAVAILABLE);
        }

        return generateStatusResponse();
      });
    });
  }

  self.disableLight = function () {

    if (statusFlags.lightEnabled) {
      return currentVideoCapture.disableLight().then(function () {
        statusFlags.lightEnabled = false;
        return generateStatusResponse();
      });
    }

    return generateStatusResponse();

  }

  self.openSettings = function () {
    return Promise.wrapError(errorTypes.OPEN_SETTINGS_UNAVAILABLE);
  }

  self.destroy = function () {
    currentDocument.destroyPreview();
  }

}

module.exports = function () {
  return new QRScannerEngine();
};
