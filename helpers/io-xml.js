"use strict";

/**
 * @module itsa-fetch
 * @class Fetch
 * @since 0.0.1
*/

var TEXT_XML = "text/xml",
    REGEXP_XML = /(?: )*(<\?xml (?:.)*\?>)(?: )*(<(?:\w)+>)/;

var extendIO = function (IO, DOMParser) {

    /*
     * Adds properties to the xhr-object: in case of streaming,
     * xhr._parseStream=function is created to parse streamed data.
     *
     * @method _progressHandle
     * @param xhr {Object} containing the xhr-instance
     * @param props {Object} the propertie-object that is added too xhr and can be expanded
     * @param options {Object} options of the request
     * @private
    */
    var _entendXHR = function(xhr, props, options, promise) {
        var parser, followingstream, regegexp_endcont, regexpxml, xmlstart, container, endcontainer;
        if ((typeof options.streamback === "function") && options.headers && (options.headers.Accept===TEXT_XML)) {
            parser = new DOMParser();
            xhr._parseStream = function(streamData) {
                var fragment, parialdata;
                try {
                    if (!followingstream) {
                        regexpxml = streamData.match(REGEXP_XML);
                        if (regexpxml) {
                            xmlstart = regexpxml[1];
                            container = regexpxml[2];
                            endcontainer = "</"+container.substr(1);
                            regegexp_endcont = new RegExp("(.*)"+endcontainer+"( )*$");
                        }
                    }
                    parialdata = (followingstream ? xmlstart+container : "") + streamData;
                    regegexp_endcont.test(streamData) || (parialdata+=endcontainer);
                    fragment = parser.parseFromString(parialdata, TEXT_XML);
                    followingstream = true;
                    return fragment;
                }
                catch(err) {
                    promise.reject(err);
                }
            };
        }
        return xhr;
    };

    IO._xhrList.push(_entendXHR);

    /**
     * Performs an AJAX request with the GET HTTP method and expects a JSON-object.
     * The resolved Promise-callback returns an object (JSON-parsed serverresponse).
     *
     * Additional request-parameters can be on the url (with questionmark), through `params`, or both.
     *
     * The Promise gets fulfilled if the server responses with `STATUS-CODE` in the 200-range (excluded 204).
     * It will be rejected if a timeout occurs (see `options.timeout`), or if `xhr.abort()` gets invoked.
     *
     * Note1: If you expect the server to response with data that consist of Date-properties, you should set `options.parseJSONDate` true.
     *        Parsing takes a bit longer, but it will generate trully Date-objects.
     * Note2: CORS is supported, as long as the responseserver is set up to:
     *       a) has a response header which allows the clientdomain:
     *          header("Access-Control-Allow-Origin: http://www.some-site.com"); or header("Access-Control-Allow-Origin: *");
     *       b) in cae you have set a custom HEADER (through "options"), the responseserver MUST listen and respond
     *          to requests with the OPTION-method
     *       More info:  allows to send to your domain: see http://remysharp.com/2011/04/21/getting-cors-working/
     *
     * @method readXML
     * @param url {String} URL of the resource server
     * @param [params] {Object} additional parameters.
     * @param [options] {Object} See also: [`I.io`](#method_xhr)
     *    @param [options.url] {String} The url to which the request is sent.
     *    can be ignored, even if streams are used --> the returned Promise will always hold all data
     *    @param [options.sync=false] {boolean} By default, all requests are sent asynchronously. To send synchronous requests, set to true.
     *    @param [options.params] {Object} Data to be sent to the server.
     *    @param [options.body] {Object} The content for the request body for POST method.
     *    @param [options.headers] {Object} HTTP request headers.
     *    @param [options.responseType="text"] {String} The response type.
     *    @param [options.timeout=3000] {Number} to timeout the request, leading into a rejected Promise.
     *    @param [options.withCredentials=false] {boolean} Whether or not to send credentials on the request.
     *    @param [options.parseJSONDate=false] {boolean} Whether the server returns JSON-stringified data which has Date-objects.
     * @return {Promise}
     * on success:
        * Object received data
     * on failure an Error object
        * reason {Error}
    */
    IO.readXML = function(url, params, options) {
        var XMLOptions = {
                headers: {"Accept": TEXT_XML},
                method: "GET",
                url: url,
                data: params
            },
            ioPromise, returnPromise;
        options && XMLOptions.itsa_merge(options);
        ioPromise = this.request(XMLOptions);
        returnPromise = ioPromise.then(
            function(xhrResponse) {
                // if the responsetype is no TEXT_XML, then throw an error, else return xhrResponse.responseXML;
                // note that nodejs has "Content-Type" in lowercase!
                // Also: XDR DOES NOT support getResponseHeader() --> so we must just assume the data is text/xml
                var contenttype = !xhrResponse._isXDR && (xhrResponse.getResponseHeader("Content-Type") || xhrResponse.getResponseHeader("content-type"));
                if (xhrResponse._isXDR || /^text\/xml/.test(contenttype)) {
                    // cautious: when streaming, xhrResponse.responseXML will be undefined in case of using XDR
                    return xhrResponse.responseXML || (new DOMParser()).parseFromString(xhrResponse.responseText, TEXT_XML);
                }
                // when code comes here: no valid xml response:
                throw new Error("recieved Content-Type is no XML");
            }
        );
        // set `abort` to the thennable-promise:
        returnPromise.abort = ioPromise.abort;
        return returnPromise;
    };

};

module.exports = {
    extendIO: extendIO
};
