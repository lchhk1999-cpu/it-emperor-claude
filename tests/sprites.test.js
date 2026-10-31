(function () {
  // Character art is plain SVG strings (src/ui/sprites.js + characters.js).
  const EXPRS = ["idle", "happy", "speechless", "surprised"];
  const balanced = (svg) => {
    const open = (svg.match(/<(?!\/)[a-z]/g) || []).length;
    const selfClose = (svg.match(/\/>/g) || []).length;
    const close = (svg.match(/<\/[a-z]/g) || []).length;
    return open === selfClose + close;
  };

  test("sprites: every workbook character has its own design with all expressions", () => {
    for (const c of ITE.gameData.characters) {
      assert.ok(ITE.sprites.CHARACTER_IDS.includes(c.id), `${c.id} has a design`);
      const drawn = EXPRS.map((e) => ITE.sprites.character(c.id, e));
      drawn.forEach((svg, i) => {
        assert.ok(balanced(svg), `${c.id} ${EXPRS[i]} SVG tags balanced`);
        assert.ok(!/undefined|NaN/.test(svg), `${c.id} ${EXPRS[i]} has no missing values`);
        assert.ok(svg.includes(`aria-label="${c.name}"`), `${c.id} labelled with its name`);
      });
      assert.equal(new Set(drawn).size, EXPRS.length, `${c.id} expressions look different`);
    }
  });

  test("sprites: characters look different from each other", () => {
    const idle = ITE.gameData.characters.map((c) => ITE.sprites.character(c.id, "idle"));
    assert.equal(new Set(idle).size, idle.length);
  });

  test("sprites: every variant design (品種) is valid and looks different", () => {
    const ids = ITE.sprites.CHARACTER_IDS;
    assert.ok(ids.length >= 31);
    const idle = ids.map((id) => ITE.sprites.character(id, "idle"));
    idle.forEach((svg, i) => assert.ok(balanced(svg) && !/undefined|NaN/.test(svg), ids[i]));
    assert.equal(new Set(idle).size, ids.length);
    assert.equal(new Set(Object.values(ITE.sprites.CHARACTER_FAMILIES)).size, 8, "seven families + the UR emperor");
  });

  test("sprites: an unknown character falls back to the hero", () => {
    assert.ok(ITE.sprites.character("CH-NEW", "idle").includes('aria-label="主角"'));
  });
  test("sprites: SSR characters look powerful; 機械 IT狗 is now a mecha bulldog (老虎狗)", () => {
    const data = ITE.gameData;
    for (const c of data.characters) {
      const svg = ITE.sprites.character(c.id, "idle");
      assert.equal(svg.includes('class="ssr-aura"'), c.rarity === "SSR", `${c.id}: only SSR have the energy aura`);
    }
    const tiger = ITE.sprites.character("CH-ITDOG-MECHA", "idle");
    assert.ok(tiger.includes("M54 36 Q66 31 78 36") && tiger.includes("M30 74 Q24 114"), "bulldog wrinkles and jowls");
    // R and SR dogs keep their approved look (no tiger stripes).
    for (const id of ["CH-ITDOG", "CH-ITDOG-CORGI", "CH-ITDOG-HUSKY", "CH-ITDOG-GOLDEN"]) assert.ok(!ITE.sprites.character(id, "idle").includes("M30 74 Q24 114"), id);
  });
})();
