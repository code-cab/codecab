let tern = require('tern/lib/tern');
let infer = require('tern/lib/infer');
let condense = require('tern/lib/condense');
require('tern/plugin/webpack');
let fs = require('fs');
let path = require('path');

const outputFilename = process.argv[process.argv.length - 1];
console.log("Output: " + outputFilename);

/*
 The original defs does not eat the path value well when used in a multi module environment
 This will replace the regex to make it work correctly.
 */

const reReplace = {};
reReplace[String(/[\w$<>\.:!]/)] = /[\w$<>`\/\.:!]/;
reReplace[String(/[\w$<>\.!:]/)] = /[\w$<>`\/\.!:]/;
reReplace[String(/[\w$<>\.!:`]/)] = /[\w$<>\/\.!:`]/;
const superWord = infer.def.TypeParser.prototype.word;
infer.def.TypeParser.prototype.word = function(newre) {
    let sre = String(newre);
    let re = newre;
    if (reReplace[sre]) {
        re = reReplace[sre];
    }
    return superWord.call(this, re);
};

//
//
//
// process.chdir('../../../codecab');
// let f = fs.readdirSync('.');
// console.log(f);


let server = new tern.Server({
    getFile: file => {
        console.log("Getting file content: " + file);
        const text = fs.readFileSync(path.resolve(file), "utf8");
        return text;
    },
    projectDir: path.resolve('.'), // Node module resolves and loads the file itself so the projectDir must be valid
    debug: true,
    async: false,
    ecmaVersion: 9,
    plugins: {
        webpack: {
            configPath: './webpack.config.js'
        },
    }
});

const windowDefs = {
    "!name": "browser",
    "!define": {
    },
    window: {
        "!type": "<top>",
        "!doc": "Top level Browser window scope"
    }
};

server.addDefs(windowDefs);

const entryFile = './src/windowscope.js';
server.addFile(entryFile);

server.flush(function (err) {
    if (err) throw err;

    let origins = Object.keys(server.mod.modules.modules);
    // Exclude origins here when not required
    const output = condense.condense(origins, null, {
        spans: false,
        server: server
    });

    let json = JSON.stringify(output, null, 2);
    console.log(json);
    // Check if def can be read

    server.reset();
    server.addDefs(output);
    server.flush(function (err) {
        if (err) throw err;
        console.log('Def is ok');
        fs.writeFileSync(outputFilename, json, 'utf8');

        process.exit(0);
    });

});



