  const urlutil = require('cordova/urlutil');

  let currentPreview;

  function create() {

    if (currentPreview) {
      throw 'preview already exists';
    }

    let capturePreviewFrameStyle = document.createElement('link');
    capturePreviewFrameStyle.rel = "stylesheet";
    capturePreviewFrameStyle.type = "text/css";
    capturePreviewFrameStyle.href = urlutil.makeAbsolute("/www/css/plugin-barcodeScanner.css");
    document.head.appendChild(capturePreviewFrameStyle);

    let capturePreviewFrame = document.createElement('div');
    capturePreviewFrame.className = "barcode-scanner-wrap";
    capturePreviewFrame.style.zIndex = -100;
    capturePreviewFrame.style.visibility = 'hidden';

    let capturePreview = document.createElement("video");
    capturePreview.className = "barcode-scanner-preview";
    capturePreview.style.height = 'calc(100%)';
    capturePreview.style.top = 'calc(50%)';
    capturePreview.addEventListener('click', function () {
      focus();
    });

    capturePreviewFrame.appendChild(capturePreview);
    document.body.appendChild(capturePreviewFrame);

    return {

      setVideoUrl: function (videoUrl) {
        capturePreview.src = videoUrl;
      }

      show: function () {
        if (!capturePreviewFrame) {
          return;
        }

        capturePreview.play();
        capturePreviewFrame.style.visibility = 'visible';
      }

      hide: function () {
        if (!capturePreviewFrame) {
          return;
        }

        capturePreviewFrame.style.visibility = 'hidden';
        capturePreview.pause();
      }

      pause: function() {
        capturePreview.pause();
      }

      resume: function() {
        capturePreview.play();
      }

      destroy: function () {
        if (!currentPreview) {
          return;
        }

        currentPreview = null;
        document.body.removeChild(capturePreviewFrameStyle);
        document.body.removeChild(capturePreviewFrame);
      }

    }

  }

  module.exports = {
    create: create
  };
