import CObject from './CObject';
import CStage from './CStage';
import CTargetPoint from './core/CTargetPoint'
import {deg2rad, rad2deg, rangeDeg} from './misc/math';
import CTween from './CTween';

var _idCounter = 1;

const STAGE_EVENTS = ['keypress', 'keydown', 'keyup'];

const DEFAULT_OPTIONS = {
};

export default class CChildObject extends CObject {
    constructor(delayedStart, options) {
        super(delayedStart);
        this._options = Object.assign({}, DEFAULT_OPTIONS);
        if (options) this._options = Object.assign(this._options, options);
        if (this._options.id === undefined) {
            this._options.id = 'child' + (_idCounter++);
        }
        Object.freeze(this._options);

        this._position = createPosition.call(this);
        this.id = this._options.id;
    }

    set _pixiObject(pixiObject) {
        if (this.__pixiObject) {
            CStage.get()._childrenContainer.removeChild(this.__pixiObject);
            this.__pixiObject.destroy();
        }
        this.__pixiObject = pixiObject;
        this.__pixiObject._childObject = this;
        CStage.get()._childrenContainer.addChild(this.__pixiObject);
    }

    get _pixiObject() {
        return this.__pixiObject;
    }


    static get(id) {
        return CStage.childById(id);
    }

    destroy() {
        super.destroy();
        this.__pixiObject.destroy();
    }

    get stage() {
        return CStage.get();
    }

    set x(value) {
        this._position.x = value;
    }

    set y(value) {
        this._position.y = value;
    }

    get x() {
        return this._position.x;
    }

    get y() {
        return this._position.y;
    }

    get position() {
        return this._position;
    }

    set position(point) {
        this._position.setPoint(point)
    }

    goto(x, y) {
        this._position.set(x, y);
    }

    set width(value) {
        this.__pixiObject.width = value;
    }

    get width() {
        return this.__pixiObject.width;
    }

    set height(value) {
        this.__pixiObject.height = value;
    }

    get height() {
        return this.__pixiObject.height;
    }

    set rotation(degrees) {
        this.__pixiObject.rotation = deg2rad(degrees);
    }


    get rotation() {
        return rad2deg(this.__pixiObject.rotation);
    }

    /**
     * Set the scale. When a number is provided, both x and y are scaled respecting the width/height ratio
     * @param value
     */
    set scale(factor) {
        if (typeof factor === 'number') {
            factor = {
                x: factor,
                y: factor
            };
        }
        this.__pixiObject.scale.set(factor.x, factor.y);
        if (this.body && !this.body.isNone()) {
            this.body._updateScale();
        }
    }

    get scale() {
        return this.__pixiObject.scale.x;
    }

    set opacity(value) {
        this.__pixiObject.alpha = value;
    }

    get opacity() {
        return this.__pixiObject.alpha;
    }

    getDistanceTo(point) {
        var dx = point.x - this.x;
        var dy = point.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    getDirectionTo(point) {
        var dx = point.x - this.x;
        var dy = -(point.y - this.y);
        var degrees;
        if (dy === 0) {
            degrees = dx >= 0 ? 90 : 270;
        } else if (dy > 0) {
            degrees = rad2deg(Math.atan(dx / dy));
        } else {
            degrees = rad2deg(Math.atan(dx / dy)) + 180;
        }
        return degrees;
    };


    glideTo(x, y, seconds) {
        return this.tween({x : x, y : y}, seconds);
    };

    tween(props, seconds, ease, yoyo) {
        let tween = new CTween(this);
        if (!yoyo) {
            return tween.to(props, seconds, ease);
        } else {
            return tween.yoyo(props, seconds, ease);
        }
    }

    set visible(visible) {
        this.__pixiObject.visible = !!visible;
    }

    get visible() {
        return !!this.__pixiObject.visible;
    }


    toFront() {
        this.order = Number.MAX_VALUE;
    }

    get order() {
        return CStage.get()._childrenContainer.getChildIndex(this.__pixiObject);
    }

    set order(index) {
        index = Math.max(Math.min(index, CStage.get()._childrenContainer.children.length - 1), 0);
        CStage.get()._childrenContainer.setChildIndex(this.__pixiObject, index);
    }

    isKeyPressed(key) {
        return this.stage._keyManager.isKeyPressed(key);
    }


    onKeyPress(key, callback) {
        this.stage._keyManager.onKeyEvent('keypress', this, key, callback);
    }

    onKeyDown(key, callback) {
        this.stage._keyManager.onKeyEvent('keydown', this, key, callback);
    }

    onKeyUp(key, callback) {
        this.stage._keyManager.onKeyEvent('keyup', this, key, callback);
    }

    onClick(callback) {
        this.on('pointerdown', callback);
    }

    onRightClick(callback) {
        on('rightdown', callback);
    }

    onMouseDown(callback) {
        this.on('pointerdown', callback);
    }

    onMouseUp(callback) {
        this.on('pointerup', callback);
    }

    onMouseMove(callback) {
        this.on('pointermove', callback);
    }

    on(eventName, callback) {
        if (STAGE_EVENTS.indexOf(eventName) >= 0) {
            this.stage._on(eventName, this, callback);
        } else {
            super.on(eventName, callback);
            this.stage._on(eventName, this, callback);
        }
    }

    unbind(eventName, callback) {
        if (STAGE_EVENTS.indexOf(eventName) >= 0) {
            this.stage.removeListener(eventName, callback);
        } else {
            super.removeListener(eventName, callback);
            this.stage.removeListener(eventName, callback);
        }
    }

    broadcast(eventName) {
        this.stage.emit(eventName);
    }

    onStart(callback) {
        // Only attach to this object and not to stage
        super.on('start', callback);
    }


}

function createPosition() {
    return new CTargetPoint(
        () => {
            if (!this.body || this.body.isNone()) return this._pixiObject.transform.position;
            let pt = this.body.worldPosition;
            return {
                x: pt.x * this.stage._options.pixelsPerMeter,
                y: pt.y * this.stage._options.pixelsPerMeter
            }
        },
        (point) => {

            // if (this._textBox) this._textBox.transform.position.copy(point);
            if (!this.body || this.body.isNone()) {
                this._pixiObject.transform.position.copy(point);
            } else {
                this.body.worldPosition.set(
                    point.x / this.stage._options.pixelsPerMeter,
                    point.y / this.stage._options.pixelsPerMeter
                );
            }
            this.emit('position', point);
            // this.pen.draw(point);
        });
}
