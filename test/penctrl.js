'use strict';

const testutil = require('./lib/testutil');

const MockPointer = require('./lib/MockPointer');

describe('CPenCtrl', function() {
    it('should draw a pen', async function () {
        CStage.load('cab', testutil.getResourceUrl('test/res/cab.png'));
        const stage = await testutil.startStage();
        let s1 = new CSprite('cab');
        let s2 = new CSprite('cab');
        s1.opacity = 0.0001; // Can't be 0 here. Don't know why.
        s2.opacity = 0.0001; // Can't be 0 here. Don't know why.
        s1.pen.down();
        s2.pen.down();
        s2.pen.setColor(255, 0, 0);
        s2.pen.width = 10;
        s1.x += 10;
        s1.x += 10;
        s1.x += 10;
        s1.x += 10;
        s1.x += 10;
        s1.y = 20;
        s2.x = -30;
        s2.y = -20;
        s1.goto(0, -40);
        s1.pen.width = 5;
        s1.goto(-50, 0);
        s2.goto(-50, 40);
        await testutil.render();
        expect(testutil.compareSnapshot(this)).to.be.true;
    });

    it('should stamp and unstamp', async function() {
        CStage.load('cab', testutil.getResourceUrl('test/res/cab.png'));
        const stage = await testutil.startStage();
        let s = new CSprite('cab');
        s.goto(-30, -10);
        s.pen.stamp();
        s.goto(50, 20);
        s.pen.stamp();
        s.goto(0, 0);
        s.pen.unstamp();
        s.destroy();
        await testutil.render();
        expect(testutil.compareSnapshot(this)).to.be.true;
    }).timeout(600000);
    afterEach(function() {
        testutil.destroyAll();
    });
});