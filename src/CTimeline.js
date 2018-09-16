import EventEmitter from 'eventemitter3';
import CStage from './CStage';

export default class CTimeline extends EventEmitter {
    constructor() {
        super();
        this._steps = [];
        this._starttimestamp = 0;
    }

    start() {
        this._starttimestamp = CStage.get().timestamp;
    }
}