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

  test("save: backup code round-trips a save with Chinese text and drops the active battle", () => {
    const battle = ITE.battle.createBattle(ITE.stages[0], ITE.devSampleQuestions, ITE.rng.createRng(5));
    const base = S.withActiveBattle({ ...S.defaultSave(), stages: { "stage-1": { cleared: true, bestAccuracy: 90, plays: 3 } } }, battle);
    const code = S.exportCode(base);
    assert.ok(code.startsWith("ITE1."));
    const r = S.importCode(code);
    assert.ok(r.ok);
    assert.equal(r.save.activeBattle, null);
    assert.deepEqual(r.save.stages, base.stages);
    // spaces and line breaks from copy-paste are ignored
    assert.ok(S.importCode(" " + code.slice(0, 20) + "\n" + code.slice(20) + " ").ok);
    const loaded = S.load(S.createMemoryStorage());
    const withProfile = { ...loaded.save, profile: ITE.profile.defaultProfile(ITE.gameData) };
    assert.deepEqual(S.importCode(S.exportCode(withProfile)).save.profile, S.load((() => { const m = S.createMemoryStorage(); S.persist(m, withProfile); return m; })()).save.profile);
  });

  test("save: bad backup codes are rejected without throwing", () => {
    const code = S.exportCode(S.defaultSave());
    assert.equal(S.importCode("").reason, "empty");
    assert.equal(S.importCode("hello").reason, "format");
    assert.equal(S.importCode("ITE1.@@@@.00000000").reason, "format");
    const body = code.split(".")[1];
    const flipped = (body[5] === "A" ? "B" : "A");
    assert.equal(S.importCode(`ITE1.${body.slice(0, 5)}${flipped}${body.slice(6)}.${code.split(".")[2]}`).reason, "checksum");
    assert.equal(S.importCode(code.slice(0, code.length - 12) + code.slice(-9)).ok, false);
    assert.equal(S.importCode(S.exportCode({ version: 99, stages: {} })).reason, "invalid");
  });

  test("save: nicknames are trimmed, limited to 10 characters and kept through save/load", () => {
    assert.equal(S.cleanName("  IT  小勇者 "), "IT 小勇者");
    assert.equal(S.cleanName("一二三四五六七八九十十一"), "一二三四五六七八九十");
    assert.equal(S.cleanName("a\u0000b\u202ec"), "abc");
    assert.equal(S.cleanName("   "), "");
    assert.equal(S.cleanName(42), "");
    const store = S.createMemoryStorage();
    const save = { ...S.defaultSave(), profile: { ...ITE.profile.defaultProfile(ITE.gameData), name: "阿明" } };
    S.persist(store, save);
    assert.equal(S.load(store).save.profile.name, "阿明");
    store.setItem(S.SAVE_KEY, JSON.stringify({ ...save, profile: { ...save.profile, name: "  " } }));
    const r = S.load(store);
    assert.equal(r.save.profile.name, undefined);
    assert.equal(r.status, "repaired");
  });
})();
