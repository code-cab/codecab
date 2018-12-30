import * as PIXI from 'pixi.js';
import {ASSERT} from './misc/util';
import * as MouseEvents from './impl/mouse-events';

import EventEmitter from 'eventemitter3';

class DestroyedError extends Error {
    constructor(message) {
        super(message);
    }
}
/**
 * Contains typical common Scratch functions
 */
export default class CObject extends EventEmitter {
    constructor(delayedStart) {
        super();
        this._destroyed = false;
        this.__notStarted = true;
        if (!delayedStart) {
            this.__doStart();
        }
        this._frameCallbacks = [];
        this._promisesSet = new Set();
        this._eventMap = {};
    }

    destroy() {
        let self = this;
        this._destroyed = true;
        this._promisesSet.forEach(reject => {
            reject(new DestroyedError('Object destroyed'));
        });
        // this._frameCallbacks.forEach(callback => PIXI.ticker.shared.remove(callback, self));
        this.removeAllListeners();
    }

    /**
     * Create managed Promise. This means that all pending promises will be rejected when this object is destroyed.
     *
     * @param callback
     */
    promise(callback) {
        let self = this;
        if (this._destroyed) return Promise.reject("Object is destroyed");
        return new Promise((resolve, reject) =>{
            self._promisesSet.add(reject);
            callback.call(self, arg => {
                self._promisesSet.delete(reject);
                resolve(arg);
            }, arg => {
                self._promisesSet.delete(reject);
                reject(arg);
            })
        });
    }

    __doStart() {
        if (this.__notStarted) {
            delete this.__notStarted;
            PIXI.ticker.shared.addOnce(delta => this.emit('start'), this, 0 /* UPDATE_PRIORITY.NORMAL */);
        }
    }

    onStart(callback) {
        super.on('start', callback);
    }

    on(eventName, callback) {
        if (eventName === 'frame') throw new Error("on('frame') is not supported. Use onFrame()")
        if (MouseEvents.isMouseEvent(eventName)) {
            if (this._eventMap[eventName] === undefined) {
                this._eventMap[eventName] = [];
            }
            this._eventMap[eventName].push(callback);
            MouseEvents.registerMouseEvent(eventName);
            // if (this.isNone()) {
            //     this.type = 'sensor';
            // }
        } else {
            super.on(eventName, callback);
        }
    }

    off(eventName, callback) {
        if (MouseEvents.isMouseEvent(eventName)) {
            if (this._eventMap[eventName]) {
                let i = this._eventMap[eventName].indexOf(callback);
                if (i >= 0) this._eventMap[eventName].splice(i, 1);
                if (!this._eventMap[eventName].length) {
                    delete this._eventMap[eventName];
                }
            }
            MouseEvents.unregisterMouseEvent(eventName, callback);
        } else {
            super.unbind(eventName, callback);
        }
    }

    onFrame(callback) {
        if (!callback || typeof callback !== 'function') throw new Error("No callback function provided");
        let self = this;
        let startTime = PIXI.ticker.shared.lastTime;

        function loop() {
            if (self._destroyed) return;
            let currentTime = PIXI.ticker.shared.lastTime;
            let prom = callback.call(self, (currentTime - startTime) * 0.001);
            startTime = currentTime;
            if (prom instanceof Promise) {
                prom.then(() =>  self.nextFrame().then(loop)).catch(e => {
                    if (!self._destroyed) throw e;
                });
            } else {
                self.nextFrame().then(loop).catch(e => {
                    if (!self._destroyed) throw e;
                });
            }
        }

        // Do not call directly but on next frame
        this.nextFrame().then(loop);

        let cb = () => {
            if (this._destroyed) return;
            if (!this.__notStarted) {
                let result = callback.call(this, PIXI.ticker.shared.elapsedMS / 1000);
            }
        };
    }

    /**
     * Returns promise with elapsed time
     * @returns {Promise.<*>}
     */
    nextFrame() {
        if (this._destroyed) return Promise.reject("Object is destroyed");
        let startTime = PIXI.ticker.shared.lastTime;
        return this.promise(resolve => {
           PIXI.ticker.shared.addOnce(() => resolve(PIXI.ticker.shared.lastTime - startTime), this, 0 /* UPDATE_PRIORITY.NORMAL */)
        });
    }

    delay(seconds) {
        return this.promise(resolve => {
            setTimeout(resolve, seconds * 1000);
        });
    }

    /**
     * Call 'callback' function 'forever'.
     * When done is not provided, the call is done every tick.
     * When done is provided, the next call is performed the next frame after 'done' has been called.
     *
     * When 'true' is returned, the forever looped is stopped
     *
     * @param callback: function(done) {}
     */
    forever(callback) {
        return this.promise((resolve, reject) => {
            if (!callback || typeof callback !== 'function') throw new Error("No callback function provided");
            let self = this;
            let startTime = PIXI.ticker.shared.lastTime;

            function loop() {
                if (self._destroyed) return;
                let currentTime = PIXI.ticker.shared.lastTime;
                let prom = callback.call(self, (currentTime - startTime) * 0.001);
                startTime = currentTime;
                if (prom instanceof Promise) {
                    prom.then(() => {
                        // Check if immediately resolved. If so, wait a frame
                        if (currentTime === PIXI.ticker.shared.lastTime) {
                            self.nextFrame().then(loop);
                        } else {
                            loop();
                        }
                    }).catch(e => {
                        if (!self._destroyed) throw e;
                    });

                } else {
                    self.nextFrame().then(loop).catch(e => {
                        if (!self._destroyed) throw e;
                    });
                }
            }
            loop();
        });
    }

    /**
     * Like forever but now limited to the count value or when 'true' is returned
     * @param count
     * @param callback
     */
    repeat(count, callback) {
        return this.promise((resolve, reject) => {

            let counter = 0;
            let self = this;
            if (!callback || typeof callback !== 'function') throw new Error("No callback function provided");
            function loop() {
                if (self._destroyed) return;
                if ((counter++) < count) {
                    let prom = callback.call(self);
                    let currentTime = PIXI.ticker.shared.lastTime;
                    if (prom instanceof Promise) {
                        prom.then(() => {
                            // Check if immediately resolved. If so, wait a frame
                            if (currentTime === PIXI.ticker.shared.lastTime) {
                                self.nextFrame().then(loop);
                            } else {
                                loop();
                            }
                        }).catch(reject);
                    } else {
                        self.nextFrame().then(loop);
                    }
                } else {
                    resolve();
                }
            }
            loop();
        });

    }

    /**
     * @palette Control
     * @block during () secs call ()
     * @param {Number} [2] seconds Period in seconds
     * @param {Sprite~nextUpdateCallback} fn Function to call
     */
    during(seconds, callback) {
        return this.promise((resolve, reject) => {
            let endTime = new Date().getTime() + 1000 * seconds;
            let self = this;
            if (!callback || typeof callback !== 'function') throw new Error("No callback function provided");
            function loop() {
                if (self._destroyed) return;
                let time = new Date().getTime();
                let currentTime = PIXI.ticker.shared.lastTime;
                if (time <= endTime) {
                    let prom = callback.call(self);
                    if (prom instanceof Promise) {
                        prom.then(() => {
                            // Check if immediately resolved. If so, wait a frame
                            if (currentTime === PIXI.ticker.shared.lastTime) {
                                self.nextFrame().then(loop);
                            } else {
                                loop();
                            }
                        }).catch(reject);
                    } else {
                        self.nextFrame().then(loop);
                    }
                } else {
                    resolve();
                }
            }
            loop();
        });
    };

}