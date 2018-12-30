import CController from '../../CController';
import CRect from '../../CRect';
import CPoint from '../../CPoint';
import CMath from "../../CMath";

import * as TURB from '../../../generate/lib/turbulenz/physics2ddevice'
import * as PIXI from 'pixi.js';
import { firstDefined } from '../../misc/util';
import { PhysicsDebugDraw } from './PhysicsDebugDraw';

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

        this._engine = TURB.Physics2DDevice.create();

        // this._options.velocityIterations = 100;
        // this._options.positionIterations = 100;
        // this._options.broadphase = this._engine.createSweepAndPruneBroadphase();
        let o = {
            broadphase: this._options.broadphase,
            velocityIterations: this._options.velocityIterations,
            positionIterations: this._options.positionIterations
        };
        o.gravity = [
            this._options.gravity * CMath.sin(this._options.gravityDirection),
            -this._options.gravity * CMath.cos(this._options.gravityDirection)
        ];
        this._world  = this._engine.createWorld(o);
        this._world.clear();

        // staticReferenceBody is used to attach something to the world.
        this._staticReferenceBody = this._engine.createRigidBody({type: 'static', position: [0,0]});
        this._world.addRigidBody(this._staticReferenceBody);
        this._engine.collisionUtils = this._engine.createCollisionUtils();
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
     *  [bottom, left, right, top]: add edge at specific coordinates
     *
     * @param type
     */
    setBorder(type) {
        if (this._borderBody) this.world.removeRigidBody(this._borderBody);

        const MIN = -20000;
        const MAX = 20000;

        let thickness = 10;

        let rect = this.target.stageRect;
        let top = rect.y;
        let left = rect.x;
        let bottom = (rect.y + rect.height);
        let right = (rect.x + rect.width);

        if (typeof type === 'object' ) {
            bottom = type.bottom != undefined ? type.bottom : MAX;
            left = type.left != undefined ? type.left : MIN;
            top = type.top != undefined ? type.top : MIN;
            right = type.right != undefined ? type.right : MAX;
            type = 'box';
        }

        top /= this.target._options.pixelsPerMeter;
        left /= this.target._options.pixelsPerMeter;
        right /= this.target._options.pixelsPerMeter;
        bottom /= this.target._options.pixelsPerMeter;


        switch (type) {
            case 'box':
                this._borderBody = this.engine.createRigidBody({
                    type: 'static',
                    shapes: [
                        // left
                        this.engine.createPolygonShape({
                            vertices: this.engine.createRectangleVertices(left-thickness, top, left, bottom),
                            group: 0xffffff
                        }),
                        // right
                        this.engine.createPolygonShape({
                            vertices: this.engine.createRectangleVertices(right, top, right + thickness, bottom),
                            group: 0xffffff
                        }),
                        // top
                        this.engine.createPolygonShape({
                            vertices: this.engine.createRectangleVertices(left-thickness, top-thickness, right+thickness, top),
                            group: 0xffffff
                        }),
                        // bottom
                        this.engine.createPolygonShape({
                            vertices: this.engine.createRectangleVertices(left-thickness, bottom, right+thickness, bottom + thickness),
                            group: 0xffffff
                        })
                    ]
                });
                break;
            case 'bowl':
                this._borderBody = this.engine.createRigidBody({
                    type: 'static',
                    shapes: [
                        // left
                        this.engine.createPolygonShape({
                            vertices: this.engine.createRectangleVertices(left-thickness, MIN, left, bottom),
                            group: 0xffffff
                        }),
                        // right
                        this.engine.createPolygonShape({
                            vertices: this.engine.createRectangleVertices(right, MIN, right + thickness, bottom),
                            group: 0xffffff
                        }),
                        // bottom
                        this.engine.createPolygonShape({
                            vertices: this.engine.createRectangleVertices(left - thickness, bottom, right + thickness, bottom + thickness),
                            group: 0xffffff
                        })
                    ]
                });
                break;
            case 'bottom':
                this._borderBody = this.engine.createRigidBody({
                    type: 'static',
                    shapes: [
                        // bottom
                        this.engine.createPolygonShape({
                            vertices: this.engine.createRectangleVertices(MIN, bottom, MAX, bottom + thickness),
                            group: 0xffffff
                        })
                    ]
                });
                break;
            default: // none
                this._borderBody = undefined;
        }
        if (this._borderBody) this.world.addRigidBody(this._borderBody);
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
                if (event && event.allTargets) {
                    let sprite = event.allTargets.find(s => s.body && s.body.type === 'dynamic');
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
    let bodies = world.rigidBodies;
    let limit = bodies.length;
    this._endTimeMsec += deltaSec * 1000;

    let endNow = performance.now() + maxTimeMsec;


    while (this._startTimeMsec < this._endTimeMsec && performance.now() < endNow) {
        for (let body of bodies) {
            if (body.userData && body.userData.target &&
                (body.userData.target.__notStarted || body.userData.target._destroyed || !body.userData.target.enable)) continue;
            body._update();
            body._prevSleeping = false;
        }
        world.step(stepMsec * 0.001);

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
            CStage.get()._childrenContainer.addChild(this._bodyObject);
        }
        g = this._bodyObject;
        g.clear();
    }
    for (let i = 0; i < limit; i++) {
        let body = bodies[i];
        if (body.userData && body.userData.target &&
            (body.userData.target.__notStarted || body.userData.target._destroyed || !body.userData.target.enable)) continue;
        body._update();
        if (body.userData) {
            body.userData._update();
        } else {
            showNonSpriteShapes.call(this, body, g);
        }
    }
    if (this.showConstraints) {
        showConstraints.call(this, world, g);
    }
}


function showNonSpriteShapes(rigidBody, g) {
    if (!rigidBody || !this.showShapes) return;
    let pixelsPerMeter = CStage.get()._options.pixelsPerMeter;

    var color = rigidBody.sleeping ? 0xff0000 : 0x00ff00;
    g.beginFill(color, 0.3);
    g.lineStyle(1, color);

    for (var shapeIndex = 0; shapeIndex < rigidBody.shapes.length; shapeIndex++) {
        var shape = rigidBody.shapes[shapeIndex];
        var pdata = shape._data;
        var limit = pdata.length;
        var x, y, i;
        var path = [];
        for (i = 6; i < limit; i += 13) {
            x = pdata[i + 2] * pixelsPerMeter;
            y = pdata[i + 3] * pixelsPerMeter;
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
