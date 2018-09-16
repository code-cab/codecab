import colorsys from 'colorsys';


import { SHAPES } from 'pixi.js/lib/core/const';
import buildPoly from 'pixi.js/lib/core/graphics/webgl/utils/buildPoly';
import buildRectangle from 'pixi.js/lib/core/graphics/webgl/utils/buildRectangle';
import {trianglesToConvex, convexToArray} from './codecab_tracer';


export default class CGraphicsToVerticeRenderer {
    render(g) {
        let polys = [];
        for (let lineId = 0; lineId < g.graphicsData.length; lineId += 1) {
            let shapeData = {
                points: [],
                indices: []
            };
            let data = g.graphicsData[lineId];
            switch (data.type) {
                case SHAPES.POLY:
                    buildPoly(data, shapeData, undefined);
                    break;
                case SHAPES.RECT:
                    buildRectangle(data, shapeData, undefined);
                    break;
                case SHAPES.CIRC:
                case SHAPES.ELIP:
                case SHAPES.RREC:
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
            polys.push(poly);
        }
        let shapes = trianglesToConvex(polys);
        let array = convexToArray(shapes, 0);
        return array;
    }
}
