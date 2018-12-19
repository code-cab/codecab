import CController from './CController';
import * as PIXI from 'pixi.js';
require('pixi-sound');


export default class CSoundCtrl extends CController {
    constructor() {
        super();
        this._volume = 100;
        this._instances = [];
    }

    play(source, startSec, endSec) {
        let self = this;
        if (self._cancel) self._cancel();
        return this.target.promise(resolve => {
            let sound = PIXI.loader.resources[source];
            if (!sound) {
                PIXI.loader.add(source, source);
                PIXI.loader.load((loader, resources) => {
                    sound = PIXI.loader.resources[source];
                    if (!sound) {
                        console.error("Unable to load " + source);
                        resolve();
                        return;
                    }
                    doPlay();
                });
            } else {
                doPlay();
            }
            function doPlay() {
                let options = {
                    start: startSec,
                    end: endSec
                };
                let instance = sound.sound.play(options);
                instance._cancel = () => {
                    instance.stop();
                    self._removeInstance(instance);
                    instance._cancel = undefined;
                    resolve();
                };
                instance.on('end', function() {
                    if (instance._cancel) instance._cancel();
                });
                self._instances.push(instance);
            }

            // let instance;
            //
            //
            //
            // instance = PIXI.sound.Sound.from({
            //     url: source,
            //     autoPlay: true,
            //     singleInstance: true,
            //     volume: this._volume * 0.01,
            //     complete: () => {
            //         if (instance._cancel) instance._cancel();
            //     },
            // });
        });
    }

    stopAll() {
        while (this._instances.length) {
            let i = this._instances.shift();
            if (i._cancel) i._cancel();
        }
    }

    set volume(percentage) {
        this._instances.forEach(instance => instance.volume = percentage * 0.01);
        this._volume = percentage;
    }

    get volume() {
        return this._volume;
    }

    _removeInstance(instance) {
        let i = this._instances.indexOf(instance);
        if (i >= 0) {
            this._instances.splice(i, 1);
        }
    }

    destroy() {
        super.destroy();
        this.stopAll();
    }
}