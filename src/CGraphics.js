import CChildObject from './CChildObject';
import * as PIXI from 'pixi.js';
import GraphicsToVerticeRenderer from './tracer/GraphicsToVerticeRenderer';
// import buildRectangle from './utils/buildRectangle';
// import buildRoundedRectangle from './utils/buildRoundedRectangle';
// import buildCircle from './utils/buildCircle';



/**
 * Usage:
 * moveTo()
 * lineTo()
 * lineTo()
 * lineTo()
 * fill();
 */
export default class CGraphics extends CChildObject {
    constructor() {
        super();
        this._pixiObject = new PIXI.Graphics();

        this._pixiObject._generateArrayOfVertices = function() {
            let r = new GraphicsToVerticeRenderer();
            return r.render(this);
        };

        this._init();
    }

    _init() {
        this.setLineColor(74, 108, 212);
        this.setFillColor(212, 108, 74);
        this.lineWidth = 1;
        this.lineOpacity = 1;
    }
    set lineWidth(width) {
        this.__pixiObject.lineWidth = width;
    }

    get lineWidth() {
        return this.__pixiObject.lineWidth;
    }

    set lineOpacity(opacity) {
        this.__pixiObject.lineAlpha = opacity;
    }

    get lineOpacity() {
        return this.__pixiObject.lineAlpha;
    }

    set fillOpacity(opacity) {
        this._fillOpacity = opacity;
    }

    get fillOpacity() {
        return this._fillOpacity;
    }

    setLineColor(red, green, blue) {
        this.lineColor = {r: red, g: green, b: blue};
    }

    set lineColor(rgb) {
        this._lineColor = rgb;
        this.__pixiObject.lineColor = this._rgbValue(rgb);
    }

    get lineColor() {
        return this._lineColor;
    }

    setFillColor(red, green, blue) {
        this.fillColor = {r: red, g: green, b: blue};
    }

    set fillColor(rgb) {
        this._fillColor = rgb;
    }

    setNoFill() {
        this.fillColor = undefined;
    }

    get fillColor() {
        return this._fillColor;
    }

    moveTo(x, y) {
        this._beginFill();
        this.__pixiObject.moveTo(x, y);
    }

    lineTo(x, y) {
        this.__pixiObject.lineTo(x, y);
    }

    closePath() {
        this.__pixiObject.closePath();
        this._endFill();
    }

    rect(x, y, width, height) {
        this._beginFill();
        this.__pixiObject.drawRect(x, y, width, height);
        this._endFill();
    }

    roundedRect(x, y, width, height, radius) {
        this._beginFill();
        this.__pixiObject.drawRoundedRect(x, y, width, height, radius);
        this._endFill();
    }

    circle(x, y, radius) {
        this._beginFill();
        this.__pixiObject.drawCircle(x, y, radius);
        this._endFill();
    }

    ellipse(x, y, width, height) {
        this._beginFill();
        this.__pixiObject.drawEllipse(x, y, width, height);
        this._endFill();
    }

    polygon(path) {
        this._beginFill();
        this.__pixiObject.drawPolygon(path);
        this._endFill();
    }

    quadraticCurveTo(cpX, cpY, toX, toY) {
        this.__pixiObject.quadraticCurveTo(cpX, cpY, toX, toY);
    }

    bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY) {
        this.__pixiObject.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);
    }

    arcTo(x1, y1, x2, y2, radius) {
        this.__pixiObject.arcTo(x1, y1, x2, y2, radius);
    }

    arc(cx, cy, radius, startAngle, endAngle, anticlockwise = false) {
        this.__pixiObject.arc(cx, cy, radius, startAngle, endAngle, anticlockwise);
    }

    _beginFill() {
        if (this._fillColor) {
            if (this.__pixiObject.filling) {
                this._endFill();
            }
            this.__pixiObject.beginFill(this._rgbValue(this._fillColor),
                this._fillOpacity);
        }
    }

    _endFill() {
        if (this._fillColor) {
            this.__pixiObject.endFill();
        }
    }

    clear() {
        this.__pixiObject.clear();
        this._init();
    }

    _rgbValue(rgb) {
        if (typeof rgb === 'number') return rgb;
        let r = Math.max(0, Math.min(255, rgb.r));
        let g = Math.max(0, Math.min(255, rgb.g));
        let b = Math.max(0, Math.min(255, rgb.b));
        return r << 16 | g << 8 | b;
    }
};