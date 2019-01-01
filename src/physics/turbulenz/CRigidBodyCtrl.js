/**
 * Created by ROB3656 on 1-2-2018.
 */
import CController from '../../CController';
// import CPolygonShapes from './CPolygonShapes';
import CPhysicsCtrl from './CPhysicsCtrl';
import CTargetPoint from '../../core/CTargetPoint'
import CStage from '../../CStage';
// import CShapes from './CPolygonShapes';
import CMath from '../../CMath';
import {CRotatingJoint, CFixedJoint} from './CJoint';

import * as TURB from '../../../generate/lib/turbulenz/physics2ddevice'
import {deg2rad, rad2deg} from '../../misc/math';
import * as PIXI from 'pixi.js';
import {ASSERT} from '../../misc/util';

/**

 // body

 set body type to [dynamic v]  :: sound

 apply force (5) in direction (90) :: sound

 set velocity () in direction (90) :: sound

 (velocity :: sound)

 (angular speed :: sound

 (mass :: sound

 // shapes

 set shape automatically :: sound

 set rectancle shape width () height () :: sound

 set circular shape radius () :: sound

 (shape line color :: sound

 (shape line width :: sound

 (shape fill color :: sound





 // joints

 OUD: (rotating joint on [sprite] at x[10] y[-10] :: sound
 create rotating joint [joint1 v] at (0) (0) :: sound

 (welded joint on [sprite] at center of mass :: sound
 (sliding joint on [sprite] from () () to () () :: sound

 make [joint1 v] stiff :: sound

 make [joint2 v] flexible amount (0.4) :: sound

 motorize [joint1 v] speed (10) :: sound

 set [joint1 v] max force (50) :: sound


 */


/*

    Texture - body scenario's



    1)  direct beschikbaar
    2)  Texture async beschikbaar
    3) Texture later aanpassen
    4) Custom shapes
    5) Type wijzigen van none naar sensor
    6) Type wijzigen van sensor naar dynamic (of kinematic of static)
    7) Type wijzigen van dynamic naar sensor
    8) type wijzigen van sensor naar dynamic

 */


export default class CRigidBody extends CController {
    constructor(options) {
        super();
        this._rigidBody = undefined;

        // useComOrigin indicates if the Shapes will be aligned to the 'Center of Mass' or to the Sprites anchor.
        // When _useComOrigin is true, origin of the shapes will not match the rigid body x y and have to
        // be translated. _useComOrigin needs to be true for dynamic bodies.
        this._useComOrigin = false;
        this._collisionMask = 0xffffffff;
        this._material = CPhysicsCtrl.get().engine.getDefaultMaterial();
    }

    set __target(value) {
        super.__target = value;
    }

    getTouching(...targets) {
        return getTouching.apply(this, arguments);
    }

    setRectangleShape(width, height) {
        // TODO
    }



    setCircleShape(radius) {
        let pixelsPerMeter = CStage.get()._options.pixelsPerMeter;
        // Device by scale because when body is created the size is scaled down again.
        // Custom shape should be independent of scale
        this._customShapes = [CPhysicsCtrl.get().engine.createCircleShape({
            radius: radius / this.target._pixiObject.scale.x,
            origin: [
                this._target.width / (2 * this.target._pixiObject.scale.x),
                this._target.height / (2 *  this.target._pixiObject.scale.y)]
        })];
        this.type = this.type;
    }
    /**
     *
     * @block: [wheel1 v] is rotating joint to [sprite] at x (15) y (100)


     (rotating joint on [sprite] at x (10) y (20))

     [wheel1 v] is rotating joint to [sprite] at center of mass

     [joint1 v] is fixed joint to [sprite]

     turn [wheel1 v] with strength (50) and speed(100)

     */

    get rigidBody() {
        return this._rigidBody;
    }

    _sourceChanged() {
        // Trigger body recreate through type init.
        this.type = this.type;
    }

    _updateScale() {
        scaleBody.call(this);
    }

    _updateAnchor() {
        updateAnchor.call(this);
    }
    isNone() {
        return !this._rigidBody;
    }

    set freezeRotation(freeze) {
        if (freeze) {
            if (!this._freezeConstraint) {
                let physics = CPhysicsCtrl.get();
                this._freezeConstraint = physics.engine.createAngleConstraint({
                    bodyA: this._rigidBody,
                    bodyB: physics._staticReferenceBody,
                    ratio: 1,
                    lowerBound: this._rigidBody.getRotation(),
                    upperBound: this._rigidBody.getRotation()
                });
                physics.world.addConstraint(this._freezeConstraint);
            }
        } else {
            if (this._freezeConstraint) {
                CPhysicsCtrl.get().removeConstraint(this._freezeConstraint);
                delete this._freezeConstraint;
            }
        }
    }

    get freezeRotation() {
        return this._freezeConstraint !== undefined;
    }

    set material(material) {

        if (material instanceof TURB.Physics2DMaterial) {
            this._material = material;
        } else {
            this._material = CPhysicsCtrl.get().engine.createMaterial(material);
        }
    }

    get material() {
        return this._material;
    }

    set elasticity(elasticity) {
        let m = this._material;
        this._material = CPhysicsCtrl.get().engine.createMaterial({
            elasticity: elasticity,
            staticFriction : m.getStaticFriction(),
            dynamicFriction : m.getDynamicFriction(),
            rollingFriction : m.getRollingFriction(),
            density : m.getDensity()
        });
        this.type = this.type;
    }

    get elasticity() {
        return this._material.getElasticity();
    }

    set staticFriction(staticFriction) {
        if (staticFriction <= 0) console.warn('Static friction should be > 0');
        let m = this._material;
        this._material = CPhysicsCtrl.get().engine.createMaterial({
            elasticity: m.getElasticity(),
            staticFriction : staticFriction,
            dynamicFriction : m.getDynamicFriction(),
            rollingFriction : m.getRollingFriction(),
            density : m.getDensity()
        });
        this.type = this.type;
    }

    get staticFriction() {
        return this._material.getStaticFriction();
    }

    set dynamicFriction(dynamicFriction) {
        if (dynamicFriction <= 0) console.warn('Dynamic friction should be > 0');
        let m = this._material;
        this._material = CPhysicsCtrl.get().engine.createMaterial({
            elasticity: m.getElasticity(),
            staticFriction : m.getStaticFriction(),
            dynamicFriction : dynamicFriction,
            rollingFriction : m.getRollingFriction(),
            density : m.getDensity()
        });
        this.type = this.type;
    }

    get dynamicFriction() {
        return this._material.getDynamicFriction();
    }

    set rollingFriction(rollingFriction) {
        if (rollingFriction <= 0) console.warn('Rolling friction should be > 0');
        let m = this._material;
        this._material = CPhysicsCtrl.get().engine.createMaterial({
            elasticity: m.getElasticity(),
            staticFriction : m.getStaticFriction(),
            dynamicFriction : m.getDynamicFriction(),
            rollingFriction : rollingFriction,
            density : m.getDensity()
        });
        this.type = this.type;
    }

    get rollingFriction() {
        return this._material.getRollingFriction();
    }
    set density(density) {
        let m = this._material;
        this._material = CPhysicsCtrl.get().engine.createMaterial({
            elasticity: m.getElasticity(),
            staticFriction : m.getStaticFriction(),
            dynamicFriction : m.getDynamicFriction(),
            rollingFriction : m.getRollingFriction(),
            density : density
        });
        this.type = this.type;
    }

    get density() {
        return this._material.getDensity();
    }


    set type(value) {
        ASSERT.isOneOf(['none', 'sensor', 'dynamic', 'kinematic', 'static'], value, 'type');
        createOrRecreateBody.call(this, value);
    }

    get type() {
        if (this.isNone()) return 'none';
        if (this._rigidBody.shapes.length && this.rigidBody.shapes[0].sensor) return 'sensor';
        if (this._rigidBody.isStatic()) return 'static';
        if (this._rigidBody.isKinematic()) return 'kinematic';
        return 'dynamic';
    }

    isSensor() {
        return this._rigidBody && this._rigidBody.shapes.length &&
            this.rigidBody.shapes[0].sensor;
    }

    isKinematic() {
        return this._rigidBody && this._rigidBody.isKinematic();
    }

    isDynamic() {
        return this._rigidBody && this._rigidBody.isDynamic();
    }

    set bullet(value) {
        if (this._rigidBody) this._rigidBody.bullet = value;
    }

    get bullet() {
        if (this._rigidBody) return this._rigidBody.bullet;
        return false;
    }

    set worldX(value) {
        if (!this._worldPosition) {
            this.target.x = value;
        } else if (!this._useComOrigin) {
            this._worldPosition.x = value;
        } else {
            this._worldPosition.x = value;
            // TODO
            // throw new Error("Not implemented yet");
        }
    }
    get worldX() {
        if (this._worldPosition) return this._worldPosition.x;
    }

    set worldY(value) {
        if (!this._worldPosition) {
            this.target.y = value;
        } else if (!this._useComOrigin) {
            this._worldPosition.y = value;
        } else {
            // TODO
            this._worldPosition.y = value;
            // throw new Error("Not implemented yet");
        }
    }
    get worldY() {
        if (this._worldPosition) return this._worldPosition.y;
    }

    set worldPosition(point) {
        if (this._worldPosition) {
            this._worldPosition.setPoint(point);
        }
    }

    get worldPosition() {
        return this._worldPosition;
    }

    /**
     * Wat moet ik hermee?
     *
     * @param value
     */
    set rotation(value) {
        if (this._freezeRotation !== undefined) {
            this._freezeRotation = deg2rad(value);
        }
        if (this.isNone()) {
            this.target.rotation = value;
        } else {
            let pos = this._worldPosition.get();
            this.rigidBody.setRotation(deg2rad(value));
            this._worldPosition.setPoint(pos);
        }
    }

    get rotation() {
        return this.isNone() ? this.target.rotation : rad2deg(this.rigidBody.getRotation());
    }

    get mass() {
        if (this.isNone()) return;
        return this.rigidBody.getMass();
    }

    get areaInPixels() {
        if (this.isNone()) return;
        let area = 0;
        for (let shape of this._rigidBody.shapes) {
            area += shape.computeArea();
        }
        area *= CMath.square(CStage.get()._options.pixelsPerMeter);
        return area;
    }

    set collisionLayers(layers) {
        if (!Array.isArray(layers)) {
            layers = [layers];
        }
        let mask = 0;
        layers.forEach(layer => mask |= (1 << Math.max(0, Math.min(31, layer))));
        this._collisionMask = mask;
        if (this.isNone()) return;
        let rigidBody = this._rigidBody;
        for (let i = 0; i < rigidBody.shapes.length; i += 1) {
            rigidBody.shapes[i].setMask(this._collisionMask);
            rigidBody.shapes[i].setGroup(this._collisionMask);
        }
    }

    applyImpulse(force, direction) {
        let impulse = [
            force * CMath.sin(direction),
            -force * CMath.cos(direction)
        ];
        this._rigidBody.applyImpulse(impulse);
    }

    applyVelocity(velocity, direction) {
        let currVel = this._rigidBody.getVelocity();
        let mass = this.mass;
        let changeX = velocity * CMath.sin(direction) - currVel[0];
        let changeY = -velocity * CMath.cos(direction) - currVel[1];

        this._rigidBody.applyImpulse([changeX * mass, changeY * mass]);
    }

    get velocity() {
        let currVel = this._rigidBody.getVelocity();
        return CMath.sqrt(CMath.square(currVel[0]), CMath.square(currVel[1]));
    }

    get velocityDirection() {
        let currVel = this._rigidBody.getVelocity();
        return CMath.atan2(currVel[0], -currVel[1]);
    }

    setForce(force, direction) {
        let f = [
            force * CMath.sin(direction),
            -force * CMath.cos(direction)
        ];
        this._rigidBody.setForce(f);
    }

    // alignToCenterOfMass() {
    //     if (this.isNone() || this._useComOrigin) return;
    //
    // }

    createFixedJoint(otherObject, ownserOffsetX, owneroffsetY) {
        return new CFixedJoint(this, otherObject, owneroffsetY, owneroffsetY);
    }

    createRotatingJoint(otherObject, ownerOffsetX, ownerOffsetY) {
        return new CRotatingJoint(this, otherObject, ownerOffsetX, ownerOffsetY);
    }

    _update() {
        if (this.isNone()) return;
        if (this.rigidBody.sleeping && this.rigidBody._prevSleeping) return;
        let sprite = this.target._pixiObject;
        let pos = this._worldPosition.get();
        pos.x *= CStage.get()._options.pixelsPerMeter;
        pos.y *= CStage.get()._options.pixelsPerMeter;
        let rotation = this.rigidBody.getRotation();
        if (pos.x !== sprite.x || pos.y !== sprite.y || rotation !== sprite.rotation) {
            sprite.x = pos.x;
            sprite.y = pos.y;
            sprite.rotation = rotation;
            this._target.emit('position', {x: pos.x, y: pos.y, rotation: rotation});
            if (this._target._destroyed) return;
        }
        showShapes.call(this);
    }

    destroy() {
        super.destroy();
        let world = CPhysicsCtrl.get().world;
        if (this._bodyObject) {
            this._bodyObject.destroy();
            delete this._bodyObject;
        }
        if (this._rigidBody) {
            world.removeRigidBody(this._rigidBody);
            delete this._rigidBody;
        }
    }
}

function arrayOfVerticesToShapes(arrayOfVertices, owner, material, sensor) {
    let shapes = [];

    function pushVerticesAsShape(vertices) {
        let shape = CPhysicsCtrl.get().engine.createPolygonShape({
            vertices: vertices,
            material: material,
            sensor: sensor
        });
        shapes.push(shape);
    }
    let index = 1;
    for (let l = 0; l < Math.round(arrayOfVertices[0]); l++) {
        let verticesCount = Math.round(arrayOfVertices[index++]);
        let vertices = [];
        for (let v = 0; v < verticesCount; v++) {
            let x = arrayOfVertices[index++];
            let y = arrayOfVertices[index++];

            vertices.push([x, y]);

            if (vertices.length === 8 ||
                (vertices.length >= 6 && verticesCount - v === 3)) {
                pushVerticesAsShape(vertices);
                vertices = [vertices[0], vertices[vertices.length - 1]];
            }
        }
        if (vertices.length) pushVerticesAsShape(vertices);


    }
    return shapes;
}

/**
 * Always replace the entire body and shapes when type is changed.
 *
 * About the anchor, shapepos and center of mass (com)
 *
 * B----------+
 * |          |
 * |       C  |
 * |    A     |
 * |          |
 * |          |
 * +----------+
 *
 * A - Anchor vector
 * B - Shape origin
 * C - COM (Center of mass)
 *
 * Puspose is to set the shapes (0,0) to C when Dynamic and to A in other cases
 * When C is selected, the worldPosition can be translated to A
 *
 * So:
 * when dynamic: useCom=true,  Translate Shapes(0,0) to C (= currAnchor), worldPos -> translate from C to A on demand
 * when other:   useCom=false, Translate Shapes(0,0) to A (= currAnchor), worldPos -> use A, update on anchorChange
 *
 * @param type
 */
function createOrRecreateBody(type) {
    if (type === 'none' && !this._rigidBody) {
        // Return immediately when body is not relevant
        return;
    }
    let engine = CPhysicsCtrl.get().engine;
    let world = CPhysicsCtrl.get().world;

    // let oldBody = this._rigidBody;
    //
    // if (oldBody) {
    //     world.removeRigidBody(oldBody);
    // }

    if (type === 'none') {
        world.removeRigidBody(this._rigidBody);
        if (this._rigidBody) delete this._rigidBody;
        return;
    }

    let sensor = type === 'sensor';
    let shapes;
    let material = this._material || CPhysicsCtrl.get().engine.getDefaultMaterial();

    if (this._customShapes) {
        shapes = [];
        for (let cs of this._customShapes) {
            let s = cs.clone();
            s.sensor = sensor;
            s.setMaterial(material);
            shapes.push(s);
        }
    } else if (this.target._pixiObject.texture &&
        this.target._pixiObject.texture.baseTexture &&
        this.target._pixiObject.texture.baseTexture.arrayOfVertices) {
        shapes = arrayOfVerticesToShapes(
            this.target._pixiObject.texture.baseTexture.arrayOfVertices,
            this.target,
            material,
            sensor
        );
    } else if (this.target._pixiObject._generateArrayOfVertices) {
        shapes = arrayOfVerticesToShapes(
            this.target._pixiObject._generateArrayOfVertices(),
            this.target,
            material,
            sensor
        );
    } else {
        shapes = [CPhysicsCtrl.get().engine.createPolygonShape({
            vertices: CPhysicsCtrl.get().engine.createRectangleVertices(0, 0,
                this.target.width / this.target._pixiObject.scale.x,
                this.target.height / this.target._pixiObject.scale.y),
            sensor: sensor,
            material: material
        })];
    }

    // TODO: Is this needed?
    // this.target._pixiObject.calculateVertices();

    let pixelsPerMeter = CStage.get()._options.pixelsPerMeter;

    let rigidBodyType = sensor ? 'kinematic' : type;

    if (this._rigidBody) {
        if (rigidBodyType === 'static' || this._rigidBody.isStatic()) {
            world.removeRigidBody(this._rigidBody);
            delete this._rigidBody;
        }
    }


    if (!this._rigidBody) {
        let position = [
            this.target._pixiObject.x / pixelsPerMeter,
            this.target._pixiObject.y / pixelsPerMeter
        ];
        let rotation = this._target.rotation;
        let velocity = undefined;
        let angularVelocity = undefined;
        this._rigidBody = engine.createRigidBody({
            type: rigidBodyType === 'static' ? 'kinematic' : rigidBodyType, // Set to static when done
            userData: this,
            shapes: shapes,
            position: position,
            rotation: rotation
        });
    } else {
        while (this._rigidBody.shapes.length) {
            this._rigidBody.removeShape(this._rigidBody.shapes[0]);
        }
        switch (rigidBodyType) {
            case 'static': this._rigidBody.setAsKinematic(); break; // Set to static when done
            case 'kinematic': this._rigidBody.setAsKinematic(); break;
            case 'dynamic': this._rigidBody.setAsDynamic(); break;
            default: throw "Invalid value for rigidBodyType ";
        }
        for (let shape of shapes) {
            this._rigidBody.addShape(shape);
        }

    }


    let rigidBody = this._rigidBody;
    let s = new Date().getTime();

    // Reset collision mask
    for (let i = 0; i < rigidBody.shapes.length; i += 1) {
        rigidBody.shapes[i].setMask(this._collisionMask);
        rigidBody.shapes[i].setGroup(this._collisionMask);
    }
    // console.log('tick ' + (new Date().getTime() - s));
    let metersPerPixel = 1/pixelsPerMeter;
    for (let i = 0; i < rigidBody.shapes.length; i += 1) {
        let tmpBody = rigidBody.shapes[i].body;
        rigidBody.shapes[i].body = undefined;
        rigidBody.shapes[i].scale(metersPerPixel, metersPerPixel);
        rigidBody.shapes[i].body = tmpBody;
    }
    // console.log('took ' + (new Date().getTime() - s));


    rigidBody._currAnchor = [0,0];

    let com = rigidBody.computeLocalCenterOfMass();
    let scale = this._target._pixiObject.scale;

    rigidBody._centerOfMassPerc = [
        com[0] / ((this.target.width / (scale.x * pixelsPerMeter)) || 1),
        com[1] / ((this.target.height / (scale.y * pixelsPerMeter)) || 1)
    ];


    if (type === 'dynamic') {
        this._useComOrigin = true;
        rigidBody._currAnchor  = [this.target.anchor.x, this.target.anchor.y];
        // rigidBody._currAnchor = rigidBody._centerOfMassPerc;
        translateShapes.call(this, -com[0], -com[1]);


        // rigidBody.invalidate();
        this._worldPosition = new CTargetPoint(
            () => {
                let rotation = rigidBody.getRotation();
                let sin = Math.sin(rotation);
                let cos = Math.cos(rotation);
                let a = cos, b = sin, c = -sin, d = cos;
                let dx = -(rigidBody._centerOfMassPerc[0] - rigidBody._currAnchor[0]) * this.target.width / pixelsPerMeter;
                let dy = -(rigidBody._centerOfMassPerc[1] - rigidBody._currAnchor[1]) * this.target.height / pixelsPerMeter;
                let pos = rigidBody.getPosition();
                // var bodyX = xFromWorldPoint.call(this, pos);
                // var bodyY = yFromWorldPoint.call(this, pos);
                return {
                    x: pos[0] + dx * a + dy * c,
                    y: pos[1] + dx * b + dy * d
                };
            },
            (pos) =>{
                if (rigidBody.isStatic()) {
                    throw new Error("Static bodies should not be moved");
                }
                let rotation = rigidBody.getRotation();
                let sin = Math.sin(rotation);
                let cos = Math.cos(rotation);
                let a = cos, b = sin, c = -sin, d = cos;
                let dx = (rigidBody._centerOfMassPerc[0] - rigidBody._currAnchor[0]) * this.target.width / pixelsPerMeter;
                let dy = (rigidBody._centerOfMassPerc[1] - rigidBody._currAnchor[1]) * this.target.height / pixelsPerMeter;
                let newPos =[
                    pos.x + dx * a + dy * c,
                    pos.y + dx * b + dy * d
                ];
                rigidBody.setPosition(newPos);
            });

        this._worldPosition.set(this.target._pixiObject.x / pixelsPerMeter, this.target._pixiObject.y / pixelsPerMeter);
    } else {
        this._useComOrigin = false;

        this._worldPosition = new CTargetPoint(
            () => {
                let position = rigidBody.getPosition();
                return {x: position[0], y: position[1]};
            },
            point => rigidBody.setPosition([point.x, point.y])
        );
    }
    world.addRigidBody(rigidBody);
    rigidBody._invalidate();

    scaleBody.call(this);

    updateAnchor.call(this);

    if (rigidBodyType === 'static') {
        this._rigidBody.setAsStatic();
    }
}

function updateAnchor() {
    let anchor = [this.target.anchor.x, this.target.anchor.y];
    let rigidBody = this._rigidBody;
    if (!this._useComOrigin) {
        let world = CPhysicsCtrl.get().world;
        let pixelsPerMeter = CStage.get()._options.pixelsPerMeter;

        let prevAnchor = rigidBody._currAnchor;
        // Translate according to sprite anchor
        let anchorPos = [
            (anchor[0] - prevAnchor[0]) * -this.target.width / pixelsPerMeter,
            (anchor[1] - prevAnchor[1]) * -this.target.height / pixelsPerMeter
        ];

        for (let i = 0; i < rigidBody.shapes.length; i += 1) {
            rigidBody.shapes[i].translate(anchorPos, true);
        }
    }
    rigidBody._currAnchor = anchor;
}

/**
 * Update rigidBody position and rotation from sprite data
 *
 * @private
 */
function scaleBody() {
    let rigidBody = this._rigidBody;
    if (!rigidBody) return;
    let scale = this._target._pixiObject.scale;

    // rigidBody.alignWithOrigin();
    for (var i = 0; i < rigidBody.shapes.length; i++) {
        let shape = rigidBody.shapes[i];
        if (!shape._currScale) {
            shape._currScale = {x: 1, y: 1};
        }
        var relScaleX = scale.x / shape._currScale.x;
        var relScaleY = scale.y / shape._currScale.y;

        rigidBody.shapes[i].scale(relScaleX, relScaleY);
        shape._currScale.x *= relScaleX;
        shape._currScale.y *= relScaleY;

    }
}

// function transformRotateBody() {
//     let rigidBody = this.rigidBody;
//     if (!rigidBody) return;
//     let worldScale = CPhysicsCtrl.get().worldScale;
//
//     let rotation = this.target.rotation;
//     let sin = Math.sin(rotation);
//     let cos = Math.cos(rotation);
//     let a = cos, b = sin, c = -sin, d = cos;
//     let dx = 0;
//     let dy = 0;
//
//     dx = (rigidBody._collisionBodyOrigin.x - this.target._pixiObject.anchor.x) * this.width;
//     dy = (rigidBody._collisionBodyOrigin.y - this.target._pixiObject.anchor.y) * this.height;
//
//     let bodyX = this.x + dx * a + dy * c;
//     let bodyY = this.y + dx * b + dy * d;
//
//     rigidBody.setPosition([worldScale * bodyX, worldScale * bodyY]);
//     rigidBody.setRotation(rotation);
// }

export function showShapes() {

    if (!CPhysicsCtrl.get().showShapes) return;
    let rigidBody = this.rigidBody;
    if (!rigidBody) return;
    rigidBody._prevSleeping = rigidBody.sleeping;
    let worldScale = CPhysicsCtrl.get().worldScale;


    if (!this._bodyObject) {
        this._bodyObject = new PIXI.Graphics(true);
        this.target.stage._childrenContainer.addChild(this._bodyObject);
    }
    let pixelsPerMeter = CStage.get()._options.pixelsPerMeter;

    let g = this._bodyObject;
    g.clear();
    let color = rigidBody.sleeping ? 0x00ff00 : 0xff0000;
    g.lineStyle(2, color);

    for (let shapeIndex = 0; shapeIndex < rigidBody.shapes.length; shapeIndex++) {
        let shape = rigidBody.shapes[shapeIndex];
        let pdata = shape._data;
        let limit = pdata.length;
        if (shape.type === 'CIRCLE') {
            let x = pdata[9] * pixelsPerMeter;
            let y = pdata[10] * pixelsPerMeter;
            let rad = pdata[6] * pixelsPerMeter;
            g.drawCircle(x, y, rad);
        } else {
            let x, y, i;
            let path = [];
            for (i = 6; i < limit; i += 13) {
                x = pdata[i + 2] * pixelsPerMeter;
                y = pdata[i + 3] * pixelsPerMeter;
                if (isNaN(x) || isNaN(y)) debugger;
                path.push(x, y);
            }
            if (path.length) {
                // add first point
                if (path[0] !== x || path[1] !== y) {
                    path.push(path[0]);
                    path.push(path[1]);
                }
                g.drawPolygon(path);
            }
        }
    }
    // g.endFill();

}


function translateShapes(x, y) {
    let pos = [x, y];
    for (let i = 0; i < this._rigidBody.shapes.length; i += 1) {
        this._rigidBody.shapes[i].translate(pos, true);
    }
}

function getTouching(...targets) {
    if (this.isNone()) return;
    if (!targets || !targets.length) targets = this.target.stage.children;
    let utils = CPhysicsCtrl.get().collisionUtils;
    let shapes = this._rigidBody.shapes;
    let r = this._rigidBody.computeWorldBounds();
    let rt = [0,0,0,0];
    let pt = [0,0];

    let pixelsPerMeter = this.target.stage._options.pixelsPerMeter;

    function intersectRect(r1, r2) {
        return !(r2[0] > r1[2] ||
        r2[2] < r1[0] ||
        r2[1] > r1[3] ||
        r2[3] < r1[1]);
    }

    let _isTouching = target => {
        if (!target || target === this.target) return false;
        let targetBody;
        if (target instanceof CSprite) {
            targetBody = target.body && !target.body.isNone() && target.body._rigidBody;
        }
        if (target instanceof CStage) {
            targetBody = target && target.physics && target.physics._borderBody;

        }

        if (targetBody && targetBody.shapes) {
            targetBody.computeWorldBounds(rt);
            if (!intersectRect(r, rt)) {
                return false;
            }
            for (let si = 0; si < shapes.length; si += 1) {
                for (let ti = 0; ti < targetBody.shapes.length; ti += 1) {
                    if (utils.intersects(shapes[si], targetBody.shapes[ti])) {
                        return true;
                    }
                }
            }
        } else if (target.x !== undefined && target.y !== undefined) {
            pt[0] = target.x / pixelsPerMeter;
            pt[1] = target.y / pixelsPerMeter;

            for (let si = 0; si < shapes.length; si += 1) {
                if (utils.containsPoint(shapes[si], pt)) return true;
            }

        }
        return false;
    };

    let touchingTargets = [];
    for (let i = 0; i < targets.length; i += 1) {
        let target = targets[i];
        if (Array.isArray(target)) {
            for (let j = 0; j < target.length; j += 1) {
                let t = target[j];
                if (typeof t === 'string') {
                    t = CSprite.get(t);
                }
                if (!t) continue;
                if (_isTouching(t)) touchingTargets.push(t);
            }
        } else {
            if (typeof target === 'string') {
                target = CSprite.get(target);
            }
            if (!target) continue;
            if (_isTouching(target)) touchingTargets.push(target);
        }
    }
    if (touchingTargets.length) return touchingTargets;
}
