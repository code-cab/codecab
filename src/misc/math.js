"use strict";

export function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

export function rad2deg(rad) {
    return rad * (180 / Math.PI);
}

export function rangeDeg(deg) {
    var d = deg;
    while (d >= 360) {
        d -= 360;
    }
    while (d < 0) {
        d += 360;
    }
    return d;
}

export function round(value, digits) {
    if (typeof digits === 'undefined' || +digits === 0) {
        return Math.round(value);
    }
    value = +value;
    digits = +digits;
    if (isNaN(value) || !(typeof digits === 'number' && digits % 1 === 0)) {
        return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math.round(+(value[0] + 'e' + (value[1] ? (+value[1] - digits) : -digits)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + digits) : digits));
}

