'use strict';
debugger;
const testutil = require('./lib/testutil');

const MockPointer = require('./lib/MockPointer');

describe('CSprite-filter', function() {
    it('should apply ascii filter', async function () {
        await testFilter.call(this, 'ascii', 10);
    });

    it('should apply blur filter', async function () {
        await testFilter.call(this, 'blur', 10);
    });
    it('should apply bulge filter', async function () {
        await testFilter.call(this, 'bulge', 50, true);
    });
    it('should apply convolution filter', async function () {
        await testFilter.call(this, 'convolution', 20);
    });
    it('should apply crt filter', async function () {
        await testFilter.call(this, 'crt', 20);
    });
    it('should apply dot filter', async function () {
        await testFilter.call(this, 'dot', 20);
    });
    it('should apply glow filter', async function () {
        await testFilter.call(this, 'glow', 30);
    });
    it('should apply godray filter', async function () {
        await testFilter.call(this, 'godray', 30);
    });
    it('should apply noise filter', async function () {
        await testFilter.call(this, 'noise', 30);
    });
    it('should apply oldFilm filter', async function () {
        await testFilter.call(this, 'oldFilm', 30);
    });
    it('should apply outline filter', async function () {
        await testFilter.call(this, 'outline', 30);
    });
    it('should apply pixelate filter', async function () {
        await testFilter.call(this, 'pixelate', 30);
    });
    it('should apply radialBlur filter', async function () {
        await testFilter.call(this, 'radialBlur', 30);
    });
    it('should apply reflection filter', async function () {
        await testFilter.call(this, 'reflection', 30);
    });
    it('should apply rgbSplit filter', async function () {
        await testFilter.call(this, 'rgbSplit', 30);
    });
    it('should apply twist filter', async function () {
        await testFilter.call(this, 'twist', 30);
    });
    it('should apply gamma filter', async function () {
        await testFilter.call(this, 'gamma', 100);
    });
    it('should apply contrast filter', async function () {
        await testFilter.call(this, 'contrast', 100);
    });
    it('should apply saturation filter', async function () {
        await testFilter.call(this, 'saturation', 100);
    });
    it('should apply red filter', async function () {
        await testFilter.call(this, 'red', 100);
    });
    it('should apply green filter', async function () {
        await testFilter.call(this, 'green', 100);
    });
    it('should apply blue filter', async function () {
        await testFilter.call(this, 'blue', 100);
    });
    it('should apply brightness filter', async function () {
        await testFilter.call(this, 'brightness', 100);
    });
    it('should apply bloom filter', async function () {
        await testFilter.call(this, 'bloom', 50);
    });
    it('should apply alpha filter', async function () {
        await testFilter.call(this, 'alpha', 50);
    });

    afterEach(function() {
        testutil.destroyAll();
    });
});

async function testFilter(name, amount, useSprite) {
    CStage.load('cab', testutil.getResourceUrl('test/res/cab.png'));
    CStage.load('back', testutil.getResourceUrl('test/res/background.jpg'));
    const stage = await testutil.startStage();
    Object.defineProperty(stage, 'timer', {
        get: () => 0.1
    });
    stage.setBackground('back');
    let oldRandom = Math.random;
    Math.random = () => 0.5;
    let s = new CSprite('cab');
    if (useSprite) {
        s.setEffect(name, amount);
    } else {
        stage.setEffect(name, amount);
    }

    await testutil.render();
    Math.random = oldRandom;
    expect(testutil.compareSnapshot(this)).to.be.true;
}

