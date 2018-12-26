'use strict';

const testutil = require('./lib/testutil');

const MockPointer = require('./lib/MockPointer');

describe('CSprite', function() {
    it('should only be used for debugging', async function () {
        CStage.load('cab', testutil.getResourceUrl('test/res/cab.png'));
        const stage = new CStage({width: 250, height: 100, autoStart: false});
        let s = new CSprite('cab');
        await stage.start();
        stage._app.render();
        expect(testutil.compareSnapshot(this)).to.be.true;
    });

    afterEach(function() {
        testutil.destroyAll();
    });
});