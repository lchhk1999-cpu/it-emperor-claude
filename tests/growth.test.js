(function () {
  const Gr = ITE.growth;
  const P = ITE.profile;
  const E = ITE.equipment;
  const S = ITE.save;
  const data = ITE.gameData;
  const R = Gr.GROWTH_RULES;
  const dog = data.characters.find((c) => c.id === "CH-ITDOG"); // R, PY_BASIC
  const rich = (extra) => ({ ...P.defaultProfile(data), coins: 100000, ...(extra || {}) });
  const at = (p, level, evo) => ({ ...p, growth: { characters: { "CH-ITDOG": { level, evo } }, equipment: {} } });

  test("growth: new characters start at Lv 1, no evolution; family topic decides the material", () => {
    assert.deepEqual(Gr.charGrowth(P.defaultProfile(data), "CH-ITDOG"), { level: 1, evo: 0 });
    assert.equal(Gr.topicMaterial(dog, data), "MAT-PY");
    assert.equal(Gr.topicMaterial(data.characters.find((c) => c.id === "CH-DB"), data), "MAT-SQL");
    assert.equal(Gr.topicMaterial(data.characters.find((c) => c.id === "CH-AIBOT"), data), "MAT-EXP", "全部課題 → 經驗芯片");
  });

  test("growth: levelling costs coins and stops at the cap of the evolution stage", () => {
    let r = Gr.levelUp({ ...P.defaultProfile(data), coins: 9 }, "CH-ITDOG", data);
    assert.equal(r.error, "not_enough_coins");
    r = Gr.levelUp({ ...P.defaultProfile(data), coins: 10 }, "CH-ITDOG", data);
    assert.deepEqual([r.profile.coins, Gr.charGrowth(r.profile, "CH-ITDOG").level], [0, 2]);
    assert.equal(Gr.levelUp(rich(), "CH-DB", data).error, "not_owned");
    assert.equal(Gr.levelUp(at(rich(), 10, 0), "CH-ITDOG", data).error, "needs_evolution");
    assert.equal(Gr.levelUp(at(rich(), 40, 3), "CH-ITDOG", data).error, "max_level");
    assert.equal(Gr.levelUp(at(rich(), 10, 1), "CH-ITDOG", data).error, undefined);
  });

  test("growth: stats grow with level and evolution", () => {
    assert.deepEqual(Gr.stats(dog, { level: 1, evo: 0 }), { attack: dog.attack, hp: dog.hp });
    const s = Gr.stats(dog, { level: 11, evo: 1 });
    assert.equal(s.attack, Math.round(dog.attack * 1.2 * 1.1));
    // The battle team uses grown stats.
    const p = at(P.defaultProfile(data), 11, 1);
    assert.equal(P.teamSnapshot(p, data)[0].attack, s.attack);
  });

  test("growth: evolution 1 needs the level cap, 3 topic materials and 200 coins", () => {
    const base = { ...at(rich({ coins: 200 }), 10, 0), materials: { "MAT-PY": 3 } };
    assert.equal(Gr.evolve({ ...base, growth: { characters: { "CH-ITDOG": { level: 9, evo: 0 } }, equipment: {} } }, "CH-ITDOG", data).error, "needs_level");
    assert.equal(Gr.evolve({ ...base, materials: { "MAT-PY": 2 } }, "CH-ITDOG", data).error, "not_enough_materials");
    assert.equal(Gr.evolve({ ...base, coins: 199 }, "CH-ITDOG", data).error, "not_enough_coins");
    const r = Gr.evolve(base, "CH-ITDOG", data);
    assert.equal(r.error, undefined);
    assert.deepEqual(Gr.charGrowth(r.profile, "CH-ITDOG"), { level: 10, evo: 1 });
    assert.deepEqual([r.profile.materials, r.profile.coins], [{}, 0]);
  });

  test("growth: evolution 2 adds 傳說核心; evolution 3 needs shards (R 3 / SR 2 / SSR 1)", () => {
    const two = Gr.evolutionCost({ ...at(rich(), 20, 1) }, dog, data);
    assert.deepEqual(two.map((c) => [c.id, c.need]), [["level", 20], ["MAT-PY", 6], ["MAT-RARE", 1], ["coins", 500]]);
    const p3 = { ...at(rich(), 30, 2), materials: { "MAT-PY": 10, "MAT-RARE": 2 }, shards: { "CH-ITDOG": 2 } };
    assert.equal(Gr.evolve(p3, "CH-ITDOG", data).error, "not_enough_shards");
    const r = Gr.evolve({ ...p3, shards: { "CH-ITDOG": 3 } }, "CH-ITDOG", data);
    assert.equal(r.error, undefined);
    assert.deepEqual([Gr.charGrowth(r.profile, "CH-ITDOG").evo, r.profile.shards], [3, {}]);
    assert.equal(Gr.evolutionCost(r.profile, dog, data), null);
    assert.equal(Gr.evolve(r.profile, "CH-ITDOG", data).error, "max_evolution");
    const ssr = data.characters.find((c) => c.rarity === "SSR");
    const sh = Gr.evolutionCost({ ...rich(), growth: { characters: { [ssr.id]: { level: 30, evo: 2 } }, equipment: {} } }, ssr, data).find((c) => c.kind === "shards");
    assert.equal(sh.need, 1);
  });

  test("growth: equipment tier 2 needs 傳說核心; tier 3 also a shard; battle uses the tier's effect", () => {
    let p = rich({ materials: { "MAT-RARE": 3 } });
    assert.equal(Gr.equipmentTier(p, "EQ-AI"), 1);
    assert.equal(Gr.evolveEquipment(p, "EQ-COMPUTER", data).error, "not_owned");
    p = Gr.evolveEquipment(p, "EQ-AI", data).profile;
    assert.equal(Gr.equipmentTier(p, "EQ-AI"), 2);
    assert.equal(Gr.evolveEquipment(p, "EQ-AI", data).error, "not_enough_shards");
    p = Gr.evolveEquipment({ ...p, shards: { "EQ-AI": 1 } }, "EQ-AI", data).profile;
    assert.equal(Gr.equipmentTier(p, "EQ-AI"), 3);
    assert.equal(Gr.evolveEquipment(p, "EQ-AI", data).error, "max_evolution");
    const withAi = { ...p, equipment: { "CH-ITDOG": "EQ-AI" } };
    const ai = E.battleLoadout(withAi, data)[0];
    assert.deepEqual([ai.tier, ai.remove, ai.cooldown], [3, 2, 4]);
    assert.deepEqual([E.battleLoadout({ ...rich(), equipment: { "CH-ITDOG": "EQ-AI" } }, data)[0].remove], [1]);
  });

  test("growth: levels, tiers and shards survive save/load; bad entries are dropped", () => {
    const store = S.createMemoryStorage();
    const p = { ...P.defaultProfile(data), shards: { "CH-ITDOG": 2 }, growth: { characters: { "CH-ITDOG": { level: 5, evo: 1 } }, equipment: { "EQ-AI": 2 } } };
    S.persist(store, { ...S.defaultSave(), profile: p });
    const loaded = S.load(store);
    assert.equal(loaded.status, "ok");
    assert.deepEqual(loaded.save.profile.growth, p.growth);
    assert.deepEqual(loaded.save.profile.shards, p.shards);
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null, profile: { level: 1, exp: 0, coins: 0, gems: 0, team: [], shards: { a: -1, b: 2 }, growth: { characters: { x: { level: 0, evo: 1 }, y: { level: 3, evo: 9 }, z: { level: 3, evo: 2 } }, equipment: { e: 4, f: 3 } } } }));
    const bad = S.load(store).save.profile;
    assert.deepEqual(bad.shards, { b: 2 });
    assert.deepEqual(bad.growth, { characters: { z: { level: 3, evo: 2 } }, equipment: { f: 3 } });
  });
})();
