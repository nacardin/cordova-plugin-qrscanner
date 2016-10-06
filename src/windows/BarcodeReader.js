const Imaging = Windows.Graphics.Imaging;
const Streams = Windows.Storage.Streams;

function createBarcodeReader() {
  let cancelled;
  let capture;
  let width;
  let height;
  let zxingReader;

  return {
    init: function (capture, width, height) {
      capture = capture;
      width = width;
      height = height;
      zxingReader = new ZXing.BarcodeReader();
    },

    readCode: function () {
      function scanBarcodeAsync(mediaCapture, zxingReader, frameWidth, frameHeight) {

        let frame = new Windows.Media.VideoFrame(Imaging.BitmapPixelFormat.bgra8, frameWidth, frameHeight);
        return mediaCapture.getPreviewFrameAsync(frame)
        .then(function (capturedFrame) {

          let bitmap = capturedFrame.softwareBitmap;
          let rawBuffer = new Streams.Buffer(bitmap.pixelWidth * bitmap.pixelHeight * 4);
          capturedFrame.softwareBitmap.copyToBuffer(rawBuffer);
          capturedFrame.close();

          let data = new Uint8Array(rawBuffer.length);
          let dataReader = Streams.DataReader.fromBuffer(rawBuffer);
          dataReader.readBytes(data);
          dataReader.close();

          return zxingReader.decode(data, frameWidth, frameHeight, ZXing.BitmapFormat.bgra32);
        });
      }

      return scanBarcodeAsync(capture, zxingReader, width, height)
      .then(function (result) {
        if (cancelled) {
          return null;
        }

        return result || scanBarcodeAsync(capture, zxingReader, width, height);
      });
    },

    stop: function () {
      cancelled = true;
    }
  }

}

module.exports = function() {
  if(Windows.Media.VideoFrame) {
    return createBarcodeReader();
  }
  return new WinRTBarcodeReader.Reader();
};
