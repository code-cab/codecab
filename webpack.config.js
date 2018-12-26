const path = require('path');

module.exports = {
    entry: './src/windowscope.js',
    optimization:{
        minimize: false,
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: 'codecab-webpack.js'
    }
};