'use strict';

const testutil = require('./testutil');
const MockPointer = require('./lib/MockPointer');

describe('CStage', function() {
    it('should emit start', function(done) {

        let stage = this.stage = new CStage();
        stage.onStart(done);
    });
    it('should not autostart', async function() {
        let stage = this.stage.new CStage({autoStart: false});
        testutil.delay(500);
        expect(stage._running).not.to.equal(true);
        await stage.start();
        expect(stage._running).to.equal(true);
    });

    // it('should handle click', function(done) {
    //     let stage = this.stage = new CStage();
    //     stage.onClick(done);
    //     stage.onStart(function() {
    //         let event = new MouseEvent('click', {
    //             view: window,
    //             bubbles: true,
    //             cancelable: true
    //         });
    //         stage._app.view.dispatchEvent(event);
    //     });
    //
    // });
    afterEach(function() {
        if (this.stage) {
            this.stage.destroy();
            delete this.stage;
        }
        if (this.pointer)
        {
            this.pointer.cleanUp();
            delete this.pointer;
        }
    });
});