var fs = require('fs');
var gulp = require('gulp');
var browserify = require('browserify');

var config = {
    watching: false,
    usewatchify: false,

    browserify: {
        src: 'index.js.js',
        basedir: 'script',
        require: [],
        output: 'codecab.js',
        dest: 'build'
    },

};


gulp.task('browserify', function () {
    var plugins = [];
    if (config.usewatchify) {
        plugins.push(watchify);
    }
    var bundler = browserify({
        entries: [config.browserify.src],
        require: config.browserify.require,
        basedir: config.browserify.basedir,
        externalRequireName: 'require',
        plugin: plugins,
        // fast: config.usewatchify,
        cache: {},
        packageCache: {}
    });
    bundler.on('update', function() {
        bundle(true);
    });
    bundler.on('log', function (msg) {
        console.log('Browserify: ' + msg);
    });
    return bundle(false);
    function bundle(byWatchify) {
        var b = bundler;
        b = b
            .transform(config.browserify.replace, 'browserify-replace')
            .bundle();
        b = b.on('error', function (e) {
            console.log('Browserify error ' + e.stack);
            if (!byWatchify) {
                throw e;
            }
        });

        b = b.pipe(source(config.browserify.output))
            .pipe(buffer())
            .pipe(gulp.dest(config.browserify.dest));
        return b;
    }
});

gulp.task('build', function() {

});