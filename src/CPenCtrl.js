import CController from './CController';
import colorsys from 'colorsys';
import * as PIXI from 'pixi.js';

import Matrix from 'pixi.js/lib/core/math/Matrix';
import GroupD8 from 'pixi.js/lib/core/math/GroupD8';


export default class CPenCtrl extends CController {
    constructor() {
        super();
        this._prevPos = {x: 0, y: 0};
    }

    set __target(value) {
        super.__target = value;
        // this._graphics = CStage.get()._penGraphics;
        this._canvasSprite = CStage.get()._penCanvas;
        this._init();

    }

    _init() {
        this.setColor(74, 108, 212);
        this._lineWidth = 1;
        this.opacity = 1;
    }

    clear() {
        this._canvasSprite.context.clearRect(0, 0, this._canvasSprite.canvas.width, this._canvasSprite.canvas.height);
        this._canvasSprite.changed = true;
    }

    up() {
        this._isDown = false;
    }

    down() {
        if (!this._subscribed) {
            this._subscribed = true;
            this.target.on('position', pos => {
                if (this._isDown) {
                    let posLoc = this._getTargetPos(pos);
                    let g = this._canvasSprite.context;
                    g.lineWidth = this._lineWidth;
                    g.lineCap = 'round';
                    g.strokeStyle = 'rgba(' +
                        Math.round(this._lineColor.r) % 256 + ',' +
                        Math.round(this._lineColor.g) % 256 + ',' +
                        Math.round(this._lineColor.b) % 256 + ',' +
                        this.opacity + ')';
                    g.beginPath();
                    g.moveTo(this._prevPos.x, this._prevPos.y);
                    g.lineTo(posLoc.x, posLoc.y);
                    g.stroke();
                    this._canvasSprite.changed = true;
                    this._prevPos.x = posLoc.x;
                    this._prevPos.y = posLoc.y;
                }
            });
        }
        if (!this._isDown) {
            this._isDown = true;
            let posLoc = this._getTargetPos();
            this._prevPos.x = posLoc.x;
            this._prevPos.y = posLoc.y;
        }
    }


    setColor(red, green, blue) {
        this.color = {r: red, g: green, b: blue};
    }

    set color(rgb) {
        this._lineColor = rgb;
    }

    get color() {
        return this._lineColor;
    }

    set width(width) {
        this._lineWidth = width;
    }

    get width() {
        return this._lineWidth;
    }

    set opacity(opacity) {
        this._lineAlpha = opacity;
    }

    get opacity() {
        return this._lineAlpha;
    }

    set hue(hue) {
        let hsl = colorsys.rgb2Hsl(this._lineColor.r, this._lineColor.g, this._lineColor.b);
        hsl.h = hue;
        this._lineColor = colorsys.hsl2Rgb(hsl.h, hsl.s, hsl.l);
    }

    get hue() {
        let hsl = colorsys.rgb2Hsl(this._lineColor.r, this._lineColor.g, this._lineColor.b);
        return hsl.h;
    }

    set saturation(saturation) {
        let hsl = colorsys.rgb2Hsl(this._lineColor.r, this._lineColor.g, this._lineColor.b);
        hsl.s = saturation;
        this._lineColor = colorsys.hsl2Rgb(hsl.h, hsl.s, hsl.l);
    }

    get saturation() {
        let hsl = colorsys.rgb2Hsl(this._lineColor.r, this._lineColor.g, this._lineColor.b);
        return hsl.s;
    }

    set lightness(lightness) {
        let hsl = colorsys.rgb2Hsl(this._lineColor.r, this._lineColor.g, this._lineColor.b);
        hsl.l = lightness;
        this._lineColor = colorsys.hsl2Rgb(hsl.h, hsl.s, hsl.l);
    }

    get lightness() {
        let hsl = colorsys.rgb2Hsl(this._lineColor.r, this._lineColor.g, this._lineColor.b);
        return hsl.l;
    }

    stamp() {
        _stamp.call(this, true);
    }

    unstamp() {
        _stamp.call(this, false);
    }

    _getTargetPos(pos) {
        return this._canvasSprite.toLocal(pos || this.target.position, this.target.stage._stageContainer);
    }

    /**
     * new CSprite(stage.pen.createTexture(x, y, width, height);
     *
     * @param x
     * @param y
     * @param width
     * @param height
     */
    // createTexture(x, y, width, height) {
    //     let graphics = this._g.clone();
    //     return graphics.generateCanvasTexture();
    // }

}

let canvasWorldTransform = new Matrix();

function _stamp(add) {
    this.target._pixiObject.updateTransform();

    const texture = this.target._pixiObject.texture;
    const context = this._canvasSprite.context;

    const width = texture._frame.width;
    const height = texture._frame.height;
    let wt = this.target._pixiObject.transform.worldTransform;
    let dx = 0;
    let dy = 0;
    if (!texture.valid || texture.orig.width <= 0 || texture.orig.height <= 0 || !texture.baseTexture.source) {
        return;
    }

    context.save();

    if (texture.rotate) {
        wt.copy(canvasWorldTransform);
        wt = canvasWorldTransform;
        GroupD8.matrixAppendRotationInv(wt, texture.rotate, dx, dy);
        // the anchor has already been applied above, so lets set it to zero
        dx = 0;
        dy = 0;
    }

    dx -= width / 2;
    dy -= height / 2;

    const resolution = 1;

    context.setTransform(wt.a, wt.b, wt.c, wt.d, wt.tx * resolution, wt.ty * resolution);

    context.globalCompositeOperation = add ? 'source-over' : 'destination-out';
    context.drawImage(
        texture.baseTexture.source,
        texture._frame.x * resolution, texture._frame.y * resolution,
        width * resolution, height * resolution,
        dx * resolution, dy * resolution,
        width * resolution, height * resolution);

    context.restore();

    this._canvasSprite.changed = true;

    // let canvasRenderer = new PIXI.CanvasRenderer({
    //         width: this._canvasSprite.width,
    //         height: this._canvasSprite.height,
    //         view: this._canvasSprite.canvas,
    //         clearBeforeRender: false,
    //         transparent: true
    //     });
    // // Add new destination-out blendMode on the fly
    // if (!add) {
    //     const substract = 100;
    //     this.target._pixiObject.blendMode = substract;
    //     canvasRenderer.blendModes[substract] = 'destination-out';
    // }
    //
    // // this.target._pixiObject.updateTransform();
    // this.target._pixiObject._renderCanvas(canvasRenderer);
    // canvasRenderer.destroy();
    // this._canvasSprite.changed = true;
    // // this.target._pixiObject.blendMode = PIXI.BLEND_MODES.NORMAL;

}