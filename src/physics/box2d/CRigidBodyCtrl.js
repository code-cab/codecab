/**
 * Created by ROB3656 on 1-2-2018.
 */
import CController from '../../CController';
// import CPolygonShapes from '../turbulenz/CPolygonShapes';
import CPhysicsCtrl from './CPhysicsCtrl';
import CTargetPoint from '../../core/CTargetPoint'
import CStage from '../../CStage';
// import CShapes from '../turbulenz/CPolygonShapes';
import CMath from '../../CMath';
import {CRotatingJoint, CFixedJoint} from './CJoint';
import VerticesArray from '../../tracer/VerticesArray';

import b2 from 'lucy-b2';

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
        this._autoShape = true;

        // useComOrigin indicates if the Shapes will be aligned to the 'Center of Mass' or to the Sprites anchor.
        // When _useComOrigin is true, origin of the shapes will not match the rigid body x y and have to
        // be translated. _useComOrigin needs to be true for dynamic bodies.
        this._useComOrigin = false;
        this._collisionMask = 0xffffffff;
        // this._material = CPhysicsCtrl.get().engine.getDefaultMaterial();
        this._material = {
            density: 1.0,
            friction: 0.5,
            restitution: 0.1
        };
        this._eventMap = {};
    }

    set __target(value) {
        super.__target = value;
    }

    _bindMouseEvent(eventName, callback) {
        if (this._eventMap[eventName] === undefined) {
            this._eventMap[eventName] = [];
        }
        this._eventMap[eventName].push(callback);
        CPhysicsCtrl.get()._registerMouseEvent(eventName);
        if (this.isNone()) {
            this.type = 'sensor';
        }
    }

    _unbindMouseEvent(eventName, callback) {
        if (this._eventMap[eventName]) {
            let i = this._eventMap[eventName].indexOf(callback);
            if (i >= 0) this._eventMap[eventName].splice(i, 1);
            if (!this._eventMap[eventName].length) {
                delete this._eventMap[eventName];
            }
        }
        CPhysicsCtrl.get()._unregisterMouseEvent(eventName, callback);
    }

    getTouching(...targets) {
        return getTouching.apply(this, arguments);
    }

    setRectangleShape(width, height) {
        // TODO
        // this._autoShape = false;
        // let shapes = [this._target.stage._engine.createPolygonShape()
    }

    setCircleShape(radius) {
        let pixelsPerMeter = CStage.get()._options.pixelsPerMeter;
        // Device by scale because when body is created the size is scaled down again.
        // Custom shape should be independent of scale

        let shape = new b2.CircleShape();
        shape.m_radius = radius / this.target._pixiObject.scale.x;
        shape.Set(this._target.width / (2 * this.target._pixiObject.scale.x),
            this._target.height / (2 *  this.target._pixiObject.scale.y));

        this._customShapes = [shape];
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
        // Box2d won't allow scaling shapes
        this.type = this.type;
        // scaleBody.call(this);
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
                    lowerBound: this._rigidBody.GetAngle(),
                    upperBound: this._rigidBody.GetAngle()
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
        this._material.density = density;
        this.type = this.type;
    }


    get density() {
        return this._material.getDensity();
    }

    set mass(mass) {
        this._rigidBody.SetMassData({
            mass: mass,
            center: new b2.Vec2(0, 0),
            I: 0
        });
    }

    set bullet(isBullet) {
        this._rigidBody.SetBullet(isBullet);
    }

    set type(value) {
        ASSERT.isOneOf(['none', 'sensor', 'dynamic', 'kinematic', 'static'], value, 'type');
        createOrRecreateBody.call(this, value);
    }

    get type() {
        if (this.isNone()) return 'none';
        if (this.isSensor()) return 'sensor';
        if (this.isStatic()) return 'static';
        if (this.isKinematic()) return 'kinematic';
        return 'dynamic';
    }

    isSensor() {
        return this._rigidBody.GetFixtureList() && this._rigidBody.GetFixtureList().IsSensor();
    }

    isKinematic() {
        return this._rigidBody.GetType() === b2.BodyType.kinematicBody;
    }

    isDynamic() {
        return this._rigidBody && this._rigidBody.isDynamic();
    }

    isStatic() {
        return this._rigidBody.GetType() === b2.BodyType.staticBody;
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
            this.rigidBody.SetAngle(deg2rad(value));
            this._worldPosition.setPoint(pos);
        }
    }

    get rotation() {
        return this.isNone() ? this.target.rotation : rad2deg(this.rigidBody.GetAngle());
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
        for (let f = rigidBody.GetFixtureList(); f; f = f.GetNext()) {
            if (!f.filter) f.filter = new b2.Filter();
            f.maskBits = this._collisionMask;
            f.categoryBits = this._collisionMask;
            // rigidBody.shapes[i].setMask(this._collisionMask);
            // rigidBody.shapes[i].setGroup(this._collisionMask);
        }
    }

    applyImpulse(force, direction) {
        let impulse = new b2.Vec2(
            force * CMath.sin(direction),
            -force * CMath.cos(direction)
        );
        this._rigidBody.ApplyForceToCenter(impulse, true);
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
        if (!this.rigidBody.IsAwake() && this.rigidBody._prevSleeping) return;
        let sprite = this.target._pixiObject;
        let pos = this._worldPosition.get();
        pos.x *= CStage.get()._options.pixelsPerMeter;
        pos.y *= CStage.get()._options.pixelsPerMeter;
        if (pos.x !== sprite.x || pos.y !== sprite.y) {
            sprite.x = pos.x;
            sprite.y = pos.y;
            this._target.emit('position', {x: sprite.x, y: sprite.y});
        }
        // if (this._freezeRotation !== undefined) {
        //     this.rigidBody.setRotation(this._freezeRotation);
        // }
        sprite.rotation = this.rigidBody.GetAngle();

        showShapes.call(this);

    }
}

function arrayOfVerticesToShapes(arrayOfVertices, scaleX, scaleY, offX, offY) {
    let shapes = [];

    function pushVerticesAsShape(vertices) {
        let shape = new b2.PolygonShape();
        shape.Set(vertices, vertices.length);
        shapes.push(shape);
    }
    let index = 1;
    for (let l = 0; l < Math.round(arrayOfVertices[0]); l++) {
        let verticesCount = Math.round(arrayOfVertices[index++]);
        let vertices = [];
        for (let v = 0; v < verticesCount; v++) {
            if (vertices.length === 8 ||
                (vertices.length >= 6 && verticesCount - v === 3)) {
                pushVerticesAsShape(vertices);
                let firstVer = vertices[0];
                vertices = [vertices[0], vertices[vertices.length-1]];
            }

            let x = arrayOfVertices[index++] * scaleX + offX;
            let y = arrayOfVertices[index++] * scaleY + offY;

            vertices.push(new b2.Vec2(x, y));
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
    let world = CPhysicsCtrl.get().world;

    // let oldBody = this._rigidBody;
    //
    // if (oldBody) {
    //     world.removeRigidBody(oldBody);
    // }

    let pixelsPerMeter = CStage.get()._options.pixelsPerMeter;
    let metersPerPixel = 1/pixelsPerMeter;

    if (type === 'none') {
        world.DestroyBody(this._rigidBody);
        if (this._rigidBody) delete this._rigidBody;
        return;
    }

    let sensor = type === 'sensor';
    let shapes;
    let material = this._material || CPhysicsCtrl.get().engine.getDefaultMaterial();

    let anchor = [this.target.anchor.x, this.target.anchor.y];
    let anchorPos = [
        (anchor[0]) * -this.target.width / pixelsPerMeter,
        (anchor[1]) * -this.target.height / pixelsPerMeter
    ];

        // Obsolete in box2d?
        // for (let i = 0; i < rigidBody.shapes.length; i += 1) {
        //     rigidBody.shapes[i].translate(anchorPos, true);
        // }
    // }

    let sx = this.target._pixiObject.scale.x;
    let sy = this.target._pixiObject.scale.y;

    if (this._customShapes) {
        shapes = [];
        for (let cs of this._customShapes) {
            let s;
            if (cs instanceof b2.CircleShape) {
                let s = new b2.CircleShape();
            } else {
                throw Error("Unsupported custom shape class");
            }
            let verts = [];
            s.m_radius = cs.m_radius * sx;
            for (let i = 0; i < cs.GetVertexCount(); i += 1) {
                let v = cs.GetVertex(i);
                verts.push[
                    new b2.Vec2(v.x * metersPerPixel * sx + anchorPos[0]),
                        new b2.Vec2(v.y * metersPerPixel * sy + anchorPos[1])];
            }
            s.Set(verts);
            s.sensor = sensor;
            s.material = material;
            shapes.push(s);
        }
    } else if (this.target._pixiObject.texture &&
        this.target._pixiObject.texture.baseTexture &&
        this.target._pixiObject.texture.baseTexture.arrayOfVertices) {
        shapes = arrayOfVerticesToShapes(this.target._pixiObject.texture.baseTexture.arrayOfVertices,
            metersPerPixel * sx,
            metersPerPixel * sy,
            anchorPos[0], anchorPos[1]
            );
    } else if (this.target._pixiObject._generateArrayOfVertices) {
        shapes = arrayOfVerticesToShapes(this.target._pixiObject._generateArrayOfVertices(),
            metersPerPixel * sx + anchorPos[0],
            metersPerPixel * sy + anchorPos[1],
            anchorPos[0], anchorPos[1]
        );
    } else {
        // shapes = [CPhysicsCtrl.get().engine.createPolygonShape({
        //     vertices: CPhysicsCtrl.get().engine.createRectangleVertices(0, 0,
        //         this.target.width / sx,
        //         this.target.height / sy),
        //     sensor: sensor,
        //     material: material
        // })];
        shapes = [];
        let shape = new b2.PolygonShape();
        shape.SetAsBox(this.target.width * metersPerPixel / sx,
                this.target.height * metersPerPixel / sy);
        shapes.push(shape);
    }

    // TODO: Is this needed?
    // this.target._pixiObject.calculateVertices();


    let rigidBodyType = sensor ? 'kinematic' : type;

    if (this._rigidBody) {
        if (rigidBodyType === 'static' || this._rigidBody.GetType() === b2.BodyType.staticBody) {
            world.DestroyBody(this._rigidBody);
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
        let bodyDef = new b2.BodyDef();
        const bodyTypes = {
            'dynamic': b2.BodyType.dynamicBody,
            'sensor': b2.BodyType.dynamicBody,
            'kinematic': b2.BodyType.kinematicBody,
            'static': b2.BodyType.kinematicBody, // Set to static when done
        };
        bodyDef.type = bodyTypes[rigidBodyType];
        this._rigidBody = world.CreateBody(bodyDef);
        for (let shape of shapes) {
            let fixDef = new b2.FixtureDef();
            fixDef.density = material.density;
            fixDef.friction = material.friction;
            fixDef.restitution = material.restitution;
            fixDef.shape = shape;
            fixDef.isSensor = sensor;
            this._rigidBody.CreateFixture(fixDef);
        }
        this._rigidBody.SetTransform(position[0], position[1], rotation);
        this._rigidBody.SetUserData(this);

        // this._rigidBody = engine.createRigidBody({
        //     type: rigidBodyType === 'static' ? 'kinematic' : rigidBodyType, // Set to static when done
        //     userData: this,
        //     shapes: shapes,
        //     position: position,
        //     rotation: rotation
        // });
    } else {
        // while (this._rigidBody.shapes.length) {
        //     this._rigidBody.removeShape(this._rigidBody.shapes[0]);
        // }
        let fixture;
        while ((fixture = this._rigidBody.GetFixtureList())) {
            this._rigidBody.DestroyFixture(fixture);
        }
        switch (rigidBodyType) {
            case 'static': this._rigidBody.SetType(b2.BodyType.kinematicBody); break; // Set to static when done
            case 'kinematic': this._rigidBody.SetType(b2.BodyType.kinematicBody); break;
            case 'dynamic': this._rigidBody.SetType(b2.BodyType.dynamicBody); break;
            default: throw "Invalid value for rigidBodyType ";
        }
        for (let shape of shapes) {
            let fixDef = new b2.FixtureDef();
            fixDef.density = material.density;
            fixDef.friction = material.friction;
            fixDef.restitution = material.restitution;
            fixDef.shape = shape;
            fixDef.isSensor = sensor;
            this._rigidBody.CreateFixture(fixDef);
        }

    }


    let rigidBody = this._rigidBody;
    let s = new Date().getTime();

    // Reset collision mask
    for (let f = rigidBody.GetFixtureList(); f; f = f.GetNext()) {
        if (!f.filter) f.filter = new b2.Filter();
        f.maskBits = this._collisionMask;
        f.categoryBits = this._collisionMask;
        // rigidBody.shapes[i].setMask(this._collisionMask);
        // rigidBody.shapes[i].setGroup(this._collisionMask);
    }


    // Obsolete in Box2d?
    // console.log('tick ' + (new Date().getTime() - s));
    /*
    for (let i = 0; i < rigidBody.shapes.length; i += 1) {
        let tmpBody = rigidBody.shapes[i].body;
        rigidBody.shapes[i].body = undefined;
        rigidBody.shapes[i].scale(metersPerPixel, metersPerPixel);
        rigidBody.shapes[i].body = tmpBody;
    }
    // console.log('took ' + (new Date().getTime() - s));
    */

    rigidBody._currAnchor = [0,0];

    let com = rigidBody.GetLocalCenter();
    com = [com.x, com.y];
    let scale = this._target._pixiObject.scale;

    rigidBody._centerOfMassPerc = [
        com[0] / ((this.target.width / (scale.x * pixelsPerMeter)) || 1),
        com[1] / ((this.target.height / (scale.y * pixelsPerMeter)) || 1)
    ];


    if (type === 'dynamic-not-sed') {
        this._useComOrigin = true;
        rigidBody._currAnchor  = [this.target.anchor.x, this.target.anchor.y];
        // FIXME: Do we need this for BOX2D?
        //translateShapes.call(this, -com[0], -com[1]);


        // rigidBody.invalidate();
        this._worldPosition = new CTargetPoint(
            () => {
                let rotation = rigidBody.GetAngle();
                let sin = Math.sin(rotation);
                let cos = Math.cos(rotation);
                let a = cos, b = sin, c = -sin, d = cos;
                let dx = -(rigidBody._centerOfMassPerc[0] - rigidBody._currAnchor[0]) * this.target.width / pixelsPerMeter;
                let dy = -(rigidBody._centerOfMassPerc[1] - rigidBody._currAnchor[1]) * this.target.height / pixelsPerMeter;
                let pos = rigidBody.GetPosition();
                pos = [pos.x, pos.y];
                // var bodyX = xFromWorldPoint.call(this, pos);
                // var bodyY = yFromWorldPoint.call(this, pos);
                return {
                    x: pos[0] + dx * a + dy * c,
                    y: pos[1] + dx * b + dy * d
                };
            },
            (pos) =>{
                if (rigidBody.GetType() === b2.BodyType.staticBody) {
                    throw new Error("Static bodies should not be moved");
                }
                let rotation = rigidBody.GetAngle();
                let sin = Math.sin(rotation);
                let cos = Math.cos(rotation);
                let a = cos, b = sin, c = -sin, d = cos;
                let dx = (rigidBody._centerOfMassPerc[0] - rigidBody._currAnchor[0]) * this.target.width / pixelsPerMeter;
                let dy = (rigidBody._centerOfMassPerc[1] - rigidBody._currAnchor[1]) * this.target.height / pixelsPerMeter;
                let newPos =[
                    pos.x + dx * a + dy * c,
                    pos.y + dx * b + dy * d
                ];
                rigidBody.SetPosition(new b2.Vec2(newPos[0], newPos[1]));
            });

        this._worldPosition.set(this.target._pixiObject.x / pixelsPerMeter, this.target._pixiObject.y / pixelsPerMeter);
    } else {
        this._useComOrigin = false;

        this._worldPosition = new CTargetPoint(
            () => {
                let position = rigidBody.GetPosition();
                return {x: position.x, y: position.y};
            },
            point => rigidBody.SetTransform(new b2.Vec2(point.x, point.y), rigidBody.GetAngle())
        );
    }
    // world.addRigidBody(rigidBody);
    // rigidBody._invalidate();

//    scaleBody.call(this);

//    updateAnchor.call(this);

    if (rigidBodyType === 'static') {
        this._rigidBody.type = b2.BodyType.staticBody;
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

        // FIXME
        // for (let i = 0; i < rigidBody.shapes.length; i += 1) {
        //     rigidBody.shapes[i].translate(anchorPos, true);
        // }
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
    return;
    if (!CPhysicsCtrl.get().showShapes) return;
    var rigidBody = this.rigidBody;
    if (!rigidBody) return;
    rigidBody._prevSleeping = !rigidBody.IsAwake();
    let worldScale = CPhysicsCtrl.get().worldScale;


    if (!this._bodyObject) {
        this._bodyObject = new PIXI.Graphics(true);
        this.target.stage._childrenContainer.addChild(this._bodyObject);
    }
    let pixelsPerMeter = CStage.get()._options.pixelsPerMeter;

    var g = this._bodyObject;
    g.clear();
    var color = !rigidBody.IsAwake() ? 0x00ff00 : 0xff0000;
    g.lineStyle(2, color);

    for (let fixture = rigidBody.GetFixtureList(); fixture; fixture = fixture.GetNext()) {

        let shape = fixture.GetShape();
        var limit = shape.m_count;
        var x, y, i;
        var path = [];
        for (i = 0; i < limit; i += 1) {
            x = shape.m_vertices[i].x * pixelsPerMeter;
            y = shape.m_vertices[i].y * pixelsPerMeter;
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
    if (!targets.length) targets = this.target.stage.children;
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
        let targetShapes = target && target.body && !target.body.isNone() && target.body._rigidBody.shapes;
        if (targetShapes) {
            target.body._rigidBody.computeWorldBounds(rt);

            if (!intersectRect(r, rt)) {
                return false;
            }
            for (let si = 0; si < shapes.length; si += 1) {
                for (let ti = 0; ti < targetShapes.length; ti += 1) {
                    if (utils.intersects(shapes[si], targetShapes[ti])) {
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
