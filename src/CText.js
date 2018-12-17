import CChildObject from './CChildObject';
import * as PIXI from 'pixi.js';
import colorsys from 'colorsys';

/**
 * Usage:
 * new CText('
 *
 *
 * moveTo()
 * lineTo()
 * lineTo()
 * lineTo()
 * fill();
 */
export default class CText extends CChildObject {
    constructor(text, size, family) {
        super();
        this._pixiObject = new PIXI.Text(text, {
            fontSize: size || 16,
            fontFamily: family || 'Arial',
            fill: '#000000',
            align: 'center'
        });
        this._pixiObject.anchor.set(0.5);
    }

    set text(text) {
        this.__pixiObject.text = text;
    }

    get text() {
        return this.__pixiObject.text;
    }

    set size(size) {
        this.__pixiObject.style.fontSize = size;
    }

    get size() {
        return this.__pixiObject.style.fontSize;
    }

    set align(align) {
        this.__pixiObject.style.align = align;
        if (align === 'center') {
            this._pixiObject.anchor.set(0.5);
        } else {
            this._pixiObject.anchor.set(0);
        }
    }

    get align() {
        return this.__pixiObject.style.align;
    }

    setFillColor(red, green, blue) {
       this.__pixiObject.style.fill = colorsys.rgb2Hex(red, green, blue);
    }

    setLineColor(red, green, blue) {
        this.__pixiObject.style.stroke = colorsys.rgb2Hex(red, green, blue);
        if (!this.lineWidth) {
            this.lineWidth = Math.ceil(this.size / 10);
        }
    }

    set lineWidth(width) {
        this.__pixiObject.style.strokeThickness = width;
    }

    get lineWidth() {
        return this.__pixiObject.style.strokeThickness;
    }
};
