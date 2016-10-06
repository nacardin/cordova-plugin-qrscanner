const videoCapture = require('./videoCapture');
const preview = require('./preview');

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

function create() {

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
  let currentPreview;

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
      currentVideoCapture = videoCapture(cameraType ? availableCameras.front.id : availableCameras.back.id);
      return currentVideoCapture.canEnableLight().then(function (canEnableLight) {
        statusFlags.canEnableLight = canEnableLight;
        currentCameraType = cameraType;
      });
    }
    return Promise.wrap();
  }

  function getPreview() {
    if(currentPreview) {
      return Promise.wrap(currentPreview);
    }
    return init().then(function () {
      return currentVideoCapture.getUrl().then(function (videoUrl) {
        currentPreview = preview.create();
        currentPreview.setVideoUrl(videoUrl);
        return currentPreview;
      });
    });
  }

  let qrScanner;

  qrScanner.getStatus = function () {
    return init().then(generateStatusResponse, generateStatusResponse);
  }

  qrScanner.prepare = function () {
    return init().then(generateStatusResponse);
  }

  qrScanner.useCamera = function (inputStr) {
    let cameraType = parseInt(inputStr)
    return initCamera(cameraType).then(function () {
      return generateStatusResponse();
    });
  }

  qrScanner.show = function () {
    return getPreview().then(function (preview) {
      preview.show();
      statusFlags.showing = true;
      return generateStatusResponse();
    });
  }

  qrScanner.hide = function () {
    return getPreview().then(function () {
      preview.hide();
      statusFlags.showing = false;
      return generateStatusResponse();
    });
  }

  qrScanner.scan = function () {
    statusFlags.scanning = true;
    return currentVideoCapture.scan();
  }

  qrScanner.cancelScan = function () {
    statusFlags.scanning = false;
    currentVideoCapture.cancelScan();
    return generateStatusResponse();
  }

  qrScanner.pausePreview = function () {
    currentPreview.pause();
    return generateStatusResponse();
  }

  qrScanner.resumePreview = function () {
    currentPreview.play();
    return generateStatusResponse();
  }

  //on Lumia devices, light functionality may be disabled while plugged in
  qrScanner.enableLight = function () {
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

  qrScanner.disableLight = function () {

    if (statusFlags.lightEnabled) {
      return currentVideoCapture.disableLight().then(function () {
        statusFlags.lightEnabled = false;
        return generateStatusResponse();
      });
    }

    return generateStatusResponse();

  }

  qrScanner.openSettings = function () {
    return Promise.wrapError(errorTypes.OPEN_SETTINGS_UNAVAILABLE);
  }

  qrScanner.destroy = function () {
    currentPreview.destroy();
  }

  return qrScanner;

}

module.exports = create();
