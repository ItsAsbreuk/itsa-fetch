"use strict";

/**
 * @module itsa-fetch
 * @class Fetch
 * @since 0.0.1
*/

var async = require("itsa-utils").async;

var extendIO = function (IO) {
    /**
     * Injects a script into the page, as last childNode inside the "head"-Element.
     *
     * @method insertScript
     * @param url {String} the url of the script that should be inserted.
     * @return {Promise} A promise that gets resolved as soon as the script is loaded.
     *                   When fulfilled, the callback holds the script-Element
     * @since 0.0.2
     */
    IO.insertScript = function(url) {
        var instance = this,
            newNode, promise, rejectClosure,
            tagName = "script",
            DOCUMENT = document,
            HEAD = DOCUMENT.head;

        newNode = DOCUMENT.createElement(tagName);
        promise = new Promise(function(fulfill, reject) {
            var fulfillSubscriber, rejectSubscriber, unsubScribe;
            unsubScribe = function() {
                // support for IE8:
                if (instance._oldEventSystem) {
                    newNode.detachEvent("onload", fulfillSubscriber);
                    newNode.detachEvent("onerror", rejectSubscriber);
                } else {
                    newNode.removeEventListener("load", fulfillSubscriber);
                    newNode.removeEventListener("error", rejectSubscriber);
                }
            };
            fulfillSubscriber = function() {
                unsubScribe();
                fulfill(newNode);
            };
            rejectSubscriber = function(e) {
                unsubScribe();
                HEAD.contains(newNode) && HEAD.removeChild(newNode);
                reject(e);
            };
            rejectClosure = rejectSubscriber;
            // support for IE8:
            if (instance._oldEventSystem) {
                newNode.attachEvent("onload", fulfillSubscriber);
                newNode.attachEvent("onerror", rejectSubscriber);
            } else {
                newNode.addEventListener("load", fulfillSubscriber);
                newNode.addEventListener("error", rejectSubscriber);
            }
        });
        promise.abort = rejectClosure;
        async(function() {
            newNode.async = 1;
            newNode.src = url;
            HEAD.appendChild(newNode);
        });
        return promise;
    };

};

module.exports = {
    extendIO: extendIO
};
