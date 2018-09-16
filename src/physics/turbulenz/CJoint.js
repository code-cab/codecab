import CPhysicsCtrl from './CPhysicsCtrl';

import * as PIXI from 'pixi.js';
import * as TURB from '../../../generate/lib/turbulenz/physics2ddevice'

export class CJoint {
    /**
     *
     *
     * @param constraintType
     * @param ownerObject CSprite, CSprite.body or RigidBody
     * @param otherObject
     * @param ownerOffsetX Offset X relative to owner center or to COM when undefined
     * @param ownerOffsetY Same as ownerOffsetX but for Y
     * @param options
     */
    constructor(constraintType, ownerObject, otherObject, ownerOffsetX, ownerOffsetY, options) {

        this._bodyA = this._getBody(ownerObject);
        this._bodyB = this._getBody(otherObject);

        let _options = options || {};
        _options.bodyA = this._bodyA;
        _options.bodyB = this._bodyB;
        this._updateOffset(_options, ownerOffsetX, ownerOffsetY);

        this._constraint = CPhysicsCtrl.get().engine[constraintType](_options);
        CPhysicsCtrl.get().world.addConstraint(this._constraint);
        this.elasticity = 1;
    }

    setOffset(x, y) {
        let options = {};
        this._updateOffset(options, x, y);
        this._constraint.setAnchorA(options.anchorA);
        this._constraint.setAnchorB(options.anchorB);
    }

    _updateOffset(options, ownerOffsetX, ownerOffsetY) {
        let anchorA, anchorB;
        let worldPos;
        if (ownerOffsetX !== undefined && ownerOffsetX !== undefined) {
            let pixelsPerMeter = CStage.get()._options.pixelsPerMeter;
            if (this._bodyA.userData && this._bodyA.userData._target) {
                worldPos = [this._bodyA.userData._target.x, this._bodyA.userData._target.y];
            } else {
                worldPos = this._bodyA.transformLocalPointToWorld(this._bodyA.getPosition());
                worldPos[0] *= pixelsPerMeter;
                worldPos[1] *= pixelsPerMeter;
            }
            worldPos[0] += ownerOffsetX;
            worldPos[1] += ownerOffsetY;
            worldPos[0] /= pixelsPerMeter;
            worldPos[1] /= pixelsPerMeter;
            anchorA = this._bodyA.transformWorldPointToLocal(worldPos);
        } else {
            anchorA = [0,0];
            worldPos = this._bodyA.transformLocalPointToWorld(anchorA);
        }
        anchorB = this._bodyB.transformWorldPointToLocal(worldPos);
        options.anchorA = anchorA;
        options.anchorB = anchorB;
    }


    set elasticity(elasticity) {
        this._elasticy = elasticity;
        let stiff = elasticity === 0;

        this._constraint.configure({
            stiff: elasticity <= 0,
            frequency: 10 / (elasticity || 1)
        });
    }

    get elasticity() {
        return this._elasticy;
    }


    _getBody(object) {
        if (object instanceof TURB.Physics2DRigidBody) {
            return object;
        }
        if (object._rigidBody) {
            return object._rigidBody;
        }
        if (object.body && object.body._rigidBody) {
            return object.body._rigidBody;
        }
        throw new Error("Invalid object");
    }
}

export class CMotorizedJoint extends CJoint {
    constructor(constraintType, motorConstraintType, ownerObject, otherObject, ownerOffsetX, ownerOffsetY, options, motorOptions) {
        super(constraintType, ownerObject, otherObject, ownerOffsetX, ownerOffsetY, options);
        this._motorConstraintType = motorConstraintType;
        this._motorOptions = motorOptions || {};
        this._force = Number.POSITIVE_INFINITY;
    }

    set speed(rate) {
        this._createMotorConstraint();
        this._motorConstraint.setRate(rate);
        if (!this._autoBreak) {
            if (rate === 0) this._motorConstraint.disable();
            else this._motorConstraint.enable();
        }
    }

    set force(force) {
        this._createMotorConstraint();
        if (force === 0) {
            if (!this._motorConstraint.isDisabled()) this._motorConstraint.disable();
        } else {
            if (!this._motorConstraint.isEnabled()) this._motorConstraint.enable();
            if (force !== this._force) {
                this._motorConstraint.configure({
                    maxForce: force
                });
                this._force = force;
            }
        }
    }

    set autoBreak(enable) {
        this._autoBreak = enable;
    }

    _createMotorConstraint() {
        if (!this._motorConstraint) {
            this._motorOptions.maxForce = this._force;
            this._motorOptions.bodyA = this._bodyA;
            this._motorOptions.bodyB = this._bodyB;
            this._motorConstraint = CPhysicsCtrl.get().engine[this._motorConstraintType](this._motorOptions);
            CPhysicsCtrl.get().world.addConstraint(this._motorConstraint);
        }
    }
}

export class CRotatingJoint extends CMotorizedJoint {
    constructor(ownerObject, otherObject, ownerOffsetX, ownerOffsetY) {
        super('createPointConstraint', 'createMotorConstraint', ownerObject, otherObject, ownerOffsetX, ownerOffsetY);
    }

    set speed(rate) {
        super.speed = -rate;
    }
}

export class CFixedJoint extends CJoint {
    constructor(ownerObject, otherObject, ownerOffsetX, ownerOffsetY) {
        super('createWeldConstraint', ownerObject, otherObject, ownerOffsetX, ownerOffsetY);
    }
}

export class CSlidingJoint extends CMotorizedJoint {
    constructor(ownerObject, otherObject, ownerOffsetX, ownerOffsetY, direction, distance) {
        super('createLineConstraint', 'createMotorConstraint', ownerObject, otherObject, ownerOffsetX, ownerOffsetY, {
            axis: [1,0],
            lowerBound: -1,
            upperBound: 1,
        });
    }
}