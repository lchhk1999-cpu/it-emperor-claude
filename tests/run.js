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
    // Key order does not matter (arrays keep their order).
    const stable = (v) =>
      Array.isArray(v) ? `[${v.map(stable).join(",")}]`
        : v && typeof v === "object" ? `{${Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`
        : JSON.stringify(v);
    const a = stable(actual);
    const b = stable(expected);
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

["src/core/rng.js", "src/core/questions.js", "src/core/battle.js", "src/core/save.js", "src/core/guildRaid.js", "src/core/story.js", "src/core/profile.js", "src/core/missions.js", "src/core/equipment.js", "src/core/gacha.js", "src/core/inventory.js", "src/core/dungeons.js", "src/core/stamina.js", "src/core/growth.js", "src/core/drill.js", "src/core/checkin.js", "src/core/trial.js", "src/core/demo.js", "src/data/game_data.js", "src/data/demo_guilds.js", "src/data/story_bank.js", "src/data/stages.js", "src/data/dev_sample_questions.js", "src/data/question_bank.js", "src/ui/sprites.js", "src/ui/characters.js", "src/ui/gear.js", "src/ui/monsters.js", "src/ui/scenes.js", "src/ui/sound.js", "src/ui/music.js"].forEach((f) => load(f));
["tests/questions.test.js", "tests/battle.test.js", "tests/save.test.js", "tests/guildRaid.test.js", "tests/bank.test.js", "tests/story.test.js", "tests/profile.test.js", "tests/sprites.test.js", "tests/missions.test.js", "tests/equipment.test.js", "tests/gacha.test.js", "tests/inventory.test.js", "tests/dungeons.test.js", "tests/stamina.test.js", "tests/growth.test.js", "tests/drill.test.js", "tests/checkin.test.js", "tests/trial.test.js", "tests/demo.test.js", "tests/sound.test.js", "tests/music.test.js", "tests/monsters.test.js", "tests/settings.test.js"].forEach((f) => load(f));

// Every script the page loads must at least compile (UI files are not unit-tested,
// so a syntax error there would otherwise only show up in the browser).
test("build: every script in index.html compiles", () => {
  const html = readFile("index.html");
  const srcs = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(srcs.length > 30, "found the page scripts");
  for (const f of srcs) {
    try {
      new Function(readFile(f));
    } catch (e) {
      throw new Error(`${f}: ${e.message}`);
    }
  }
});

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
