(function () {
  const T = ITE.trial;
  const data = ITE.gameData;
  const MON = Date.UTC(2026, 10, 2, 1, 0); // Monday 2 Nov 2026, 09:00 HKT
  const NEXT_MON = MON + 7 * 24 * 3600 * 1000;
  const fresh = () => ITE.profile.ensureOwned(ITE.profile.defaultProfile(data), data);
  const fixed = (x) => () => x; // rng returning x

  test("trial: four tiers with the user's question counts and shard ranges; no stamina", () => {
    const st = T.stages();
    assert.deepEqual(st.map((s) => s.questionCount), [5, 15, 30, 50]);
    assert.deepEqual(T.TRIAL_RULES.order.map((k) => T.TRIAL_RULES.tiers[k].shards), [[1, 1], [1, 3], [2, 4], [3, 5]]);
    assert.ok(st.every((s) => s.kind === "trial" && ITE.stamina.stageCost(s) === 0));
    assert.ok(st.every((s) => s.boss.maxHp > 0), "boss HP from the damage formula");
    assert.ok(ITE.dungeons.allStages(data, MON).some((s) => s.id === "trial-master"), "battles can find trial stages");
  });

  test("trial: a win gives shards once per tier per Hong Kong week; a loss gives nothing", () => {
    let p = fresh();
    assert.equal(T.claim(p, "master", "lost", MON, fixed(0)).shards, 0);
    let r = T.claim(p, "master", "won", MON, fixed(0));
    assert.equal(r.shards, 3);
    p = r.profile;
    assert.equal(T.shardsOf(p), 3);
    assert.equal(T.claim(p, "master", "won", MON + 3600 * 1000, fixed(0.99)).shards, 0, "same week: already rewarded");
    r = T.claim(p, "intermediate", "won", MON, fixed(0.99));
    assert.equal(r.shards, 3, "top of the 1–3 range");
    p = r.profile;
    assert.deepEqual(T.clearedThisWeek(p, MON), ["master", "intermediate"]);
    assert.deepEqual(T.clearedThisWeek(p, NEXT_MON), [], "resets on Monday");
    r = T.claim(p, "master", "won", NEXT_MON, fixed(0.99));
    assert.equal(r.shards, 5);
    assert.equal(T.shardsOf(r.profile), 11);
  });

  test("trial: 40 shards combine into the UR IT帝, which the gacha never gives", () => {
    let p = { ...fresh(), shards: { "CH-ITEMPEROR": 39 } };
    assert.equal(T.canUnlock(p), false);
    assert.equal(T.unlock(p, data).error, "not_enough_shards");
    p = { ...p, shards: { "CH-ITEMPEROR": 43 } };
    assert.ok(T.canUnlock(p));
    const r = T.unlock(p, data);
    assert.ok(r.profile.owned.characters.includes("CH-ITEMPEROR"));
    assert.equal(T.shardsOf(r.profile), 3, "extra shards are kept for evolution");
    assert.equal(T.unlock(r.profile, data).error, "owned");
    const ur = data.characters.find((c) => c.id === "CH-ITEMPEROR");
    assert.equal(ur.rarity, "UR");
    const inPool = ITE.gacha.characterRates(data).flatMap((x) => x.characters.map((c) => c.id));
    assert.ok(!inPool.includes("CH-ITEMPEROR"));
  });

  test("trial: weekly progress survives save/load; damaged entries are dropped", () => {
    const S = ITE.save;
    const store = S.createMemoryStorage();
    const p = T.claim(fresh(), "beginner", "won", MON, fixed(0)).profile;
    S.persist(store, { ...S.defaultSave(), profile: p });
    assert.deepEqual(S.load(store).save.profile.trials, { week: ITE.guildRaid.hktWeekKey(MON), cleared: ["beginner"] });
    store.setItem(S.SAVE_KEY, JSON.stringify({ ...S.defaultSave(), profile: { ...p, trials: { week: "soon", cleared: 1 } } }));
    assert.equal(S.load(store).save.profile.trials, undefined);
  });
})();
