import * as CC from './index.js';
if (typeof window !== "undefined") {
    // Put CodeCab classes on window scope
    for (let key in CC) window[key] = CC[key];
}