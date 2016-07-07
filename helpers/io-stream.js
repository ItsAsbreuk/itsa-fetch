"use strict";

/**
 * @module itsa-fetch
 * @class Fetch
 * @since 0.0.1
*/
var NAME = "[io-stream]: ";

var UNKNOW_ERROR = "Unknown XDR-error", // XDR doesn"t specify the error
    isNode = require("itsa-utils").isNode;

var extendIO = function (IO) {

    /*
     * Adds properties to the xhr-object: in case of streaming,
     * xhr._isStream is set and xhr._isXDR might be set in case of IE<10
     *
     * @method _entendXHR
     * @param xhr {Object} containing the xhr-instance
     * @param props {Object} the propertie-object that is added too xhr and can be expanded
     * @param options {Object} options of the request
     * @private
    */
    var _entendXHR = function(xhr, props, options /*, promise */) {
        if (typeof options.streamback === "function") {
            if (!props._isXHR2 && !props._isXDR) {
                if (!isNode && (typeof window.XDomainRequest !== "undefined")) {
                    xhr = new window.XDomainRequest();
                    props._isXDR = true;
                }
            }
            props._isStream = props._isXHR2 || props._isXDR;
        }
        return xhr;
    },

    /*
     * Adds extra initialisation of the xhr-object: in case of streaming,
     * an `onprogress`-handler is set up
     *
     * @method _progressHandle
     * @param xhr {Object} containing the xhr-instance
     * @param promise {Promise} reference to the Promise created by xhr
     * @private
    */
    _progressHandle = function(xhr, promise /*, headers, method */) {
        if (xhr._isStream) {
            console.log(NAME, "progressHandle");
            xhr._progressPos = 0;
            xhr.onprogress = function() {
                console.log(NAME, "xhr.onprogress received data #"+xhr.responseText+"#");
                var data = xhr.responseText.substr(xhr._progressPos);

                // backup the fact that streaming occured
                xhr._gotstreamed = true;

                xhr._parseStream && (data=xhr._parseStream(data));

                promise.callback(data);
                xhr._progressPos = xhr.responseText.length;
            };
        }
    },

    /**
     * Adds 2 methods on the xhr-instance which are used by xhr when events occur:
     *
     * xhr.onload()
     * xhr.onerror()  // only XMLHttpRequest2
     *
     * These events are only added in case of XDR
     *
     * @method _readyHandleXDR
     * @param xhr {Object} containing the xhr-instance
     * @param promise {Promise} reference to the Promise created by xhr
     * @private
    */
    _readyHandleXDR = function(xhr, promise /*, headers, method */) {
        if (xhr._isXDR) {
            console.log(NAME, "readyHandleXDR");
            // for XDomainRequest, we need "onload" instead of "onreadystatechange"
            xhr.onload = function() {
                clearTimeout(xhr._timer);
                console.log(NAME, "xhr.onload invokes with responseText="+xhr.responseText);
                if (xhr._isStream && !xhr._gotstreamed) {
                    xhr.onprogress(xhr.responseText);
                }
                promise.fulfill(xhr);
            };
            xhr.onerror = function() {
                clearTimeout(xhr._timer);
                promise.reject(UNKNOW_ERROR);
            };
        }
    },

    /**
     * Adds a `headers` X-Stream=true in case of a streaming request.
     *
     * @method _setStreamHeader
     * @param xhr {Object} containing the xhr-instance
     * @param headers {Object} containing all headers
     * @param method {String} the request-method used
     * @private
    */
    _setStreamHeader = function(xhr /*, promise, headers, method */) {
        if (xhr._isStream && !xhr._isXDR) {
            console.log(NAME, "_setStreamHeader");
            xhr.setRequestHeader("X-Stream", "true");
        }
    };

    IO._xhrList.push(_entendXHR);
    IO._xhrInitList.push(_readyHandleXDR);
    IO._xhrInitList.push(_progressHandle);
    IO._xhrInitList.push(_setStreamHeader);

};

module.exports = {
    extendIO: extendIO
};
