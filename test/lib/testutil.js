'use strict';

require('../../build/codecab-' + process.env.npm_package_version);

window.expect = require('chai').expect;
window.sinon = require('sinon');


module.exports.delay = function(msec) {
    return new Promise(resolve => setTimeout(resolve, msec));
};

module.exports.getResourceUrl = function(relPath) {
    let m = document.location.href.match(/(file\:.*\/codecab\/)/);
    return m[1] + relPath;
};

module.exports.destroyAll = function() {
    try {
        let stage = CStage.get();
        if (stage) {
            let view = stage._app.view;
            stage.destroy();
            view.remove();
            PIXI.loader.reset();
        }
    } catch(e) {}
};

/**
 * Take a snapshot from the canvas and compare it with the last approved image.
 * When images are not the same, the new image is saved as '-new.png' and the function will return
 * false. As a result, the unit test should fail on that. To approve the new image value rename it to the old image.
 *
 * When images are identical (within a small anti aliasing margin), true is returned.
 *
 * @param testContext
 * @param relPath
 * @returns {boolean}
 */
module.exports.compareSnapshot = function(testContext, relPath) {
    const fs = require('fs');
    const path = require('path');
    const nativeImage = require('electron').nativeImage;

    let baseName = testContext.test.title;
    if (testContext.test.parent) {
        baseName = testContext.test.parent.title + ' ' + baseName;
    }
    baseName = baseName.replace(/\s/g, '-');

    let copyCanvas = document.createElement("canvas");
    let renderer = new PIXI.CanvasRenderer({
        width: CStage.get()._app.screen.width,
        height: CStage.get()._app.screen.height,
        autoResize: true,
        view: copyCanvas,
        transparent: true,
        clearBeforeRenderer: false
    });
    renderer.clear('white');
    CStage.get()._app.stage.renderCanvas(renderer);

    let baseDir = path.dirname(testContext.test.file);
    let filename = path.join(baseDir, 'results', baseName + '.png');
    let newFilename = path.join(baseDir, 'results', baseName + '-new.png');

    let oldImg;
    if (fs.existsSync(filename)) {
        let ni = nativeImage.createFromPath(filename);
        oldImg = {
            width: ni.getSize().width,
            height: ni.getSize().height,
            data: ni.getBitmap()
        };
    }

    let ni2 = nativeImage.createFromDataURL(copyCanvas.toDataURL('image/png'));
    let img = {
        width: ni2.getSize().width,
        height: ni2.getSize().height,
        data: ni2.getBitmap()
    };

    if (!oldImg || imgDiff(oldImg, img, null, 10) > 0) {
        fs.writeFileSync(newFilename, ni2.toPNG());
        return false;
    }
    return true;
};


/**
 * Absolute difference between bitmaps.
 *
 * @param img1 bitmap 1
 * @param img2 bitmap 2
 * @param diffImg Result bitmap for difference
 * @param tolerance {number} tolerance for difference
 * @returns {number} number of different bits
 */
function imgDiff(img1, img2, diffImg, tolerance) {
    var src = img1.data;
    var dest = img2.data;
    var w = diffImg ? diffImg.width : img1.width;
    var h = diffImg ? diffImg.height : img1.width;

    var diff = diffImg ? diffImg.data : null;
    var isDiff;
    var ov, nv, d = 0, cnt=0;
    for (var y = 0; y < h; y += 1) {
        for (var x = 0; x < w; x += 1) {
            var df = diffImg ? (4 * (diffImg.width * y + x)) : 0;
            if (x < img1.width && x < img2.width && y < img1.height && y < img2.height) {
                var sd = 4 * (img1.width * y + x);
                var d = 4 * (img2.width * y + x);
                for (var i = 0; i < 3; i += 1) {
                    ov = src[sd + i];
                    nv = dest[d + i];
                    isDiff = Math.abs(ov - nv) > tolerance;
                    if (isDiff) {
                        cnt += 1;
                    }
                    if (diff) diff[df + i] = isDiff ? 255 : 0;
                }
                if (diff) diff[df + 3] = src[sd + 3];
            } else if (diff) {
                diff[df + 0] = 255;
                diff[df + 1] = 255;
                diff[df + 2] = 255;
                diff[df + 3] = 255;
            }
        }
    }
    return cnt;
}