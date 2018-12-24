// import * as PIXI from '../lib/es6/pixi.js/index';
import * as PIXI from 'pixi.js';
import CObject from './CObject';
import CPhysicsCtrl from './CPhysicsCtrl';
import CSoundCtrl from './CSoundCtrl';
import CController from './CController';
import CMouse from './CMouse';
import CTween from './CTween';
import CanvasSprite from './misc/canvassprite';
import KeyManager from './impl/stage-keymanager';

import { loadAndTraceResource, init, reset, loadWebFont } from './tracer/resource_loader';
import {ASSERT, MOUSE_EVENTS} from './misc/util';
import TWEEN from 'tween.js';

import CPoint from './CPoint';
import CRect from './CRect';

// Sorry PIXI, too intrusive
PIXI.utils.skipHello();

const DEFAULT_OPTIONS = {
    width: 1024,
    height: 640,
    backgroundColor: 0x0ffffff,
    supportsTouchEvents: true,
    origin: 'center',
    // resolution: window.devicePixelRatio,

    // Physics options
    pixelsPerMeter: 60,
    stepsPerSecond: 60,
    gravity: 10,
    gravityDirection: 180,
    enableDragging: true,
    showShapes: false,
    showConstraints: false,
    border: 'bowl'
};

var _instance;

export default class CStage extends CObject {
    /**
     *
     *
     *
     * @param {object} [options]
     * @param {boolean} [options.pixelsPerMeter] - Set world scale
     */
    static create(options) {
        return new CStage(options);
    }

    static get() {
        if (!_instance) {
            throw new Error('CStage has not been created yet. Use "new CStage()" to create a new instance');
        }
        return _instance;
    }

    static get $() {
        return CStage.get();
    }

    /**
     *
     * @private
     * @param options
     */
    constructor(options) {
        super();
        if (_instance) {
            throw new Error('CStage already created. Only one instance is allowed. Reset previous instance first');
        }
        _instance = this;
        let self = this;

        this._options = Object.assign({}, Object.assign(DEFAULT_OPTIONS, options || {}));
        this._options.autoStart = false;
        this._options.sharedTicker = true;
        // Object.freeze(this._options);

        this._app = new PIXI.Application(this._options);

        // this._app.stage = this;
        // All stage stuff goes in here
        this._staticBackgroundContainer = new PIXI.Container();
        this._app.stage.addChild(this._staticBackgroundContainer);
        this._stageZoomContainer = new PIXI.Container();
        this._app.stage.addChild(this._stageZoomContainer);
        this._stageContainer = new PIXI.Container();
        this._stageZoomContainer.addChild(this._stageContainer);
        this._backgroundContainer = new PIXI.Container();
        this._stageContainer.addChild(this._backgroundContainer);

        setOrigin.call(this);
        let r = this.stageRect;

        // this._backGraphics = new PIXI.Graphics();
        // this._stageContainer.addChild(this._backGraphics);
        this._penCanvas = CanvasSprite.create(r.width, r.height);
        this._penCanvas.x = r.x;
        this._penCanvas.y = r.y;
        this._stageContainer.addChild(this._penCanvas);
        this._childrenContainer = new PIXI.Container();
        this._stageContainer.addChild(this._childrenContainer);
        this._textContainer = new PIXI.Container();
        this._stageContainer.addChild(this._textContainer);
        // this._frontGraphics = new PIXI.Graphics();
        // this._stageContainer.addChild(this._frontGraphics);

        // Screen overlay container
        this._screenContainer = new PIXI.Container();
        this._app.stage.addChild(this._screenContainer);
        // this._screenContainer.width = this._app.screen.width;
        // this._screenContainer.height = this._app.screen.height;

        this._watchContainer = new PIXI.Container();
        this._screenContainer.addChild(this._watchContainer);

        this._backgroundObject = null;

        this._dummy = 0;




        // Sorry, we'll give enough credits but want to be silent on startup

        this._nextFrameCallbacks = [];
        this._controllers = [];


        this._app.ticker.add(() => self._frame.call(self, this._app.ticker.elapsedMS / 1000));

        this._physics = new CPhysicsCtrl(this._options);
        this.addController(this._physics);

        let target = document.getElementById('codecab-wrapper') || document.body;
        target.appendChild(this._app.view);

        this._keyManager = new KeyManager(this);

        PIXI.interaction.InteractionManager.supportsTouchEvents = this._options.supportsTouchEvents;

        // Preinit mouse:
        this.mouse;

        // Render once to set background
        this._app.render();
        setTimeout(() =>
            init.call(this, this, () => {
                this.start();
            })
        , 0);

        Object.freeze(this._options);
    }


    stop() {
        this._running = false;
        this._app.stop();
    }

    start() {
        this._app.start();
        this._running = true;
    }

    set x(x) {
        this._stageContainer.x = -x;
        updateTiling.call(this);
    }

    set y(y) {
        this._stageContainer.y = -y;
        updateTiling.call(this);
    }

    get x() {
        return -this._stageContainer.x;
    }

    get y() {
        return -this._stageContainer.y;
    }

    set scale(factor) {
        this._stageZoomContainer.scale = {x: factor, y: factor};
        updateTiling.call(this);
    }

    get scale() {
        return this._stageZoomContainer.scale.x;
    }

    tween(props, seconds, ease, yoyo) {
        let tween = new CTween(this);
        if (!yoyo) {
            return tween.to(props, seconds, ease);
        } else {
            return tween.yoyo(props, seconds, ease);
        }
    }

    static load(resource, resourceUrl, options) {
        return loadAndTraceResource.call(this, resource, resourceUrl, options);
    }

    /**
     * Examples:
     * loadWebFont('google', 'Montserrat:700');
     * @param origin
     * @param family
     */
    static loadFont(origin, family) {
        loadWebFont(origin, family);
    }

    destroy() {
        this._controllers.forEach(controller => controller.destroy());
        super.destroy();
        if (_instance) {
            _instance._app.stop();
            _instance = null;
        }
        _instance = undefined;
        reset();
    }

    get physics() {
        return this._physics;
    }

    get sound() {
        if (!this._sound) {
            this._sound = this.addController(new CSoundCtrl());
        }
        return this._sound;
    }

    get options() {
        return this._options;
    }

    get children() {
        return this._childrenContainer.children.filter(child => child._childObject).map(child => child._childObject);
    }

    static childById(id) {
        let found = CStage.get()._childrenContainer.children.find(child => {
            if (child._childObject && id === child._childObject.id) return true;
        });
        if (found) return found._childObject;
        if (id === CStage.get().mouse.id) {
            return CStage.get().mouse;
        }
    }

    get _screen() {
        return this._screenContainer;
    }

    get width() {
        return this.stageRect.width;
    }

    get height() {
        return this.stageRect.height;
    }

    setBackground(source, type = 'cover') {
        setBackground.call(this, source, type);
    }


    on(eventName, callback) {
        if (MOUSE_EVENTS.indexOf(eventName) >= 0) {
            this.physics._bindMouseEvent(eventName, callback);
        } else {
            super.on(eventName, callback);
        }
    }

    off(eventName, callback) {
        if (MOUSE_EVENTS.indexOf(eventName) >= 0) {
            this.physics._unbindMouseEvent(eventName, callback);
        } else {
            super.off(eventName, callback);
        }
    }

    onClick(callback) {
        this.on('click', callback);
    }

    onPointerDown(callback) {
        this.on('pointerdown', callback);
    }

    onPointerUp(callback) {
        this.on('pointerup', callback);
        this.on('pointerupoutside', callback);
    }

    onPointerMove(callback) {
        this.on('pointermove', callback);
    }


    isKeyPressed(key) {
        return this._keyManager.isKeyPressed(key);
    }
    /**
     *
     * @param key optional
     * @param callback
     */
    onKeyPress(key, callback) {
        this._keyManager.onKeyEvent('keypress', this, key, callback);
    }

    onKeyDown(key, callback) {
        this._keyManager.onKeyEvent('keydown', this, key, callback);
    }

    onKeyUp(key, callback) {
        this._keyManager.onKeyEvent('keyup', this, key, callback);
    }


    _on(eventName, context, callback) {
        this.on(eventName, event => callback.call(context, event));
    }


    broadcast(eventName) {
        this.emit(eventName);
    }


    /**
     * Overridden
     * @param deltaSec
     */
    _frame(deltaSec) {
        this._dummy += deltaSec;
        this.emit('frame', deltaSec);
        if (this._penCanvas.changed) {
            this._penCanvas.setCanvasChanged();
            this._penCanvas.changed = false;
        }
        TWEEN.update(TWEEN.now());
        this._nextFrameCallbacks.forEach(cb => cb.call(this));
        this._nextFrameCallbacks = [];

        this.physics._update(deltaSec);
    }

    get timer() {
        return this._app.ticker.lastTime / 1000;
    }

    get fps() {
        return this._app.ticker.FPS;
    }

    get stageRect() {
        let screenRect = this._app.screen;
        let topLeft = new CPoint(screenRect.left, screenRect.top);
        let bottomRight = new CPoint(screenRect.right, screenRect.bottom);
        // this._app.stage.toLocal(topLeft, this._app.stage, true);
        // this._app.stage.toLocal(bottomRight, this._app.stage, true);
        this._stageContainer.worldTransform.applyInverse(topLeft, topLeft);
        this._stageContainer.worldTransform.applyInverse(bottomRight, bottomRight);
        let rect = CRect.createFromPoints(topLeft, bottomRight);
        rect.normalize();
        return rect;

    }
    /**
     * Usage:
     *  await stage.nextFrame();
     *
     *  stage.nextFrame().then(() => ...);
     *
     *  stage.nextFrame(function() {
     *  });
     * @param callback
     * @returns {Promise}
     */

    nextFrame(callback) {
        var self = this;
        return new Promise(function(resolve) {
            self._nextFrameCallbacks.push(function() {
                resolve();
            });
        });
    }

    addController(controller) {
        ASSERT.isInstanceOf(CController, controller, 'controller');
        this._controllers.push(controller);
        controller.__target = this;
        return controller;
    }

    watch(x, y, name, callback) {
        var font = this.options.watchFont || "16px Arial";
        var fontHeight = parseInt(font, 10);
        if (!fontHeight) {
            fontHeight = 20;
        }
        var nameFontFill = this.options.watchNameFontFill || 'white';
        var valueFontFill = this.options.watchValueFontFill || 'black';
        var watchFill = this.options.watchFill || 'blue';

        var watch = CanvasSprite.create();
        watch.name = name;
        watch.x = x;
        watch.y = y;
        watch.timer = setInterval(() => {
            var value = callback();
            if (value === watch._lastText) {
                return;
            }
            watch._lastText = value;
            var canvas = watch.canvas;
            var c = canvas.getContext("2d");
            c.font = font;
            var nameWidth = c.measureText(name).width;
            var valueWidth = c.measureText(value).width;
            var w = 15 + nameWidth + valueWidth;
            var h = 8 + fontHeight;
            canvas.width = w;
            canvas.height = h;
            c.font = font;
            c.beginPath();
            c.moveTo(5, 0);
            c.lineTo(w-5, 0);
            c.quadraticCurveTo(w, 0, w, 5);
            c.lineTo(w, h-5);
            c.quadraticCurveTo(w, h, w-5, h);
            c.lineTo(5, h);
            c.quadraticCurveTo(0, h, 0, h-5);
            c.lineTo(0, 5);
            c.quadraticCurveTo(0, 0, 5, 0);
            c.fillStyle = watchFill;
            c.fill();
            c.textBaseline = "top";
            c.fillStyle = nameFontFill;
            c.fillText(name, 2, 2);
            watch.setCanvasChanged();
            c.fillStyle = "white";
            c.fillRect(nameWidth + 5, 1, valueWidth + 5, h-2);
            c.fillStyle = valueFontFill;
            c.fillText(value, nameWidth + 7, 2);
            let pos = watch.getGlobalPosition();
        }, 200);
        this._watchContainer.addChild(watch);
    };

    removeWatch(name) {
        var children = this._watchContainer.children.slice();
        for (var child in children) {
            if (child.name === name) {
                this._watchContainer.removeChild(child);
            }
        }
    };

    get mouse() {
        return CMouse.instance;
    }

}


function setOrigin() {
    let screen = this._app.screen;
    this._stageZoomContainer.position = {
        x: screen.width / 2,
        y: screen.height / 2,
    };


    let origin = this._options.origin;
    if (origin === 'topleft') {
        origin = {x: -screen.width / 2, y: -screen.height / 2};
    }
    if (origin === 'center') {
        origin = {x: 0, y: 0};
    }
    let stage = this._stageContainer;
    if (origin) {
        stage.position = origin;
        this._backgroundContainer.position = {
            x: -origin.x,
            y: -origin.y
        };
    }
    this._stageZoomContainer.updateTransform();
}

function setBackground(source, type = 'cover') {
    loadAndTraceResource(source, source).then((result) => {
        this._backgroundContainer.removeChildren();
        this._staticBackgroundContainer.removeChildren();
        this._tiling = false;
        let texture = PIXI.Texture.fromImage(source);
        switch (type) {
            case 'cover': {
                let sprite = new PIXI.Sprite(texture);
                let bkRatio = this._app.screen.width / this._app.screen.height;
                let tRatio = texture.width / texture.height;
                let scale;
                if (bkRatio > tRatio) {
                    scale = this._app.screen.width / texture.width;
                } else {
                    scale = this._app.screen.height / texture.height;
                }
                sprite.x = -texture.width / 2;
                sprite.y = -texture.height / 2;
                sprite.scale = new CPoint(scale, scale);
                this._backgroundContainer.addChild(sprite);
                break;
            }
            case 'tiling': {
                let sprite = new PIXI.extras.TilingSprite(texture, this._app.screen.width, this._app.screen.height);
                sprite.anchor = {x: 0.5, y: 0.5};
                sprite.x = this._app.screen.width / 2;
                sprite.y = this._app.screen.height / 2;
                sprite.tileOffset = {
                    x: (this._app.screen.width - texture.width) / 2
                };
                this._staticBackgroundContainer.addChild(sprite);
                updateTiling.call(this);
                break;
            }
        }
    });
}


function updateTiling() {

    for (let child of this._staticBackgroundContainer.children) {

        if (child.tileScale && child.tilePosition) {
            let factor = this.scale;
            child.tileScale.x = factor;
            child.tileScale.y = factor;
            child.tilePosition.x = (this._stageContainer.x - child.texture.width / 2) * factor + this._app.screen.width / 2;
            child.tilePosition.y = (this._stageContainer.y - child.texture.height / 2) * factor + this._app.screen.height / 2;
        }
    }

}