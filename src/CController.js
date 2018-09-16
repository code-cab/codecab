import {ASSERT} from './misc/util';

export default class CController {
    constructor() {
        this._target = undefined;
    }

    /**
     *
     * @param value
     * @private
     */
    set __target(value) {
        this._target = value;
    }

    get target() {
        return this._target;
    }

    destroy() {
    }

    set enable(value) {
    }
}