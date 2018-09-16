import b2 from '../../../lib/js/box2d/Box2D_v2.3.1_min';

class World extends b2.b2World {
    constructor(a,b,c,d) {
        super(a,b,c,d);
    }
}

class Vec2 extends b2.b2Vec2 {
    constructor(a,b,c,d) {
        super(a,b,c,d);
    }
}

class BodyDef extends b2.b2BodyDef {
    constructor(a,b,c,d) {
        super(a,b,c,d);
    }

    set type(value) {
        this.set_type(value);
    }
    get type() {
        return this.get_type();
    }
}

let BodyType = {
    staticBody:b2.b2_staticBody
};

class EdgeShape extends b2.b2EdgeShape {
    constructor(a,b,c,d) {
        super(a,b,c,d);
    }
}

class Draw extends b2.b2Draw {
    constructor(a,b,c,d) {
        super(a,b,c,d);
    }
}

var B2 = {
    World,
    Draw,
    Vec2,
    BodyDef,
    BodyType,
    EdgeShape
};

module.exports = B2;