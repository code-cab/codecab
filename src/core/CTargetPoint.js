export default class CTargetPoint {

    /**
     *
     * @param target
     * @param setter (point) => {}
     * @param getter () => {x, y]
     */

    constructor(getter, setter) {
        this._getter = getter;
        this._setter = setter;
        this._tempPoint = {x:0, y: 0};
    }

    setPoint(point) {
        this._setter(point);
    }

    set(x, y) {
        this._tempPoint.x = x;
        this._tempPoint.y = y;
        this._setter(this._tempPoint);
    }

    get() {
        return this._getter();
    }

    copy() {
        let pt = this._getter();
        return {x: pt.x, y: pt.y};
    }

    set x(value) {
        let pt = this.get();
        pt.x = value;
        this.setPoint(pt);
    }

    set y(value) {
        let pt = this.get();
        pt.y = value;
        this.setPoint(pt);
    }

    get x() {
        return this.get().x;
    }

    get y() {
        return this.get().y;
    }
}