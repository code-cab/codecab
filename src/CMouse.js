// import * as PIXI from '../lib/es6/pixi.js/index';
import * as PIXI from 'pixi.js';
import CObject from './CObject';
import CStage from './CStage';

let FAR_AWAY = -1000000;

let instance;
export default class CMouse extends CObject {
    constructor() {
        super();
        instance = this;
        this.id = 'mouse';
        this.stage = CStage.get();
        this.stage._stageContainer.interactive = true;
        this.stage._stageContainer.on('pointermove', event => {
            this._lastPosition = event.data.global;
        });
    }

    static get instance() {
        if (!instance) {
            instance = new CMouse();
        }
        return instance;
    }

    get position() {
        if (!this._lastPosition) {
            return {x: FAR_AWAY, y: FAR_AWAY};
        }
        let point = this.stage._stageContainer.toLocal(this._lastPosition);
        return point;
    }

    get x() {
        return this.position.x;
    }

    get y() {
        return this.position.y;
    }

    get worldPosition() {
        let pt = this.position;
        return {
            x: pt.x / this.stage._options.pixelsPerMeter,
            y: pt.y / this.stage._options.pixelsPerMeter
        }
    }

    get worldX() {
        return this.worldPosition.x;
    }

    get worldY() {
        return this.worldPosition.y;
    }
}

