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

  const defaultStatusFlags = {
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
    canChangeCamera: false,
    currentCamera: cameraTypes.BACK
  };

  function getDefaultStatusFlags() {
    let statusFlags = {};
    for (let property in defaultStatusFlags) {
      statusFlags[property] = defaultStatusFlags[property];
    }
    return statusFlags;
  }

  let statusFlags = getDefaultStatusFlags();
  let availableCameras;
  let currentVideoCapture;
  let currentPreview;
  let deferredResolveScanResult;

  function generateStatusResponse() {
    let response = {};
    for (let property in statusFlags) {
      response[property] = statusFlags[property] ? '1' : '0';
    }
    return Promise.wrap(response);
  }

  function init() {
    if (!statusFlags.prepared) {
      availableCameras = null;
      statusFlags.currentCamera = null;
      currentVideoCapture = null;
      currentPreview = preview.create();
      document.body.addEventListener('click', onPreviewClick);
      return videoCapture.getCameras().then(function (cameras) {
        if (cameras.back && cameras.front) {
          statusFlags.canChangeCamera = true;
        }
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
    if (statusFlags.currentCamera !== cameraType) {
      if (cameraType === cameraTypes.FRONT && !availableCameras.front) {
        cameraType = cameraTypes.BACK;
      }
      return videoCapture.get(cameraType ? availableCameras.front.id : availableCameras.back.id).then(function (videoCapture) {
        currentVideoCapture = videoCapture;

        if(statusFlags.scanning && deferredResolveScanResult) {
          currentVideoCapture.scan().then(function(result) {
            onScanResult(result).then(deferredResolveScanResult);
            deferredResolveScanResult = null;
          });
        }

        return Promise.join({
          videoUrl: currentVideoCapture.getUrl(),
          canEnableLight: currentVideoCapture.canEnableLight()
        }).then(function (result) {
          if (statusFlags.showing) {
            currentPreview.pause();
          }
          currentPreview.setVideoUrl(result.videoUrl);
          currentPreview.setMirroring(cameraType === cameraTypes.FRONT);
          if (statusFlags.showing) {
            currentPreview.resume();
          }
          statusFlags.canEnableLight = result.canEnableLight;
          statusFlags.currentCamera = cameraType;
        });
      });

    }
    return Promise.wrap();
  }

  function onPreviewClick(e) {
    if (statusFlags.showing && currentVideoCapture) {
      currentVideoCapture.focus();
    }
  }

  let qrScanner = {};

  qrScanner.getStatus = function () {
    return init().then(generateStatusResponse, generateStatusResponse);
  }

  qrScanner.prepare = function () {
    return init().then(generateStatusResponse);
  }

  qrScanner.useCamera = function (inputStr) {
    return init().then(function () {
      let cameraType = parseInt(inputStr)
      return initCamera(cameraType).then(function () {
        return generateStatusResponse();
      });
    });
  }

  qrScanner.show = function () {
    return init().then(function (preview) {
      currentPreview.show();
      statusFlags.showing = true;
      return generateStatusResponse();
    });
  }

  qrScanner.hide = function () {
    return init().then(function (preview) {
      currentPreview.hide();
      statusFlags.showing = false;
      return generateStatusResponse();
    });
  }

  function onScanResult (result) {
    if(!result) {
        if (statusFlags.scanning) {
          return new Promise(function(resolve, reject) {
            deferredResolveScanResult = resolve;
          });
        } else {
          return Promise.wrapError(errorTypes.SCAN_CANCELED);
        }
    }
    statusFlags.scanning = false;
    return result.text;
  }

  qrScanner.scan = function () {
    if (statusFlags.scanning) {
      currentVideoCapture.cancelScan();
    }
    statusFlags.scanning = true;
    let promise = init().then(currentVideoCapture.scan).then(onScanResult);
    return promise;
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
    currentPreview.resume();
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
    statusFlags = getDefaultStatusFlags();
    if (currentPreview) {
      document.body.removeEventListener('click', onPreviewClick);
      currentPreview.destroy();
    }
    return generateStatusResponse();
  }

  return qrScanner;

}

module.exports = create();
