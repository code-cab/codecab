import * as CC from './index.js';

if (typeof window !== "undefined") {
    window.CStage = CC.CStage;
    window.CSprite = CC.CSprite;
    window.CGroup = CC.CGroup;
    window.CText = CC.CText;
    window.CGraphics = CC.CGraphics;
    window.CMath = CC.CMath;
    window.CJoint = CC.CJoint;
    window.CMotorizedJoint = CC.CMotorizedJoint;
    window.CRotatingJoint = CC.CRotatingJoint;
    window.CWeldJoint = CC.CWeldJoint;
    window.CSlidingJoint = CC.CSlidingJoint;
}

