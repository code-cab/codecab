export default class CColorUtil {
    static rgbaString(rgb, alpha) {
        return '"rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + alpha + ')"';
    }

    static rgb2hex(rgb)
    {
        return (((rgb[0] * 255) << 16) + ((rgb[1] * 255) << 8) + (rgb[2] * 255 | 0));
    }

    static hex2rgb(hex, out)
    {
        out = out || [];

        out[0] = ((hex >> 16) & 0xFF) / 255;
        out[1] = ((hex >> 8) & 0xFF) / 255;
        out[2] = (hex & 0xFF) / 255;

        return out;
    }

    /**
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes h, s, and l are contained in the set [0, 1] and
     * returns r, g, and b in the set [0, 255].
     *
     * @param   {number}  h       The hue
     * @param   {number}  s       The saturation
     * @param   {number}  l       The lightness
     * @return  {Array}           The RGB representation
     */
    static hsl2rgb(hsl){
        let h = hsl[0] / 255, s = hsl[1] / 255, l = hsl[2] / 255;
        var r, g, b;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            var hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1/6) return p + (q - p) * 6 * t;
                if(t < 1/2) return q;
                if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            }

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    /**
     * Converts an RGB color value to HSL. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes r, g, and b are contained in the set [0, 255] and
     * returns h, s, and l in the set [0, 1].
     *
     * @param   {number}  r       The red color value
     * @param   {number}  g       The green color value
     * @param   {number}  b       The blue color value
     * @return  {Array}           The HSL representation
     */
    static rgb2hsl(rgb){
        let r = rgb[0] / 255, g = rgb[1] / 255, b = rgb[2] / 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min){
            h = s = 0; // achromatic
        }else{
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max){
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h * 255, s * 255, l * 255];
    }
    // static rgb2hsv(rgb) {
    //     let r,g,b,h,s,v;
    //     r= rgb[0];
    //     g= rgb[1];
    //     b= rgb[2];
    //     let min = Math.min( r, g, b );
    //     let max = Math.max( r, g, b );
    //
    //
    //     v = max;
    //     let delta = max - min;
    //     if( max != 0 )
    //         s = delta / max;        // s
    //     else {
    //         // r = g = b = 0        // s = 0, v is undefined
    //         s = 0;
    //         h = -1;
    //         return [h, s, undefined];
    //     }
    //     if( r === max )
    //         h = ( g - b ) / delta;      // between yellow & magenta
    //     else if( g === max )
    //         h = 2 + ( b - r ) / delta;  // between cyan & yellow
    //     else
    //         h = 4 + ( r - g ) / delta;  // between magenta & cyan
    //     h *= 60;                // degrees
    //     if( h < 0 )
    //         h += 360;
    //     if ( isNaN(h) )
    //         h = 0;
    //     return [h,s,v];
    // }
    //
    // static hsv2rgb(hsv) {
    //     let i;
    //     let h,s,v,r,g,b;
    //     h= hsv[0];
    //     s= hsv[1];
    //     v= hsv[2];
    //     if(s === 0 ) {
    //         // achromatic (grey)
    //         r = g = b = v;
    //         return [r,g,b];
    //     }
    //     h /= 60;            // sector 0 to 5
    //     i = Math.floor( h );
    //     let f = h - i;          // factorial part of h
    //     let p = v * ( 1 - s );
    //     let q = v * ( 1 - s * f );
    //     let t = v * ( 1 - s * ( 1 - f ) );
    //     switch( i ) {
    //         case 0:
    //             r = v;
    //             g = t;
    //             b = p;
    //             break;
    //         case 1:
    //             r = q;
    //             g = v;
    //             b = p;
    //             break;
    //         case 2:
    //             r = p;
    //             g = v;
    //             b = t;
    //             break;
    //         case 3:
    //             r = p;
    //             g = q;
    //             b = v;
    //             break;
    //         case 4:
    //             r = t;
    //             g = p;
    //             b = v;
    //             break;
    //         default:        // case 5:
    //             r = v;
    //             g = p;
    //             b = q;
    //             break;
    //     }
    //     return [r,g,b];
    // }

}