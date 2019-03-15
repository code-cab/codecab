import colorsys from 'colorsys';


import { SHAPES } from 'pixi.js/lib/core/const';
import * as _utils from 'pixi.js/lib/core/utils';
import buildLine from 'pixi.js/lib/core/graphics/webgl/utils/buildLine';
import buildPoly from 'pixi.js/lib/core/graphics/webgl/utils/buildPoly';
import {trianglesToConvex, convexToArray} from './codecab_tracer';
import earcut from 'earcut';


function buildSimpleRectangle(graphicsData, webGLData, webGLDataNativeLines) {
    // --- //
    // need to convert points to a nice regular data
    //
    var rectData = graphicsData.shape;
    var x = rectData.x;
    var y = rectData.y;
    var width = rectData.width;
    var height = rectData.height;

    if (graphicsData.fill) {
        if (graphicsData.lineWidth) {
            x -= graphicsData.lineWidth / 2;
            y -= graphicsData.lineWidth / 2;
            width += graphicsData.lineWidth;
            height += graphicsData.lineWidth;
        }
        var color = (0, _utils.hex2rgb)(graphicsData.fillColor);
        var alpha = graphicsData.fillAlpha;

        var r = color[0] * alpha;
        var g = color[1] * alpha;
        var b = color[2] * alpha;

        var verts = webGLData.points;
        var indices = webGLData.indices;

        var vertPos = verts.length / 6;

        // start
        verts.push(x, y);
        verts.push(r, g, b, alpha);

        verts.push(x + width, y);
        verts.push(r, g, b, alpha);

        verts.push(x, y + height);
        verts.push(r, g, b, alpha);

        verts.push(x + width, y + height);
        verts.push(r, g, b, alpha);

        // insert 2 dead triangles..
        indices.push(vertPos, vertPos, vertPos + 1, vertPos + 2, vertPos + 3, vertPos + 3);
    } else  if (graphicsData.lineWidth) {
        var tempPoints = graphicsData.points;

        graphicsData.points = [x, y, x + width, y, x + width, y + height, x, y + height, x, y];

        buildLine(graphicsData, webGLData, webGLDataNativeLines);

        graphicsData.points = tempPoints;
    }
}


function buildSimpleCircle(graphicsData, webGLData, webGLDataNativeLines) {
    // need to convert points to a nice regular data
    var circleData = graphicsData.shape;
    var x = circleData.x;
    var y = circleData.y;
    var width = void 0;
    var height = void 0;

    // TODO - bit hacky??
    if (graphicsData.type === SHAPES.CIRC) {
        width = circleData.radius;
        height = circleData.radius;
    } else {
        width = circleData.width;
        height = circleData.height;
    }

    if (width === 0 || height === 0) {
        return;
    }

    var totalSegs = Math.floor(2 * Math.sqrt(circleData.radius)) || Math.floor(15 * Math.sqrt(circleData.width + circleData.height));

    var seg = Math.PI * 2 / totalSegs;

    if (width === height && graphicsData.fill) {
        let radius = width;
        if (graphicsData.lineWidth) radius += graphicsData.lineWidth / 2;

        webGLData.circles.push({
            x: x,
            y: y,
            circleRadius: radius
        });
    } else {
        if (graphicsData.fill) {
            var color = _utils.hex2rgb(graphicsData.fillColor);
            var alpha = graphicsData.fillAlpha;

            var r = color[0] * alpha;
            var g = color[1] * alpha;
            var b = color[2] * alpha;

            var verts = webGLData.points;
            var indices = webGLData.indices;

            var vecPos = verts.length / 6;

            indices.push(vecPos);

            for (var i = 0; i < totalSegs + 1; i++) {
                verts.push(x, y, r, g, b, alpha);

                verts.push(x + Math.sin(seg * i) * width, y + Math.cos(seg * i) * height, r, g, b, alpha);

                indices.push(vecPos++, vecPos++);
            }

            indices.push(vecPos - 1);
        }

        if (graphicsData.lineWidth) {
            var tempPoints = graphicsData.points;

            graphicsData.points = [];

            for (var _i = 0; _i < totalSegs; _i++) {
                graphicsData.points.push(x + Math.sin(seg * -_i) * width, y + Math.cos(seg * -_i) * height);
            }

            graphicsData.points.push(graphicsData.points[0], graphicsData.points[1]);

            buildLine(graphicsData, webGLData, webGLDataNativeLines);

            graphicsData.points = tempPoints;
        }
    }
}

function buildSimpleRoundedRectangle(graphicsData, webGLData, webGLDataNativeLines) {
    var rrectData = graphicsData.shape;
    var x = rrectData.x;
    var y = rrectData.y;
    var width = rrectData.width;
    var height = rrectData.height;

    var radius = rrectData.radius;

    var recPoints = [];

    if (graphicsData.lineWidth) {
        x -= graphicsData.lineWidth / 2;
        y -= graphicsData.lineWidth / 2;
        width += graphicsData.lineWidth;
        height += graphicsData.lineWidth;
        radius += graphicsData.lineWidth / 2;
    }

    recPoints.push(x + radius, y);
    quadraticBezierCurve(x + width - radius, y, x + width, y, x + width, y + radius, recPoints);
    quadraticBezierCurve(x + width, y + height - radius, x + width, y + height, x + width - radius, y + height, recPoints);
    quadraticBezierCurve(x + radius, y + height, x, y + height, x, y + height - radius, recPoints);
    quadraticBezierCurve(x, y + radius, x, y, x + radius + 0.0000000001, y, recPoints);

    // this tiny number deals with the issue that occurs when points overlap and earcut fails to triangulate the item.
    // TODO - fix this properly, this is not very elegant.. but it works for now.


    var color = _utils.hex2rgb(graphicsData.fillColor);
    var alpha = graphicsData.fillAlpha;

    var r = color[0] * alpha;
    var g = color[1] * alpha;
    var b = color[2] * alpha;

    var verts = webGLData.points;
    var indices = webGLData.indices;

    var vecPos = verts.length / 6;

    var triangles = earcut(recPoints, null, 2);

    for (var i = 0, j = triangles.length; i < j; i += 3) {
        indices.push(triangles[i] + vecPos);
        indices.push(triangles[i] + vecPos);
        indices.push(triangles[i + 1] + vecPos);
        indices.push(triangles[i + 2] + vecPos);
        indices.push(triangles[i + 2] + vecPos);
    }

    for (var _i = 0, _j = recPoints.length; _i < _j; _i++) {
        verts.push(recPoints[_i], recPoints[++_i], r, g, b, alpha);
    }
}

/**
 * Calculate a single point for a quadratic bezier curve.
 * Utility function used by quadraticBezierCurve.
 * Ignored from docs since it is not directly exposed.
 *
 * @ignore
 * @private
 * @param {number} n1 - first number
 * @param {number} n2 - second number
 * @param {number} perc - percentage
 * @return {number} the result
 *
 */
function getPt(n1, n2, perc) {
    var diff = n2 - n1;

    return n1 + diff * perc;
}

/**
 * Calculate the points for a quadratic bezier curve. (helper function..)
 * Based on: https://stackoverflow.com/questions/785097/how-do-i-implement-a-bezier-curve-in-c
 *
 * Ignored from docs since it is not directly exposed.
 *
 * @ignore
 * @private
 * @param {number} fromX - Origin point x
 * @param {number} fromY - Origin point x
 * @param {number} cpX - Control point x
 * @param {number} cpY - Control point y
 * @param {number} toX - Destination point x
 * @param {number} toY - Destination point y
 * @param {number[]} [out=[]] - The output array to add points into. If not passed, a new array is created.
 * @return {number[]} an array of points
 */
function quadraticBezierCurve(fromX, fromY, cpX, cpY, toX, toY) {
    var out = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : [];

    var n = 20;
    var points = out;

    var xa = 0;
    var ya = 0;
    var xb = 0;
    var yb = 0;
    var x = 0;
    var y = 0;

    for (var i = 0, j = 0; i <= n; ++i) {
        j = i / n;

        // The Green Line
        xa = getPt(fromX, cpX, j);
        ya = getPt(fromY, cpY, j);
        xb = getPt(cpX, toX, j);
        yb = getPt(cpY, toY, j);

        // The Black Dot
        x = getPt(xa, xb, j);
        y = getPt(ya, yb, j);

        points.push(x, y);
    }

    return points;
}


export default class CGraphicsToVerticeRenderer {
    render(g) {
        let polys = [];
        let circles = [];
        for (let lineId = 0; lineId < g.graphicsData.length; lineId += 1) {
            let shapeData = {
                points: [],
                indices: [],
                circles: []
            };
            let data = g.graphicsData[lineId];
            switch (data.type) {
                case SHAPES.POLY:
                    buildPoly(data, shapeData, undefined);
                    break;
                case SHAPES.RECT:
                    buildSimpleRectangle(data, shapeData, undefined);
                    break;
                case SHAPES.CIRC:
                case SHAPES.ELIP:
                    buildSimpleCircle(data, shapeData, undefined);
                    break;
                case SHAPES.RREC:
                    buildSimpleRoundedRectangle(data, shapeData, undefined);
                    break;
                default:
                    throw "Not implemented";

            }
            let points = [];
            let skip = false;
            for (let i = 0; i < shapeData.points.length; i += 6) {
                let x = shapeData.points[i];
                let y = shapeData.points[i + 1];
                if (isNaN(x) || !isFinite(x) || isNaN(y) || !isFinite(y)) {
                    skip = true;
                }
                points.push(x);
                points.push(y);
            }
            if (skip) continue;
            let poly = {
                poly: points,
                vertices: []
            };
            let odd = true;
            for (let i = 0; i < shapeData.indices.length - 2; i += 1) {
                let v0 = shapeData.indices[i];
                let v1 = shapeData.indices[i + 1];
                let v2 = shapeData.indices[i + 2];
                if (v0 === v1 || v1 === v2 || v2 === v0) continue;

                if (odd) {
                    poly.vertices.push(v0);
                    poly.vertices.push(v1);
                    poly.vertices.push(v2);
                } else {
                    poly.vertices.push(v1);
                    poly.vertices.push(v0);
                    poly.vertices.push(v2);
                }
                odd = !odd;
            }
            for (let i = 0; i < shapeData.circles.length; i += 1) {
                circles.push(shapeData.circles[i]);
            }
            polys.push(poly);
        }
        let shapes = trianglesToConvex(polys);
        for (let circle of circles) {
            shapes.push([circle]);
        }

        let array = convexToArray(shapes, 0);
        return array;
    }
}
