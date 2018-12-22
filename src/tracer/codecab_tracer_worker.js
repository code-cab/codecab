"use strict";
let traceAndConvexify = require('./codecab_tracer').traceAndConvexify;

var me = self || {};
me.onmessage = function (e) {
    var data = e.data;
    var resultList = null;
    var errorMessage = null;

    try {
        resultList = doCommand(data);
    } catch (err) {
        resultList = [];
        errorMessage = err.message;
    }

    var resultTransferList = [];
    for (var i = 0; i < resultList.length; i++) {
        resultTransferList.push(resultList[i].buffer);
    }
    var returnData = {
        ticket: data.ticket,
        resultList: resultList,
        errMsg: errorMessage,
        workerId: data.workerId
    };
    me.postMessage(returnData, resultTransferList);
    return returnData;

};

function doCommand(data) {
    if (data.cmd === 'traceAndConvexify') {
        return traceAndConvexify(data.imgData);
    }
    throw new Error("Unknown command " + data.cmd);
}
