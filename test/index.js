'use strict';

/* eslint-disable global-require */
require('../build/codecab-' + process.env.npm_package_version);

describe('CodeCab', function ()
{
    require('./stage.js');
});