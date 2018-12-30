import CController from '../../CController';
import CRect from '../../CRect';
import CPoint from '../../CPoint';

import b2 from 'lucy-b2';

import * as PIXI from 'pixi.js';
import { firstDefined } from '../../misc/util';
import DebugDraw from './DebugDraw';

let instance;

// const stepTimeMsec = 20;
// const maxCount = 60;
const tempPoint = new PIXI.Point();

export default class CPhysicsCtrl extends CController {
    constructor(options) {
        super();
        if (instance) {
            throw new Error('CPhysicsCtrl already created. Only one instance is allowed. Reset previous instance first');
        }
        instance = this;
        this._options = options || {};
        this._borderBodies = [];

        // this._options.velocityIterations = 100;
        // this._options.positionIterations = 100;
        // this._options.broadphase = this._engine.createSweepAndPruneBroadphase();
        let gravity = new b2.Vec2(this._options.gravity[0], this._options.gravity[1]);
        this._world  = new b2.World(gravity);

        // staticReferenceBody is used to attach something to the world.
        let bodyDef = new b2.BodyDef();
        bodyDef.type = b2.BodyType.staticBody;
        this._staticReferenceBody = this._world.CreateBody(bodyDef);

        // this._engine.collisionUtils = this._engine.createCollisionUtils();
        this._registeredEventMap = {};
        this._eventMap = {};
        this._endTimeMsec = 0;
        this._startTimeMsec = 0;
        this._totalDeltaMsec = undefined;



        // this._debugDraw.setPhysics2DViewport([0, 0, 500, 500]);
    }

    set __target(value) {
        super.__target = value;
        this.enableDragging = this._options.enableDragging;
        this.setBorder(this._options.border);
    }

    static get() {
        return instance;
    }

    destroy() {
        super.destroy();
        instance = undefined;
    }

    get engine() {
        return this._engine;
    }

    get world() {
        return this._world;
    }

    get timer() {
        return this._startTimeMsec / 1000;
    }

    stageToWorld(point, newPoint) {
        newPoint = newPoint || new CPoint();
        newPoint.x /= this._options.pixelsPerMeter;
        newPoint.y /= this._options.pixelsPerMeter;
        return newPoint;
    }

    worldToStage(point, newPoint) {
        newPoint = newPoint || new CPoint();
        newPoint.x *= this._options.pixelsPerMeter;
        newPoint.y *= this._options.pixelsPerMeter;
        return newPoint;
    }

    /**
     * Values:
     *  none: no body;
     *  box: add an edge around the corners
     *  bowl: add an edge at both sides and the bottom
     *  bottom: add an edge at the bottom
     *
     * @param type
     */
    setBorder(type) {
        for (let b of this._borderBodies) {
            this.world.DestroyBody(b);
        }
        this._borderBodies = [];

        let thickness = 10;

        let rect = this.target.stageRect;
        let top = rect.y / this.target._options.pixelsPerMeter;
        let left = rect.x / this.target._options.pixelsPerMeter;
        let bottom = (rect.y + rect.height) / this.target._options.pixelsPerMeter;
        let right = (rect.x + rect.width) / this.target._options.pixelsPerMeter;
        // let bounds = CRect.createFromRect(this.target._app.screen);
        // bounds.applyTransform(this.target._stageContainer.localTransform);
        // bounds.applyTransform(this.transform);
        // let marginBounds = CRect.createFromRect(bounds);
        // marginBounds.pad(thickness);

        const MIN = -200;
        const MAX = 200;

        let addBorderEdge = (l, t, r, b) => {
            let shape = new b2.EdgeShape();
            shape.Set(new b2.Vec2(l, t), new b2.Vec2(r, b));
            let bodyDef = new b2.BodyDef();
            bodyDef.type = b2.BodyType.staticBody;
            let body = this._world.CreateBody(bodyDef);
            body.CreateFixture(shape, 1);
            body.GetFixtureList().maskBits = 0xffffffff;
            this._borderBodies.push(body);
        };
        
        switch (type) {
            case 'box': {
                addBorderEdge(left, top, left, bottom);
                addBorderEdge(right, top, right, bottom);
                addBorderEdge(left, bottom, right, bottom);
                addBorderEdge(left, top, right, top);
                break;
            }
            case 'bowl': {
                addBorderEdge(left, MIN, left, bottom);
                addBorderEdge(right, MIN, right, bottom);
                addBorderEdge(left, bottom, right, bottom);
                break;
            }
            case 'bottom': {
                addBorderEdge(MIN, bottom, MAX, bottom);
                break;
            }
            default: // none
        }
        // if (this._borderBody) this.world.addRigidBody(this._borderBody);
    }

    get collisionUtils() {
        return this.engine.collisionUtils;
    }

    set showShapes(show) {
        this._showShapes = show;
    }

    get showShapes() {
        return firstDefined(this._showShapes, this._options.showShapes);
    }

    set showConstraints(show) {
        this._showConstraints = show;
    }

    get showConstraints() {
        return firstDefined(this._showConstraints, this._options.showConstraints);
    }

    set enableDragging(value) {
        this._draggingEnabled = value;
        if (value) {
            this._enableDragging();
        }
    }

    get enableDragging() {
        return this._draggingEnabled;
    }


    _enableDragging() {
        if (!this._draggingInit) {
            this._draggingInit = true;

            let draggingConstraint;

            this.target.on('pointerdown', (event) => {
                if (draggingConstraint || !this._draggingEnabled) return;
                if (event && event.data && event.data.objects) {
                    let sprite = event.data.objects.find(s => s.body.type === 'dynamic');
                    if (sprite) {
                        draggingConstraint = this.engine.createPointConstraint({
                            bodyA: this._staticReferenceBody,
                            bodyB: sprite.body.rigidBody,
                            anchorA: [event.worldPoint.x, event.worldPoint.y],
                            anchorB: sprite.body.rigidBody.transformWorldPointToLocal([event.worldPoint.x, event.worldPoint.y]),
                            stiff: false,
                            maxForce: 1e5
                        });
                        this.world.addConstraint(draggingConstraint);
                    }
                }
            });

            this.target.on('pointerup', (event) => {
                if (draggingConstraint) {
                    this.world.removeConstraint(draggingConstraint);
                    draggingConstraint = undefined;
                }
            });

            this.target.onFrame(() => {
                if (draggingConstraint && this._draggingEnabled) {
                    let body = draggingConstraint.bodyB;
                    draggingConstraint.setAnchorA([this.target.mouse.worldX, this.target.mouse.worldY]);
                    body.setAngularVelocity(body.getAngularVelocity() * 0.9);
                }
            });
        }
    }

    _bindMouseEvent(eventName, callback) {
        if (this._eventMap[eventName] === undefined) {
            this._eventMap[eventName] = [];
        }
        this._eventMap[eventName].push(callback);
        this._registerMouseEvent(eventName);
    }

    _unbindMouseEvent(eventName, callback) {
        if (this._eventMap[eventName]) {
            let i = this._eventMap[eventName].indexOf(callback);
            if (i >= 0) this._eventMap[eventName].splice(i, 1);
            if (!this._eventMap[eventName].length) {
                delete this._eventMap[eventName];
            }
        }
        this._unregisterMouseEvent(eventName, callback);
    }


    _registerMouseEvent(eventName) {
        if (this._registeredEventMap[eventName] === undefined) {
            this.target._app.stage.interactive = true;
            this._registeredEventMap[eventName] = 1;
            this.target._app.stage.on(eventName,
                event => this._handleEvent(event, eventName));
        } else {
            this._registeredEventMap[eventName] += 1;
        }
    }

    _unregisterMouseEvent(eventName) {
        if (this._registeredEventMap[eventName] > 0) {
            this._registeredEventMap[eventName] -= 1;
            if (this._registeredEventMap[eventName] <= 0) {
                delete this._registeredEventMap[eventName];
                this.target._app.stage.removeListener(eventName);
            }
        }
    }

    _handleEvent(event, eventName) {
        if (!CStage.get()._running) return;
        let point = this.target._stageContainer.toLocal(event.data.global);
        event.point = point;
        point = [
            point.x / this.target._options.pixelsPerMeter,
            point.y / this.target._options.pixelsPerMeter];
        event.worldPoint = {
            x: point[0],
            y: point[1]
        };

        let bodies = [];
        let vec = new b2.Vec2(point[0], point[1]);
        for (let body = this.world.GetBodyList(); body; body = body.GetNext()) {
            for (let fixture = body.GetFixtureList(); fixture; fixture = fixture.GetNext()) {
                if (fixture.TestPoint(vec) && bodies.indexOf(body) < 0) {
                    bodies.push(body);
                }
            }
        }
        if (event.data) {
            event.data.objects = [];
            bodies.forEach(b => {
                if (b.GetUserData() && b.GetUserData().target) {
                    event.data.objects.push(b.GetUserData().target);
                }
            });
        }


        for (let i = 0; i < bodies.length; i += 1) {
            let body = bodies[i];
            if (body.GetUserData() && body.GetUserData()._eventMap[eventName]) {
                for (let j = 0; j < body.GetUserData()._eventMap[eventName].length; j += 1) {
                    let callback = body.GetUserData()._eventMap[eventName][j];
                    callback.call(body.GetUserData().target, event);
                    if (event.defaultPrevented) break;
                }
            }
        }
        if (!event.defaultPrevented && this._eventMap[eventName]) {
            for (let callback of this._eventMap[eventName]) {
                callback.call(this.target, event);
            }
        }
    }

    _update(delta) {
        updatePhysics.call(this, delta);
    }
}

function updatePhysics(deltaSec) {
    // const renderOnEnd = true;
    let count = 0;
    let stepMsec = 1000 / this._options.stepsPerSecond;

    let maxTimeMsec = Math.round(1000/30); // Allow max 1/30Hz time to calculate physics and keep up with time. When
    // this is not sufficient, slow down

    let world = this.world;
    // let bodies = world.rigidBodies;
    // let limit = bodies.length;
    this._endTimeMsec += deltaSec * 1000;

    let endNow = performance.now() + maxTimeMsec;


    while (this._startTimeMsec < this._endTimeMsec && performance.now() < endNow) {
        // for (let body of bodies) {
        //     body._update();
        //     body._prevSleeping = false;
        // }
        world.Step(stepMsec * 0.001, 20, 20);

        this._startTimeMsec += stepMsec;
        count += 1;
    }
    if (this._startTimeMsec < this._endTimeMsec) {
        console.log('Not enough time keep up with physics rendering. Will slow down');
        this._endTimeMsec = this._startTimeMsec;
    }

    let g = undefined;
    if (this.showShapes || this.showConstraints) {
        if (!this._bodyObject) {
            this._bodyObject = new PIXI.Graphics(true);
            this._bodyObject.nativeLines = true;
            CStage.get()._stageContainer.addChild(this._bodyObject);
            let draw = new DebugDraw(this._bodyObject);
            draw.AppendFlags(b2.DrawFlags.e_shapeBit);
            world.SetDebugDraw(draw);
        }
        world.m_debugDraw.prepareDraw();
        world.DrawDebugData();
    }
//
    for (let body = world.GetBodyList(); body; body = body.GetNext()) {
// //        body._update();
        if (body.GetUserData()) {
            body.GetUserData()._update();
        } else {
//             showNonSpriteShapes.call(this, body, g);
        }
    }
//     if (this.showConstraints) {
//         showConstraints.call(this, world, g);
//     }
}


function showNonSpriteShapes(rigidBody, g) {
    if (!rigidBody || !this.showShapes) return;
    let pixelsPerMeter = CStage.get()._options.pixelsPerMeter;

    let color = !rigidBody.IsAwake() ? 0xff0000 : 0x00ff00;
    g.beginFill(color, 0.3);
    g.lineStyle(1, color);

    for (let fixture = rigidBody.GetFixtureList(); fixture; fixture = fixture.GetNext()) {
        let shape = fixture.GetShape();
        let x, y, i, v;
        let limit = shape.m_count;
        let path = [];
        for (i = 0; i < limit; i += 1) {
            v = shape.m_vertices[i];
            x = v.x * pixelsPerMeter;
            y = v.y * pixelsPerMeter;
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
    g.endFill();

}

function showConstraints(world, g) {
    if (!this.showConstraints) return;

    let debug = new PhysicsDebugDraw(g);
    let constraints = world.constraints;
    let limit = constraints.length;
    for (let i = 0; i < limit; i++) {
        let con = constraints[i];
        if (con._active && con._draw) {
            con._draw(debug);
        }
    }
}
