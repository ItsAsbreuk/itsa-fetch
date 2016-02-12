/*global describe, it */
/*jshint unused:false */

"use strict";

var expect = require("chai").expect;

require("chai").should();
require("itsa-jsext");

var isNode = (typeof global!=="undefined") && ({}.toString.call(global)==="[object global]") && (!global.document || ({}.toString.call(global.document)!=="[object HTMLDocument]")),
    IO = isNode ? require("../lib/io-node") : require("../lib/io-browser"),
    URL = "http://servercors.itsa.io/io",
    block2k = "",
    xdr, testxhr, xhr2support, i;

if (!isNode) {
    testxhr = new window.XMLHttpRequest(),
    xhr2support = ("withCredentials" in testxhr);
    if (!xhr2support) {
        xdr = (typeof window.XDomainRequest !== "undefined");
    }
}

// Very interesting issue where we must take care with:
// some browsers only fire the `onprogress`-event when the block of code exceeds 2k !
// see: http://blogs.msdn.com/b/ieinternals/archive/2010/04/06/comet-streaming-in-internet-explorer-with-xmlhttprequest-and-xdomainrequest.aspx
// Thus, we prepend the response with 2k of whitespace

for (i=0; i<2000; i++) {
    block2k += " ";
}

describe("io-stream", function () {

    // "../lib/io-node" cannot stream yet
    if (isNode) {
        it("No stream test on node.js yet", function () {
        });
    }
    else {
        it("IO.request with stream", function (done) {
            this.timeout(10000);
            var options, cb, pck = 0;
            cb = function(data) {
                pck++;
                expect(data).to.eql(block2k+"package "+pck);
            };
            options = {
                url: URL+"/action/stream",
                method: "GET",
                streamback: cb,
                data: {xdr: xdr}
            };

            IO.request(options).then(
                function(xhr) {
                    expect(pck).to.eql(4);
                    xhr.responseText.should.be.eql(block2k+"package 1"+block2k+"package 2"+block2k+"package 3"+block2k+"package 4");
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("IO.request with stream with small portions", function (done) {
            this.timeout(10000);
            var options, cb, build = "";
            cb = function(data) {
                build += data;
            };
            options = {
                url: URL+"/action/stream",
                method: "GET",
                streamback: cb,
                data: {xdr: xdr, type: "noblock"}
            };

            IO.request(options).then(
                function(xhr) {
                    expect(build).to.eql(xhr.responseText);
                    xhr.responseText.should.be.eql("package 1package 2package 3package 4");
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("IO.request with stream when server doesn\"t stream", function (done) {
            this.timeout(10000);
            var options, cb, build = "";
            cb = function(data) {
                build += data;
            };
            options = {
                url: URL+"/action/stream",
                method: "GET",
                streamback: cb,
                data: {xdr: xdr, type: "nostream"}
            };

            IO.request(options).then(
                function(xhr) {
                    expect(build).to.eql(xhr.responseText);
                    xhr.responseText.should.be.eql("package 1package 2package 3package 4");
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("IO.read array with stream", function (done) {
            this.timeout(10000);
            var options, cb, pck = 0;
            cb = function(data) {
                pck++;
                expect(data).to.eql([{a: pck}]);
            };
            options = {
                streamback: cb
            };

            IO.read(URL+"/action/stream", {xdr: xdr, type: "jsonarray"}, options).then(
                function(data) {
                    expect(pck).to.eql(4);
                    data.should.be.eql([{a:1},{a:2},{a:3},{a:4}]);
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("IO.read object with stream", function (done) {
            this.timeout(10000);
            var options, cb, pck = 0;
            cb = function(data) {
                pck++;
                switch(pck) {
                    case 1:
                        expect(data).to.eql({a: 1});
                        break;
                    case 2:
                        expect(data).to.eql({b: 2});
                        break;
                    case 3:
                        expect(data).to.eql({c: 3});
                        break;
                    case 4:
                        expect(data).to.eql({d: 4});
                        break;
                }
            };
            options = {
                streamback: cb
            };

            IO.read(URL+"/action/stream", {xdr: xdr, type: "jsonobject"}, options).then(
                function(data) {
                    expect(pck).to.eql(4);
                    data.should.be.eql({a:1, b:2, c:3, d:4});
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("IO.read object with stream with small portions", function (done) {
            this.timeout(10000);
            var options, cb, build = {};
            cb = function(data) {
                build.itsa_merge(data);
            };
            options = {
                streamback: cb
            };

            IO.read(URL+"/action/stream", {xdr: xdr, type: "jsonobjectnoblock"}, options).then(
                function(data) {
                    expect(build).to.eql(data);
                    data.should.be.eql({a:1, b:2, c:3, d:4});
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("IO.read object with stream when server doesn\"t stream", function (done) {
            this.timeout(10000);
            var options, cb, build = {};
            cb = function(data) {
                build.itsa_merge(data);
            };
            options = {
                streamback: cb
            };

            IO.read(URL+"/action/stream", {xdr: xdr, type: "jsonobjectnostream"}, options).then(
                function(data) {
                    expect(build).to.eql(data);
                    data.should.be.eql({a:1, b:2, c:3, d:4});
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("IO.readXML with stream", function (done) {
            this.timeout(10000);
            var options, cb, pck = 0;
            cb = function(responseXML) {
                pck++;
                responseXML.documentElement.getElementsByTagName("response")[0].firstChild.nodeValue.should.be.eql(pck.toString());
                expect(responseXML.documentElement.getElementsByTagName("response").length).to.be.eql(1);
            };
            options = {
                streamback: cb
            };

            IO.readXML(URL+"/action/stream", {xdr: xdr, type: "xml"}, options).then(
                function(responseXML) {
                    expect(pck).to.eql(4);
                    responseXML.documentElement.getElementsByTagName("response")[2].firstChild.nodeValue.should.be.eql("3");
                    expect(responseXML.documentElement.getElementsByTagName("response").length).to.be.eql(4);
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("IO.readXML with stream with small portions", function (done) {
            this.timeout(10000);
            var options, cb, build;
            cb = function(responseXML) {
                build = responseXML;
            };
            options = {
                streamback: cb
            };

            IO.readXML(URL+"/action/stream", {xdr: xdr, type: "xmlnoblock"}, options).then(
                function(responseXML) {
                    if (xdr) {
                        var oSerializer = new window.XMLSerializer();
                        expect(oSerializer.serializeToString(build)).to.eql(oSerializer.serializeToString(responseXML));
                    }
                    responseXML.documentElement.getElementsByTagName("response")[2].firstChild.nodeValue.should.be.eql("3");
                    expect(responseXML.documentElement.getElementsByTagName("response").length).to.be.eql(4);
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("IO.readXML with stream when server doesn\"t stream", function (done) {
            this.timeout(10000);
            var options, cb, build;
            cb = function(responseXML) {
                build = responseXML;
            };
            options = {
                streamback: cb
            };

            IO.readXML(URL+"/action/stream", {xdr: xdr, type: "xmlnostream"}, options).then(
                function(responseXML) {
                    if (xdr) {
                        var oSerializer = new window.XMLSerializer();
                        expect(oSerializer.serializeToString(build)).to.eql(oSerializer.serializeToString(responseXML));
                    }
                    responseXML.documentElement.getElementsByTagName("response")[2].firstChild.nodeValue.should.be.eql("3");
                    expect(responseXML.documentElement.getElementsByTagName("response").length).to.be.eql(4);
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

    }
});

