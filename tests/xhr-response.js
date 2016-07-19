/* global describe, it */

"use strict";

var chai = require("chai"),
    expect = chai.expect;

require("chai").should();

chai.use(require("chai-as-promised"));

var isNode = (typeof global!=="undefined") && ({}.toString.call(global)==="[object global]") && (!global.document || ({}.toString.call(global.document)!=="[object HTMLDocument]")),
    IO = isNode ? require("../extra/io-node") : require("../extra/io-browser"),
    URL = "http://servercors.itsa.io/io",
    xdr, testxhr, xhr2support;

if (!isNode) {
    testxhr = new window.XMLHttpRequest(),
    xhr2support = ("withCredentials" in testxhr);
    if (!xhr2support) {
        xdr = (typeof window.XDomainRequest !== "undefined");
    }
}

describe("Response-object", function () {

    this.timeout(5000);

    it("responseText", function (done) {
        var options = {
            url: URL+"/action/responsetxt",
            method: "GET"
        };
        IO.request(options).then(
            function(response) {
                response.responseText.should.be.eql("Acknowledge responsetext ok");
                (response.readyState===4).should.be.true; // response.readyState.should.be.eql(4) --> goes wrong in IE<10 ??
                (response.status===200).should.be.true; // response.status.should.be.eql(200) --> goes wrong in IE<10 ??
                expect(response.getAllResponseHeaders()).be.a.String;
                ((response.getAllResponseHeaders().indexOf("Content-Type:")!==-1) || (response.getAllResponseHeaders().indexOf("content-type:")!==-1)).should.be.true;
                response.getResponseHeader("Content-Type").should.be.eql(xdr ? "text/plain" : "text/plain; charset=utf-8");
                done();
            }
        ).then(
            undefined,
            done
        );
    });

});

describe("Analysing params", function () {

    this.timeout(5000);

    describe("GET-params", function () {

        it("through querystring", function (done) {
            var options = {
                url: URL+"?data=25&dummy1=5",
                method: "GET"
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge get-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("through dataobject", function (done) {
            var options = {
                url: URL,
                method: "GET",
                data: {data: 25}
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge get-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("combined 1", function (done) {
            var options = {
                url: URL+"?data=25&dummy1=5",
                method: "GET",
                data: {dummy2: 10}
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge get-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("combined 2", function (done) {
            var options = {
                url: URL+"?dummy1=5&dummy2=10",
                method: "GET",
                data: {data: 25}
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge get-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

    });

    describe("DELETE-params", function () {

        it("through querystring", function (done) {
            var options = {
                url: URL+"?data=25&dummy=5",
                method: "DELETE"
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge "+(xdr ? "get" : "delete")+"-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("through dataobject", function (done) {
            var options = {
                url: URL,
                method: "DELETE",
                data: {data: 25}
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge "+(xdr ? "get" : "delete")+"-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("combined 1", function (done) {
            var options = {
                url: URL+"?data=25&dummy=5",
                method: "DELETE",
                data: {dummy2: 10}
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge "+(xdr ? "get" : "delete")+"-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("combined 2", function (done) {
            var options = {
                url: URL+"?dummy1=5&dummy2=10",
                method: "DELETE",
                data: {data: 25}
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge "+(xdr ? "get" : "delete")+"-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

    });

    describe("PUT-params", function () {

        it("through querystring", function (done) {
            var options = {
                url: URL+"?data=25&dummy1=5",
                method: "PUT"
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge "+(xdr ? "post" : "put")+"-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("through dataobject", function (done) {
            var options = {
                url: URL,
                method: "PUT",
                data: {data: 25}
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge "+(xdr ? "post" : "put")+"-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("combined 1", function (done) {
            var options = {
                url: URL+"?data=25&dummy1=5",
                method: "PUT",
                data: {dummy2: 10}
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge "+(xdr ? "post" : "put")+"-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("combined 2", function (done) {
            var options = {
                url: URL+"?dummy1=5&dummy2=10",
                method: "PUT",
                data: {data: 25}
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge "+(xdr ? "post" : "put")+"-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

    });

    describe("POST-params", function () {

        it("through querystring", function (done) {
            var options = {
                url: URL+"?data=25&dummy1=5",
                method: "POST"
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge post-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("through dataobject", function (done) {
            var options = {
                url: URL,
                method: "POST",
                data: {data: 25}
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge post-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("combined 1", function (done) {
            var options = {
                url: URL+"?data=25&dummy1=5",
                method: "POST",
                data: {dummy2: 10}
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge post-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("combined 2", function (done) {
            var options = {
                url: URL+"?dummy1=5&dummy2=10",
                method: "POST",
                data: {data: 25}
            };
            IO.request(options).then(
                function(response) {
                    response.responseText.should.be.eql("Acknowledge post-request with data: 25");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

    });

    describe("Aborting requests", function () {

        it("aborting", function (done) {
            var options = {
                url: URL+"/action/responsedelayed",
                method: "GET"
            };
            var io = IO.request(options);
            io.then(
                function() {
                    done(new Error("io should not be fulfilled"));
                },
                function() {
                    done();
                }
            );
            setTimeout(function() {
                io.abort();
            }, 50);
        });

        it("aborting by timeout", function (done) {
            var options = {
                url: URL+"/action/responsedelayed",
                method: "GET",
                timeout: 100
            };
            var io = IO.request(options);
            io.then(
                function() {
                    done(new Error("io should not be fulfilled"));
                },
                function() {
                    done();
                }
            );
        });

    });

});
