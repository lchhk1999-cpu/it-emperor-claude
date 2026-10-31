(function () {
  const T = ITE.trial;
  const data = ITE.gameData;
  const MON = Date.UTC(2026, 10, 2, 1, 0); // Monday 2 Nov 2026, 09:00 HKT
  const NEXT_MON = MON + 7 * 24 * 3600 * 1000;
  const fresh = () => ITE.profile.ensureOwned(ITE.profile.defaultProfile(data), data);
  const fixed = (x) => () => x; // rng returning x

  test("trial: four tiers with the user's question counts and shard ranges; no stamina", () => {
    const st = T.stages(T.TRIAL_RULES);
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

  // ---------- 魔王限時 ----------
  const demonBattle = (key, loadout) => {
    const st = T.stage(key);
    return ITE.battle.createBattle(st, ITE.questionBank.questions, ITE.rng.createRng(4), [], loadout || []);
  };

  test("demon: four timed tiers for the second UR, weekly shards like 帝王試煉", () => {
    const st = T.stages(T.DEMON_RULES);
    assert.deepEqual(st.map((s) => s.difficulty), ["easy", "medium", "hard", "ultimate"]);
    assert.ok(st.every((s) => s.timed && s.timed.drainPct > 0 && ITE.stamina.stageCost(s) === 0));
    assert.ok(T.stages(T.TRIAL_RULES).every((s) => !s.timed), "帝王試煉 is not timed");
    const r = T.claim(fresh(), "demon-ultimate", "won", MON, fixed(0));
    assert.equal(T.shardsOf(r.profile, T.DEMON_RULES), 3);
    assert.equal(T.shardsOf(r.profile), 0, "IT帝 shards untouched");
    const p = { ...r.profile, shards: { "CH-BUGLORD": 40 } };
    assert.ok(T.unlock(p, data, T.DEMON_RULES).profile.owned.characters.includes("CH-BUGLORD"));
  });

  test("demon: HP drains per second only while a question is open; 0 HP loses", () => {
    let s = demonBattle("demon-easy");
    assert.equal(s.party.maxHp, 100);
    s = T.tick(s, 10000); // 10 s at 0.7 %/s
    assert.equal(s.party.hp, 93);
    const q = ITE.battle.currentQuestion(s);
    s = ITE.battle.answer(s, q.answer);
    const hp = s.party.hp;
    assert.equal(T.tick(s, 60000).party.hp, hp, "reading the explanation never drains");
    s = T.tick(s, 1000000);
    assert.equal(s.phase, "feedback");
    s = T.tick(ITE.battle.next(s), 1000000);
    assert.equal(s.party.hp, 0);
    assert.equal(s.phase, "lost");
    assert.equal(ITE.battle.summary(s).outcome, "lost");
    const plain = ITE.battle.createBattle(ITE.stages[0], ITE.devSampleQuestions, ITE.rng.createRng(1));
    assert.equal(T.tick(plain, 5000), plain, "normal battles have no timer");
  });

  test("demon: 眼鏡 gives drain-free seconds at the start of every question", () => {
    const glasses = { id: "EQ-GLASSES", type: "time", seconds: 5, holder: "CH-ITDOG", tier: 2 };
    let s = demonBattle("demon-easy", [glasses]);
    assert.equal(T.graceLeft(s), 5);
    s = T.tick(s, 4000);
    assert.equal(s.party.hp, 100);
    assert.equal(T.graceLeft(s), 1);
    s = T.tick(s, 6000); // 1 s grace left, then 5 s drain
    assert.equal(s.party.hp, 96.5);
    s = ITE.battle.next(ITE.battle.answer(s, ITE.battle.currentQuestion(s).answer));
    assert.equal(T.graceLeft(s), 5, "a new question restarts the grace period");
    assert.equal(T.tick(s, 5000).party.hp, 96.5);
  });
})();
