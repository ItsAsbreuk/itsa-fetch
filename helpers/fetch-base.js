"use strict";

/**
 * @module itsa-fetch
 * @class Fetch
 * @since 0.0.1
*/

var Classes = require("itsa-classes"),
    Body, fetch;

Body = Classes.createClass(function(xhr) {
    this._responseText = xhr.responseText;
}, {
    arrayBuffer: function() {
    },
    blob: function() {

    },
    formData: function() {

    },
    json: function() {

    },
    text: function() {

    }
});

fetch = function(url/*, options */) {
    // as from version 2.0.0 we will support the native fetch-methods
    var requestOptions, request;
    requestOptions = {
        url: url
    };
    request = fetch.io.request(requestOptions);
    return request.then(function(xhr) {
        return new Body(xhr);
    });
};

module.exports = function(io) {
    fetch.io = io;
    return fetch;
};