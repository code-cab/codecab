'use strict';

describe('CStage', function() {
    it('should emit start', function(done) {
        let stage = new CStage();
        stage.onStart(done);
    });
    // it('should handle click', function(done) {
    //     let stage = new CStage();
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
        CStage.get().destroy();
    });
});