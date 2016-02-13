/*global describe, it, beforeEach */

"use strict";

var expect = require("chai").expect;

var isNode = (typeof global!=="undefined") && ({}.toString.call(global)==="[object global]") && (!global.document || ({}.toString.call(global.document)!=="[object HTMLDocument]")),
    IO = isNode ? require("../lib/io-node") : require("../lib/io-browser"),
    async = require("itsa-utils").async;

if (isNode) {
    require("../helpers/io-assets").extendIO(IO);
}

describe("fetch.insertScript", function () {

    var dom;
    this.timeout(5000);

    beforeEach(function () {
        var jsdom;
        if (isNode) {
            jsdom = require("jsdom").jsdom;
            global.document = dom = jsdom("<html><head></head><body></body></html>");
        }
        else {
            dom = window.document;
        }
    });

    it("should be inserted", function (done) {
        var URL = "http://www.google-analytics.com/analytics.js";
        IO.insertScript(URL).then(
            function(node) {
                expect(dom.contains(node)).to.be.true;
                done();
            },
            done
        );
    });

    it("should be not present when immediate aborted", function (done) {
        var URL = "http://www.google-analytics.com/analytics.js";
        var promise = IO.insertScript(URL);
        promise.then(
            function() {
                done("fetch.insertScript should be aborted");
            },
            function() {
                expect(dom.head.childNodes.length).to.be.equal(0);
                done();
            }
        );
        promise.abort();
    });

    it("should be not present when async-aborted", function (done) {
        var URL = "http://www.google-analytics.com/analytics.js";
        var promise = IO.insertScript(URL);
        promise.then(
            function() {
                done("fetch.insertScript should be aborted");
            },
            function() {
                expect(dom.head.childNodes.length).to.be.equal(0);
                done();
            }
        );
        async(function() {
            promise.abort();
        });
    });

});
