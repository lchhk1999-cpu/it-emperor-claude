(function () {
  // Monsters (src/ui/monsters.js) and battle backgrounds (src/ui/scenes.js).
  const Sp = ITE.sprites;
  const Sc = ITE.scenes;
  const balanced = (svg) => {
    const open = (svg.match(/<(?!\/)[a-z]/g) || []).length;
    const selfClose = (svg.match(/\/>/g) || []).length;
    const close = (svg.match(/<\/[a-z]/g) || []).length;
    return open === selfClose + close;
  };
  const TIERS = ["easy", "medium", "hard", "ultimate"];

  test("monsters: five original monsters, every expression and tier draws a valid SVG", () => {
    assert.deepEqual(Sp.MONSTER_IDS, ["slime", "crab", "fish", "snake", "parrot"]);
    for (const id of Sp.MONSTER_IDS) {
      for (const expr of ["idle", "hurt", "smug"]) {
        for (const tier of TIERS) {
          const svg = Sp.monster(id, expr, { tier });
          assert.ok(balanced(svg) && !/undefined|NaN/.test(svg), `${id} ${expr} ${tier}`);
          assert.ok(svg.includes(`aria-label="${Sp.MONSTER_NAMES[id]}"`), `${id} labelled`);
        }
      }
      // Expressions and tiers look different; ultimate and story mini-bosses wear a crown.
      assert.ok(Sp.monster(id, "idle") !== Sp.monster(id, "hurt"));
      assert.ok(Sp.monster(id, "idle", { tier: "easy" }).replace(/clip-\d+/g, "") !== Sp.monster(id, "idle", { tier: "hard" }).replace(/clip-\d+/g, ""));
      assert.ok(Sp.monster(id, "idle", { tier: "ultimate" }).includes('class="aura"'));
      assert.ok(Sp.monster(id, "idle", { crown: true }).includes("#f4d36b"));
    }
    // Unknown ids fall back to Bug 王 (mixed practice).
    assert.ok(Sp.monster("bug", "idle").includes('aria-label="Bug 王"'));
  });

  test("monsters: the five monsters look different from each other", () => {
    const art = Sp.MONSTER_IDS.map((id) => Sp.monster(id, "idle").replace(/clip-\d+/g, ""));
    assert.equal(new Set(art).size, art.length);
  });

  test("scenes: every DSE world A–E has its own background and monster; others use the IT lab", () => {
    const dungeonBosses = Object.fromEntries(ITE.dungeons.WORLDS.map((w) => [w.id, w.boss]));
    for (const w of ["A", "B", "C", "D", "E"]) {
      const look = Sc.forWorld(w);
      assert.equal(look.theme, w);
      assert.equal(look.name, dungeonBosses[w], `${w}: stage boss name matches the art`);
    }
    assert.deepEqual(Sc.forWorld(null), { theme: "lab", monster: "bug", name: "Bug 王" });
    const bgs = Sc.THEMES.map((t) => Sc.background(t));
    bgs.forEach((svg, i) => assert.ok(balanced(svg) && !/undefined|NaN/.test(svg), Sc.THEMES[i]));
    assert.equal(new Set(bgs).size, bgs.length, "every background is different");
    assert.ok(Sc.THEMES.includes("guild"));
  });

  test("scenes: limited stages fight the monster of their topic's world", () => {
    const mon = ITE.dungeons.limitedStage(ITE.gameData, Date.UTC(2026, 10, 2, 4, 0)); // Monday: Python
    assert.equal(mon.world, "D");
    assert.equal(mon.boss.name, "無限迴圈蛇");
    const sun = ITE.dungeons.limitedStage(ITE.gameData, Date.UTC(2026, 10, 1, 4, 0)); // Sunday: mixed
    assert.equal(sun.world, null);
    assert.equal(sun.boss.name, "Bug 王");
  });
})();
