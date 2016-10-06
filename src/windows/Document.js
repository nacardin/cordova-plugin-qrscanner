  const urlutil = require('cordova/urlutil');

  function Document() {

    let capturePreviewFrame;
    let capturePreview;

    this.createPreview = function (videoUrl) {
      if (capturePreviewFrame) {
        return;
      }

      let capturePreviewFrameStyle = document.createElement('link');
      capturePreviewFrameStyle.rel = "stylesheet";
      capturePreviewFrameStyle.type = "text/css";
      capturePreviewFrameStyle.href = urlutil.makeAbsolute("/www/css/plugin-barcodeScanner.css");
      document.head.appendChild(capturePreviewFrameStyle);

      capturePreviewFrame = document.createElement('div');
      capturePreviewFrame.className = "barcode-scanner-wrap";
      capturePreviewFrame.style.zIndex = -100;
      capturePreviewFrame.style.visibility = 'hidden';

      capturePreview = document.createElement("video");
      capturePreview.className = "barcode-scanner-preview";
      capturePreview.style.height = 'calc(100%)';
      capturePreview.style.top = 'calc(50%)';
      capturePreview.src = videoUrl;
      capturePreview.addEventListener('click', function () {
        focus();
      });

      capturePreviewFrame.appendChild(capturePreview);
      document.body.appendChild(capturePreviewFrame);
    }

    this.showPreview = function () {
      if (!capturePreviewFrame) {
        return;
      }

      capturePreview.play();
      capturePreviewFrame.style.visibility = 'visible';
    }

    this.hidePreview = function () {
      if (!capturePreviewFrame) {
        return;
      }

      capturePreviewFrame.style.visibility = 'hidden';
      capturePreview.pause();
    }

    this.destroyPreview = function () {
      if (!capturePreviewFrame) {
        return;
      }

      document.body.removeChild(capturePreviewFrame);
      capturePreviewFrame = null;
      capturePreview = null;
    }

  }

  module.exports = function () {
    return new Document();
  };
