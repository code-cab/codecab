'use strict';

module.exports.delay = function(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
}