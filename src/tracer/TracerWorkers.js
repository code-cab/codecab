//import earcutWrapped from './earcut_wrapped';
//import codecabTracerWrapped from './codecab_tracer_wrapped';
// var webworkify = require('webworkify');
//var webworkify = require('../misc/workerloader');
var codecabWorker = require('../../generate/codecab_worker');

var numberOfWorkers = 1;
var workers = [];
var ticketCallbacks = {};
var ticketCounter = 1;
var queue = [];

var url = module.URL || module.webkitURL;


function createWorker() {
    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
    var blob = new Blob([atob(codecabWorker.default)], { type: 'text/javascript' });
    var workerUrl = URL.createObjectURL(blob);
    var worker = new Worker(workerUrl);
    worker.objectURL = workerUrl;
    return worker;

}

function appendFunction(fn) {
    return fn.toString()
        .replace(/^function \([\w\W]*?\) \{/, '')
        .replace(/}$/, '')
        .replace(/\/\/TEST[\s\S.]*?\/\/_TEST/g, '');
}

function work(data, transferList, callback) {
    var postData = {
        ticket: 'ticket_' + (ticketCounter++)
    };
    for (var key in data) {
        postData[key] = data[key];
    }
    ticketCallbacks[postData.ticket] = callback;

    if (!sendToWorker(postData, transferList)) {
        // All busy
        queue.push([postData, transferList]);
    }
}
function workDone(e) {
    var ticket = e.data.ticket;
    var ticketCallback = ticketCallbacks[ticket];
    delete ticketCallbacks[ticket];
    workers[e.data.workerId].busy = false;

    var queuedData = queue.shift();
    if (queuedData) {
        sendToWorker(queuedData[0], queuedData[1]);
    }

    ticketCallback(e.data.errMsg, e.data, e.data.resultList);
}

function sendToWorker(postData, transferList) {
    for (var i = 0; i < workers.length; i++) {
        if (!workers[i].busy) {
            postData.workerId = i;
            workers[i].busy = true;
            workers[i].postMessage(postData, transferList);
            return true;
        }
    }
    return false;
}




export default class TracerWorkers {
    constructor() {
    }

    /**
     * Create a multi convex polygon for the supplied image data.
     *  imgData = {
     *      data: Uint8Array[w*h * 4], // ImageData
     *      w: 0,
     *      h: 0,
     *      tolerance: 1.5, // Maximum accuracy deviation for tracing (pixels)
     *      scale: 1, // Whether the supplied image is scaled
     *      margin: 10, // Offset of the image. Offset is required to avoid edge problems
     *      weaklySimple: false, // When true make weakly simple polygon. When false
      *                          // outer lines and inner holes are used for triangulation
     *      backgroundColor: null // When null the alpha channel (transparency) is used
      *                           // to determine edges. When set to a color that color
      *                           // is used. Alpha channel is then ignored
      *                           // Use hex notation for color (0x7fff00)
     *  }
     *
     * callback(err, polyList);
     */
    static traceAndConvexify(imgData, callback) {
        var data = {
            cmd: 'traceAndConvexify',
            imgData: imgData
        };
        work(data, [imgData.data.buffer], function(err, data, resultList) {
            var array = resultList.length ? resultList[0] : null;
            callback(err, array);
        });
    };



    /**
     * When startWorker is not started or Worker is not available the main thread is used
     * with async callback
     */
    static startWorkers() {
        if (window.__ideWorkers) {
            for (let i = 0; i < window.__ideWorkers.length; i += 1) {
                workers.push(window.__ideWorkers[i]);
                workers[i].busy = false;
                workers[i].onmessage = workDone;
            }
            return;
        }
        window.URL = window.URL || window.webkitURL;
        //
        // if (!Worker || !URL) {
        //     throw Error("WebWorkers not supported");
        // }
        // let script =
        //     appendFunction(codecabTracerWrapped) +
        //     appendFunction(earcutWrapped);
        //
        // var blob;
        // try {
        //     blob = new Blob([script], {type: 'application/javascript'});
        // } catch (e) { // Backwards-compatibility
        //     window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        //     blob = new BlobBuilder();
        //     blob.append(script);
        //     blob = blob.getBlob();
        // }

        for (let i = 0; i < numberOfWorkers; i++) {
            workers.push(createWorker());
            // workers.push(new Worker(URL.createObjectURL(blob)));
            workers[i].busy = false;
            workers[i].onmessage = workDone;
        }
    }

    static getImageData(img, options) {
        // Create mask -> data with values 0x00 and 0x80
        var currentImageSize = img.width * img.height;
        var scale = 1;
        if (options.limitSize && currentImageSize > options.limitSize) {
            scale = options.limitSize / currentImageSize;
        }
        var margin = Math.ceil(4 + options.tolerance);
        margin = 10;
        var wImg = Math.ceil(scale * img.width);
        var hImg = Math.ceil(scale * img.height);
        var w = wImg + 2 * margin;
        var h = hImg + 2 * margin;
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        if (scale === 1) {
            ctx.drawImage(img, margin, margin);
        } else {
            ctx.drawImage(img, margin, margin, wImg, hImg);
        }

        var imgData = ctx.getImageData(0, 0, w, h);
        var buf = imgData.data;

        return {
            data: imgData.data,
            w: w,
            h: h,
            tolerance: options.tolerance,
            scale: scale,
            margin: margin,
            weaklySimple: !!options.weaklySimple,
            backgroundColor: 0
        };
    }
}