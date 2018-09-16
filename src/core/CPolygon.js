import * as PIXI from 'pixi.js';

export default class CPolygon extends PIXI.Polygon {
    constructor(...points) {
        super(...points);
    }

    contains(x, y) {
        if (this._x1 === undefined) {
            let first = true;
            const length = this.points.length / 2;
            for (let i = 0; i < length; i++)
            {
                const xi = this.points[i * 2];
                const yi = this.points[(i * 2) + 1];
                if (first) {
                    first = false;
                    this._x1 = this._x2 = xi;
                    this._y1 = this._y2 = yi;
                } else {
                    this._x1 = Math.min(this._x1, xi);
                    this._x2 = Math.max(this._x2, xi);
                    this._y1 = Math.min(this._y1, yi);
                    this._y2 = Math.max(this._y2, yi);
                }
            }
        }
        if (x < this._x1 || x > this._x2 || y < this._y1 || y > this._y2) {
            return false;
        }
        return PIXI.Polygon.prototype.contains.call(this, x, y);
    }
}

