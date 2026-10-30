// Test runner for macOS's built-in JavaScriptCore (no Node needed).
// Run from the repo root:
//   /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc tests/run.js
// (or ./scripts/test.sh)
const tests = [];
globalThis.test = (name, fn) => tests.push({ name, fn });
globalThis.assert = {
  equal(actual, expected, msg) {
    if (actual !== expected) throw new Error(`${msg || "equal"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  },
  ok(value, msg) {
    if (!value) throw new Error(msg || "expected truthy value");
  },
  deepEqual(actual, expected, msg) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) throw new Error(`${msg || "deepEqual"}: expected ${b}, got ${a}`);
  },
  throws(fn, msg) {
    try {
      fn();
    } catch (e) {
      return;
    }
    throw new Error(msg || "expected function to throw");
  },
};

["src/core/rng.js", "src/core/questions.js", "src/core/battle.js", "src/core/save.js", "src/core/guildRaid.js", "src/data/demo_guilds.js", "src/data/stages.js", "src/data/dev_sample_questions.js", "src/data/question_bank.js"].forEach((f) => load(f));
["tests/questions.test.js", "tests/battle.test.js", "tests/save.test.js", "tests/guildRaid.test.js", "tests/bank.test.js"].forEach((f) => load(f));

let failed = 0;
for (const t of tests) {
  try {
    t.fn();
    print(`  ✓ ${t.name}`);
  } catch (e) {
    failed++;
    print(`  ✗ ${t.name}\n      ${e.message}`);
  }
}
print(`\n${tests.length - failed} passed, ${failed} failed, ${tests.length} total`);
if (failed) throw new Error("TESTS FAILED");
