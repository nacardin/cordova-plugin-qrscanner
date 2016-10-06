const QRScannerEngine = require('./QRScannerEngine');

let proxy = {};

let qrScannerEngine = QRScannerEngine();

function wrap(fn) {
  return function (successCallback, errorCallback, strInput) {
    fn.call(qrScannerEngine, strInput).then(successCallback, function (errorCode) {
      errorCallback(errorCode.toString() || '0');
    });
  }
}

for (let property in qrScannerEngine) {
  if (typeof qrScannerEngine[property] == "function") {
    proxy[property] = wrap(qrScannerEngine[property])
  }
}

module.exports = proxy;

cordova.commandProxy.add("QRScanner", proxy);
