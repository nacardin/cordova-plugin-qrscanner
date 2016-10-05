/**
 * The pure JS implementation of barcode reader from WinRTBarcodeReader.winmd.
 *   Works only on Windows 10 devices and more efficient than original one.
 *
 * @class {BarcodeReader}
 */
function BarcodeReader() {
  this._promise = null;
  this._cancelled = false;
}

/**
 * Initializes instance of reader.
 *
 * @param   {MediaCapture}  capture  Instance of
 *   Windows.Media.Capture.MediaCapture class, used for acquiring images/ video
 *   stream for barcode scanner.
 * @param   {Number}  width    Video/image frame width
 * @param   {Number}  height   Video/image frame height
 */
BarcodeReader.prototype.init = function (capture, width, height) {
  this._capture = capture;
  this._width = width;
  this._height = height;
  this._zxingReader = new ZXing.BarcodeReader();
};

/**
 * Starts barcode search routines asyncronously.
 *
 * @return  {Promise<ScanResult>}  barcode scan result or null if search
 *   cancelled.
 */
BarcodeReader.prototype.readCode = function () {

  /**
   * Grabs a frame from preview stream uning Win10-only API and tries to
   *   get a barcode using zxing reader provided. If there is no barcode
   *   found, returns null.
   */
  function scanBarcodeAsync(mediaCapture, zxingReader, frameWidth, frameHeight) {
    // Shortcuts for namespaces
    var Imaging = Windows.Graphics.Imaging;
    var Streams = Windows.Storage.Streams;

    var frame = new Windows.Media.VideoFrame(Imaging.BitmapPixelFormat.bgra8, frameWidth, frameHeight);
    return mediaCapture.getPreviewFrameAsync(frame)
    .then(function (capturedFrame) {

      // Copy captured frame to buffer for further deserialization
      var bitmap = capturedFrame.softwareBitmap;
      var rawBuffer = new Streams.Buffer(bitmap.pixelWidth * bitmap.pixelHeight * 4);
      capturedFrame.softwareBitmap.copyToBuffer(rawBuffer);
      capturedFrame.close();

      // Get raw pixel data from buffer
      var data = new Uint8Array(rawBuffer.length);
      var dataReader = Streams.DataReader.fromBuffer(rawBuffer);
      dataReader.readBytes(data);
      dataReader.close();

      return zxingReader.decode(data, frameWidth, frameHeight, ZXing.BitmapFormat.bgra32);
    });
  }

  var self = this;
  return scanBarcodeAsync(this._capture, this._zxingReader, this._width, this._height)
  .then(function (result) {
    if (self._cancelled)
      return null;

    return result || (self._promise = self.readCode());
  });
};

/**
 * Stops barcode search
 */
BarcodeReader.prototype.stop = function () {
  this._cancelled = true;
};

module.exports = BarcodeReader;
