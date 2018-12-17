import {deg2rad, rad2deg} from './misc/math';

const PI180 = Math.PI/180;
export default class CMath {
    /**
     * Return whole integer between min and max, including max.
     *
     * @param min
     * @param max
     * @returns {number}
     */
    static randomBetween(min, max) {
        min = Math.round(min);
        max = Math.round(max);
        let r = Math.random();
        return Math.min(Math.floor(r * (max - min + 1)) + min, max);
    }

    static round(value) {
        return Math.round(value);
    }

    static floor(value) {

    }

    static abs(value) {
        return Math.abs(value);
    }

    static square(value) {
        return value * value;
    }

    static sqrt(value) {
        return Math.sqrt(value);
    }

    static sin(degrees) {
        return Math.sin(degrees * PI180);
    }

    static cos(degrees) {
        return Math.cos(degrees * PI180);
    }

    static tan(degrees) {
        return Math.tan(degrees * PI180);
    }

    static asin(value) {
        return Math.asin(value) / PI180;
    }

    static acos(value) {
        return Math.acos(value) / PI180;
    }

    static atan(value) {
        return Math.atan(value) / PI180;
    }

    static atan2(x, y) {
        return Math.atan2(x, y) / PI180;
    }

    static ln(value) {
        return Math.log(value);
    }

    static log10(value) {
        return Math.log10(value);
    }

    static exp(value) {
        return Math.exp(value);
    }

    static pow10(value) {
        return Math.pow(value, 10);
    }
}