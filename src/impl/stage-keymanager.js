
export default class KeyManager {

    constructor(target) {
        this._target = target;
        this._keysDown = {};

        window.addEventListener('keypress', event => this._onKeyPress(event));
        window.addEventListener('keyup', event => this._onKeyUp(event));
        window.addEventListener('keydown', event => this._onKeyDown(event));
    }

    static get keyEventRegex() {
        return /(keypress|keydown|keystart)(\-.+)?$/;
    }

    isKeyEvent(event) {
        return event.match(/(keypress|keydown|keystart)(\-.+)?$/);
    }

    onKeyEvent(keyEventName, context, key, callback) {
        let eventName = keyEventName;
        if (typeof key === 'string') {
            if (key === ' ') key = 'Space';
            eventName += '-' + key;
        } else if (typeof key === 'function') {
            callback = key;
        }
        eventName = eventName.toLowerCase();
        this._target._on(eventName, context, callback);
    }

    _onKeyPress(event) {
        this._target.emit('keypress', event);
        this._target.emit('keypress-' + this._mapKey(event.key), event);

    }

    _onKeyDown(event) {
        this._keysDown[event.code] = true;
        this._target.emit('keydown', event);
        this._target.emit('keydown-' + this._mapKey(event.key), event);
    }

    _onKeyUp(event) {
        delete this._keysDown[event.code];
        this._target.emit('keyup', event);
        this._target.emit('keyup-' + this._mapKey(event.key), event);
    }

    isKeyPressed(key) {
        if (this._keysDown[code]) return true;
        return false;
    }

    _mapKey(key) {
        if (key === ' ') return 'space';
        return key.toLowerCase();
    }
}