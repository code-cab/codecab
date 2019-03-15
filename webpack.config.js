const path = require('path');

module.exports = {
    entry: './src/windowscope.js',
    target: '',
    optimization:{
        minimize: false,
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'codecab-webpack.js'
    },
    resolve: { // Config for tern/webpack  plugin
    }
};