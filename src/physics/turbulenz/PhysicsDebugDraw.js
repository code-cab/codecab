import * as TURB from '../../../generate/lib/turbulenz/physics2ddevice'
import CStage from '../../CStage';

export class PhysicsDebugDraw {
    constructor(g) {
        this.g = g;
        this.pixelsPerMeter = CStage.get()._options.pixelsPerMeter;

        let o = this;

        o.circleMaxError = 0.4; //px
        o.curveMaxError = 0.6; //px
        o.spiralMaxArc = Math.PI / 4; // rad
        o.spiralEpsilon = 1e-5;
        o.spiralSpringSize = 0.75; // percentage of gap between spiral arms for spring.
        o._curveStack = [];
        o._curveVerts = [];

        o.minSpringLength = 0.5; // px

        var bulletColor                  = v4Build(1.0, 1.0, 1.0, 1.0);
        var staticColor                  = v4Build(1.0, 0.5, 0.5, 1.0);
        var staticSensorColor            = v4Build(0.9, 0.7, 0.7, 0.6);
        var kinematicColor               = v4Build(0.8, 0.3, 0.8, 1.0);
        var kinematicSensorColor         = v4Build(0.8, 0.4, 0.8, 0.6);
        var dynamicColor                 = v4Build(0.5, 1.0, 0.5, 1.0);
        var dynamicSensorColor           = v4Build(0.7, 0.9, 0.7, 0.6);
        var sleepingDynamicColor         = v4Build(0.5, 1.0, 0.5, 0.5);
        var sleepingDynamicSensorColor   = v4Build(0.7, 0.9, 0.7, 0.4);
        var sleepingKinematicColor       = v4Build(0.8, 0.4, 0.8, 0.5);
        var sleepingKinematicSensorColor = v4Build(0.8, 0.5, 0.8, 0.4);

        o.showConstraints               = true;
        o.constraintAnchorRadius        = 3.0;
        o.constraintSpringRadius        = 3.0;
        o.constraintSpringNumCoils      = 3;
        o.constraintSpiralMinRadius     = 10.0;
        o.constraintSpiralDeltaRadius   = (2.5 / Math.PI);
        o.constraintSpiralNumCoils      = 4;
        o.constraintColorA              = v4Build(1.0, 0.0, 0.0, 0.8);
        o.constraintSleepingColorA      = v4Build(0.7, 0.2, 0.2, 0.6);
        o.constraintColorB              = v4Build(0.0, 0.0, 1.0, 0.8);
        o.constraintSleepingColorB      = v4Build(0.2, 0.2, 0.7, 0.6);
        o.constraintColorC              = v4Build(0.0, 1.0, 0.0, 0.8);
        o.constraintSleepingColorC      = v4Build(0.2, 0.7, 0.2, 0.6);
        o.constraintColorD              = v4Build(1.0, 0.0, 1.0, 0.8);
        o.constraintSleepingColorD      = v4Build(0.7, 0.2, 0.7, 0.6);
        o.constraintErrorColorA         = v4Build(1.0, 1.0, 0.5, 0.8);
        o.constraintErrorSleepingColorA = v4Build(0.7, 0.7, 0.5, 0.6);
        o.constraintErrorColorB         = v4Build(0.5, 1.0, 1.0, 0.8);
        o.constraintErrorSleepingColorB = v4Build(0.5, 0.7, 0.7, 0.6);
        o.constraintErrorColorC         = v4Build(0.4, 1.0, 0.4, 0.8);
        o.constraintErrorSleepingColorC = v4Build(0.4, 0.7, 0.4, 0.6);
        o.constraintErrorColorD         = v4Build(1.0, 0.4, 1.0, 0.8);
        o.constraintErrorSleepingColorD = v4Build(0.7, 0.4, 0.7, 0.6);

        o.showContacts         = false;
        o.showContactImpulses  = false;
        o.contactRadius        = 3.0;
        o.contactImpulseScale  = 30.0;
        o.dynamicContactColor  = v4Build(1.0, 0.0, 0.5, 0.7);
        o.staticContactColor   = v4Build(0.5, 0.0, 1.0, 0.7);
        o.normalImpulseColor   = v4Build(1.0, 0.0, 0.0, 1.0);
        o.frictionImpulseColor = v4Build(0.0, 0.0, 1.0, 1.0);

        o.showRigidBodies    = true;
        o.showColliderShapes = true;
        o.showSensorsShapes   = true;
        o.showBodyDetail     = false;
        o.showShapeDetail    = false;
        o.bodyPositionRadius = 0.5;
        o.circleOriginRadius = 0.5;
        o.bodyDetailColor    = v4Build(0.0, 1.0, 1.0, 0.5);
        o.shapeDetailColor   = v4Build(1.0, 1.0, 0.0, 0.5);

        o.screenToPhysics2D = 1/this.pixelsPerMeter;
    }

    _drawAnchor(x, y, rad, color)
    {
        // 'emulates' a filled circle.
        this.drawFilledCircle(x, y, rad, color);
    }

    _drawAngleIndicator(x, y, ang, rad, size, color)
    {
        var cos = Math.cos(ang);
        var sin = Math.sin(ang);
        this._drawAnchor(x + (rad * cos), y + (rad * sin), size, color);
    }

    drawFilledCircle(x, y, rad, color) {
        let pixelsPerMeter = this.pixelsPerMeter;
        this.g.lineWidth = 0;
        this.g.beginFill(rgb(color), 1);
        this.g.drawCircle(x * pixelsPerMeter, y * pixelsPerMeter, rad * pixelsPerMeter);
        this.g.endFill();
    }

    drawCurve(x1, y1, cx, cy, x2, y2, color) {
        let p = this.pixelsPerMeter;
        this.g.lineStyle(1, rgb(color));
        this.g.moveTo(x1 * p, y1 * p);
        this.g.quadraticCurveTo(cx * p, cy * p, x2 * p, y2 * p);
        // this.drawLine(x1, y1, x2, y2, color);
    }

    drawLine(x1, y1, x2, y2, color) {
        let p = this.pixelsPerMeter;
        this.g.lineStyle(1, rgb(color));
        this.g.moveTo(x1 * p, y1 * p);
        this.g.lineTo(x2 * p, y2 * p);
    }

    drawLinearSpring(x1, y1, x2, y2, numCoils, radius, color)
    {
        if (numCoils <= 0)
        {
            this.drawLine(x1, y1, x2, y2, color);
            return;
        }

        // Draw linear spring as a sequence of curves approximating
        // a sine wave.
        //
        var dx = (x2 - x1);
        var dy = (y2 - y1);

        var lengthSq = ((dx * dx) + (dy * dy));
        var min = (this.minSpringLength * this.screenToPhysics2D);
        if (lengthSq < (min * min))
        {
            // Spring length is below defined epsilon, so we use a line instead.
            this.drawLine(x1, y1, x2, y2, color);
            return;
        }

        // set (nx, ny) to be normal-offset to line between end points of spring
        //   defining twice the amplitude of wave.
        // We use control points which are twice as far from spring line
        //   as the amplitude of wave as the nature of bezier curves means this will
        //   give us a curve that reaches the amplitude perfectly.
        var nx = -dy;
        var ny = dx;
        var nlsq = ((2 * radius) / Math.sqrt((nx * nx) + (ny * ny)));
        nx *= nlsq;
        ny *= nlsq;

        var rec = (1 / (numCoils * 4));
        dx *= rec;
        dy *= rec;

        var i;
        for (i = 0; i < numCoils; i += 1)
        {
            x2 = (x1 + (dx * 2));
            y2 = (y1 + (dy * 2));
            this.drawCurve(x1, y1, (x1 + dx + nx), (y1 + dy + ny), x2, y2, color);
            x1 = x2;
            y1 = y2;

            x2 = (x1 + (dx * 2));
            y2 = (y1 + (dy * 2));
            this.drawCurve(x1, y1, (x1 + dx - nx), (y1 + dy - ny), x2, y2, color);
            x1 = x2;
            y1 = y2;
        }
    }

    drawSpiral(x, y, ang1, ang2, rad1, rad2, color)
    {
        // Order end points so ang1 < ang2.
        if (ang1 > ang2)
        {
            var tmp = ang1;
            ang1 = ang2;
            ang2 = tmp;

            tmp = rad1;
            rad1 = rad2;
            rad2 = tmp;
        }

        if (ang1 === ang2)
        {
            return;
        }

        var deltaRadius = (rad2 - rad1);
        var deltaAngle = (ang2 - ang1);

        // Render spiral in angular segments.
        var segmentCount = Math.ceil(deltaAngle / this.spiralMaxArc);
        var segmentDeltaRadius = (deltaRadius / segmentCount);
        var segmentDeltaAngle = (deltaAngle / segmentCount);

        var cosDelta = Math.cos(segmentDeltaAngle);
        var sinDelta = Math.sin(segmentDeltaAngle);

        // Generate spiral points by rotating (and scaling)
        // radial vector.
        var radialX = Math.cos(ang1);
        var radialY = Math.sin(ang1);
        var radius = rad1;

        var x1 = (x + (rad1 * radialX));
        var y1 = (y + (rad1 * radialY));

        // Gradient at (x1, y1).
        var ux = (deltaRadius * radialX) - (radius * deltaAngle * radialY);
        var uy = (deltaRadius * radialY) + (radius * deltaAngle * radialX);

        var i;
        for (i = 0; i < segmentCount; i += 1)
        {
            // Compute next point on spiral
            var newRadius = (radius + segmentDeltaRadius);
            var newRadialX = (cosDelta * radialX) - (sinDelta * radialY);
            var newRadialY = (sinDelta * radialX) + (cosDelta * radialY);

            var x2 = (x + (newRadius * newRadialX));
            var y2 = (y + (newRadius * newRadialY));

            // Gradient at (x2, y2)
            var vx = (deltaRadius * newRadialX) - (newRadius * deltaAngle * newRadialY);
            var vy = (deltaRadius * newRadialY) + (newRadius * deltaAngle * newRadialX);

            // Render this spiral segment using a bezier curve (if possible)
            // We find the control point by intersecting the gradients at start and end point.
            var den = ((ux * vy) - (uy * vx));
            if ((den * den) < this.spiralEpsilon)
            {
                // Gradients are nearly parallel, use a line!
                this.drawLine(x1, y1, x2, y2, color);
            }
            else
            {
                // Compute intersection 'time' along gradient (ux, uy).
                var t = (((x2 - x1) * vy) + ((y1 - y2) * vx)) / den;
                if (t <= 0)
                {
                    // Intersection has negative 'time'? Can happen (rare).
                    // Better use a line!
                    this.drawLine(x1, y1, x2, y2, color);
                }
                else
                {
                    this.drawCurve(x1, y1, (x1 + (ux * t)), (y1 + (uy * t)), x2, y2, color);
                }
            }

            radius = newRadius;
            radialX = newRadialX;
            radialY = newRadialY;
            ux = vx;
            uy = vy;
            x1 = x2;
            y1 = y2;
        }
    }

    // We render a spiral 'spring' in the same way we do a spiral.
    // Only that the expressions for point on spring, and gradient at point
    // are more complex than that of a plain spiral.
    drawSpiralSpring(x, y, ang1, ang2, rad1, rad2, numCoils, color)
    {
        // Order end points so ang1 < ang2.
        if (ang1 > ang2)
        {
            var tmp = ang1;
            ang1 = ang2;
            ang2 = tmp;

            tmp = rad1;
            rad1 = rad2;
            rad2 = tmp;
        }

        if (ang1 === ang2)
        {
            return;
        }

        var deltaRadius = (rad2 - rad1);
        var deltaAngle = (ang2 - ang1);

        // Render spiral in angular segments.
        var segmentCount = Math.max(Math.ceil(deltaAngle / (this.spiralMaxArc * 3)), (40 * numCoils));
        var segmentDeltaAngle = (deltaAngle / segmentCount);
        var segmentDeltaTime = (1 / segmentCount);

        var cosDelta = Math.cos(segmentDeltaAngle);
        var sinDelta = Math.sin(segmentDeltaAngle);

        var spiralSpringSize = this.spiralSpringSize;
        // Coeffecients in expression for point on spiral spring.
        // and gradient of spiral spring at point.
        var Delta = Math.abs(2 * Math.PI * deltaRadius / deltaAngle);
        var spiralA = (spiralSpringSize * Delta);
        var spiralB = (2 * numCoils * Math.PI);
        var spiralAt = (spiralA * spiralB);

        // Generate spiral points by rotating (and scaling)
        // radial vector.
        var radialX = Math.cos(ang1);
        var radialY = Math.sin(ang1);
        var radius = rad1;

        var x1 = (x + (radius * radialX));
        var y1 = (y + (radius * radialY));

        // Gradient at (x1, y1).
        var gradient = (deltaRadius + spiralAt);
        var ux = (gradient * radialX) - (radius * deltaAngle * radialY);
        var uy = (gradient * radialY) + (radius * deltaAngle * radialX);

        var i;
        for (i = 0; i < segmentCount; i += 1)
        {
            // Compute next point on spiral.
            var t = ((i + 1) * segmentDeltaTime);
            var newRadialX = (cosDelta * radialX) - (sinDelta * radialY);
            var newRadialY = (sinDelta * radialX) + (cosDelta * radialY);

            radius = ((rad1 + (deltaRadius * t)) + (spiralA * Math.sin(spiralB * t)));
            var x2 = (x + (radius * newRadialX));
            var y2 = (y + (radius * newRadialY));

            // Gradient at (x2, y2)
            gradient = (deltaRadius + (spiralAt * Math.cos(spiralB * t)));
            var vx = (gradient * newRadialX) - (radius * deltaAngle * newRadialY);
            var vy = (gradient * newRadialY) + (radius * deltaAngle * newRadialX);

            // Render spiral segment using a bezier curve (if possible).
            // We find the control point by intersecting the gradients at start and end point.
            var den = ((ux * vy) - (uy * vx));
            // Additional constraint that gradient directions in same general direction
            // but not completely equal.
            var dot = ((ux * vx) + (uy * vy));
            if ((den * den) < this.spiralEpsilon || dot < 0 || dot > (1 - this.spiralEpsilon))
            {
                // better use a line!
                this.drawLine(x1, y1, x2, y2, color);
            }
            else
            {
                // Compute intersection 'time' along gradient (ux, uy).
                t = (((x2 - x1) * vy) + ((y1 - y2) * vx)) / den;
                if (t <= 0)
                {
                    // better use a line!
                    this.drawLine(x1, y1, x2, y2, color);
                }
                else
                {
                    this.drawCurve(x1, y1, (x1 + (ux * t)), (y1 + (uy * t)), x2, y2, color);
                }
            }

            radialX = newRadialX;
            radialY = newRadialY;
            ux = vx;
            uy = vy;
            x1 = x2;
            y1 = y2;
        }
    }


}

TURB.Physics2DPulleyConstraint.prototype._draw = function _pulleyDrawFn(debug)
{
    var colA  = (this.sleeping ? debug.constraintSleepingColorA      : debug.constraintColorA);
    var colB  = (this.sleeping ? debug.constraintSleepingColorB      : debug.constraintColorB);
    var colC  = (this.sleeping ? debug.constraintSleepingColorC      : debug.constraintColorC);
    var colD  = (this.sleeping ? debug.constraintSleepingColorD      : debug.constraintColorD);
    var colSA = (this.sleeping ? debug.constraintErrorSleepingColorA : debug.constraintErrorColorA);
    var colSB = (this.sleeping ? debug.constraintErrorSleepingColorB : debug.constraintErrorColorB);
    var colSC = (this.sleeping ? debug.constraintErrorSleepingColorC : debug.constraintErrorColorC);
    var colSD = (this.sleeping ? debug.constraintErrorSleepingColorD : debug.constraintErrorColorD);

    var data = this._data;
    var b1 = this.bodyA._data;
    var b2 = this.bodyB._data;
    var b3 = this.bodyC._data;
    var b4 = this.bodyD._data;

    var x1 = (b1[(/*BODY_POS*/2)]     + data[(/*PULLEY_RANCHOR1*/19)]);
    var y1 = (b1[(/*BODY_POS*/2) + 1] + data[(/*PULLEY_RANCHOR1*/19) + 1]);
    var x2 = (b2[(/*BODY_POS*/2)]     + data[(/*PULLEY_RANCHOR2*/21)]);
    var y2 = (b2[(/*BODY_POS*/2) + 1] + data[(/*PULLEY_RANCHOR2*/21) + 1]);
    var x3 = (b3[(/*BODY_POS*/2)]     + data[(/*PULLEY_RANCHOR3*/23)]);
    var y3 = (b3[(/*BODY_POS*/2) + 1] + data[(/*PULLEY_RANCHOR3*/23) + 1]);
    var x4 = (b4[(/*BODY_POS*/2)]     + data[(/*PULLEY_RANCHOR4*/25)]);
    var y4 = (b4[(/*BODY_POS*/2) + 1] + data[(/*PULLEY_RANCHOR4*/25) + 1]);

    var n12x = (x2 - x1);
    var n12y = (y2 - y1);
    var n34x = (x4 - x3);
    var n34y = (y4 - y3);
    var nL12 = Math.sqrt((n12x * n12x) + (n12y * n12y));
    var nL34 = Math.sqrt((n34x * n34x) + (n34y * n34y));
    var ratio = data[(/*PULLEY_RATIO*/7)];
    this._drawLink(debug, x1, y1, x2, y2, n12x, n12y, nL12, (nL34 * ratio), 1.0, colSA, colSB);
    this._drawLink(debug, x3, y3, x4, y4, n34x, n34y, nL34, nL12, (1 / ratio),   colSC, colSD);

    var rad = (debug.constraintAnchorRadius * debug.screenToPhysics2D);
    debug._drawAnchor(x1, y1, rad, colA);
    debug._drawAnchor(x2, y2, rad, colB);
    debug._drawAnchor(x3, y3, rad, colC);
    debug._drawAnchor(x4, y4, rad, colD);
};

TURB.Physics2DPulleyConstraint.prototype._drawLink = function _drawLinkFn(debug, x1, y1, x2, y2, nx, ny, nl, bias, scale, colSA, colSB)
{
    if (nl > Physics2DConfig.NORMALIZE_EPSILON)
    {
        var rec = (1 / nl);
        nx *= rec;
        ny *= rec;

        var midX = (0.5 * (x1 + x2));
        var midY = (0.5 * (y1 + y2));

        var data = this._data;
        var jointMin = (data[(/*PULLEY_JOINTMIN*/5)] - bias) * scale;
        if (jointMin < 0)
        {
            jointMin = 0;
        }
        var jointMax = (data[(/*PULLEY_JOINTMAX*/6)] - bias) * scale;
        if (jointMax < 0)
        {
            jointMax = 0;
        }

        var minX1 = (midX - (nx * (jointMin * 0.5)));
        var minY1 = (midY - (ny * (jointMin * 0.5)));
        var minX2 = (midX + (nx * (jointMin * 0.5)));
        var minY2 = (midY + (ny * (jointMin * 0.5)));

        debug.drawLine(minX1, minY1, minX2, minY2, colSA);

        if (isFinite(jointMax))
        {
            var maxX1 = (midX - (nx * (jointMax * 0.5)));
            var maxY1 = (midY - (ny * (jointMax * 0.5)));
            var maxX2 = (midX + (nx * (jointMax * 0.5)));
            var maxY2 = (midY + (ny * (jointMax * 0.5)));

            debug.drawLine(maxX1, maxY1, minX1, minY1, colSB);
            debug.drawLine(maxX2, maxY2, minX2, minY2, colSB);
        }

        if (!this._stiff)
        {
            var numCoils = debug.constraintSpringNumCoils;
            var radius   = (debug.constraintSpringRadius * debug.screenToPhysics2D);
            if (nl > jointMax)
            {
                debug.drawLinearSpring(maxX1, maxY1, x1, y1, numCoils, radius, colSB);
                debug.drawLinearSpring(maxX2, maxY2, x2, y2, numCoils, radius, colSB);
            }
            else if (nl < jointMin)
            {
                debug.drawLinearSpring(minX1, minY1, x1, y1, numCoils, radius, colSA);
                debug.drawLinearSpring(minX2, minY2, x2, y2, numCoils, radius, colSA);
            }
        }
    }
};

// =========================================================================
// LINE CONSTRAINT

TURB.Physics2DLineConstraint.prototype._draw = function lineDrawFn(debug)
{
    var colA  = (this.sleeping ? debug.constraintSleepingColorA      : debug.constraintColorA);
    var colB  = (this.sleeping ? debug.constraintSleepingColorB      : debug.constraintColorB);
    var colSA = (this.sleeping ? debug.constraintErrorSleepingColorA : debug.constraintErrorColorA);
    var colSB = (this.sleeping ? debug.constraintErrorSleepingColorB : debug.constraintErrorColorB);
    var colSC = (this.sleeping ? debug.constraintErrorSleepingColorC : debug.constraintErrorColorC);

    var data = this._data;
    var b1 = this.bodyA._data;
    var b2 = this.bodyB._data;

    var x1 = (b1[(/*BODY_POS*/2)]     + data[(/*LINE_RANCHOR1*/13)]);
    var y1 = (b1[(/*BODY_POS*/2) + 1] + data[(/*LINE_RANCHOR1*/13) + 1]);
    var x2 = (b2[(/*BODY_POS*/2)]     + data[(/*LINE_RANCHOR2*/15)]);
    var y2 = (b2[(/*BODY_POS*/2) + 1] + data[(/*LINE_RANCHOR2*/15) + 1]);
    var dx = data[(/*LINE_RAXIS*/17)];
    var dy = data[(/*LINE_RAXIS*/17) + 1];

    var jointMin = data[(/*LINE_JOINTMIN*/5)];
    var jointMax = data[(/*LINE_JOINTMAX*/6)];
    if (jointMin === Number.NEGATIVE_INFINITY)
    {
        jointMin = -1e20;
    }
    if (jointMax === Number.POSITIVE_INFINITY)
    {
        jointMax = 1e20;
    }

    var delX = (x2 - x1);
    var delY = (y2 - y1);
    var pn = (delX * dx) + (delY * dy);

    var ex1 = (x1 + (dx * jointMin));
    var ey1 = (y1 + (dy * jointMin));
    var ex2 = (x1 + (dx * jointMax));
    var ey2 = (y1 + (dy * jointMax));

    var t;
    if (pn > jointMin)
    {
        t = Math.min(pn, jointMax);
        debug.drawLine(ex1, ey1, x1 + (dx * t), y1 + (dy * t), colSA);
    }
    if (pn < jointMax)
    {
        t = Math.max(pn, jointMin);
        debug.drawLine(ex2, ey2, x1 + (dx * t), y1 + (dy * t), colSB);
    }

    if (!this._stiff)
    {
        var anchX = (pn < jointMin ? ex1 : (pn > jointMax ? ex2 : (x1 + (dx * pn))));
        var anchY = (pn < jointMin ? ey1 : (pn > jointMax ? ey2 : (y1 + (dy * pn))));

        var numCoils = debug.constraintSpringNumCoils;
        var radius   = (debug.constraintSpringRadius * debug.screenToPhysics2D);
        debug.drawLinearSpring(anchX, anchY, x2, y2, numCoils, radius, colSC);
    }

    var rad = (debug.constraintAnchorRadius * debug.screenToPhysics2D);
    debug._drawAnchor(x1, y1, rad, colA);
    debug._drawAnchor(x2, y2, rad, colB);
};

// =========================================================================
// DISTANCE CONSTRAINT

TURB.Physics2DDistanceConstraint.prototype._draw = function distanceDrawFn(debug)
{
    var colA  = (this.sleeping ? debug.constraintSleepingColorA      : debug.constraintColorA);
    var colB  = (this.sleeping ? debug.constraintSleepingColorB      : debug.constraintColorB);
    var colSA = (this.sleeping ? debug.constraintErrorSleepingColorA : debug.constraintErrorColorA);
    var colSB = (this.sleeping ? debug.constraintErrorSleepingColorB : debug.constraintErrorColorB);

    var data = this._data;
    var b1 = this.bodyA._data;
    var b2 = this.bodyB._data;

    var x1 = (b1[(/*BODY_POS*/2)]     + data[(/*DIST_RANCHOR1*/11)]);
    var y1 = (b1[(/*BODY_POS*/2) + 1] + data[(/*DIST_RANCHOR1*/11) + 1]);
    var x2 = (b2[(/*BODY_POS*/2)]     + data[(/*DIST_RANCHOR2*/13)]);
    var y2 = (b2[(/*BODY_POS*/2) + 1] + data[(/*DIST_RANCHOR2*/13) + 1]);

    var nx = (x2 - x1);
    var ny = (y2 - y1);
    var nlsq = ((nx * nx) + (ny * ny));
    if (nlsq > Physics2DConfig.NORMALIZE_SQ_EPSILON)
    {
        var nl = Math.sqrt(nlsq);
        var rec = (1 / nl);
        nx *= rec;
        ny *= rec;

        var midX = (0.5 * (x1 + x2));
        var midY = (0.5 * (y1 + y2));

        var jointMin = data[(/*DIST_JOINTMIN*/5)];
        var jointMax = data[(/*DIST_JOINTMAX*/6)];
        var minX1 = (midX - (nx * (jointMin * 0.5)));
        var minY1 = (midY - (ny * (jointMin * 0.5)));
        var minX2 = (midX + (nx * (jointMin * 0.5)));
        var minY2 = (midY + (ny * (jointMin * 0.5)));

        debug.drawLine(minX1, minY1, minX2, minY2, colSA);

        if (isFinite(jointMax))
        {
            var maxX1 = (midX - (nx * (jointMax * 0.5)));
            var maxY1 = (midY - (ny * (jointMax * 0.5)));
            var maxX2 = (midX + (nx * (jointMax * 0.5)));
            var maxY2 = (midY + (ny * (jointMax * 0.5)));

            debug.drawLine(maxX1, maxY1, minX1, minY1, colSB);
            debug.drawLine(maxX2, maxY2, minX2, minY2, colSB);
        }

        if (!this._stiff)
        {
            var numCoils = debug.constraintSpringNumCoils;
            var radius   = (debug.constraintSpringRadius * debug.screenToPhysics2D);
            if (nl > jointMax)
            {
                debug.drawLinearSpring(maxX1, maxY1, x1, y1, numCoils, radius, colSB);
                debug.drawLinearSpring(maxX2, maxY2, x2, y2, numCoils, radius, colSB);
            }
            else if (nl < jointMin)
            {
                debug.drawLinearSpring(minX1, minY1, x1, y1, numCoils, radius, colSA);
                debug.drawLinearSpring(minX2, minY2, x2, y2, numCoils, radius, colSA);
            }
        }
    }

    var rad = (debug.constraintAnchorRadius * debug.screenToPhysics2D);
    debug._drawAnchor(x1, y1, rad, colA);
    debug._drawAnchor(x2, y2, rad, colB);
};

// =========================================================================
// ANGLE CONSTRAINT

TURB.Physics2DAngleConstraint.prototype._draw = function angleDrawFn(debug)
{
    var colA  = (this.sleeping ? debug.constraintSleepingColorA      : debug.constraintColorA);
    var colB  = (this.sleeping ? debug.constraintSleepingColorB      : debug.constraintColorB);
    var colSA = (this.sleeping ? debug.constraintErrorSleepingColorA : debug.constraintErrorColorA);
    var colSB = (this.sleeping ? debug.constraintErrorSleepingColorB : debug.constraintErrorColorB);

    var data = this._data;
    var b1 = this.bodyA._data;
    var b2 = this.bodyB._data;

    var ratio = data[(/*ANGLE_RATIO*/7)];
    this._drawForBody(debug, b1, b2, ratio, -1, colSA, colSB, colA);
    this._drawForBody(debug, b2, b1, (1 / ratio), (1 / ratio), colSA, colSB, colB);
};

TURB.Physics2DAngleConstraint.prototype._drawForBody = function _drawForBodyFn(debug, b1, b2, bodyScale, limitScale, colA, colB, col)
{
    var data = this._data;
    var jointMin = data[(/*ANGLE_JOINTMIN*/5)];
    var jointMax = data[(/*ANGLE_JOINTMAX*/6)];

    var min = (b2[(/*BODY_POS*/2) + 2] * bodyScale) + (jointMin * limitScale);
    var max = (b2[(/*BODY_POS*/2) + 2] * bodyScale) + (jointMax * limitScale);
    if (min > max)
    {
        var tmp = min;
        min = max;
        max = tmp;
    }

    var minRadius     = (debug.constraintSpiralMinRadius   * debug.screenToPhysics2D);
    var deltaRadius   = (debug.constraintSpiralDeltaRadius * debug.screenToPhysics2D);
    var indicatorSize = (debug.constraintAnchorRadius      * debug.screenToPhysics2D);
    var numCoils      = debug.constraintSpiralNumCoils;

    var x   = b1[(/*BODY_POS*/2)];
    var y   = b1[(/*BODY_POS*/2) + 1];
    var rot = b1[(/*BODY_POS*/2) + 2];

    var dr;
    if (rot > min)
    {
        dr = Math.min(rot, max);
        debug.drawSpiral(x, y, min, dr, minRadius, minRadius + ((dr - min) * deltaRadius), colA);
    }
    else if (!this._stiff && rot < min)
    {
        debug.drawSpiralSpring(x, y, rot, min, minRadius + ((rot - min) * deltaRadius), minRadius, numCoils, colA);
    }

    if (rot < max)
    {
        dr = Math.max(rot, min);
        debug.drawSpiral(x, y, dr, max, minRadius + ((dr - min) * deltaRadius), minRadius + ((max - min) * deltaRadius), colB);
    }
    else if (!this._stiff && rot > max)
    {
        debug.drawSpiralSpring(x, y, rot, max, minRadius + ((rot - min) * deltaRadius), minRadius + ((max - min) * deltaRadius), numCoils, colB);
    }

    debug._drawAngleIndicator(x, y, rot, minRadius + ((rot - min) * deltaRadius), indicatorSize, col);
};

// =========================================================================
// WELD CONSTRAINT

TURB.Physics2DWeldConstraint.prototype._draw = function weldDrawFn(debug)
{
    var colA = (this.sleeping ? debug.constraintSleepingColorA      : debug.constraintColorA);
    var colB = (this.sleeping ? debug.constraintSleepingColorB      : debug.constraintColorB);
    var colE = (this.sleeping ? debug.constraintErrorSleepingColorC : debug.constraintErrorColorC);

    var data = this._data;
    var b1 = this.bodyA._data;
    var b2 = this.bodyB._data;

    var x1 = (b1[(/*BODY_POS*/2)]     + data[(/*WELD_RANCHOR1*/9)]);
    var y1 = (b1[(/*BODY_POS*/2) + 1] + data[(/*WELD_RANCHOR1*/9) + 1]);
    var x2 = (b2[(/*BODY_POS*/2)]     + data[(/*WELD_RANCHOR2*/11)]);
    var y2 = (b2[(/*BODY_POS*/2) + 1] + data[(/*WELD_RANCHOR2*/11) + 1]);

    var rad = (debug.constraintAnchorRadius * debug.screenToPhysics2D);
    debug._drawAnchor(x1, y1, rad, colA);
    debug._drawAnchor(x2, y2, rad, colB);

    if (this._stiff)
    {
        debug.drawLine(x1, y1, x2, y2, colE);
    }
    else
    {
        var numCoils = debug.constraintSpringNumCoils;
        var radius   = (debug.constraintSpringRadius * debug.screenToPhysics2D);
        debug.drawLinearSpring(x1, y1, x2, y2, numCoils, radius, colE);

        var minRadius     = (debug.constraintSpiralMinRadius  * debug.screenToPhysics2D);
        var deltaRadius   = (debug.constraintSpiralDeltaRadius * debug.screenToPhysics2D);
        var indicatorSize = (debug.constraintAnchorRadius     * debug.screenToPhysics2D);
        numCoils          = debug.constraintSpiralNumCoils;

        var target, min;
        // angle indication on bodyA
        min = b1[(/*BODY_POS*/2) + 2];
        target = (b2[(/*BODY_POS*/2) + 2] - data[(/*WELD_PHASE*/13)]);

        var colSA = (this.sleeping ? debug.constraintErrorSleepingColorA : debug.constraintErrorColorA);
        var colSB = (this.sleeping ? debug.constraintErrorSleepingColorB : debug.constraintErrorColorB);

        debug.drawSpiralSpring(b1[(/*BODY_POS*/2)], b1[(/*BODY_POS*/2) + 1],
            min, target, minRadius, minRadius + ((target - min) * deltaRadius),
            numCoils, colSB);
        debug._drawAngleIndicator(b1[(/*BODY_POS*/2)], b1[(/*BODY_POS*/2) + 1], min, minRadius, indicatorSize, colSA);

        min = b2[(/*BODY_POS*/2) + 2];
        target = (data[(/*WELD_PHASE*/13)] + b1[(/*BODY_POS*/2) + 2]);

        debug.drawSpiralSpring(b2[(/*BODY_POS*/2)], b2[(/*BODY_POS*/2) + 1],
            min, target, minRadius, minRadius + ((target - min) * deltaRadius),
            numCoils, colSA);
        debug._drawAngleIndicator(b2[(/*BODY_POS*/2)], b2[(/*BODY_POS*/2) + 1], min, minRadius, indicatorSize, colSB);
    }
};

// =========================================================================
// POINT CONSTRAINT

TURB.Physics2DPointConstraint.prototype._draw = function pointDrawFn(debug)
{
    var colA = (this.sleeping ? debug.constraintSleepingColorA      : debug.constraintColorA);
    var colB = (this.sleeping ? debug.constraintSleepingColorB      : debug.constraintColorB);
    var colE = (this.sleeping ? debug.constraintErrorSleepingColorC : debug.constraintErrorColorC);

    var data = this._data;
    var b1 = this.bodyA._data;
    var b2 = this.bodyB._data;

    var x1 = (b1[(/*BODY_POS*/2)]     + data[(/*POINT_RANCHOR1*/9)]);
    var y1 = (b1[(/*BODY_POS*/2) + 1] + data[(/*POINT_RANCHOR1*/9) + 1]);
    var x2 = (b2[(/*BODY_POS*/2)]     + data[(/*POINT_RANCHOR2*/11)]);
    var y2 = (b2[(/*BODY_POS*/2) + 1] + data[(/*POINT_RANCHOR2*/11) + 1]);

    var rad = (debug.constraintAnchorRadius * debug.screenToPhysics2D);
    debug._drawAnchor(x1, y1, rad, colA);
    debug._drawAnchor(x2, y2, rad, colB);

    if (this._stiff)
    {
        debug.drawLine(x1, y1, x2, y2, colE);
    }
    else
    {
        var numCoils = debug.constraintSpringNumCoils;
        var radius   = (debug.constraintSpringRadius * debug.screenToPhysics2D);
        debug.drawLinearSpring(x1, y1, x2, y2, numCoils, radius, colE);
    }
};

function v4Build(r, g, b, a) {
    return [r, g, b, a];
}

function rgb(color) {
    return (Math.floor(color[0] * 255) << 16) |
        (Math.floor(color[1] * 255) << 8) |
        (Math.floor(color[2] * 255) << 0);
}