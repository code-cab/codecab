let PIXI = require('pixi.js');

export default class CPoint extends PIXI.Point {
    constructor(x = 0, y = 0) {
        super(x, y);
    }
}

