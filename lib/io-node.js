"use strict";

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var IO = require("../helpers/io-base")(XMLHttpRequest);
var DOMParser = require("xmldom").DOMParser;

require("../helpers/io-transfer").extendIO(IO);
require("../helpers/io-xml").extendIO(IO, DOMParser);

// `xmlhttprequest` does not support XMLHttpRequest2 yet, so it cannot stream: we comment the next line:
// require("../helpers/io-stream").extendIO(IO);

module.exports = IO;