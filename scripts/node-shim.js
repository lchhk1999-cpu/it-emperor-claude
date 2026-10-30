// Lets the jsc-style scripts (tests/run.js, scripts/build.js) run under Node,
// e.g. in Linux cloud routines that have no JavaScriptCore.
// Usage: node scripts/node-shim.js <script.js> [-- args...]
const fs = require("fs");
const vm = require("vm");

const [, , target, ...rest] = process.argv;
const args = rest[0] === "--" ? rest.slice(1) : rest;

globalThis.print = (...a) => console.log(...a);
globalThis.readFile = (p) => fs.readFileSync(p, "utf8");
globalThis.load = (p) => vm.runInThisContext(fs.readFileSync(p, "utf8"), { filename: p });
globalThis.scriptArgs = args;

try {
  load(target);
} catch (e) {
  console.error(e && e.message ? e.message : e);
  process.exit(3);
}
