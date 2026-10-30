(function () {
  const S = ITE.save;

  test("save: empty storage gives a new default save", () => {
    const r = S.load(S.createMemoryStorage());
    assert.equal(r.status, "new");
    assert.deepEqual(r.save, S.defaultSave());
  });

  test("save: persist then load round-trips including an active battle", () => {
    const store = S.createMemoryStorage();
    const battle = ITE.battle.createBattle(ITE.stages[0], ITE.devSampleQuestions, ITE.rng.createRng(5));
    const save = S.withActiveBattle(S.defaultSave(), battle);
    assert.ok(S.persist(store, save));
    const r = S.load(store);
    assert.equal(r.status, "ok");
    assert.deepEqual(r.save, save);
  });

  test("save: corrupt JSON recovers to default and keeps a backup", () => {
    const store = S.createMemoryStorage();
    store.setItem(S.SAVE_KEY, "{not json");
    const r = S.load(store);
    assert.equal(r.status, "recovered");
    assert.deepEqual(r.save, S.defaultSave());
    // backup key is timestamped so earlier backups are not overwritten
    const backups = store.keys().filter((k) => k.startsWith(S.SAVE_KEY + ".corrupt-backup."));
    assert.equal(backups.length, 1);
    assert.equal(store.getItem(backups[0]), "{not json");
  });

  test("save: malformed active battle is dropped, rest of save kept (QA blocker)", () => {
    const store = S.createMemoryStorage();
    const bad = [
      { phase: "question" },
      { phase: "question", deck: [], index: 0 },
      { phase: "won", deck: [{}], index: 0 },
    ];
    for (const activeBattle of bad) {
      store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: { "stage-1": { cleared: true, bestAccuracy: 90, plays: 3 } }, activeBattle }));
      const r = S.load(store);
      assert.equal(r.status, "repaired");
      assert.equal(r.save.activeBattle, null);
      assert.equal(r.save.stages["stage-1"].bestAccuracy, 90);
    }
  });

  test("save: valid mid-battle state passes isValidBattle in both phases", () => {
    const b = ITE.battle.createBattle(ITE.stages[0], ITE.devSampleQuestions, ITE.rng.createRng(9));
    assert.ok(S.isValidBattle(b));
    assert.ok(S.isValidBattle(ITE.battle.answer(b, "A")));
    assert.ok(!S.isValidBattle({ ...b, index: b.deck.length }));
    assert.ok(!S.isValidBattle({ ...b, boss: { ...b.boss, hp: "300" } }));
  });

  test("save: bad per-stage records are sanitized", () => {
    const store = S.createMemoryStorage();
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: { s1: {}, s2: { cleared: "yes", bestAccuracy: 500, plays: -1 } }, activeBattle: null }));
    const r = S.load(store);
    assert.equal(r.status, "repaired");
    assert.deepEqual(r.save.stages.s1, { cleared: false, bestAccuracy: 0, plays: 0 });
    assert.deepEqual(r.save.stages.s2, { cleared: false, bestAccuracy: 100, plays: 0 });
    const next = S.recordStageResult(r.save, "s1", { outcome: "won", accuracy: 70 });
    assert.deepEqual(next.stages.s1, { cleared: true, bestAccuracy: 70, plays: 1 });
  });

  test("save: wrong version or shape is not trusted", () => {
    const store = S.createMemoryStorage();
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 99, stages: {}, activeBattle: null }));
    assert.equal(S.load(store).status, "recovered");
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: [], activeBattle: null }));
    assert.equal(S.load(store).status, "recovered");
  });

  test("save: storage that throws does not crash load or persist", () => {
    const broken = {
      getItem() { throw new Error("denied"); },
      setItem() { throw new Error("denied"); },
    };
    assert.equal(S.load(broken).status, "recovered");
    assert.equal(S.persist(broken, S.defaultSave()), false);
  });

  test("save: stage result keeps best accuracy, cleared flag sticks, clears active battle", () => {
    let save = S.withActiveBattle(S.defaultSave(), { phase: "question" });
    save = S.recordStageResult(save, "stage-1", { outcome: "won", accuracy: 80 });
    save = S.recordStageResult(save, "stage-1", { outcome: "lost", accuracy: 40 });
    assert.deepEqual(save.stages["stage-1"], { cleared: true, bestAccuracy: 80, plays: 2 });
    assert.equal(save.activeBattle, null);
  });

  test("save: guild state round-trips; old saves without guild load as ok", () => {
    const store = S.createMemoryStorage();
    const gs = { nickname: "阿一", guild: { id: "g1", name: "虛構學會", founder: "阿一", members: ["阿一"] }, myAttacks: [{ nickname: "阿一", dayKey: "2026-10-28", weekKey: "2026-10-26", damage: 160, correct: 3, answered: 4 }] };
    S.persist(store, S.withGuild(S.defaultSave(), gs));
    const r = S.load(store);
    assert.equal(r.status, "ok");
    assert.deepEqual(r.save.guild, gs);
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null }));
    const old = S.load(store);
    assert.equal(old.status, "ok");
    assert.equal(old.save.guild, null);
  });

  test("save: tampered guild state is dropped, rest of save kept", () => {
    const store = S.createMemoryStorage();
    const good = { nickname: "阿一", guild: { id: "g1", name: "虛構學會", founder: "阿一", members: ["阿一"] }, myAttacks: [] };
    const bad = [
      { ...good, nickname: "" },
      { ...good, guild: { ...good.guild, members: ["別人"] } },
      { ...good, myAttacks: [{ nickname: "阿一", dayKey: "d", weekKey: "w", damage: -5 }] },
      { ...good, myAttacks: [{ nickname: "別人", dayKey: "d", weekKey: "w", damage: 5 }] },
      "guild",
    ];
    for (const guild of bad) {
      store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: { s1: { cleared: true, bestAccuracy: 50, plays: 1 } }, activeBattle: null, guild }));
      const r = S.load(store);
      assert.equal(r.status, "repaired");
      assert.equal(r.save.guild, null);
      assert.equal(r.save.stages.s1.bestAccuracy, 50);
    }
  });
})();
