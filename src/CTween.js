
import TWEEN from 'tween.js';
import CStage from './CStage';

const EASE = {
    linear: TWEEN.Easing.Linear.None,
    quadIn: TWEEN.Easing.Quadratic.In,
    quadOut: TWEEN.Easing.Quadratic.Out,
    quadInOut: TWEEN.Easing.Quadratic.InOut,
    cubicIn: TWEEN.Easing.Cubic.In,
    cubicOut: TWEEN.Easing.Cubic.Out,
    cubicInOut: TWEEN.Easing.Cubic.InOut,
    quartIn: TWEEN.Easing.Quartic.In,
    quartOut: TWEEN.Easing.Quartic.Out,
    quartInOut: TWEEN.Easing.Quartic.InOut,
    quintIn: TWEEN.Easing.Quintic.In,
    quintOut: TWEEN.Easing.Quartic.Out,
    quintInOut: TWEEN.Easing.Quartic.InOut,
    sinusIn: TWEEN.Easing.Sinusoidal.In,
    sinusOut: TWEEN.Easing.Sinusoidal.Out,
    sinusInOut: TWEEN.Easing.Sinusoidal.InOut,
    expIn: TWEEN.Easing.Exponential.In,
    expOut: TWEEN.Easing.Exponential.Out,
    expInOut: TWEEN.Easing.Exponential.InOut,
    circIn: TWEEN.Easing.Circular.In,
    circOut: TWEEN.Easing.Circular.Out,
    circInOut: TWEEN.Easing.Circular.InOut,
    elasticIn: TWEEN.Easing.Elastic.In,
    elasticOut: TWEEN.Easing.Elastic.Out,
    elasticInOut: TWEEN.Easing.Elastic.InOut,
    backIn: TWEEN.Easing.Back.In,
    backOut: TWEEN.Easing.Back.Out,
    backicOut: TWEEN.Easing.Back.InOut,
    bounceIn: TWEEN.Easing.Bounce.In,
    bounceOut: TWEEN.Easing.Bounce.Out,
    bounceInOut: TWEEN.Easing.Bounce.InOut,
};

export default class CTween {

    // Simple wrapper for CREATEJS.Tween

    constructor(target) {
        this._target = target;
        this._tween = new TWEEN.Tween(target);
    }

    to(props, seconds, ease) {
        return this._doTween(
            this._tween
                .to(props, 1000 * seconds)
                .easing(EASE[ease || 'linear'])
        );
    }

    /**
     * Implement yoyo correcyly. Avoid bug in tween.js
     * @param props
     * @param seconds
     * @param ease
     * @returns {*}
     */
    yoyo(props, seconds, ease) {
        let lastK = 0;
        let repeat = 0;
        return this._doTween(
            this._tween
                .to(props, 1000 * seconds / 2)
                .repeat(1)
                .easing(k => {
                    if (k < lastK - 0.7) repeat++;
                    lastK = k;
                    return EASE[ease || 'linear'](repeat ? 1-k : k);
                })
        );
    }

    stop() {
        this._tween.stop()
        this._tween.stopChainedTweens();
    }

    _doTween(tween) {
        return new Promise(resolve => tween
                .onComplete(resolve)
                .onStop(resolve)
                // .onStart(() => console.log('started'))
                // .onUpdate((a, b, c) => console.log("Update " + a + ", " + b + " " + c))
                .start());
    }
}