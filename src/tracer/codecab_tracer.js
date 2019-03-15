"use strict";
let earcut = require('earcut');


/*
 Copyright (c) 2015, Krijgsman Automatisering
 www.codecab.com

 Permission to use, copy, modify, and/or distribute this software for any purpose
 with or without fee is hereby granted, provided that the above copyright notice
 and this permission notice appear in all copies.

 THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
 OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
 TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
 THIS SOFTWARE.
 */

var START = 255;
var TRACED = 254;
var IGNORED = 253;
var INTERSECTION = 0x08;

const SHAPE_CIRCLE = -1;

//
//  +---+---+---+
//  | 1 | 0 | 7 |
//  +---+---+---+
//  | 2 | P | 6 |
//  +---+---+---+
//  | 3 | 4 | 5 |
//  +---+---+---+
var DIRS = [[0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1]];

export function traceAndConvexify(imgData) {
    imgData.data = createMask(imgData);
    var polys;
    //TEST
    showTracedImage(imgData, polys, 5);
    var s;
    s = new Date().getTime();
    //_TEST

    avoidSinglePixels(imgData);

    //TEST
    if (typeof document !== 'undefined') console.log('avoidSinglePixels took ' + (new Date().getTime() - s) + ' msec');
    showTracedImage(imgData, polys, 5);
    s = new Date().getTime();
    //_TEST

    var polys = traceImage(imgData);

    //TEST
    if (typeof document !== 'undefined') console.log('traceImage took ' + (new Date().getTime() - s) + ' msec');
    showTracedImage(imgData, polys, 5);
    s = new Date().getTime();
    //_TEST

    polys = simplify(imgData, polys);

    //TEST
    if (typeof document !== 'undefined') console.log('simplify took ' + (new Date().getTime() - s) + ' msec');
    showSimplified(imgData, polys, 4);
    s = new Date().getTime();
    //_TEST

    polys = triangulate(polys);

    //TEST
    if (typeof document !== 'undefined') console.log('triangulate took ' + (new Date().getTime() - s) + ' msec');
    showVertices(polys, imgData.w, imgData.h, 4);
    s = new Date().getTime();
    //_TEST

    var shapes = trianglesToConvex(polys);
    //TEST
    if (typeof document !== 'undefined') console.log('trianglesToConvex took ' + (new Date().getTime() - s) + ' msec');
    showConvex(shapes, imgData.w, imgData.h, 4);
    s = new Date().getTime();
    //_TEST

    return [convexToArray(shapes, -imgData.margin - 0.5)];
}

function hex2rgb(hex) {
    return [(hex >> 16 & 0xff) / 255, ( hex >> 8 & 0xff) / 255, (hex & 0xff) / 255];
}

// Create a mask
export function createMask(imgData) {
    var w = imgData.w,
        h = imgData.h,
        data = imgData.data,
        // Reuse data buffer to avoid extra memory allocation
        // Setting mask value replaces the original image pixel which we don't need
        // anymore
        mask = new Uint32Array(data.buffer),
        i;
    if (typeof imgData.backgroundColor === 'number') {
        var alpha = imgData.backgroundColor * 256;
        for (i = 0; i < w * h; i += 1) {
            mask[i] = data[i * 4 + 3] > alpha ? 1 : 0;
        }
    } else {
        var c = hex2rgb(imgData.backgroundColor);
        for (i = 0; i < w * h; i += 1) {
            if (data[i * 4] === c[0] &&
                data[i * 4 + 1] === c[1] &&
                data[i * 4 + 2] === c[2]) {
                mask[i] = 1;
            } else mask[i] = 0; // auto set by Uint8Array but just to be sure
        }
    }
    return mask;
}

// Trace routine won't work on some single pixel patterns.
// This function will avoid them by adding an extra pixel.
export function avoidSinglePixels(imgData) {
    var reset = [];
    var i,
        w = imgData.w,
        h = imgData.h,
        lth = imgData.w * imgData.h,
        data = imgData.data;
    for (i = 0; i < lth - w - 1; i += 1) {
        if (data[i] === 1) {
            if (!data[i + 1]) {
                data[i + 1] = 2;
                reset.push(i + 1);
            }
            if (!data[i + w]) {
                data[i + w] = 2;
                reset.push(i + w);
            }
            if (!data[i + w + 1]) {
                data[i + w + 1] = 2;
                reset.push(i + w + 1);
            }
        }
    }

    function checkDiagonal(j) {
        if (!data[j] && !data[j + w + 1] && data[j + 1] && data[j + w]) {
            data[j] = 1;
            checkDiagonal(j - w - 1);
            checkDiagonal(j - w);
            checkDiagonal(j - w + 1);
        }
        if (data[j] && data[j + w + 1] && !data[j + 1] && !data[j + w]) {
            data[j + 1] = 1;
            checkDiagonal(j - w - 1);
            checkDiagonal(j - w);
            checkDiagonal(j - w + 1);
        }
    }

    for (i = w + 1; i < lth - w - 1; i += 1) {
        checkDiagonal(i);
    }
    for (i = 0; i < reset.length; i++) {
        data[reset[i]] = 1;
    }
}

// Find edge and follow it until the start is found
// Edge from 0 -> 1 is outer line, from 1 -> 0 is inner hole
// Traced pixels are marked to avoid double tracing
// When a hole is found we can easily create a weakly simple polygon
// by looking to the left until its outer edge is found. That is always
// the corresponding outer edge.
// When the weakly simple polygon option is set the polygons are combined
// and joined by an intersection line. The knowledge of an intersection
// point here is very useful to create better simplified polys in the next
// step.
export function traceImage(imgData) {
    var i,
        w = imgData.w,
        h = imgData.h,
        lth = imgData.w * imgData.h,
        data = imgData.data,
        polys = [],
        poly, p, prev = 0,
        intersection,
        index = 0,
        weaklySimple = imgData.weaklySimple;

    for (i = w + 1; i < lth - w - 1; i += 1) {
        p = data[i];
        if (p === 1 && prev === 0) {
            // Outer line
            poly = followEdge(data, i, w, true, index);
            if (poly) {
                polys.push({
                    outer: poly,
                    inners: []
                });
                index++;
            }
        } else if (p === 0 && prev === 1) {
            poly = followEdge(data, i - 1, w, false, index);
            if (poly) {
                intersection = mergeInnerPoly(data, polys, poly, i - 1, w, weaklySimple);
                if (!weaklySimple) {
                    polys[intersection.otherIndex].inners.push(poly);
                }
            }
        }
        prev = p;
    }

    // Remove inners when needed
    if (imgData.options.noHoles) {
        for (i = 0; i < polys.length; i += 1) {
            polys[i].inners = [];
        }
    }
    return polys;
}

//Follow the edge by looking counterclockwise in 8 directions.
//That way we should always meet our start point again

function followEdge(data, offset, width, isOuter, index) {
    var poly = [],
        xs = offset % width,
        ys = Math.floor(offset / width),
        x = xs,
        xn,
        y = ys,
        yn,
        dir = (isOuter ? 3 : 6),
        d,
        p,
        lth = 0,
        maxPoints = 10000000, // Avoid endless loops
        i,
        vec;

    data[x + y * width] = START;
    while (lth++ < maxPoints) {
        for (i = 0; i <= 8; i++) {
            if (i === 8) {
                // Tried all directions, must be a single pixel
                if (!poly.length) {
                    // Ignore single pixel
                    data[x + y * width] = IGNORED;
                    return null;
                }
                throw new Error("Cannot findnext point at " + xs + ", " + ys);
            }
            d = (dir + i) % 8;
            vec = DIRS[d];
            xn = x + vec[0];
            yn = y + vec[1];
            p = data[xn + yn * width];
            if (p === 0) continue;
            x = xn;
            y = yn;
            poly.push(x, y, d);
            data[x + y * width] = (TRACED | (index << 8));
            if (p === START) {
                // Poly must at least contain 3 points (triangle)
                if (poly.length > 2 * 3) {
                    // Add start point
                    poly.push(poly[0], poly[1], poly[3]);
                    return poly;
                }
                // Ignore next time (too short)
                while (poly.length) {
                    data[poly[0] + width * poly[1]] = IGNORED;
                    poly.shift();
                    poly.shift();
                    poly.shift();
                }
                return null;
            }
            dir = (d + 8 - 3) % 8;
            // continue with next point
            break;
        }
    }
    throw new Error("Tracing error. Found endless loop at " + xs + ", " + ys);
}

function mergeInnerPoly(data, polys, inner, offset, width, weaklySimple) {
    var x = offset % width;
    var y = Math.trunc(offset / width);
    for (var xo = x - 1; xo > 0; xo--) {
        var o = xo + y * width;
        if (data[o] >= TRACED) {
            var intersection = findIntersection(data, width, polys, xo, y, true, weaklySimple);
            if (intersection) {
                // Mark innerline pixels to this otherPoly
                var otherPoly = polys[intersection.otherIndex].outer;
                for (var i2 = 0; i2 < inner.length; i2 += 3) {
                    data[inner[i2] + width * inner[i2 + 1]] &= 0x0ff;
                    data[inner[i2] + width * inner[i2 + 1]] |= (intersection.otherIndex << 8);
                }
                if (weaklySimple) {
                    var cutPoint = intersection.pointIndex;
                    // Skip left vectors
                    while (cutPoint > 6 && otherPoly[cutPoint + 2 - 3] === 2) {
                        cutPoint -= 3;
                    }
                    var startPoly = otherPoly.slice(0, cutPoint);

                    var endPoly = otherPoly.slice(intersection.pointIndex - 3);
                    endPoly[1] += 0.2;
                    endPoly[2] = 8 + 2; // special vector avoids optimalisation here
                    inner[inner.length - 2] += 0.2;
                    inner[2] = 8 + 6; // special vector avoids optimalisation here
                    otherPoly = startPoly.concat(inner.concat(endPoly));
                    polys[intersection.otherIndex].outer = otherPoly;
                }
                return intersection;
            }
        }
    }
    throw new Error("Outer edge not found");
}

function findIntersection(data, width, polys, x, y, isDownwards, weaklySimple) {
    var offset = x + y * width;
    var otherIndex = data[offset] >> 8;
    if (otherIndex === polys.length) {
        // Found our own innerline. Ignore
        return;
    }
    if (otherIndex >= polys.length) throw new Error("Invalid offset");
    var otherPoly = polys[otherIndex].outer;
    var intersection = findIntersectionOnLine(x, y, otherIndex, otherPoly, isDownwards);
    if (intersection) {
        return intersection;
    }
    for (var h = 0; h < polys[otherIndex].inners.length; h++) {
        intersection = findIntersectionOnLine(x, y, otherIndex, polys[otherIndex].inners[h], isDownwards);
        if (intersection) {
            return intersection;
        }
    }
}

function findIntersectionOnLine(x, y, otherIndex, otherPoly, isDownwards) {

    // Find point on other poly
    var dirs = isDownwards ? [3, 4, 5] : [0, 2, 1, 6, 7];
    for (var i = 0; i < otherPoly.length; i += 3) {
        if (otherPoly[i] === x && otherPoly[i + 1] === y && dirs.indexOf(otherPoly[i + 2]) >= 0) {
            return {
                otherIndex: otherIndex,
                pointIndex: i,
                isDownwards: isDownwards
            };
        }
    }
}


// Simplify creates a raster 2x2 times larger than the image.
// Then draw the small poly lines with a 'slope' around it. Slope width is
// the tolerance value for simplification. This means that as long as we
// can draw a straight line between vertices while stayin 'on the slope'
// the line is within the tolerance value:
//
//          X          X   X      X
//
//          _          _   _      _
//         _ _        _ _ _ _    _ _
//        _   _      _   _   _  _   _
//       _     _    _         __     _
//   ____       ____                  _
//
// In the next step all 'valley points' are detected and set to 0.
//
//          X          X   X      X
//
//          _          _   _      _
//         _ _        _ _ _ _    _ _
//        _   _      _       _  _   _
//       _     _    _          _     _
//   ____       ____     _    _       _
//                       0    0
//
// With this raster the simlified lines can be found by connecting
// vertrices as long as the straight line between de vertices do
// not cross '0' values. This will guarantee that simplified lines
// will never overlap.
// For speed optimalization we use bisecting steps (start with 32 or max
// half the total poly length).
// F.e. when the largest fitting line length is 43 the following lengths
// will be tested: 32, 64, 48, 40, 44, 42, 43
export function simplify(imgData, polys) {
    var z = imgData.simplifyZoom = 2;
    var s = new Date().getTime();
    var lw = imgData.w * z;
    var lh = imgData.h * z;
    var deltas = imgData.tolerance * z;
    // Reuse array
    var lb = new Uint8Array(imgData.data.buffer);
    imgData.data = lb;
    var x, y, d;
    var i;
    for (i = 0; i < lb.length; i++) {
        lb[i] = 0;
    }
    var l, poly, h;
    var x0, y0, x1, y1;
    var weaklySimple = imgData.weaklySimple;
    var tolerance = Math.round(imgData.tolerance * z);
    var mask = new Array(tolerance);
    for (x = 0; x < tolerance; x++) {
        mask[x] = new Array(tolerance);
        for (y = 0; y < tolerance; y++) {
            d = Math.sqrt(x * x + y * y);
            mask[x][y] = 255 - Math.floor(256 / tolerance) * d;
        }
    }

    function setPoint(_x, _y) {
        for (var mx = 0; mx < mask.length; mx++) {
            for (var my = 0; my < mask.length; my++) {
                if (mask[mx][my] > lb[_x + mx + (_y + my) * lw]) {
                    lb[_x + mx + (_y + my) * lw] = mask[mx][my];
                }
                if (mask[mx][my] > lb[_x - mx + (_y + my) * lw]) {
                    lb[_x - mx + (_y + my) * lw] = mask[mx][my];
                }
                if (mask[mx][my] > lb[_x + mx + (_y - my) * lw]) {
                    lb[_x + mx + (_y - my) * lw] = mask[mx][my];
                }
                if (mask[mx][my] > lb[_x - mx + (_y - my) * lw]) {
                    lb[_x - mx + (_y - my) * lw] = mask[mx][my];
                }
            }
        }
        return true;
    }

    for (l = 0; l < polys.length; l++) {
        poly = polys[l].outer;
        for (i = 3; i < poly.length; i += 3) {
            x0 = poly[i - 3] * z;
            y0 = poly[i - 2] * z;
            x1 = poly[i] * z;
            y1 = poly[i + 1] * z;
            calcLine(x0, y0, x1, y1, setPoint);
        }
        if (!weaklySimple) {
            for (h = 0; h < polys[l].inners.length; h++) {
                poly = polys[l].inners[h];
                for (i = 3; i < poly.length; i += 3) {
                    x0 = poly[i - 3] * z;
                    y0 = poly[i - 2] * z;
                    x1 = poly[i] * z;
                    y1 = poly[i + 1] * z;
                    calcLine(x0, y0, x1, y1, setPoint);
                }
            }
        }
    }

    var offset, v;

    // find lowest points and set them to 0
    for (offset = lw * 2 + 2; offset < lb.length - 1 - lw; offset += 1) {
        v = lb[offset];
        if ((lb[offset - 1] > v || lb[offset - 2] > v) && lb[offset + 1] > v) {
            lb[offset] = 0;
        }
        if ((lb[offset - lw] > v || lb[offset - lw - lw] > v) && lb[offset + lw] > v) {
            lb[offset] = 0;
        }
        if ((lb[offset - lw - 1] > v || lb[offset - lw - lw - 2] > v) && lb[offset + lw + 1] > v) {
            lb[offset] = 0;
        }
        if ((lb[offset - lw + 1] > v || lb[offset - lw - lw + 2] > v) && lb[offset + lw - 1] > v) {
            lb[offset] = 0;
        }
    }

    if (!weaklySimple) {
        for (l = 0; l < polys.length; l++) {
            polys[l].outer = simplifySegment(lb, lw, z, polys[l].outer, weaklySimple);
            for (h = 0; h < polys[l].inners.length; h++) {
                polys[l].inners[h] = simplifySegment(lb, lw, z, polys[l].inners[h], weaklySimple);
            }
        }
    } else {
        // find simplified polys
        var i0, i1, newPoly, subPoly;
        for (l = 0; l < polys.length; l++) {
            poly = polys[l].outer;
            // Move first point to end of point. Results in better horizontal/vertical poly recognition
            //
            poly.shift();
            poly.shift();
            poly.shift();
            poly.push(poly[0]);
            poly.push(poly[1]);
            poly.push(poly[2]);
            newPoly = [];
            i0 = 0;
            i1 = 3;
            while (i1 < poly.length) {
                // Check intersection
                if (poly[i1 + 2] & 8) {
                    // Intersection where i1 points to other side. Simplify segment to maintain correct intersection
                    // polys and to avoid overlap
                    subPoly = simplifySegment(lb, lw, z, poly.slice(i0, i1), weaklySimple);
                    newPoly = newPoly.concat(subPoly);
                    newPoly.push(poly[i1]);
                    newPoly.push(poly[i1 + 1]);
                    i0 = i1;
                }
                i1 += 3;
            }
            subPoly = simplifySegment(lb, lw, z, poly.slice(i0, i1 + 3, weaklySimple))
            newPoly = newPoly.concat(subPoly);
            polys[l].outer = newPoly;
        }

    }

    return polys;
}

function simplifySegment(lb, lw, z, poly, weaklySimple) {
    var valid,
        i0,
        i1,
        iprev,
        np,
        o,
        olimit,
        srange = 32,
        s0,
        s1,
        savg,
        pt, l,
        prevLength = 100;

    function checkPoint(x, y) {
        //console.log('pt ' + x + ', ' + y + ' -> ' + lb[x + y * lw]);
        return lb[x + y * lw] > 0;
    }

    function checkLineSegment(_x1, _y1, _x2, _y2) {
        // Invalid points are statistically mostly at the end of a line. So we draw the line backwards
        var _result = calcLine(_x2 * z, _y2 * z, _x1 * z, _y1 * z, checkPoint);
        // console.log('check result ' + _result);
        return _result;
    }

    function checkLine(_i0, _i1) {
        // console.log('check ' + _i0 + ' ' + _i1);
        if (_i1 >= poly.length - 1) {
            return false;
        }
        return checkLineSegment(poly[_i0], poly[_i0 + 1], poly[_i1], poly[_i1 + 1]);
    }

    if (!weaklySimple) {
        // Move first point to end of point. Results in better horizontal/vertical line recognition
        //poly.push(poly.shift(), poly.shift(), poly.shift());
        poly.shift();
        poly.shift();
        poly.shift();
        poly.push(poly[0], poly[1], poly[2]);
    }

    np = [poly[0], poly[1]];
    i0 = 0;
    // s2 may not exceed 1/4 of poly length. Otherwise we may go in the wrong direction
    while (srange > 2 && srange > (poly.length / 3) / 4) {
        srange /= 2;
    }

    while (i0 < poly.length - 3) {

        // Find part where s2 is too long
        s0 = 0;
        s1 = srange;
        while (checkLine(i0, i0 + (s1 * 3))) {
            s0 = s1;
            s1 += srange;
        }

        do {
            //console.log('> ' + s0 + ' ' + s1);
            savg = Math.round((s0 + s1) / 2);
            if (checkLine(i0, i0 + (savg * 3))) {
                s0 = savg;
            } else {
                s1 = savg;
            }
        } while (s1 - s0 > 1);
        i1 = i0 + s0 * 3;
        // look till 4 points back but until leave at 3 points in the poly
        olimit = Math.max(i1 - 6 * 3, i0 + 3 * 3);
        for (o = i1; o > olimit; o -= 3) {
            // check if i0.x === o.x or i0.y == o.y
            if (poly[i0] === poly[o] || poly[i0 + 1] === poly[o + 1]) {
                i1 = o;
                break;
            }
        }

        if (prevLength < 4 && np.length >= 6) {
            // Previous was small segment. Check if it can be removed by joining the lines before and after
            l = np.length;
            pt = getSegmentIntersectionPoint(
                np[l - 6], np[l - 5], np[l - 4], np[l - 3],
                np[l - 2], np[l - 1], poly[i1], poly[i1 + 1],
                Math.PI / 4);
            if (pt &&
                checkLineSegment(np[l - 6], np[l - 5], pt[0], pt[1]) &&
                checkLineSegment(pt[0], pt[1], poly[i1], poly[i1 + 1])) {
                np[np.length - 4] = pt[0];
                np[np.length - 3] = pt[1];
                np.pop();
                np.pop();
            }
        }
//                console.log('push ' + i0 + ' -> ' + i1);
        np.push(poly[i1], poly[i1 + 1]);
        prevLength = (i1 - i0) / 3;
        i0 = i1;
    }

    if (prevLength < 4 && np.length >= 8) {
        // Previous was small segment. Check if it can be removed by joining the lines before and after
        l = np.length;
        pt = getSegmentIntersectionPoint(
            np[l - 6], np[l - 5], np[l - 4], np[l - 3],
            np[l - 2], np[l - 1], np[2], np[3],
            Math.PI / 4);
        if (pt &&
            np[0] === np[l - 2] && np[1] === np[l - 1] &&
            checkLineSegment(np[l - 6], np[l - 5], pt[0], pt[1]) &&
            checkLineSegment(pt[0], pt[1], np[2], np[3])) {
            np[0] = pt[0];
            np[1] = pt[1];
            np[np.length - 4] = pt[0];
            np[np.length - 3] = pt[1];
            np.pop();
            np.pop();
        }
    }
    //i1 -= 3;
    //if (i1 > i0) {
    //    np.push(poly[i1], poly[i1 + 1]);
    //}
    if (np.length <= 2 * 2) {
        np = [];
    }
    return np;
}

function getSegmentIntersectionPoint(xs1, ys1, xe1, ye1, xs2, ys2, xe2, ye2, minAngle) {
    var dx1 = xe1 - xs1;
    var dy1 = ye1 - ys1;
    var dx2 = xe2 - xs2;
    var dy2 = ye2 - ys2;
    var angle1 = Math.atan2(dy1, dx1);
    var angle2 = Math.atan2(dy2, dy1);
    var angle = Math.abs(angle1 - angle2);
    if (angle > Math.PI) {
        angle -= Math.PI;
    }
    if (angle < minAngle) {
        return null;
    }
    var d = (dy2 * dx1) - (dx2 * dy1);
    if (!d) {
        return null;
    }
    var a = ys1 - ys2;
    var b = xs1 - xs2;
    var n1 = dx2 * a - dy2 * b;
    var n2 = dx1 * a - dy1 * b;
    a = n1 / d;
    b = n2 / d;
    return [xs1 + a * dx1, ys1 + a * dy1];
}

// Bresenham algorithm for drawwing straight lines
function calcLine(x0, y0, x1, y1, handler) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    var dx = x1 - x0;
    var dy = y1 - y0;
    var declive = false, simetrico = false;
    var temp;


    if (dx * dy < 0) {
        y0 = -y0;
        y1 = -y1;
        dy = -dy;
        simetrico = true;
    }

    if (Math.abs(dx) < Math.abs(dy)) {
        temp = dx;
        dx = dy;
        dy = temp;

        temp = x0;
        x0 = y0;
        y0 = temp;

        temp = x1;
        x1 = y1;
        y1 = temp;

        declive = true;
    }

    if (x0 > x1) {
        temp = x0;
        x0 = x1;
        x1 = temp;

        temp = y0;
        y0 = y1;
        y1 = temp;

        dx = -dx;
        dy = -dy;
    }

    var d = 2 * dy - dx;
    var incE = 2 * dy;
    var incNE = 2 * (dy - dx);


    var px, py, y = y0;
    for (var x = x0; x <= x1; x++) {
        if (declive) {
            px = y;
            py = x;
        } else {
            px = x;
            py = y;
        }

        if (simetrico) {
            py = -py;
        }

        if (!handler(px, py)) {
            return false;
        }

        if (d <= 0) {
            d += incE;
        } else {
            d += incNE;
            y++;
        }
    }
    return true;
}


export function triangulate(polys) {
    // Reorder poygons for earcut
    var newPolys = [];
    var l, poly, polyAll, innerIndices, h, inner;
    for (l = 0; l < polys.length; l++) {
        poly = polys[l];
        innerIndices = [];
        polyAll = poly.outer;
        for (h = 0; h < poly.inners.length; h++) {
            inner = poly.inners[h];
            if (inner.length) {
                innerIndices.push(polyAll.length / 2);
                polyAll = polyAll.concat(inner);
            }
        }
        newPolys.push({
            poly: polyAll,
            vertices: earcut(polyAll, innerIndices)
        });
    }
    return newPolys;
}

var PolyLine = function () {
    this.id = PolyLine.ID++;
};
PolyLine.ID = 1;
PolyLine.prototype = {
    id: 0,
    vectices: null
};

var Vertrice = function (x, y, poly) {
    this.id = Vertrice.ID++;
    this.x = x;
    this.y = y;
    this.next = this;
    this.prev = this;
    this.poly = poly;
};
Vertrice.ID = 1;
Vertrice.prototype = {
    id: 0,
    x: 0.0,
    y: 0.0,
    next: null,
    prev: null,
    poly: null,
    append: function (v) {
        this.prev.next = v;
        v.prev = this.prev;
        this.prev = v;
        v.next = this;
        v.poly = this.poly;
    }
};


function sortVectors(vects) {
    var sortedVectors = {};
    for (var i = 0; i < vects.length; i++) {
        var v = vects[i];
        do {
            v.poly.used = false;
            v.first = false;
            var key = v.x.toString();
            if (!sortedVectors.hasOwnProperty(key)) {
                sortedVectors[key] = [v];
            } else {
                sortedVectors[key].push(v);
            }
            v = v.next;
        } while (v != vects[i]);
    }
    return sortedVectors;
}

/**
 *  Return true if corner to the right
 * @param p0
 * @param p1
 */
function isClockwise(p0, p1, p2) {
    var ax = p2.x - p1.x;
    var ay = p2.y - p1.y;
    var bx = p1.x - p0.x;
    var by = p1.y - p0.y;
    return (by * ax - bx * ay) < -0.1; // Do not use 0 here, use some margin for rounding errors
}


function findNextTriangle(sortedVects, vects) {
    var v = vects;
    do {
        var xpoints = sortedVects[v.x.toString()];
        for (var i = 0; i < xpoints.length; i++) {
            var v1 = xpoints[i];
            if (!v1.poly.used &&
                v.poly !== v1.poly &&
                v.x === v1.x &&
                v.y === v1.y) {
                if (v.prev.x === v1.next.x &&
                    v.prev.y === v1.next.y) {
                    // check if convex for both gluepoints
                    if (isClockwise(v1.prev, v, v.next) &&
                        isClockwise(v.prev.prev, v.prev, v1.next.next)) {
                        v1.poly.used = true;
                        var va = v.prev;
                        var v1a = v1.next;
                        v1a.next.prev = va;
                        va.next = v1a.next;
                        v1.prev.next = v;
                        v.prev = v1.prev;
                        findNextTriangle(sortedVects, v);
                    }
                } else
                if (v.next.x === v1.prev.x &&
                    v.next.y === v1.prev.y) {
                    if (isClockwise(v.prev, v, v1.next) &&
                        isClockwise(v1.prev.prev, v1.prev, v.next.next)) {
                        v1.poly.used = true;
                        var va = v.next;
                        var v1a = v1.prev;
                        v1a.prev.next = va;
                        va.prev = v1a.prev;
                        v1.next.prev = v;
                        v.next = v1.next;
                        findNextTriangle(sortedVects, v);
                    }

                }
            }
        }
        v = v.next;
    } while (!v.first);
}

function findConvex(sortedVects) {
    var convexList = [];

    for (var key in sortedVects) {
        var xpoints = sortedVects[key];

        for (var i = 0; i < xpoints.length; i++) {
            var v = xpoints[i];
            if (v.poly.used) {
                continue;
            }
            // Start new Convex
            convexList.push(v);
            v.poly.used = true;
            v.first = true;
            // Find matching edge
            findNextTriangle(sortedVects, v);
        }
    }
    return convexList;
}

function makeClockwise(vect) {
    var v = vect;
    var sum = 0.0;
    do {
        sum += (v.next.x - v.x) * (v.next.y + v.y);
        v = v.next;
    } while (v != vect);
    // when sum < 0 it is counterclockwise. But y-axis points downwards so mirrored makes it clockwise
    if (sum > 0) {
        // counterclockwise: turn around
        v = vect;
        var v2 = new Vertrice(v.x, v.y, v.poly);
        do {
            v2.append(new Vertrice(v.prev.x, v.prev.y, v.prev.poly));
            v = v.prev;
        } while (v != vect);
        return v2;
    }
    return vect;
}

// Try to make convex polylines from triangles by merging triangles as long
// as it stays a convex. Optimized by sorting all vertices by its x-coordinate.
// Internally a vertrice linked list is used.
export function trianglesToConvex(triangles) {
    var shapes = [];
    for (var l = 0; l < triangles.length; l++) {
        var line = triangles[l].poly;
        var vertices = [];
        var v = triangles[l].vertices;
        for (var i = 0; i < v.length; i += 3) {
            var poly = new PolyLine();
            poly.vertices = new Vertrice(line[v[i] * 2], line[v[i] * 2 + 1], poly);
            poly.vertices.append(new Vertrice(line[v[i + 1] * 2], line[v[i + 1] * 2 + 1]));
            poly.vertices.append(new Vertrice(line[v[i + 2] * 2], line[v[i + 2] * 2 + 1]));
            poly.vertices = makeClockwise(poly.vertices);
            vertices.push(poly.vertices);
        }
        var sortedVects = sortVectors(vertices);
        var convexList = findConvex(sortedVects);

        shapes.push(convexList);
    }
    return shapes;
}

export function convexToArray(convexLists, offset) {
    var i, l, convexList, index, v, array,
        verticesLengthPos, shapeCount;

    index = 1; // first position is for shape count
    for (l = 0; l < convexLists.length; l++) {
        convexList = convexLists[l];
        for (i = 0; i < convexList.length; i++) {
            v = convexList[i];
            if (v.circleRadius !== undefined) {
                index += 4; // type, x, y, and radius
            } else {
                index++; // position for vertices length
                do {
                    index += 2; // x and y position

                    v = v.next;
                } while (v != convexList[i]);
            }
        }
    }

    array = new Float32Array(index);
    index = 1;
    shapeCount = 0;
    for (l = 0; l < convexLists.length; l++) {
        convexList = convexLists[l];
        for (i = 0; i < convexList.length; i++) {
            verticesLengthPos = index++;
            v = convexList[i];
            if (v.circleRadius !== undefined) {
                array[index++] = v.x + offset;
                array[index++] = v.y + offset;
                array[index++] = v.circleRadius;
                array[verticesLengthPos] = SHAPE_CIRCLE;
            } else {
                do {
                    array[index++] = v.x + offset;
                    array[index++] = v.y + offset;
                    v = v.next;
                } while (v != convexList[i]);
                array[verticesLengthPos] = (index - verticesLengthPos - 1) / 2;
            }
            shapeCount += 1;
        }
    }
    array[0] = shapeCount;
    return array;
}

//TEST
export function showTracedImage(imgData, polys, zoom) {
    if (typeof document === 'undefined') return;
    
    var z = zoom || 5;
    var zl = z;
    var step = 3;

    var canvas = document.createElement('canvas');
    canvas.width = imgData.w * z;
    canvas.height = imgData.h * z;
    var ctx = canvas.getContext('2d');
    var x,
        y,
        p,
        i;
    ctx.fillStyle = 'rgba(0, 0, 128, 0.3)';
    for (x = 0; x < imgData.w; x++) {
        for (y = 0; y < imgData.h; y++) {
            p = imgData.data[x + imgData.w * y];
            if (p & 0xff) {
                ctx.fillRect(x * z, y * z, z, z);
            }
        }
    }

    function drawLine(poly) {
        var isFirst = true;
        ctx.beginPath();
        for (var l2 = 0; l2 < poly.length; l2 += step) {
            x = (poly[l2] + 0.5) * zl;
            y = (poly[l2 + 1] + 0.5) * zl;
            if (isFirst) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            isFirst = false;
        }
        ctx.fill();
        ctx.stroke();
    }

    if (polys) {
        ctx.strokeStyle = 'blue';
        ctx.fillStyle = 'rgba(255, 0, 0, 0)';

        for (var l1 = 0; l1 < polys.length; l1++) {
            var poly = polys[l1];
            if (poly.hasOwnProperty('outer')) {
                drawLine(poly.outer);
                for (var h = 0; h < poly.inners.length; h++) {
                    drawLine(poly.inners[h]);
                }
            } else {
                drawLine(poly);
            }
        }
    }
    document.body.appendChild(canvas);
}

export function showSimplified(imgData, polys, zoom) {
    if (typeof document === 'undefined') return;
    var z = (zoom || 1);
    var zl = z * imgData.simplifyZoom;
    var step = 2;

    var x,
        y,
        p,
        i,
        w = imgData.w * imgData.simplifyZoom,
        h = imgData.h * imgData.simplifyZoom;
    var canvas = document.createElement('canvas');
    canvas.width = w * z;
    canvas.height = h * z;
    var ctx = canvas.getContext('2d');

    for (x = 0; x < w; x++) {
        for (y = 0; y < h; y++) {
            p = imgData.data[x + w * y];
            if (p) {
                // =P
                p = 255 - p;
                ctx.fillStyle = 'rgb(' + [p, p, p].join(',') + ')';
                ctx.fillRect(x * z, y * z, z, z);
            }
        }
    }

    function drawLine(poly) {
        var isFirst = true;
        ctx.beginPath();
        for (var l2 = 0; l2 < poly.length; l2 += step) {
            x = (poly[l2] + 0.5) * zl;
            y = (poly[l2 + 1] + 0.5) * zl;
            if (isFirst) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            isFirst = false;
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        for (l2 = 0; l2 < poly.length; l2 += step) {
            x = (poly[l2] + 0.5) * zl;
            y = (poly[l2 + 1] + 0.5) * zl;
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.stroke();
        }
    }

    if (polys) {
        ctx.strokeStyle = 'rgb(255, 0, 255)';
        ctx.fillStyle = 'rgba(255, 0, 0, 0)';

        for (var l1 = 0; l1 < polys.length; l1++) {
            var poly = polys[l1];
            if (poly.hasOwnProperty('outer')) {
                drawLine(poly.outer);
                for (var h = 0; h < poly.inners.length; h++) {
                    drawLine(poly.inners[h]);
                }
            } else {
                drawLine(poly);
            }
        }
    }
    document.body.appendChild(canvas);
}

export function showVertices(vertices, w, h, z) {
    if (typeof document === 'undefined') return;
    var canvas = document.createElement('canvas');

    canvas.width = w * z;
    canvas.height = h * z;
    var ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'rgba(0,0,255,0.3)';
    ctx.fillStyle = 'rgba(255,0,0,0.3)';
    var l, line, v, i;
    for (l = 0; l < vertices.length; l++) {
        line = vertices[l].poly;
        v = vertices[l].vertices;

        for (i = 0; i < v.length; i += 3) {
            ctx.beginPath();
            ctx.moveTo(line[v[i] * 2] * z, line[v[i] * 2 + 1] * z);
            ctx.lineTo(line[v[i + 1] * 2] * z, line[v[i + 1] * 2 + 1] * z);
            ctx.lineTo(line[v[i + 2] * 2] * z, line[v[i + 2] * 2 + 1] * z);
            ctx.lineTo(line[v[i] * 2] * z, line[v[i] * 2 + 1] * z);
            ctx.fill();
            ctx.stroke();
        }

    }
    document.body.appendChild(canvas);
}
export function showConvex(shapes, w, h, z) {
    if (typeof document === 'undefined') return;
    var canvas = document.createElement('canvas');

    canvas.width = w * z;
    canvas.height = h * z;
    var ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'rgba(255,0,0,0.3)';
    ctx.fillStyle = 'rgba(128,128,128,0.2)';
    ctx.lineWidth = z;
    var l;
    for (l = 0; l < shapes.length; l++) {
        var vect = shapes[l];
        for (var i = 0; i < vect.length; i++) {
            ctx.beginPath();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            var first = true;
            var v = vect[i];
            do {
                if (first) {
                    ctx.moveTo(v.x * z, v.y * z);
                    first = false;
                } else {
                    ctx.lineTo(v.x * z, v.y * z);
                }
                v = v.next;
            } while (v != vect[i]);
            ctx.lineTo(v.x * z, v.y * z);
            ctx.fill();
            ctx.stroke();
        }
    }
    document.body.appendChild(canvas);
}

export function showPhys2dShapes(shapes) {
    if (typeof document === 'undefined') return;
    var canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1000;

    var world = engine.createWorld({gravity: [0, 10]});
    world.clear();
    var handReferenceBody = engine.createRigidBody({
        type: 'static'
    });
    world.addRigidBody(handReferenceBody);

    var body = engine.createRigidBody({
        type: 'static',
        shapes: shapes,
        position: [0, 0]
    });
    world.addRigidBody(body);
    world.step(0);
    var ctx = canvas.getContext('2d');
    var scale = 0.025;
    for (var s = 0; s < body.shapes.length; s++) {
        var shape = body.shapes[s];
        var pdata = shape._data;
        var firstX = null, firstY = null;
        for (var i = 6; i < pdata.length; i += 13) {
            var x = pdata[i + 2] / scale;
            var y = pdata[i + 3] / scale;
            if (firstX === null) {
                firstX = x;
                firstY = y;
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.lineTo(firstX, firstY);
        ctx.stroke();
    }
    document.body.appendChild(canvas);
}

//if (typeof runTest !== 'undefined') {
//    var engine = Physics2DDevice.create();
//
//    window.earcut = require('../misc/earcut_wrapped')();
//    var ImageTracer = require('../misc/tracerworkers');
//    var img = new Image();
//    img.onload = function() {
//        var imgData = ImageTracer.getImageData(img, 2, 1000 * 1000);
//        imgData.weaklySimple = false;
//        var array = traceAndConvexify(imgData)[0];
//        var shapes = arrayToPolygonShapes(engine, array, 0.025);
//        showPhys2dShapes(shapes);
//    };
//    img.src = src;
//}
//_TEST
