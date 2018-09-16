import CPoint from './CPoint';
import * as PIXI from 'pixi.js';

export default class CRect extends PIXI.Rectangle {
    constructor(x = 0, y = 0, width = 0, height = 0) {
        super(x, y, width, height);
        this.normalize();
    }

    static createFromRect(rect) {
        return new CRect(rect.x, rect.y, rect.width, rect.height);
    }

    static createFromPoints(topLeft, bottomRight) {
        return new CRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
    }

    /**
     * Redefine because scale.y = -1;
     * @returns {*}
     */
    get top() {
        return this.y + this.height;
    }

    /**
     * Redefine because scale.y = -1;
     * @returns {*}
     */
    get bottom() {
        return this.y;
    }

    get topLeft() {
        return new CPoint(this.left, this.top);
    }

    get bottomRight() {
        return new CPoint(this.right, this.bottom);
    }

    applyTransform(matrix) {
        let topLeft = matrix.apply(this.topLeft);
        let bottomRight = matrix.apply(this.bottomRight);
        this.x = topLeft.x;
        this.y = topLeft.y;
        this.width = bottomRight.x - topLeft.x;
        this.height = bottomRight.y - topLeft.y;
    }
    applyInverseTransform(matrix) {
        let topLeft = matrix.applyInverse(this.topLeft);
        let bottomRight = matrix.applyInverse(this.bottomRight);
        this.x = topLeft.x;
        this.y = topLeft.y;
        this.width = bottomRight.x - topLeft.x;
        this.height = bottomRight.y - topLeft.y;
    }

    normalize() {
        if (this.width < 0) {
            this.x += this.width;
            this.width = -this.width;
        }
        if (this.height < 0) {
            this.y += this.height;
            this.height = -this.height;
        }
        return this;
    }
}