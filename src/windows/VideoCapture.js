  const barcodeReader = require('./barcodeReader');
  const Capture = Windows.Media.Capture;

  function create(videoDeviceId) {

    let captureSettings = new Capture.MediaCaptureInitializationSettings();
    captureSettings.streamingCaptureMode = Capture.StreamingCaptureMode.video;
    captureSettings.photoCaptureSource = Capture.PhotoCaptureSource.videoPreview;
    captureSettings.videoDeviceId = videoDeviceId;

    let capture = new Windows.Media.Capture.MediaCapture();

    let initialized = false;
    let initPromise = capture.initializeAsync(captureSettings).then(function (result) {
      initialized = true;
    });

    let videoUrl;

    let videoCapture = {};

    videoCapture.getUrl = function () {
      return initPromise.then(function () {
        if (!videoUrl) {
          videoUrl = URL.createObjectURL(capture)
        }
        return videoUrl;
      });
    }

    videoCapture.canEnableLight = function () {
      return initPromise.then(function () {
        if (capture.videoDeviceController) {
          let ctrl = capture.videoDeviceController;
          return (ctrl.flashControl && ctrl.flashControl.supported)
            || (ctrl.torchControl && ctrl.torchControl.supported);
        }
        return false;
      });
    }

    videoCapture.enableLight = function () {
      return videoCapture.canEnableLight().then(function (canEnableLight) {
        if (!canEnableLight) {
          return false;
        }

        function lightEnabler(lightControl) {
          if (lightControl && lightControl.supported) {
            lightControl.enabled = true;
            if (lightControl.powerSupported) {
              lightControl.powerPercent = 90;
            }
            return true;
          }
          return false;
        }

        if (capture.videoDeviceController) {
          let ctrl = capture.videoDeviceController;

          let flashEnabled = lightEnabler(ctrl.flashControl);
          let torchEnabled = lightEnabler(ctrl.torchControl);

          return flashEnabled || torchEnabled;
        }
        return false;
      });
    }

    videoCapture.disableLight = function () {
      return videoCapture.canEnableLight().then(function (canEnableLight) {
        if (!canEnableLight || !capture.videoDeviceController) {
          return;
        }

        let ctrl = capture.videoDeviceController;

        var tc = ctrl.torchControl;
        var fc = ctrl.flashControl;

        if (tc.enabled) {
          tc.enabled = false;
        }
        if (fc.enabled) {
          fc.enabled = false;
        }
      });
    }


    videoCapture.startPreview = function () {

    }

    videoCapture.stopPreview = function () {
      return capture.stopRecordAsync();
    }

    videoCapture.scan = function () {
      return barcodeReader.readCode().then(function(result) {
        if(!result) {
          return Promise.wrapError(errorTypes.SCAN_CANCELED);
        }
        return result.text;
      });
    }

    videoCapture.cancelScan = function () {
      barcodeReader.stop();
    }

    videoCapture.focus = function () {

    }

    videoCapture.destroy = function () {
      if (initialized) {
        capture.close();
      }
    }

  }

  VideoCapture.getCameras = function () {
    var Devices = Windows.Devices.Enumeration;

    return Devices.DeviceInformation.findAllAsync(Devices.DeviceClass.videoCapture)
    .then(function (cameras) {

      if (!cameras || cameras.length === 0) {
        throw new Error("No cameras found");
      }

      var backCameras = cameras.filter(function (camera) {
        return camera.enclosureLocation && camera.enclosureLocation.panel === Devices.Panel.back;
      });
      var frontCameras = cameras.filter(function (camera) {
        return camera.enclosureLocation && camera.enclosureLocation.panel === Devices.Panel.front;
      });

      return {
        back: backCameras[0] || cameras[0],
        front: frontCameras[0]
      };
    });
  }

  module.exports = {
    create: create
  };
