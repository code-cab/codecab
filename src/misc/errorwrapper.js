//import * as PIXI from '../../lib/es6/pixi.js/index';
import * as PIXI from 'pixi.js';
import EventEmitter from 'eventemitter3';

export default function(wrapErrors) {
    // PIXI.ticker.shared._tick = wrapErrors(PIXI.ticker.shared._tick);

    (function (p) {
        PIXI.ticker.Ticker.prototype.add = function(fn, context, priority) {
            return p.call(this, wrapErrors(fn), context, priority);
        };
    })(PIXI.ticker.Ticker.prototype.add);

    (function (p) {
        PIXI.ticker.Ticker.prototype.addOnce = function(fn, context, priority) {
            return p.call(this, wrapErrors(fn), context, priority);
        };
    })(PIXI.ticker.Ticker.prototype.addOnce);

    (function (p) {
        EventEmitter.prototype.on = function(event, fn, context) {
            return p.call(this, event, wrapErrors(fn), context);
        };
    })(EventEmitter.prototype.on);

    (function (p) {
        EventEmitter.prototype.once = function(event, fn, context) {
            return p.call(this, event, wrapErrors(fn), context);
        };
    })(EventEmitter.prototype.once);

    (function (p) {
        window.setTimeout = function(fn, timeout, ...params) {
            return p.call(this, wrapErrors(fn), timeout, params);
        }
    })(window.setTimeout);

    (function (p) {
        window.setInterval = function(fn, timeout, ...params) {
            return p.call(this, wrapErrors(fn), timeout, params);
        }
    })(window.setInterval);
    
    // (function (p) {
    //     EventTarget.prototype.addEventListener = function(type, listener, ...params) {
    //         return p.call(this, type, wrapErrors(listener), params);
    //     }
    // })(EventTarget.prototype.addEventListener);
}