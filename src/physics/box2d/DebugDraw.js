import b2 from 'lucy-b2';

export default class DebugDraw extends b2.Draw {
    constructor(g) {
        super();
        this._g = g;
    }

    X(v) {
        return this._matrix.p.x + v.x * this._matrix.q.c - v.y * this._matrix.q.s;
    }
    Y(v) {
        return this._matrix.p.y + v.x * this._matrix.q.s + v.y * this._matrix.q.c;
    }

    PushTransform(a) {
        this._matrix = a;
    }
    PopTransform(a) {
        this._matrix = undefined;
    }
    prepareDraw() {
        this._g.clear();
        this._pixelsPerMeter = CStage.get()._options.pixelsPerMeter;
    }

    DrawPolygon(vertices, vertexCount, color) {
        this.DrawSolidPolygon(vertices, vertexCount, color);
    }

    DrawSolidPolygon(vertices, vertexCount, color) {
        let g = this._g;
        // FIXME: Set color correctly
        g.lineStyle(2, 0xff0000);
        // g.beginFill(0x00ff00, 0.5);
        var path = [];
        let x, y;
        for (let i = 0; i < vertexCount; i += 1) {
            x = this.X(vertices[i]) * this._pixelsPerMeter;
            y = this.Y(vertices[i]) * this._pixelsPerMeter;
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
        // g.endFill();
    }
}