const urlutil = require('cordova/urlutil');

let preview;

function initialize() {

  let capturePreviewFrameStyle = document.createElement('link');
  capturePreviewFrameStyle.rel = "stylesheet";
  capturePreviewFrameStyle.type = "text/css";
  capturePreviewFrameStyle.href = urlutil.makeAbsolute("/www/css/plugin-qrscanner-preview.css");
  document.head.appendChild(capturePreviewFrameStyle);

  let capturePreviewFrame = document.createElement('div');
  capturePreviewFrame.className = "barcode-scanner-wrap";
  capturePreviewFrame.style.zIndex = -100;
  capturePreviewFrame.style.visibility = 'hidden';

  let capturePreview = document.createElement("video");
  capturePreview.className = "barcode-scanner-preview";
  capturePreview.msZoom = true;
  capturePreview.style.height = 'calc(100%)';
  capturePreview.style.top = 'calc(50%)';

  capturePreviewFrame.appendChild(capturePreview);
  document.body.appendChild(capturePreviewFrame);

  preview = {
    capturePreviewFrame: capturePreviewFrame,
    capturePreview: capturePreview
  };

}

function destroy() {
  document.head.removeChild(capturePreviewFrameStyle);
  document.body.removeChild(capturePreviewFrame);

  delete preview;
}

function ensurePreviewInitialized() {
  if (!preview) initialize();
}

exports.setVideoUrl = function (videoUrl) {
  ensurePreviewInitialized();
  capturePreview.src = videoUrl;
}

exports.setMirroring = function (isMirrored) {
  ensurePreviewInitialized();
  if (isMirrored) {
    capturePreviewFrame.style.transform = 'scaleY(-1)';
  } else {
    capturePreviewFrame.style.transform = '';
  }
}

exports.show = function () {
  ensurePreviewInitialized();
  if (!capturePreviewFrame) {
    return;
  }

  capturePreview.play();
  capturePreviewFrame.style.visibility = 'visible';
}

exports.hide = function () {
  ensurePreviewInitialized();
  if (!capturePreviewFrame) {
    return;
  }

  capturePreviewFrame.style.visibility = 'hidden';
  capturePreview.pause();
}

exports.pause = function () {
  ensurePreviewInitialized();
  capturePreview.pause();
}

exports.resume = function () {
  ensurePreviewInitialized();
  capturePreview.play();
}

exports.destroy = function () {
  if (preview) destroy();
}

module.exports = exports;