import CPhysicsCtrl from '../CPhysicsCtrl';
// import ClipperLib from 'js-clipper';
import b2 from 'lucy-b2';

export default class VerticesArray {
    constructor() {
        this._verticesArray = [];
        this._x1 = 0;
        this._y1 = 0;
        this._x2 = 0;
        this._y2 = 0;
        this._ownerObject = undefined;
    }
/*
    contains(x, y) {
        let worldPoint = this._ownerObject.toGlobal({x: x, y: y});
        // let worldPoint = [x * this.scale.x, y * this.scale.y];
        let utils = CStage.get()._engine.collisionUtils;
        for (let i = 0; i < this._shapes.length; i += 1) {
            let shape = this._shapes[i];
            if (!shape.body) {
                shape.body = {
                    _update: function() {
                    }
                }
            }
            if (utils.containsPoint(shape, [worldPoint.x, worldPoint.y])) {
                return true;
            }
        }
        return false;
    }
*/
    get vertices() {
        return this._verticesArray;
    }

    get x() {
        return this._x1;
    }

    get y() {
        return this._y1;
    }

    get width() {
        return this._x2 - this._x1;
    }

    get heighs() {
        return this._y2 - this._y1;
    }

    get ownserObject() {
        return this._ownerObject;
    }

    static _createFromArrayOfVertices(arrayOfVertices) {
        let verticesArray = new VerticesArray();
        verticesArray._verticesArray = [];
        let first = true;

        for (let l = 0; l < Math.round(arrayOfVertices[0]); l++) {
            let verticesCount = Math.round(arrayOfVertices[index++]);
            let vertices = [];
            for (let v = 0; v < verticesCount; v++) {
                let x = arrayOfVertices[index++];
                let y = arrayOfVertices[index++];
                vertices.push([x, y]);
                if (first) {
                    first = false;
                    verticesArray._x1 = verticesArray._x2 = x;
                    verticesArray._y1 = verticesArray._y2 = y;
                } else {
                    verticesArray._x1 = Math.min(verticesArray._x1, x);
                    verticesArray._x2 = Math.max(verticesArray._x2, x);
                    verticesArray._y1 = Math.min(verticesArray._y1, y);
                    verticesArray._y2 = Math.max(verticesArray._y2, y);
                }
            }
            verticesArray._verticesArray.push(vertices);
        }
    }

//     static _createFromArrayOfVertices(arrayOfVertices, ownerObject, material, sensor) {
//
//         // let paths = CPolygonShapes._toClipperPaths(arrayOfVertices);
//         //
//         // let newPaths = [];
//         // for (let path of paths) {
//         //     let np = ClipperLib.Clipper.CleanPolygon(path, 5);
//         //     if (np && np.length) {
//         //         newPaths.push(np);
//         //     }
//         // }
//         // paths = newPaths;
//         //
//         // return CPolygonShapes._toShapes(paths, ownerObject, material, sensor);
//
//
//         let verticesArray = new CPolygonShapes();
//         verticesArray._ownerObject = ownerObject;
//
//         verticesArray._shapes = [];
//         let first = true;
//         let v, verticesCount, index = 1, vertices;
//         let phys2dMaterial = material || engine.getDefaultMaterial();
//
//         for (let l = 0; l < Math.round(arrayOfVertices[0]); l++) {
//             verticesCount = Math.round(arrayOfVertices[index++]);
//             vertices = [];
//             for (v = 0; v < verticesCount; v++) {
//                 let x = arrayOfVertices[index++];
//                 let y = arrayOfVertices[index++];
//                 vertices.push([x, y]);
//                 if (first) {
//                     first = false;
//                     verticesArray._x1 = verticesArray._x2 = x;
//                     verticesArray._y1 = verticesArray._y2 = y;
//                 } else {
//                     verticesArray._x1 = Math.min(verticesArray._x1, x);
//                     verticesArray._x2 = Math.max(verticesArray._x2, x);
//                     verticesArray._y1 = Math.min(verticesArray._y1, y);
//                     verticesArray._y2 = Math.max(verticesArray._y2, y);
//                 }
//             }
//             let shape = engine.createPolygonShape({
//                 vertices: vertices,
//                 material: phys2dMaterial,
//                 sensor: sensor
//             });
//             shape._currScale = {
//                 x: 1,
//                 y: 1
//             };
//             verticesArray._shapes.push(shape);
//         }
//         return verticesArray;
//     }
//
// //     static _toClipperPaths(arrayOfVertices) {
// //         let v, verticesCount, index = 1, path;
// //         let paths = [];
// //         for (let l = 0; l < Math.round(arrayOfVertices[0]); l++) {
// //             verticesCount = Math.round(arrayOfVertices[index++]);
// //             path = [];
// //             for (v = 0; v < verticesCount; v++) {
// //                 let x = arrayOfVertices[index++];
// //                 let y = arrayOfVertices[index++];
// //                 let pt = new ClipperLib.IntPoint(x, y);
// //                 path.push(pt);
// // //                    if (first) {
// // //                        first = false;
// // //                        verticesArray._x1 = verticesArray._x2 = x;
// // //                        verticesArray._y1 = verticesArray._y2 = y;
// // //                    } else {
// // //                        verticesArray._x1 = Math.min(verticesArray._x1, x);
// // //                        verticesArray._x2 = Math.max(verticesArray._x2, x);
// // //                        verticesArray._y1 = Math.min(verticesArray._y1, y);
// // //                        verticesArray._y2 = Math.max(verticesArray._y2, y);
// // //                    }
// //             }
// //             paths.push(path);
// //         }
// //         return paths;
// //     }
//
//     static _toShapes(paths, ownerObject, material, sensor) {
//         let verticesArray = new CPolygonShapes();
//         verticesArray._ownerObject = ownerObject;
//         let engine = CPhysicsCtrl.get().engine;
//         let phys2dMaterial = material || engine.getDefaultMaterial();
//
//         verticesArray._shapes = [];
//         let first = true;
//
//         for (let path of paths) {
//             let vertices = [];
//             for (let pt of path) {
//                 let x = pt.X;
//                 let y = pt.Y;
//                 vertices.push([x, y]);
//                 if (first) {
//                     first = false;
//                     verticesArray._x1 = verticesArray._x2 = x;
//                     verticesArray._y1 = verticesArray._y2 = y;
//                 } else {
//                     verticesArray._x1 = Math.min(verticesArray._x1, x);
//                     verticesArray._x2 = Math.max(verticesArray._x2, x);
//                     verticesArray._y1 = Math.min(verticesArray._y1, y);
//                     verticesArray._y2 = Math.max(verticesArray._y2, y);
//                 }
//             }
//             let shape = engine.createPolygonShape({
//                 vertices: vertices,
//                 material: phys2dMaterial,
//                 sensor: sensor
//             });
//             shape._currScale = {
//                 x: 1,
//                 y: 1
//             };
//             verticesArray._shapes.push(shape);
//         }
//
//         return verticesArray;
//     }

}