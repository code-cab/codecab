import CChildObject from './CChildObject';
import CStage from './CStage';
import CController from './CController';
import CRigidBodyCtrl from './CRigidBodyCtrl';
import CPenCtrl from './CPenCtrl';
import CSoundCtrl from './CSoundCtrl';
import CRect from './CRect';
import CGraphics from './CGraphics';

import * as _spriteText from './impl/sprite-text';
import * as PIXI from 'pixi.js';

import {loadAndTraceResource} from './tracer/resource_loader';
import {deg2rad, rad2deg, rangeDeg} from './misc/math';
import {ASSERT} from './misc/util';

const MOUSE_EVENTS = ['click', 'mousedown', 'mouseup', 'mousemove', 'pointerdown', 'pointermove', 'pointerup'];

const ROTATING_STYLE_FN = {
    'none': function(degrees) {/* ignore */},
    'all around': function(degrees) {
        let delta = degrees - this._direction;
        this.rotation += delta;
    },
    'left-right': function(degrees) {
        if ((rangeDeg(degrees) > 180 && this._pixiObject.scale.x > 0) ||
            (rangeDeg(degrees) <= 180 && this._pixiObject.scale.x < 0)) {
            this._pixiObject.scale.x *= -1;
            if (!this.body.isNone()) {
                this.body._updateScale();
            }
        }
    }
};


const DEFAULT_OPTIONS = {
};

// From PackageManager
function makeVariableName(name) {
    let simpleName = name;
    if (simpleName.indexOf('/') >= 0) {
        simpleName = simpleName.substr(simpleName.lastIndexOf('/') + 1);
    }
    if (simpleName.indexOf('.') >= 0) {
        simpleName = simpleName.substr(0, simpleName.lastIndexOf('.'));
    }
    let re = RegExp('(\\w+)', 'g');
    let matches = simpleName.match(re);
    simpleName = matches.join('');
    if (simpleName.match(/^\d.*/)) {
        simpleName = '_' + simpleName;
    }
    return simpleName;
}

function getDefaultOptions(source, options) {
    let _options = Object.assign({}, DEFAULT_OPTIONS);
    if (options) _options = Object.assign(_options, options);

    if (_options.id === undefined) {
        let id = 'sprite';
        if (typeof source === 'string' && makeVariableName(source)) {
            id = makeVariableName(source);
        }
        if (CSprite.get(id)) {
            for (let i = 2;;i += 1) {
                if (!CSprite.get(id + i)) {
                    id = id + i;
                    break;
                }
            }
        }
        _options.id = id;
    }

    return _options;
}

export default class CSprite extends CChildObject {
    /**
     * source can be:
     *      url (png, jpg or svg)
     *      Other sprite
     *      PIXI DisplayObject
     *      PIXI Texture
     *      CRect
     *      CCircle
     *      CPolygon
     * @param source
     */
    constructor(source, options) {
        super(true /* delayedstart */, getDefaultOptions(source, options));
        this._eventMap = {};
        // Default empty object
        this._pixiObject = new PIXI.Sprite();
        this._anchor = new PIXI.ObservablePoint(this._onAnchorUpdate, this);
        this._controllers = [];
        this._body = this.addController(new CRigidBodyCtrl());
        this._direction = 90;
        this.anchor.set(0.5, 0.5);
        this.source = source;
    }


    get options() {
        return this._options;
    }

    get body() {
        return this._body;
    }

    get pen() {
        if (!this._pen) this._pen = this.addController(new CPenCtrl());
        return this._pen;
    }

    get sound() {
        if (!this._sound) this._sound = this.addController(new CSoundCtrl());
        return this._sound;
    }

    get _sprite() {
        return this._pixiObject;
    }

    // get shapes() {
    //     if (this._collisionBody) {
    //         return this._collisionBody.shapes;
    //     }
    // }

    // set shapes(value) {
    //     TODO: CShapes object, (can be created from CRect, texture ect)
        // this._userDefinedShapes = value;
    //
    // }

    set source(value) {
        this._source = value;
        setSource.call(this, value);
    }

    get source() {
        return this._source;
    }


    set width(value) {
        super.width = value;
        if (!this.body.isNone()) {
            this.body._updateScale();
        }
    }

    get width() {
        return super.width;
    }

    set height(value) {
        super.height = value;
        if (!this.body.isNone()) {
            this.body._updateScale();
        }
    }

    get height() {
        return super.height;
    }

    set direction(degrees) {
        ROTATING_STYLE_FN[this.rotationStyle].call(this, degrees);
        this._direction = degrees;
    }

    get direction() {
        return this._direction;
    }

    set rotation(degrees) {
        if (this.body.isNone()) {
            super.rotation = degrees;
        } else {
            this.body.rotation = degrees;
        }
    }


    get rotation() {
        return this.body.isNone() ? super.rotation : this.body.rotation;
    }

    get rotationStyle() {
        return this._rotationStyle || (this.body.isSensor() ? 'all around' : 'none');
    }

    set rotationStyle(style) {
        if (style !== "left-right" &&
            style !== "none" &&
            style !== "follow" &&
            style !== "all around") {
            throw new TypeError('CSprite.rotationStyle must be set to either: ' +
                '"left-right", "none", "follow" or "all around"');
        }
        this._rotationStyle = style;
    }

    /**
     * Set the scale. When a number is provided, both x and y are scaled respecting the width/height ratio
     * @param value
     */
    set scale(factor) {
        super.scale = factor;
        if (!this.body.isNone()) {
            this.body._updateScale();
        }
    }

    get anchor() {
        return this._anchor
    }

    set anchor(point) {
        this._anchor = point;
    }

    _onAnchorUpdate() {
        this._pixiObject.anchor = this._anchor;
        !this.body.isNone() && this.body._updateAnchor();
    }

    move(distance) {
        var rad = deg2rad(this.direction);
        this._position.set(
            this._position.x + Math.sin(rad) * distance,
            this._position.y - Math.cos(rad) * distance);
    }

    turn(degrees) {
        this.direction += degrees;
    };

    pointTowards(point) {
        this.direction = this.getDirectionTo(point);
    };


    bounceOnEdge() {
        let screen = this.stage._app.screen;
        let bounds = this._pixiObject.getBounds(false);
        let pos = this._pixiObject.getGlobalPosition();
        let bounces = 0;
        let dir = rangeDeg(this.direction);
        let overlap;
        // Right edge
        overlap = bounds.right - screen.right;
        if (dir > 0 && dir < 180 && overlap > 0) {
            pos.x -= overlap;
            dir = rangeDeg(-dir);
            bounces++;
        }
        // Left edge
        overlap = bounds.x - screen.x;
        if (dir > 180 && dir < 360 && overlap < 0) {
            pos.x += overlap;
            dir = rangeDeg(-dir);
            bounces++;
        }
        // Top edge
        overlap = bounds.top - screen.top;
        if ((dir < 90 || dir > 270) && overlap < 0) {
            pos.y += overlap;
            dir = rangeDeg(180 - dir);
            bounces++;
        }
        // Bottom edge
        overlap = bounds.bottom - screen.bottom;
        if (dir > 90 && dir < 270 && overlap > 0) {
            pos.y -= overlap;
            dir = rangeDeg(180 - dir);
            bounces++;
        }
        this.direction = dir;
        if (bounces) {
            this._pixiObject.position.copy(this.stage._stageContainer.toLocal(pos));
        }
        return bounces !== 0;
    }




    // set interactive(value) {
    //     if (value) {
    //         _sprite.setupInteractive.call(this);
    //     } else {
    //         super.interactive = false;
    //     }
    // }

    addController(controller) {
        ASSERT.isInstanceOf(CController, controller, 'controller');
        this._controllers.push(controller);
        controller.__target = this;
        return controller;
    }


    on(eventName, callback) {
        if (MOUSE_EVENTS.indexOf(eventName) >= 0) {
            this.body._bindMouseEvent(eventName, callback);
        } else {
            super.on(eventName, callback);
        }
    }

    off(eventName, callback) {
        if (MOUSE_EVENTS.indexOf(eventName) >= 0) {
            this.body._unbindMouseEvent(eventName, callback);
        } else {
            super.unbind(eventName, callback);
        }
    }




    say(text, seconds) {
        return this.text(text, {type: 'balloon'}, seconds);
    }

    think(text, seconds) {
        return this.text(text, {type: 'think-balloon'}, seconds);
    }

    text(text, options, seconds) {
        return _spriteText.text.call(this, text, options, seconds);
    }

    set texture(value) {
        if (typeof value === 'string') {
            let idx = this._textureValues.indexOf(value);
            if (idx < 0) {
                this._textureValues.push(value);
                idx = this._textureValues.length - 1;
            }
            value = idx;
        }
        if (typeof value === 'number') {
            this._currentTexture = value % this._textureValues.length;
            let texture = PIXI.Texture.fromImage(this._textureValues[this._currentTexture]);
            this._pixiObject.texture = texture;
        }
    }

    get texture() {
        return this._currentTexture !== undefined ? this._currentTexture : 0;
    }

    _updateSpriteToBody() {
        _sprite.transformCollisionBody.call(this);
    }
    _renderCollisionBody() {
        _sprite.renderCollisionBody.call(this);
    }
}

function setSource(value) {
    if (value === undefined) {
        this.__doStart();
        return;
    }
    if (value instanceof CGraphics) {
        this.anchor.set(0, 0);
        this._pixiObject = value._pixiObject.clone();
        this._pixiObject._generateArrayOfVertices = value._pixiObject._generateArrayOfVertices;
        this._pixiObject.updateTransform();
        // Set anchor to 0, 0 since graphics object has no anchor
        this.anchor.set(0, 0);
        this._body._sourceChanged();
        this.__doStart();
        return;
    }
    let values = value;
    if (typeof value === 'string') {
        values = [value];
    }
    if (Array.isArray(values) && values.length) {
        let proms = values.map(v => loadAndTraceResource(v, v));
        Promise.all(proms).then(results => {
            this._textureValues = values;
            let texture = PIXI.Texture.fromImage(values[0]);
            this._pixiObject.texture = texture;
            this._body._sourceChanged();
            this.__doStart();
        });
        return;
    }

    ASSERT.validationError('Invalid source type');
}
