import CController from './CController';
import * as PIXI from 'pixi.js';
require('pixi-sound');

export default class CSoundCtrl extends CController {
    constructor() {
        super();
        this._volume = 100;
        this._instances = [];
    }

    play(source) {
        return this.target.promise(resolve => {
            let instance = PIXI.sound.Sound.from({
                url: source,
                autoPlay: true,
                singleInstance: true,
                volume: this._volume * 0.01,
                complete: () => {
                    this._removeInstance(instance);
                    resolve();
                }
            });
            this._instances.push(instance);
        });
    }

    stopAll() {
        this._instances.forEach(instance => {
            instance.stop();
        });
        this._instances = [];
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
}