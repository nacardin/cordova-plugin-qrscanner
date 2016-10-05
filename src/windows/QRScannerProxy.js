const QRScanner = require('./QRScanner');

let exports = {};

let qrScanner = QRScanner();

function wrap(fn) {
  return function (successCallback, errorCallback, strInput) {
    fn(strInput).then(successCallback, errorCallback);
  }
}

for (let property in qrScanner) {
  if (typeof qrScanner[property] == "function") {
    exports[property] = wrap(qrScanner[property])
  }
}

module.exports = exports;

cordova.commandProxy.add("QRScanner", exports);