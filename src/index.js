//import * as PIXI from '../lib/es6/pixi.js/index';
import * as PIXI from 'pixi.js';
import { fixPixi } from './fixes/pixijs_fixes';

import wrapErrors from './misc/errorwrapper';

fixPixi();

// Prevent adding event to autoStart ticker
PIXI.ticker.shared.autoStart = false;

PIXI.loader.reset();

import CStage from './CStage';
import CSprite from './CSprite';
import CGraphics from './CGraphics';
import CMouse from './CMouse';
import CMath from './CMath';
import CText from './CText';
import {CJoint, CMotorizedJoint, CRotatingJoint, CWeldJoint, CSlidingJoint} from './CJoint';
import { ASSERT } from './misc/util';

export {
    CStage,
    CSprite,
    CGraphics,
    CText,
    CMouse,
    CMath,
    CJoint,
    CMotorizedJoint,
    CRotatingJoint,
    CWeldJoint,
    CSlidingJoint,
    ASSERT
}

