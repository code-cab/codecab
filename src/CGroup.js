import CChildObject from './CChildObject';
import * as PIXI from 'pixi.js';

/**
 * Usage:
 * new CGroup(object|[object], options);
 *
 *
 * moveTo()
 * lineTo()
 * lineTo()
 * lineTo()
 * fill();
 */
export default class CGroup extends CChildObject {
    constructor(objects, options) {
        super();
        if (options && options.pixiObject) {
            // Use __pixiObject to avoid CGroup being added to childrenContainer
            this.__pixiObject = options.pixiObject;
        } else {
            this._pixiObject = new PIXI.Container();
        }
        this.add(objects);
        // this._anchor = new PIXI.ObservablePoint(this._onAnchorUpdate, this);

    }

    get children() {
        let children = [];
        for (let pixiChild of this._pixiObject.children) {
            if (pixiChild._childObject) children.push(pixiChild._childObject);
        }
        return children;
    }

    /**
     * @param objects Single CObject or array of objects
     */
    add(objects) {
        if (!objects) return;
        let objs = Array.isArray(objects) ? objects : [objects];
        for (let obj of objs) {
            if (!obj._pixiObject) return;
            // No bodies allowed in a group. Use constraints
            if (obj.body) obj.body.type = 'none';
            obj._pixiObject.parent.removeChild(obj._pixiObject);
            this._pixiObject.addChild(obj._pixiObject);
        }
    }

    /**
     * Remove objects from group and put them back to the CStage children container
     * @param objects
     */
    remove(objects) {
        let objs = Array.isArray(objects) ? objects : [objects];
        for (let obj of objs) {
            if (this._pixiObject.removeChild(obj._pixiObject)) {
                CStage.get()._childrenContainer.addChild(obj._pixiObject);
            }
        }
    }

    // get anchor() {
    //     return this._anchor
    // }
    //
    // set anchor(point) {
    //     this._anchor = point;
    // }
    //
    // _onAnchorUpdate() {
    //     this._pixiObject.anchor = this._anchor;
    // }

};
