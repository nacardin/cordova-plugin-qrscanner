const videoCapture = require('./videoCapture');
const preview = require('./preview');

const barcodeReader = new QRReader.Reader();

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

let statusFlags;
let currentVideoCapture;

function resetStatusFlags() {

  statusFlags = {};
  for (let property in defaultStatusFlags) {
    statusFlags[property] = defaultStatusFlags[property];
  }
  return statusFlags;
}

resetStatusFlags();

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
    currentVideoCapture = null;
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

      return Promise.join({
        videoUrl: currentVideoCapture.getUrl(),
        canEnableLight: currentVideoCapture.canEnableLight(),
        capture: currentVideoCapture.getCapture()
      }).then(function (result) {
        if (statusFlags.showing) {
          preview.pause();
        }
        preview.setVideoUrl(result.videoUrl);
        preview.setMirroring(cameraType === cameraTypes.FRONT);
        if (statusFlags.showing) {
          preview.resume();
        }
        statusFlags.canEnableLight = result.canEnableLight;
        statusFlags.currentCamera = cameraType;
        barcodeReader.setCapture(result.capture);
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
  return generateStatusResponse();
}

qrScanner.prepare = function () {
  return init().then(generateStatusResponse);
}

qrScanner.useCamera = function (inputStr) {
  let cameraType = parseInt(inputStr);
  return initCamera(cameraType).then(function () {
    return generateStatusResponse();
  });
}

qrScanner.show = function () {
  return init().then(function () {
    preview.show();
    statusFlags.showing = true;
    return generateStatusResponse();
  });
}

qrScanner.hide = function () {
  return init().then(function () {
    preview.hide();
    statusFlags.showing = false;
    return generateStatusResponse();
  });
}

let resolveLastScanPromise, rejectLastScanPromise;

qrScanner.scan = function () {

  if (statusFlags.scanning) {
    rejectLastScanPromise(errorTypes.SCAN_CANCELED);

    let lastScanPromise = new Promise(function (resolve, reject) {
      resolveLastScanPromise = resolve;
      rejectLastScanPromise = reject;
    });

    return lastScanPromise;

  }
  statusFlags.scanning = true;

  let lastScanPromise = new Promise(function (resolve, reject) {
    resolveLastScanPromise = resolve;
    rejectLastScanPromise = reject;
  });

  init().then(function () {
    barcodeReader.readCode().then(function (result) {
      if (!result) {
        return rejectLastScanPromise(errorTypes.SCAN_CANCELED);
      }
      resolveLastScanPromise(result.text);
      statusFlags.scanning = false;
    });
  });

  return lastScanPromise;

}

qrScanner.cancelScan = function () {
  statusFlags.scanning = false;
  barcodeReader.stop();
  return generateStatusResponse();
}

qrScanner.pausePreview = function () {
  preview.pause();
  return generateStatusResponse();
}

qrScanner.resumePreview = function () {
  preview.resume();
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
  document.body.removeEventListener('click', onPreviewClick);
  preview.destroy();
  resetStatusFlags();
  return generateStatusResponse();
}


function wrapPromise(fn) {
  return function (successCallback, errorCallback, strInput) {
    fn.call(window, strInput).then(successCallback, function (errorCode) {
      errorCallback(errorCode.toString() || '0');
    });
  }
}

for (let property in qrScanner) {
  if (typeof qrScanner[property] == "function") {
    exports[property] = wrapPromise(qrScanner[property])
  }
}

module.exports = exports;

cordova.commandProxy.add("QRScanner", exports);
