/*global describe, it */
/*jshint unused:false */

"use strict";

require("itsa-jsext");

require("chai").should();

var isNode = (typeof global!=="undefined") && ({}.toString.call(global)==="[object global]") && (!global.document || ({}.toString.call(global.document)!=="[object HTMLDocument]")),
    IO = isNode ? require("../lib/io-node") : require("../lib/io-browser"),
    URL = "http://servercors.itsa.io/io/status",
    checklist = {
        200: false,
        201: false,
        202: false,
        203: false,
        204: false, // this response doesn't return on IE<10
        205: false,
        206: true,
        300: true,
        301: !isNode, // this request doesn"t run on node-XMLHttpRequest, for url is made undefined
        302: !isNode, // this request doesn"t run on node-XMLHttpRequest, for url is made undefined
        303: !isNode, // this request doesn"t run on node-XMLHttpRequest, for url is made undefined
        304: !isNode, // this response doesn"t return on IE<10
        305: false,
        306: false,
        307: !isNode, // this request doesn"t run on node-XMLHttpRequest, for url is made undefined
        400: false,
        401: false,
        402: false,
        403: false,
        404: true,
        405: false,
        406: false,
        407: false,
        408: false,
        409: false,
        410: false,
        411: false,
        412: false,
        413: false,
        414: false,
        415: false,
        416: false,
        417: false,
        500: false,
        501: false,
        502: false,
        503: true,
        504: false,
        505: false
    };

describe("Status codes", function () {

    this.timeout(5000);

    it("response 200-series", function (done) {
        this.timeout(10000);
        var options = {
                url: URL,
                method: "GET",
                data: {res: 101}
            },
            a = [],
            res, createIO;
        createIO = function(res) {
            var requestRes = res;
            options.data.res = requestRes;
            return IO.request(options).then(
                function(response) {
                    var resString = requestRes.toString(),
                        responseText = response.responseText;
                    // 204 and 205 seem to be a responses without content
                    if (requestRes===204) {
                        responseText.should.be.eql("");
                    }
                    else if (requestRes===205) {
                        ((responseText==="") || (responseText===resString)).should.be.true;
                    }
                    else {
                        responseText.should.be.eql(((requestRes===204) || (requestRes===205)) ? "" : resString);
                    }
                }
            );
        };

        for (res=200; res<=206; res++) {
            checklist[res] && a.push(createIO(res));
        }

        Promise.all(a).then(
            function() {
                done();
            },
            function(err) {
                done(err);
            }
        );
    });

    it("response 300-series", function (done) {
        this.timeout(10000);
        var options = {
                url: URL,
                method: "GET",
                data: {res: 101}
            },
            a = [],
            res, createIO;
        createIO = function(res) {
            var requestRes = res;
            options.data.res = requestRes;
            return IO.request(options).then(
                function() {
                    throw new Error("_xhr should not resolve");
                },
                function() {
                    return true;
                }
            );
        };

        for (res=300; res<=307; res++) {
            checklist[res] && a.push(createIO(res));
        }

        Promise.all(a).then(
            function() {
                done();
            },
            function(err) {
                done(err);
            }
        );
    });

    it("response 400-series", function (done) {
        this.timeout(10000);
        var options = {
                url: URL,
                method: "GET",
                data: {res: 101}
            },
            a = [],
            res, createIO;
        createIO = function(res) {
            var requestRes = res;
            options.data.res = requestRes;
            return IO.request(options).then(
                function() {
                    throw new Error("_xhr should not resolve");
                },
                function() {
                    return true;
                }
            );
        };

        for (res=400; res<=417; res++) {
            checklist[res] && a.push(createIO(res));
        }

        Promise.all(a).then(
            function() {
                done();
            },
            function(err) {
                done(err);
            }
        );
    });

    it("response 500-series", function (done) {
        this.timeout(10000);
        var options = {
                url: URL,
                method: "GET",
                data: {res: 101}
            },
            a = [],
            res, createIO;
        createIO = function(res) {
            var requestRes = res;
            options.data.res = requestRes;
            return IO.request(options).then(
                function() {
                    throw new Error("_xhr should not resolve");
                },
                function() {
                    return true;
                }
            );
        };

        for (res=500; res<=505; res++) {
            checklist[res] && a.push(createIO(res));
        }

        Promise.all(a).then(
            function() {
                done();
            },
            function(err) {
                done(err);
            }
        );
    });

});
