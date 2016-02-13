"use strict";

/**
 * @module itsa-fetch
 * @class Fetch
 * @since 0.0.1
*/

var fetch = function() {
    // as from version 2.0.0 we will support the native fetch-methods
};

module.exports = function(io) {
    fetch.io = io;
    return fetch;
};