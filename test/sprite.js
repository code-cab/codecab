'use strict';

const testutil = require('./lib/testutil');

const MockPointer = require('./lib/MockPointer');

describe('CSprite', function() {
    it('should show the sprite after first render', async function () {
        CStage.load('cab', testutil.getResourceUrl('test/res/cab.png'));
        const stage = new CStage({width: 250, height: 100, autoStart: false});
        let s = new CSprite('cab');
        await stage._init();
        await stage._app.render();

        expect(testutil.compareSnapshot(this)).to.be.true;
    });

    it('should show the sprite after normal start', function (done) {
        let self = this;
        CStage.load('cab', testutil.getResourceUrl('test/res/cab.png'));
        const stage = new CStage({width: 250, height: 100});
        let s = new CSprite('cab');
        s.onStart(function() {
            expect(s.width).to.be.gt(0);
            testutil.render().then(() => {
                expect(testutil.compareSnapshot(self)).to.be.true;
                done();
            });
        });
    }).timeout(4000);

    afterEach(function() {
        testutil.destroyAll();
    });
});