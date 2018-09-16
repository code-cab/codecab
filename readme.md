```javascript

CSprite {
    body = this.addController(new CRigidBodyController());
    pen = this.addController(new CPenController());
    sound = this.addController(this.stage.sound); // CSoundController
}

CRigidBodyController {
    setRectangleShape(width, height); // empty is sprite bounds
    setCircleShape(radius); // empty is sprite bounds
    setSpriteShape();
    surfaceVelocity;
    type; // none, static, kinetic, static
    isNone();
    isKinetic();
    isStatic();
    isDynamic();
    draggable; // Force: stage.options.draggingForce;

    async pull(force, direction, [px, py, duration]);
    async setVelocity(speed, direction [, duration]);
    shapeLine;
    shapeFill;
    shapeOpacity;

    createFixedJoint(sprite[, px, py]); // -> CFixedJoint, px py  = anchor of other obj (defaults 0.5, 0.5);
    createRotatingJoint(sprite, [px, py]); // CRotatingJoint, px py defaults to center of other object
    createSlidingJoint(sprite, x1, y1, x2, y2); // CSlidingJoint (defaults to center obj1, center obj2)
    // Events (via shape):
    onTouch()
}

CJoint {
    constructor(sprite1, px, py, sprite2, px, py);
    stiff, etc;
}

CRotatingJoint {
    enableMoter;
    motorSpeed;
    motorSrength;
}

CSlidingJoint {
}

// Voorbeeld van vector rectangle
let sprite = new CSprite();
sprite.body.setRectangleShape(50, 60);
sprite.body.shapeLine = 'solid 1px blue';

```

# Ideeen

Autopreview mode. Run with ctrl-R