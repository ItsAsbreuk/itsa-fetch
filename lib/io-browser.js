"use strict";

var IO = require("../helpers/io-base")(window.XMLHttpRequest);

require("../helpers/io-transfer").extendIO(IO);
require("../helpers/io-stream").extendIO(IO);
require("../helpers/io-filetransfer").extendIO(IO);
require("../helpers/io-cors").extendIO(IO);
require("../helpers/io-xml").extendIO(IO, window.DOMParser);

module.exports = IO;