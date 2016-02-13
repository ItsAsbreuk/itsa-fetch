/*global describe, it */

"use strict";

var chai = require("chai"),
    expect = chai.expect;

require("chai").should();

chai.use(require("chai-as-promised"));

var isNode = (typeof global!=="undefined") && ({}.toString.call(global)==="[object global]") && (!global.document || ({}.toString.call(global.document)!=="[object HTMLDocument]")),
    IO = isNode ? require("../lib/io-node") : require("../lib/io-browser"),
    URL = "http://servercors.itsa.io/io",
    REG_APP_JSON = /^application\/json/,
    APPLICATION_JSON_HEADER = (isNode ? "*/*, " : "") +"application/json",
    xdr, testxhr, xhr2support;

if (!isNode) {
    testxhr = new window.XMLHttpRequest(),
    xhr2support = ("withCredentials" in testxhr);
    if (!xhr2support) {
        xdr = (typeof window.XDomainRequest !== "undefined");
    }
}


describe("CORS-io response-object", function () {

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

describe("CORS-io-transfer methods", function () {

    this.timeout(5000);

    describe("data", function () {

        it("get", function () {
            return IO.get(URL+"/action/responsetxt").should.become("Acknowledge responsetext ok");
        });

        it("read", function () {
            return expect(IO.read(URL+"/extractdata", {id: 1})).to.eventually.have.property("id");
        });

        it("insert", function () {
            return expect(IO.insert(URL+"/extractdata", {id: 1})).to.eventually.have.property("id");
        });

        it("update", function () {
            return expect(IO.update(URL+"/extractdata", {id: 1})).to.eventually.have.property("id");
        });

        it("delete", function () {
            return expect(IO.delete(URL+"/extractdata", {id: 1})).to.eventually.have.property("id");
        });

        it("send", function () {
            return IO.send(URL+"/extractdata", {id: 1}).should.become("{\"id\":1}");
        });
    });

    describe("right method", function () {
        it("read --> GET", function () {
            return expect(IO.read(URL+"/extractdata/method", {id: 1})).to.eventually.have.property("GET");
        });
        it("insert --> not all fields --> POST", function () {
            return expect(IO.insert(URL+"/extractdata/method", {id: 1})).to.eventually.have.property("POST");
        });

        it("insert --> all fields --> PUT", function () {
            return expect(IO.insert(URL+"/extractdata/method", {id: 1}, {allfields: true})).to.eventually.have.property(xdr ? "POST" : "PUT");
        });

        it("update --> not all fields --> POST", function () {
            return expect(IO.update(URL+"/extractdata/method", {id: 1}, {allfields: false})).to.eventually.have.property("POST");
        });

        it("update --> all fields --> PUT", function () {
            return expect(IO.update(URL+"/extractdata/method", {id: 1})).to.eventually.have.property(xdr ? "POST" : "PUT");
        });

        it("delete --> DELETE", function () {
            return expect(IO.delete(URL+"/extractdata/method", {id: 1})).to.eventually.have.property(xdr ? "GET" : "DELETE");
        });

        it("send --> not all fields --> POST", function () {
            return IO.send(URL+"/extractdata/method", {id: 1}, {allfields: false}).should.become("{\"POST\":true}");
        });

        it("send --> all fields --> PUT", function () {
            return IO.send(URL+"/extractdata/method", {id: 1}).should.become("{\""+(xdr ? "POST" : "PUT")+"\":true}");
        });

    });

    describe("right headers", function () {
        it("action insert", function (done) {
            IO.insert(URL+"/extractdata/headers", {id: 1}).then(
                function(response) {
                    xdr || response["x-action"].should.be.eql("insert");
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("action update", function (done) {
            IO.update(URL+"/extractdata/headers", {id: 1}).then(
                function(response) {
                    xdr || response["x-action"].should.be.eql("update");
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("read accept", function (done) {
            IO.read(URL+"/extractdata/headers", {id: 1}).then(
                function(response) {
                    response.accept.should.be.eql(xdr ? "*/*" : APPLICATION_JSON_HEADER);
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("send accept", function (done) {
            IO.send(URL+"/extractdata/headers", {id: 1}).then(
                function(response) {
                    var r = JSON.parse(response);
                    r.accept.should.not.be.eql(APPLICATION_JSON_HEADER);
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("insert accept", function (done) {
            IO.insert(URL+"/extractdata/headers", {id: 1}).then(
                function(response) {
                    response.accept.should.be.eql(xdr ? "*/*" : APPLICATION_JSON_HEADER);
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("update accept", function (done) {
            IO.update(URL+"/extractdata/headers", {id: 1}).then(
                function(response) {
                    response.accept.should.be.eql(xdr ? "*/*" : APPLICATION_JSON_HEADER);
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("delete accept", function (done) {
            IO.delete(URL+"/extractdata/headers", {id: 1}).then(
                function(response) {
                    response.accept.should.not.be.eql(APPLICATION_JSON_HEADER);
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("read content-type", function (done) {
            IO.read(URL+"/extractdata/headers", {id: 1}).then(
                function(response) {
                    (response["content-type"]===undefined).should.be.true;
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("send content-type", function (done) {
            IO.send(URL+"/extractdata/headers", {id: 1}).then(
                function(response) {
                    var r = JSON.parse(response);
                    REG_APP_JSON.test(r["content-type"]).should.be.true;
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("insert content-type", function (done) {
            IO.insert(URL+"/extractdata/headers", {id: 1}).then(
                function(response) {
                    REG_APP_JSON.test(response["content-type"]).should.be.true;
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("update content-type", function (done) {
            IO.update(URL+"/extractdata/headers", {id: 1}).then(
                function(response) {
                    REG_APP_JSON.test(response["content-type"]).should.be.true;
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

        it("delete content-type", function (done) {
            IO.delete(URL+"/extractdata/headers", {id: 1}).then(
                function(response) {
                    var contenttype = response["content-type"];
                    // it seems IE<10 adds contenttype==="application/x-www-form-urlencoded" by itself...
                    ((contenttype===undefined) || (contenttype==="application/x-www-form-urlencoded")).should.be.true;
                    done();
                }
            )
            .then(
                undefined,
                done
            );
        });

    });
    describe("JSON processing", function () {
        it("insert retrieve Date", function (done) {
            var data = {
                personal: {
                    birthday: new Date()
                }
            };
            IO.insert(URL+"/extractdata", data, {parseJSONDate: true}).then(
                function(data) {
                    expect(data.personal.birthday instanceof Date).to.be.eql(true);
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("Date as String without header", function (done) {
            var data = {
                personal: {
                    birthday: new Date()
                }
            };
            IO.insert(URL+"/extractdata/headers", data).then(
                function(response) {
                    (response["x-jsondate"]===undefined).should.be.eql(true);
                    done();
                }
            ).then(
                undefined,
                done
            );
        });

        it("Date as Date with header", function (done) {
            var data = {
                personal: {
                    birthday: new Date()
                }
            };
            IO.insert(URL+"/extractdata/headers", data, {parseJSONDate: true}).then(
                function(response) {
                    xdr || response["x-jsondate"].should.be.eql("true");
                    done();
                }
            ).then(
                undefined,
                done
            );
        });
    });

    describe("data aborted", function () {
        it("get", function () {
            var io = IO.get(URL+"/action/responsedelayed");
            io.should.be.rejected;
            setTimeout(function() {
                io.abort();
            }, 50);
        });

        it("read", function () {
            var io = IO.read(URL+"/extractdata", {id: 1}, {headers: {"X-Delay": 500}});
            io.should.be.rejected;
            setTimeout(function() {
                io.abort();
            }, 50);
        });

        it("insert", function () {
            var io = IO.insert(URL+"/extractdata", {id: 1}, {headers: {"X-Delay": 500}});
            io.should.be.rejected;
            setTimeout(function() {
                io.abort();
            }, 50);
        });

        it("update", function () {
            var io = IO.update(URL+"/extractdata", {id: 1}, {headers: {"X-Delay": 500}});
            io.should.be.rejected;
            setTimeout(function() {
                io.abort();
            }, 50);
        });

        it("delete", function () {
            var io = IO.delete(URL+"/extractdata", {id: 1}, {headers: {"X-Delay": 500}});
            io.should.be.rejected;
            setTimeout(function() {
                io.abort();
            }, 50);
        });

        it("send", function () {
            var io = IO.send(URL+"/extractdata", {id: 1}, {headers: {"X-Delay": 500}});
            io.should.be.rejected;
            setTimeout(function() {
                io.abort();
            }, 50);
        });

    });

});

describe("CORS with io-xml", function () {

    this.timeout(5000);

    it("xml response", function (done) {
        IO.readXML(URL+"/action/responsexml").then(
            function(responseXML) {
                responseXML.getElementsByTagName("response")[0].firstChild.nodeValue.should.be.eql("10");
                done();
            },
            done
        );
    });

    it("non text/xml response", function (done) {
        IO.readXML(URL+"/action/responsetxt").then(
            function() {
                done(new Error("readXML should not resolve when responsetype is not text/xml"));
            },
            function(error) {
                error.message.should.be.eql("recieved Content-Type is no XML");
                done();
            }
        );
    });

    it("aborted", function () {
        var io = IO.readXML(URL+"/action/responsedelayed");
        io.should.be.rejected;
        setTimeout(function() {
            io.abort();
        }, 50);
    });

});
