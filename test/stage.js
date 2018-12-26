'use strict';

const testutil = require('./lib/testutil');

const MockPointer = require('./lib/MockPointer');

describe('CStage', function() {
    it('should emit start', function(done) {
        const stage = new CStage();
        stage.onStart(done);
    });
    it('should not autostart', async function() {
        const stage = new CStage({autoStart: false});
        await testutil.delay(200);
        expect(stage._running).not.to.equal(true);
        await stage.start();
        expect(stage._running).to.equal(true);
    });

    it('should handle click', async function() {
        const stage = new CStage({autoStart: false});
        const pointer = new MockPointer(stage._app.stage);
        const spy = sinon.spy();
        stage.onClick(spy);
        pointer.click(10, 10);
        await testutil.delay(200);
        await stage.start();
        pointer.click(10, 10);
        expect(spy.callCount).to.equal(1);
    });

    afterEach(function() {
        testutil.destroyAll();
    });
});