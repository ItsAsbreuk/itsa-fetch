"use strict";

/**
 * @module itsa-fetch
 * @class Fetch
 * @since 0.0.1
*/

require("itsa-jsext");

var NAME = "itsa-fetch",
    GET = "GET",
    DEF_REQ_TIMEOUT = 300000, // don"t create an ever-lasting request: always quit after 5 minutes
    BODY_METHODS = {
        POST: 1,
        PUT: 1
    },
    CONTENT_TYPE = "Content-Type",
    MIME_JSON = "application/json",
    MIME_BLOB = "application/octet-stream",
    DEF_CONTENT_TYPE_POST = "application/x-www-form-urlencoded; charset=UTF-8",
    ERROR_NO_XHR = "no valid xhr transport-mechanism available",
    REQUEST_TIMEOUT = "Request-timeout",
    UNKNOW_ERROR = "Network error",
    XHR_ERROR = "XHR Error",
    ABORTED = "Request aborted",
    NO_XHR = "No valid xhr found on this browser";

module.exports = function (XMLHttpRequest) {

    var ENCODE_URI_COMPONENT = encodeURIComponent,
        testxhr = new XMLHttpRequest(),
        xhr2support = ("withCredentials" in testxhr),
        IO;

    // check for XMLHttpRequest2 support:

    // to prevent multiple IO instances
    // (which might happen: http://nodejs.org/docs/latest/api/modules.html#modules_module_caching_caveats)
    // we make sure IO is defined only once. Therefore we bind it to `window` and return it if created before
    // We need a singleton IO, because submodules might merge in. You can"t have them merging
    // into some other IO-instance than which is used.

    IO = {
        config: {},

        supportXHR2: xhr2support,

        //===============================================================================================
        // private methods:
        //===============================================================================================

        _xhrList: [],

        _runningRequests: [],

        /**
         * Initializes the xhr-instance, based on the config-params.
         * This method is the standard way of doing xhr-requests without processing streams.
         *
         * @method _initXHR
         * @param xhr {Object} xhr-instance
         * @param options {Object}
         *    @param [options.url] {String} The url to which the request is sent.
         *    @param [options.method="GET"] {String} The HTTP method to use.
         *    can be ignored, even if streams are used --> the returned Promise will always hold all data
         *    @param [options.sync=false] {boolean} By default, all requests are sent asynchronously. To send synchronous requests, set to true.
         *           This feature only works in the browser: nodejs will always perform asynchronous requests.
         *    @param [options.data] {Object} Data to be sent to the server, either to be used by `query-params` or `body`.
         *    @param [options.headers] {Object} HTTP request headers.
         *    @param [options.responseType] {String} Force the response type.
         *    @param [options.timeout=3000] {number} to timeout the request, leading into a rejected Promise.
         *    @param [options.withCredentials=false] {boolean} Whether or not to send credentials on the request.
         * @param fulfill {Function} reference to xhr-promise"s fulfill-function
         * @param reject {Function} reference to xhr-promise"s reject-function
         * @param promise {Promise} the xhr-promise which will be extended with the `abort()`-method
         * @private
        */
        _initXHR: function (xhr, options, promise) {
            var instance = this,
                url = options.url,
                method = options.method || GET,
                headers = options.headers ? options.headers.itsa_deepClone() : {}, // all request will get some headers
                async = !options.sync,
                data = options.data,
                reject = promise.reject,
                sendPayload;
            // xhr will be null in case of a CORS-request when no CORS is possible
            if (!xhr) {
                console.error(NAME, "_initXHR fails: "+ERROR_NO_XHR);
                reject(ERROR_NO_XHR);
                return;
            }
            // adding default headers (when set):
            headers.itsa_merge(instance._standardHeaders);

            // method-name should be in uppercase:
            method = method.toUpperCase();
            // in case of BODY-method: eliminate any data behind querystring:
            // else: append data-object behind querystring
            if (BODY_METHODS[method]) {
                url = url.split("?"); // now url is an array
                url = url[0]; // now url is a String again
            }
            else if (data && (headers[CONTENT_TYPE]!==MIME_BLOB)) {
                url += (url.itsa_contains("?") ? "&" : "?") + instance._toQueryString(data);
            }

            xhr.open(method, url, async);
            // xhr.responseType = options.responseType || "text";
            options.withCredentials && (xhr.withCredentials=true);


            // more initialisation might be needed by extended modules:
            instance._xhrInitList.forEach(
                function(fn) {
                    fn(xhr, promise, headers, method);
                }
            );

            if (BODY_METHODS[method] && data) {
                if (headers[CONTENT_TYPE]===MIME_BLOB) {
                    if (!xhr._isXDR) {
                        sendPayload = data;
                    }
                }
                else {
                    sendPayload = ((headers[CONTENT_TYPE]===MIME_JSON) || xhr._isXDR) ? JSON.stringify(data) : instance._toQueryString(data);
                }
            }
            // send the request:
            xhr.send(sendPayload);

            // now add xhr.abort() to the promise, so we can call from within the returned promise-instance
            promise.abort = function() {
                reject(ABORTED);
                xhr._aborted = true; // must be set: IE9 won"t allow to read anything on xhr after being aborted
                xhr.abort();
            };

            // in case synchronous transfer: force an xhr.onreadystatechange:
            async || xhr.onreadystatechange();
        },

        /**
         * Adds the `headers`-object to `xhr`-headers.
         *
         * @method _setHeaders
         * @param xhr {Object} containing the xhr-instance
         * @param headers {Object} containing all headers
         * @param method {String} the request-method used
         * @private
        */
        _setHeaders: function(xhr, promise, headers, method) {
            // XDR cannot set requestheaders, only XHR:
            if (!xhr._isXDR) {
                var name;
                if ((method!=="POST") && (method!=="PUT")) {
                    // force GET-request to make a request instead of using cache (like IE does):
                    headers["If-Modified-Since"] = "Wed, 15 Nov 1995 01:00:00 GMT";
                    // header "Content-Type" should only be set with POST or PUT requests:
                    delete headers[CONTENT_TYPE];
                }
                // set all headers
                for (name in headers) {
                    xhr.setRequestHeader(name, headers[name]);
                }

                // in case of POST or PUT method: always make sure "Content-Type" is specified
                !BODY_METHODS[method] || (headers && (CONTENT_TYPE in headers)) || xhr.setRequestHeader(CONTENT_TYPE, DEF_CONTENT_TYPE_POST);
            }
        },

        /**
         * Adds 2 methods on the xhr-instance which are used by xhr when events occur:
         *
         * xhr.onreadystatechange()
         * xhr.ontimeout()  // only XMLHttpRequest2
         *
         * These events are responsible for making the Promise resolve.
         * @method _setReadyHandle
         * @param xhr {Object} containing the xhr-instance
         * @param fulfill {Function} reference to the Promise fulfill-function
         * @param reject {Function} reference to the Promise reject-function
         * @private
        */
        _setReadyHandle: function(xhr, promise) {
            // for XDomainRequest, we need "onload" instead of "onreadystatechange"
            xhr.onreadystatechange = function() {
                // CANNOT console xhr.responseText here! IE9 will throw an error:
                // you can only acces it after (xhr.readyState===4)
                // also check xhr._aborted --> IE9 comes here after aborted and will throw an error when reading xhr"s native properties
                if (!xhr._aborted && (xhr.readyState===4)) {
                    clearTimeout(xhr._timer);
                    if ((xhr.status>=200) && (xhr.status<300)) {
                        // In case streamback function is set, but when no intermediate stream-data was send
                        // (or in case of XDR: below 2kb it doesn"t call onprogress)
                        // --> we might need to call onprogress ourselve.
                        if (xhr._isStream && !xhr._gotstreamed) {
                            xhr.onprogress(xhr.responseText);
                        }
                        if (xhr._fileProgress && !xhr._gotstreamed) {
                            xhr.onprogress({
                                lengthComputable: true,
                                loaded: 1,
                                total: 1
                            });
                        }
                        promise.fulfill(xhr);
                    }
                    else {
                        promise.reject(xhr.statusText || (UNKNOW_ERROR));
                    }
                }
            };
            xhr.onerror = function() {
                clearTimeout(xhr._timer);
                promise.reject(XHR_ERROR);
            };
        },

        /**
         * Stringifies an object into one string with every pair separated by `&`
         *
         * @method _toQueryString
         * @param data {Object} containing key-value pairs
         * @return {String} stringified presentation of the object, with every pair separated by `&`
         * @private
        */
        _toQueryString: function(data) {
            var paramArray = [],
                key, value;
            for (key in data) {
                value = data[key];
                key = ENCODE_URI_COMPONENT(key);
                paramArray.push((value === null) ? key : (key + "=" + ENCODE_URI_COMPONENT(value)));
            }
            return paramArray.join("&");
        },

        _standardHeaders: {},

        setStandardHeader: function(header, value) {
            this._standardHeaders[header] = value;
        },

        removeStandardHeader: function(header) {
            delete this._standardHeaders[header];
        },

        clearStandardHeader: function() {
            this._standardHeaders = {};
        },

        /**
         * Aborts all running io-requests
        */
        abortAll: function() {
            var instance = this;
            instance._runningRequests.forEach(function(promise) {
                promise.abort();
            });
            instance._runningRequests.length = 0;
        },

        /**
         * Sends a HTTP request to the server and returns a Promise with an additional .abort() method to cancel the request.
         * This method is the standard way of doing xhr-requests without processing streams.
         *
         * @method request
         * @param options {Object}
         *    @param [options.url] {String} The url to which the request is sent.
         *    @param [options.method="GET"] {String} The HTTP method to use.
         *    can be ignored, even if streams are used --> the returned Promise will always hold all data
         *    @param [options.sync=false] {boolean} By default, all requests are sent asynchronously. To send synchronous requests, set to true.
         *    @param [options.data] {Object} Data to be sent to the server, either to be used by `query-params` or `body`.
         *    @param [options.headers] {Object} HTTP request headers.
         *    @param [options.responseType] {String} Force the response type.
         *    @param [options.timeout=3000] {number} to timeout the request, leading into a rejected Promise.
         *    @param [options.withCredentials=false] {boolean} Whether or not to send credentials on the request.
         *    @param [options.streamback] {Function} callbackfunction in case you want to process streams (needs io-stream module).
         *    @param [options.stayActive] {Number} minimal time the request should be pending, even if IO has finished
         * @return {Promise} Promise holding the request. Has an additional .abort() method to cancel the request.
         * <ul>
         *     <li>on success: xhr {XMLHttpRequest1|XMLHttpRequest2} xhr-response</li>
         *     <li>on failure: reason {Error}</li>
         * </ul>
        */
        request: function(options) {
            var instance = this,
                props = {},
                xhr, promise;
            options = Object.itsa_isObject(options) ? options.itsa_deepClone() : {};
            promise = Promise.itsa_manage(options.streamback, options.stayActive);

            xhr = new XMLHttpRequest();
            props._isXHR2 = xhr2support;
            // it could be other modules like io-cors or io-stream have subscribed
            // xhr might be changed, also private properties might be extended
            instance._xhrList.forEach(
                function(fn) {
                    xhr = fn(xhr, props, options, promise);
                }
            );
            if (!xhr) {
                return Promise.reject(NO_XHR);
            }
            xhr.itsa_merge(props);

            // Don"t use xhr.timeout --> IE<10 throws an error when set xhr.timeout
            // We use a timer that aborts the request
            Object.defineProperty(xhr, "_timer", {
                configurable: false,
                enumerable: false,
                writable: false,
                value: setTimeout(function() {
                           promise.reject(REQUEST_TIMEOUT);
                           xhr._aborted = true; // must be set: IE9 won"t allow to read anything on xhr after being aborted
                           xhr.abort();
                       }, options.timeout || instance.config.timeout || DEF_REQ_TIMEOUT)
            });

            instance._initXHR(xhr, options, promise);

            // add to interbal hash:
            instance._runningRequests.push(promise);
            // remove it when ready:
            promise.itsa_finally(function() {
                instance._runningRequests.itsa_remove(promise);
            });

            return promise;
        }

    };

    IO._xhrInitList = [
        IO._setReadyHandle,
        IO._setHeaders
    ];

    return IO;
};