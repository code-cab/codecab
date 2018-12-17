//import * as PIXI from '../../lib/es6/pixi.js/index';
import * as PIXI from 'pixi.js';
import TracerWorkers from '../tracer/TracerWorkers';
// import CStage from '../CStage';
import WebFont from 'webfontloader';
import {ASSERT} from '../misc/util';
/**
 * Load and trace resources. Can be used before or after start.
 * When CodeCab is not yet started, the 'onStart' event will wait until all sources are loaded
 * Once started the 'onStart' event will not occur
 * Callback is always called when the resource is loaded and traced.
 *
 * @type {PIXI.loader.Loader}
 */
var assetLoader = PIXI.loader;

var loadingDone = false;
var started = false;
var loaderRequestPending = false;
var loadingResources = [];
var duplicateCalbacks = {};
var resourceOptions = {};

const WEBFONT_ORIGINS = ['google'];
let webfontConfig = {};
TracerWorkers.startWorkers();



function loadAndTraceResource(resourceName, resourceUrl, options) {
    return new Promise(function (resolve, reject) {
        if (loadingDone && assetLoader.resources[resourceName] && assetLoader.resources[resourceName].isComplete) {
            resolve(assetLoader.resources[resourceName]);
        }

        if (loadingResources.indexOf(resourceName) >= 0) {
            if (!duplicateCalbacks[resourceName]) {
                duplicateCalbacks[resourceName] = [];
            }
            duplicateCalbacks[resourceName].push(resolve);
            return;
        }

        loadingResources.push(resourceName);

        let fullUrl = resourceUrl || resourceName;
        if (fullUrl.indexOf('://') < 0 && typeof CODECAB_URL_PREFIX !== 'undefined') {
            fullUrl = CODECAB_URL_PREFIX;
        }

        // Save options for later to be used in Trace filter
        if (options) resourceOptions[resourceName] = options;
        assetLoader.add(resourceName, fullUrl, {crossOrigin: true}, (resource) => {
            resolve(resource);
            duplicateCalbacks[resourceName] && duplicateCalbacks[resourceName].forEach((cb) => cb(resource));
            delete duplicateCalbacks[resourceName];
        });

        if (!loaderRequestPending && started) {
            loaderRequestPending = true;
            setTimeout(function () {
                assetLoader.load();
            }, 0);
        }
    });
}

function init(stage, callback) {
    if (started || loadingDone) {
        console.warn("CStage has already been started");
        setTimeout(function() {
            if (callback) {
                callback.call(stage);
            }
        });
        return;
    }
    assetLoader.use(function(resource, next) {
        let texture = PIXI.utils.TextureCache[resource.name];
        let options = resourceOptions[resource.name] || {};
        let baseTexture = texture.baseTexture;
        if (baseTexture && baseTexture.source) {
            options.tolerance = options.tolerance || 1.5;
            options.limitSize = options.limitSize || 1000 * 1000;
            options.noHoles = true;
            let imgData = TracerWorkers.getImageData(baseTexture.source, options);
            if (imgData) {
                imgData.backgroundColor = 0.5;
                imgData.options = options;
                TracerWorkers.traceAndConvexify(imgData, (err, arrayOfVertices) => {
                    if (err) {
                        console.warn(err);
                    }
                    if (arrayOfVertices) {
                        baseTexture.arrayOfVertices = arrayOfVertices;
                    }
                    next();
                });
            } else {
                next();
            }
        } else {
            next();
        }
    });
    assetLoader.on('error', function(error, loader, resource) {
       error.message = 'Unable to load resource: ' + resource.name;
       throw error;
    });
    assetLoader.on('progress', function() {
//        checkInitState.call(self, 'progress');
    });
    assetLoader.on('complete', function() {
        loaderRequestPending = false;
        //debugger;
//        checkInitState.call(self, 'complete');
    });

    //assetLoader.on('complete' AssetLoaded(function() {
    //    waitForFirstTimeUpdateAndLoadingSprites.call(self);
    //}));
//    TracerWorkers.startWorkers();
    assetLoader.load(() => {
        loadingDone = true;
        // Check if webfonts may be loaded
        doLoadWebFont(() => {
            callback && callback();
        });
    });
    // One extra in case there is nothing to load
    // setTimeout(function() {
    //     checkInitState.call(self, 'update');
    // }, 0);
    //} else {
    //    window.setTimeout(function() {
    //        waitForFirstTimeUpdateAndLoadingSprites.call(self);
    //    }, 0);
    //}
    started = true;
}

function checkInitState(event) {
    var resourceName;
    var resource;
    var imgData;
    var self = this;
    if (this._priv.running) {
        // Already running ignore extra event.
        return;
    }
    if (this.options.noTrace || (traceTextures() && assetLoader._numToLoad === 0)) {
        run.call(this);
    } else {
        // Just to be sure
        setTimeout(function() {
            checkInitState.call(self, 'repeat');
        }, 100);
    }
}

function getResource(resourceUrl) {
    return assetLoader.resources[resourceUrl];
}


function doLoadWebFont(cb) {
    if (Object.keys(webfontConfig).length === 0) {
        cb();
    } else {
        webfontConfig.active = function() {
            cb();
        };
        webfontConfig.inactive = function() {
            console.error("Unable to load webfonts");
            cb();
        };
        WebFont.load(webfontConfig);
    }
}

function loadWebFont(origin, family) {
    ASSERT.isOneOf(WEBFONT_ORIGINS, origin, 'origin');
    if (started || loadingDone) {
        throw new Error("CStage.loadWebFont can only be used before starting");
    }
    if (origin === 'google') {
        if (!webfontConfig.google) {
            webfontConfig.google = {
                families: []
            }
        }
        webfontConfig.google.families.push(family);
    }
}

export {
    loadAndTraceResource,
    loadWebFont,
    init,
    getResource
}