// Generates a worker script to avoid using all kind of worker-loaders

const fs = require('fs');

const filename = './generate/codecab-worker.js';
let s = fs.readFileSync(filename, 'utf8');
fs.writeFileSync(filename, `"use strict";\nlet s='${Buffer.from(s).toString('base64')}';\nexport default s;`);
process.exit(0);