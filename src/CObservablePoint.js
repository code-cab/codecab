export default class CObservablePoint {
    constructor(target, x = 0, y = 0) {
        this._target = target;
    }

    set(x, y) {
        this._target.position
    }

    get x() {
        return this._target.x;
    }

    get y() {
        return this._target.y;
    }

    set x(value) {
        this._target.x = value;
    }

    set y(value) {
        this._target.y = value;
    }
}