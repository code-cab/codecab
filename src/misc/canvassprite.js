import * as PIXI from 'pixi.js';

/**
 * Lazy create canvas on demand
 */
export default class CanvasSprite extends PIXI.Sprite {
    constructor(canvas) {
        super(PIXI.Texture.fromCanvas(canvas));
        this._canvas = canvas
    };

    static create(width, height) {
        let canvas = document.createElement("canvas");
        if (width) canvas.width = width;
        if (height) canvas.height = height;
        return new CanvasSprite(canvas);
    }
    get canvas() {
        return this._canvas;
    }

    get context() {
        return this._canvas.getContext('2d');
    }

    setCanvasChanged() {
        // Fix PIXI bug
        if (this._canvas._pixiId) {
            PIXI.utils.BaseTextureCache[this._canvas._pixiId].destroy();
        }
        super.texture = PIXI.Texture.fromCanvas(this._canvas);
    }
}