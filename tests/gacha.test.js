(function () {
  const G = ITE.gacha;
  const P = ITE.profile;
  const E = ITE.equipment;
  const data = ITE.gameData;
  const withGems = (gems, extra) => ({ ...P.defaultProfile(data), gems, ...(extra || {}) });
  const fixedRng = (values) => {
    let i = 0;
    return () => values[i++ % values.length];
  };

  test("gacha: new player owns IT狗 + AI 模型 only (user decision)", () => {
    const p = P.defaultProfile(data);
    assert.deepEqual(p.owned, { characters: ["CH-ITDOG"], equipment: ["EQ-AI"] });
    assert.deepEqual(p.team, ["CH-ITDOG"]);
    assert.equal(P.toggleMember(p, "CH-DB", data).error, "not_owned");
    assert.equal(E.assign(p, "CH-ITDOG", "EQ-EYEDROP", data).error, "not_owned");
    assert.equal(E.assign(p, "CH-ITDOG", "EQ-AI", data).error, null);
  });

  test("gacha: workbook pool rates (77/20/3); SSR pity lowered to 50 (balance); no paid gacha", () => {
    const rates = G.characterRates(data);
    assert.deepEqual(rates.map((r) => [r.rarity, r.pct]), [["R", 77], ["SR", 20], ["SSR", 3]]);
    assert.deepEqual(rates.map((r) => r.characters.length), [11, 12, 8]);
    assert.equal(G.pityThreshold(data), 50);
    // A workbook pity lower than 50 still wins; no SSR row means no pity.
    const pools = (pity) => ({ ...data, pools: { character: { rates: [{ rarity: "R", pct: 97, pity: 0 }, { rarity: "SSR", pct: 3, pity }] } } });
    assert.equal(G.pityThreshold(pools(30)), 30);
    assert.equal(G.pityThreshold(pools(80)), 50);
    assert.equal(G.pityThreshold(pools(0)), 0);
    assert.equal(data.config.gacha_paid_enabled, 0);
    assert.equal(G.GACHA_RULES.cost, 10);
  });

  test("gacha: a draw costs 10 gems and needs enough gems", () => {
    assert.equal(G.draw(withGems(9), "character", data, fixedRng([0.5])).error, "not_enough_gems");
    const r = G.draw(withGems(25), "character", data, fixedRng([0.1, 0.5]));
    assert.equal(r.profile.gems, 15);
    assert.equal(r.result.type, "character");
  });

  test("gacha: rarity follows the roll; the character joins the owned list", () => {
    const sr = G.draw(withGems(10), "character", data, fixedRng([0.8, 0.0])); // 80 -> SR band (77..97)
    assert.equal(sr.result.rarity, "SR");
    assert.ok(sr.profile.owned.characters.includes(sr.result.id));
    assert.equal(sr.result.duplicate, false);
    const ssr = G.draw(withGems(10), "character", data, fixedRng([0.99, 0.0]));
    assert.deepEqual([ssr.result.rarity, ssr.result.id], ["SSR", "CH-AIBOT"]);
    assert.equal(ssr.profile.pity.character, 0, "SSR resets the pity counter");
  });

  test("gacha: duplicates turn into 1 shard of that character (user decision) and are not added twice", () => {
    const dupe = G.draw(withGems(20, { coins: 5 }), "character", data, fixedRng([0.0, 0.0])); // R, first R = IT狗 (owned)
    assert.deepEqual([dupe.result.id, dupe.result.duplicate, dupe.result.shards], ["CH-ITDOG", true, 1]);
    assert.equal(dupe.profile.coins, 5, "no coins any more");
    assert.deepEqual(dupe.profile.shards, { "CH-ITDOG": 1 });
    assert.equal(dupe.profile.owned.characters.filter((id) => id === "CH-ITDOG").length, 1);
    const again = G.draw(dupe.profile, "character", data, fixedRng([0.0, 0.0]));
    assert.deepEqual(again.profile.shards, { "CH-ITDOG": 2 });
    const fresh = G.draw(withGems(10), "character", data, fixedRng([0.9, 0.0]));
    assert.equal(fresh.result.shards, 0);
  });

  test("gacha: the 50th draw without an SSR is a guaranteed SSR", () => {
    let p = withGems(10 * 50);
    const rngNoSsr = fixedRng([0.1]); // always R
    for (let i = 0; i < 49; i++) {
      const r = G.draw(p, "character", data, rngNoSsr);
      assert.equal(r.result.rarity, "R");
      p = r.profile;
    }
    assert.equal(p.pity.character, 49);
    assert.equal(G.drawsUntilPity(p, data), 1);
    const last = G.draw(p, "character", data, rngNoSsr);
    assert.deepEqual([last.result.rarity, last.result.pity], ["SSR", true]);
    assert.equal(last.profile.pity.character, 0);
  });

  test("gacha: real random rates stay close to the published ones", () => {
    let p = withGems(10 * 4000);
    const counts = { R: 0, SR: 0, SSR: 0 };
    const rng = ITE.rng.createRng(2026);
    for (let i = 0; i < 4000; i++) {
      const r = G.draw(p, "character", data, rng);
      counts[r.result.rarity]++;
      p = r.profile;
    }
    assert.ok(counts.R / 4000 > 0.72 && counts.R / 4000 < 0.81, JSON.stringify(counts));
    assert.ok(counts.SR / 4000 > 0.16 && counts.SR / 4000 < 0.24, JSON.stringify(counts));
    assert.ok(counts.SSR / 4000 > 0.02 && counts.SSR / 4000 < 0.06, "SSR about 3% plus pity: " + JSON.stringify(counts));
  });

  test("gacha: equipment draws give usable items with equal chance; duplicates give 1 shard", () => {
    const list = G.equipmentCandidates(data);
    assert.deepEqual(list.map((e) => e.id), ["EQ-AI", "EQ-EYEDROP", "EQ-COMPUTER", "EQ-ANTIVIRUS"], "glasses not in the pool until usable");
    const dupe = G.draw(withGems(10), "equipment", data, fixedRng([0.0]));
    assert.deepEqual([dupe.result.id, dupe.result.duplicate, dupe.result.shards], ["EQ-AI", true, 1]);
    assert.deepEqual(dupe.profile.shards, { "EQ-AI": 1 });
    const fresh = G.draw(withGems(10), "equipment", data, fixedRng([0.99]));
    assert.equal(fresh.result.id, "EQ-ANTIVIRUS");
    assert.ok(fresh.profile.owned.equipment.includes("EQ-ANTIVIRUS"));
    assert.equal(E.assign(fresh.profile, "CH-ITDOG", "EQ-ANTIVIRUS", data).error, null);
  });

  test("gacha: draw history keeps the latest 20", () => {
    let p = withGems(10 * 25);
    const rng = ITE.rng.createRng(7);
    for (let i = 0; i < 25; i++) p = G.draw(p, "character", data, rng).profile;
    assert.equal(p.gachaLog.length, 20);
  });

  test("gacha: older saves keep the characters and equipment they already use", () => {
    const old = { level: 5, exp: 0, coins: 0, gems: 3, team: ["CH-DB", "CH-HACK"], equipment: { "CH-DB": "EQ-COMPUTER" } };
    const p = P.ensureOwned(old, data);
    assert.deepEqual(p.owned.characters.sort(), ["CH-DB", "CH-HACK", "CH-ITDOG"]);
    assert.deepEqual(p.owned.equipment.sort(), ["EQ-AI", "EQ-COMPUTER"]);
    assert.deepEqual(p.pity, { character: 0 });
  });

  test("gacha: ownership, pity and history survive save/load; bad entries are dropped", () => {
    const S = ITE.save;
    const store = S.createMemoryStorage();
    const r = G.draw(withGems(20), "character", data, fixedRng([0.8, 0.0]));
    S.persist(store, { ...S.defaultSave(), profile: r.profile });
    assert.deepEqual(S.load(store).save.profile, r.profile);
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null, profile: { level: 1, exp: 0, coins: 0, gems: 0, team: ["CH-ITDOG"], owned: { characters: ["CH-ITDOG", 5, "CH-ITDOG"] }, pity: { character: -2 }, gachaLog: [{ type: "x", id: "a" }, { type: "character", id: "CH-DB", duplicate: "yes" }] } }));
    const bad = S.load(store).save.profile;
    assert.deepEqual(bad.owned, { characters: ["CH-ITDOG"], equipment: [] });
    assert.deepEqual(bad.pity, { character: 0 });
    assert.deepEqual(bad.gachaLog, [{ type: "character", id: "CH-DB", rarity: null, duplicate: false, shards: 0 }]);
  });
})();
