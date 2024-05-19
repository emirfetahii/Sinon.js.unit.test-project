#!/usr/bin/env node
"use strict";
/* eslint-disable @sinonjs/no-prototype-methods/no-prototype-methods */
const fs = require("fs");
const browserify = require("browserify");
const pkg = require("./package.json");
const sinon = require("./lib/sinon");

// YYYY-MM-DD
const date = new Date().toISOString().split("T")[0];

// Keep the preamble on one line to retain source maps
const preamble = `/* Sinon.JS ${pkg.version}, ${date}, @license BSD-3 */`;

try {
    fs.mkdirSync("pkg");
} catch (ignore) {
    // We seem to have it already
}

/**
 * @param entryPoint
 * @param config
 * @param done
 */
function makeBundle(entryPoint, config, done) {
    browserify(entryPoint, config).bundle(function (err, buffer) {
        if (err) {
            throw err;
        }
        done(buffer.toString());
    });
}

makeBundle(
    "./lib/sinon.js",
    {
        // Add inline source maps to the default bundle
        debug: true,
        // Create a UMD wrapper and install the "sinon" global:
        standalone: "sinon",
        // Do not detect and insert globals:
        detectGlobals: false,
    },
    function (bundle) {
        var script = preamble + bundle;
        fs.writeFileSync("pkg/sinon.js", script); // WebWorker can only load js files
    }
);

makeBundle(
    "./lib/sinon.js",
    {
        // Create a UMD wrapper and install the "sinon" global:
        standalone: "sinon",
        // Do not detect and insert globals:
        detectGlobals: false,
    },
    function (bundle) {
        var script = preamble + bundle;
        fs.writeFileSync("pkg/sinon-no-sourcemaps.cjs", script);
    }
);

makeBundle(
    "./lib/sinon-esm.js",
    {
        // Do not detect and insert globals:
        detectGlobals: false,
    },
    function (bundle) {
        var intro = "let sinon;";
        var outro = `\nexport default sinon;\n${Object.keys(sinon)
            .map(function (key) {
                return `const _${key} = sinon.${key};\nexport { _${key} as ${key} };`;
            })
            .join("\n")}`;

        var script = preamble + intro + bundle + outro;
        fs.writeFileSync("pkg/sinon-esm.js", script);
    }
);
