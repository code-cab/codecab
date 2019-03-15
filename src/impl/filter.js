import * as PixiFilters from 'pixi-filters';
import CPoint from '../CPoint';
import CStage from '../CStage';

/**
 * Define all possible filters.
 * Try to set amount range between (-100 - 100)
 *
 * Note that the filters won't adapt when sprite is scaled.
 * This is on purpose 1) to keep it simple but 2) can be a nice glitch to use practically (f.e. move the offset)
 *
 * @type {{ascii: {create: (()=>PIXI.filters.AsciiFilter), amount: ((p1:*, p2:*)=>*)}, blur: {create: (()), amount: ((p1:*, p2:*)=>*)}}}
 */

const filters = {
    ascii: {
        create: () => new PixiFilters.AsciiFilter(),
        amount: (filter, amount) => filter.size = Math.abs(amount)
    },
    alpha: {
        create: () => new PIXI.filters.AlphaFilter(),
        amount: (filter, amount) => filter.alpha = Math.abs(amount) / 100
    },
    bevel: {
        create: () => new PixiFilters.BevelFilter({
            rotation: 45,
            thickness: 3,
            lightColor: 0xffffff,
            lightAlpha: 0.5,
            shadowColor:0x0,
            shadowAlpha: 0.5
        }),
        amount: (filter, amount) => {
            filter.thickness = Math.abs(amount)
            filter.rotation = amount > 0 ? 45 : 225;
        }
    },
    bloom: {
        create: () => {
            let f = new PixiFilters.AdvancedBloomFilter({
                threshold: 0.5,
                bloomScale: 1.2,
                brightness: 1,
                brightness: 1,
                blur: 8,
                quality: 4
            });
            f.padding = 100;
            return f;
        },
        amount: (filter, amount) => filter.threshold = Math.abs(amount) / 100
    },
    blur: {
        create: () => new PIXI.filters.BlurFilter(),
        amount: (filter, amount) => filter.blur = Math.abs(amount)
    },
    bulge: {
        create: (pixiObject) => {
            let s = calcSquareSizes(pixiObject, 25);
            let f = new PixiFilters.BulgePinchFilter({x: 0.5, y: 0.5},
                s.maxRad,
                0.5);
            f.padding = s.padding;
            return f},
        amount: (filter, amount) => filter.strength = amount / 100,
    },
    convolution: {
        create: () => {
            let f = new PixiFilters.ConvolutionFilter([0,0,0,1,1,1,0,0,0], 300, 300);
            f.padding = 400;
            return f;
        },
        amount: (filter, amount) => filter.height = filter.width = Math.abs(amount) * 5
    },
    crossHatch: {
        create: () => new PixiFilters.CrossHatchFilter(),
        amount: (filter, amount) => {}
    },
    crt: {
        create: () => new PixiFilters.CRTFilter({
            curvature: 1,
            lineWidth: 3,
            lineContrast: 0.2,
            verticalLine: 0,
            noise: 0.2,
            noiseSize: 1,
            seed: 0,
            vignetting: 0.3,
            vignettingAlpha: 1,
            vignettingBlur: 0.3,
            time: 0.5

        }),
        amount: (filter, amount) => filter.lineContrast = filter.noise = Math.abs(amount) / 100,
        animate: (filter, dt) => {
            filter.seed = Math.random();
            filter.time += 0.5;
        }
    },
    dot: {
        create: () => new PixiFilters.DotFilter(0.5),
        amount: (filter, amount) => filter.scale = Math.abs(amount) / 100
    },
    emboss: {
        create: () => new PixiFilters.EmbossFilter(3),
        amount: (filter, amount) => {
            filter.strength = amount / 8
        }
    },
    glow: {
        create: () => {
            let f = new PixiFilters.GlowFilter(20, 0, 3);
            f.padding = 100;
            return f;
        },
        amount: (filter, amount) => {
            if (amount > 0) {
                filter.innerStrength = Math.abs(amount) / 10;
                filter.outerStrength = Math.abs(amount) / 10;
            } else {
                filter.innerStrength = 0;
                filter.outerStrength = Math.abs(amount) / 5;
            }
        }
    },
    godray: {
        create: () => new PixiFilters.GodrayFilter({
            angle: 30 ,
            center: {x: 100, y: -100},
            parallel: true,
            gain: 0.7,
            lacunarity: 3,
            time: 0
        }),
        amount: (filter, amount) => filter.lacunarity = Math.abs(amount) / 20,
        animate: (filter, dt) => filter.time = CStage.get().timer
    },
    noise: {
        create: () => {let f = new PIXI.filters.NoiseFilter(); f.seed = 0.5; f.noise = 0.5; return f;},
        amount: (filter, amount) => filter.noise = Math.abs(amount) / 10
    },
    oldFilm: {
        create: () => new PixiFilters.OldFilmFilter({
            sepia: 0.35,
            noise: 0.25,
            noiseSize: 1,
            scratch: 0.25,
            scratchDensity: 0.3,
            scratchWidth: 1,
            vignetting: 0.17,
            vignettingAlpha: 1,
            vignettingBlur: 0.8
        }),
        amount: (filter, amount) => filter.sepia = Math.abs(amount) / 100,
        animate: (filter, dt) => filter.seed = Math.random()
    },
    outline: {
        create: () => {
            let f = new PixiFilters.OutlineFilter(2, 0x0, 0.25);
            f.padding = 100;
            return f;
        },
        amount: (filter, amount) => filter.thickness = Math.abs(amount) / 5,
    },
    pixelate: {
        create: () => new PixiFilters.PixelateFilter({x: 10, y: 10}),
        amount: (filter, amount) => filter.size.x = filter.size.y = Math.abs(amount),
    },
    radialBlur: {
        create: (pixiObject) => {
            let s = calcSquareSizes(pixiObject, 25);
            if (isStage(pixiObject)) {
                s.pt = calcShockwavePosition(pixiObject);
            }
            let f = new PixiFilters.RadialBlurFilter(25, s.pt, 25, s.maxRad);
            f.padding = s.padding;
            return f;
        },
        amount: (filter, amount) => filter.angle = 1.8 * amount ,
    },
    reflection: {
        create: (pixiObject) => {
            let padding = pixiObject.height;
            let f = new PixiFilters.ReflectionFilter({
                mirror: true,
                boundary: isStage(pixiObject) ? 1/2 : 2/3,
                amplitude: [0, 20],
                waveLength: [30, 100],
                alpha: [1, 1],
                time: 0
            });
            f.padding = isStage(pixiObject) ? 0 : padding;
            return f;
        },
        amount: (filter, amount) => filter.amplitude[1] = Math.abs(amount) / 2,
        animate: (filter) => {
            filter.time += 0.1;
        }
    },
    rgbSplit: {
        create: () => new PixiFilters.RGBSplitFilter({x: -10, y: 0}, {x: 0, y: 0}, {x: 0, y: 10}),
        amount: (filter, amount) => {
            function val(wave) {
                return (wave * amount) % 20;
            }
            filter.red.x = val(1);
            filter.green.x = val(2);
            filter.blue.x = val(4);
            filter.red.y = val(8);
            filter.green.y = val(16);
            filter.blue.y = val(32);
        },
    },
    shockwave: {
        create: (pixiObject) => {
            let pt = calcShockwavePosition(pixiObject);
            let f = new PixiFilters.ShockwaveFilter(pt, {
                amplitude: 30,
                wavelength: 160,
                brightness: 1,
                speed: CStage.get().options.shockwaveEffectSpeed,
                radius: CStage.get().width
            });
            return f;
        },
        amount: (filter, amount) => {
            let pt = calcShockwavePosition(filter.__pixiObject);
            const obj = CStage.get()._stageContainer;
            filter.center = pt;
            filter.amplitude = Math.abs(amount);
            filter.time = 0;
        },
        animate: (filter, dt) => {
            filter.time += dt;
        }
    },
    twist: {
        create: (pixiObject) => {
            let pt = calcShockwavePosition(pixiObject);
            let s = calcSquareSizes(pixiObject, 25);
            let f = new PixiFilters.TwistFilter();
            f.offset.x = pt.x;
            f.offset.y = pt.y;
            f.radius = s.maxRad;
            f.angle = 7.5;
            f.padding = s.padding;
            return f;
        },
        amount: (filter, amount) => filter.angle = amount / 5,
        animate: (filter, dt) => {
            let pt = calcShockwavePosition(filter.__pixiObject);
            filter.offset.x = pt.x;
            filter.offset.y = pt.y;
        }
    },
    gamma: {
        create: () => new PixiFilters.AdjustmentFilter({
            gamma: 1,
            contrast: 1,
            saturation: 1,
            brightness: 1,
            red: 1,
            green: 1,
            blue: 1,
            alpha: 1
        }),
        amount: (filter, amount) => filter.gamma = Math.abs(amount) / 20
    },
    contrast: {
        create: () => new PixiFilters.AdjustmentFilter({
            gamma: 1,
            contrast: 1,
            saturation: 1,
            brightness: 1,
            red: 1,
            green: 1,
            blue: 1,
            alpha: 1
        }),
        amount: (filter, amount) => filter.contrast = Math.abs(amount) / 20
    },
    saturation: {
        create: () => new PixiFilters.AdjustmentFilter({
            gamma: 1,
            contrast: 1,
            saturation: 1,
            brightness: 1,
            red: 1,
            green: 1,
            blue: 1,
            alpha: 1
        }),
        amount: (filter, amount) => filter.saturation = Math.abs(amount) / 20
    },
    brightness: {
        create: () => new PixiFilters.AdjustmentFilter({
            gamma: 1,
            contrast: 1,
            saturation: 1,
            brightness: 1,
            red: 1,
            green: 1,
            blue: 1,
            alpha: 1
        }),
        amount: (filter, amount) => filter.brightness = Math.abs(amount) / 20
    },
    red: {
        create: () => new PixiFilters.AdjustmentFilter({
            gamma: 1,
            contrast: 1,
            saturation: 1,
            brightness: 1,
            red: 1,
            green: 1,
            blue: 1,
            alpha: 1
        }),
        amount: (filter, amount) => filter.red = Math.abs(amount) / 20
    },
    green: {
        create: () => new PixiFilters.AdjustmentFilter({
            gamma: 1,
            contrast: 1,
            saturation: 1,
            brightness: 1,
            red: 1,
            green: 1,
            blue: 1,
            alpha: 1
        }),
        amount: (filter, amount) => filter.green = Math.abs(amount) / 20
    },
    blue: {
        create: () => new PixiFilters.AdjustmentFilter({
            gamma: 1,
            contrast: 1,
            saturation: 1,
            brightness: 1,
            red: 1,
            greem: 1,
            blue: 1,
            alpha: 1
        }),
        amount: (filter, amount) => filter.blue = Math.abs(amount) / 20
    },



};

export function clearFilters(pixiObject) {
    if (!pixiObject.filters) return;
    for (let filter of pixiObject.filters) {
        delete filter.__pixiObject;
    }
    pixiObject.filters = [];
}

export function setFilter(pixiObject, name, amount) {
    let obj = pixiObject;
    let filterOnStage = false;

    if (name === 'shockwave') {
        filterOnStage = true;
        obj = CStage.get()._stageContainer;
    }

    if (!filters[name]) {
        throw new Error("Invalid filter effect name " + name);
    }
    if (!obj.filters) {
        obj.filters = [];
        CStage.get().onFrame(function(dt) {
            if (obj.filters) {
                for (let f of obj.filters) {
                    if (f.__filterName && filters[f.__filterName].animate) {
                        filters[f.__filterName].animate(f, dt);
                    }
                }
            }
        });
    }

    let filter;
    for (let f of obj.filters) {
        if (f.__filterName === name)  {
            filter = f;
            break;
        }
    }

    if (!filter) {
        filter = filters[name].create(pixiObject);
        filter.__filterName = name;
        filter.__pixiObject = pixiObject;
        let _filters = obj.filters;
        _filters.push(filter);
        obj.filters = _filters;
    }

    if (amount !== undefined) {
        filters[name].amount(filter, amount);
    }
    return filter;
}

/**
 * Calculare padding and stuff to allow full rotation including margin
 *
 * @param pixiObject
 * @param margin
 * @returns {{padding: *, size: *, pt: {x: number, y: number}, minRad: number, maxRad: number}}
 */
function calcSquareSizes(pixiObject, margin) {
    let padding;
    let w = pixiObject.width;
    let h = pixiObject.height;
    let cx, cy;

    if (isStage(pixiObject)) {
        padding = 0;
    } else if (w > h ) {
        padding = (w + 2 * margin - h) / 2;
    } else {
        padding = (h + 2 * margin - w) / 2;
    }

    cx = (w + 2 * padding) / 2;
    cy = (h + 2 * padding) / 2;

    return {
        padding: padding,
        pt: {x: cx, y: cy},
        minRad: Math.min(w, h) / 2,
        maxRad: Math.max(w, h) / 2
    }
}


function calcShockwavePosition(pixiObject) {
    let obj = CStage.get()._stageContainer;
    let pt = {x: pixiObject.x, y: pixiObject.y};
    // pixiObject.worldTransform.apply(pt, pt);
    obj.worldTransform.apply(pt, pt);
    // pt.x += obj.width / 2;
    // pt.y += obj.height / 2;
    return pt;
}

function isStage(pixiObject) {
    return  pixiObject === CStage.get()._stageContainer;
}