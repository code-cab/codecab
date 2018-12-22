// Generates a worker script to avoid using all kind of worker-loaders

const fs = require('fs');
const path = require('path');

const headSrc =
`let __modules = {};

function require(name) {
	return __modules[name].exports;
}

function addModule(name, fn) {
	let mod = {
		exports: {}
	};
	__modules[name] = mod;
	mod.fn = fn(require, mod, mod.exports);
}
`;


const earcutSrc = fs.readFileSync('./node_modules/earcut/src/earcut.js', 'utf8');
const codecabTracerSrc = fs.readFileSync('./src/tracer/codecab_tracer.js', 'utf-8');
const codecabTracerWorkerSrc = fs.readFileSync('./src/tracer/codecab_tracer_worker.js', 'utf-8');

let src = headSrc;

src += `addModule('earcut', function(require, module, exports){${earcutSrc}});`;
src += `addModule('./codecab_tracer', function(require, module, exports){${codecabTracerSrc}});`;
src += codecabTracerWorkerSrc;


fs.writeFileSync('./generate/codecab_worker.js', `"use strict";\nlet src='${Buffer.from(src).toString('base64')}';\nexport default src;`);
process.exit(0);