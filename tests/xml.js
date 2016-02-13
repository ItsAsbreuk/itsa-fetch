/*global describe, it */

"use strict";

require("chai").should();

var isNode = (typeof global!=="undefined") && ({}.toString.call(global)==="[object global]") && (!global.document || ({}.toString.call(global.document)!=="[object HTMLDocument]")),
    IO = isNode ? require("../extra/io-node") : require("../extra/io-browser"),
    URL = "http://servercors.itsa.io/io";

describe("io.readXML()", function () {

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
        }, 250);
    });

});
