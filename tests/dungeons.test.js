(function () {
  const Dg = ITE.dungeons;
  const B = ITE.battle;
  const data = ITE.gameData;
  // Release pool: approved questions only (what students see).
  const pool = ITE.questions.filterForMode(ITE.questionBank.questions, "release");
  const rng = (seed) => ITE.rng.createRng(seed);
  // Monday 2026-11-02 00:30 HKT and Sunday 2026-11-01 23:30 HKT.
  const MON = Date.UTC(2026, 10, 1, 16, 30);
  const SUN = Date.UTC(2026, 10, 1, 15, 30);

  test("dungeons: five worlds A–E x four difficulties; every DSE topic in exactly one world", () => {
    const stages = Dg.worldStages();
    assert.equal(stages.length, 20);
    assert.deepEqual(Dg.WORLDS.map((w) => w.id), ["A", "B", "C", "D", "E"]);
    const topics = Dg.WORLDS.flatMap((w) => w.topics);
    assert.equal(new Set(topics).size, topics.length);
    for (const q of pool) assert.ok(topics.includes(q.topic_id), `${q.question_id} ${q.topic_id}`);
    for (const w of Dg.WORLDS) for (const id of w.materials) assert.ok(ITE.inventory.materialById(data, id), id);
  });

  test("dungeons: every stage gets a full deck of approved questions from its own world", () => {
    for (const st of Dg.worldStages()) {
      const p = Dg.stagePool(st, pool, rng(7));
      assert.ok(p.length >= Math.min(st.questionCount, pool.filter((q) => st.topicIds.includes(q.topic_id)).length), st.id);
      assert.ok(p.every((q) => st.topicIds.includes(q.topic_id)), st.id);
      const battle = B.createBattle(st, p, rng(1));
      assert.equal(battle.deck.length, Math.min(st.questionCount, p.length), st.id);
    }
  });

  test("dungeons: preferred difficulty first; other difficulties fill in only when short", () => {
    const st = Dg.worldStages().find((s) => s.id === "dse-B-easy");
    const p = Dg.stagePool(st, pool, rng(3));
    assert.ok(p.every((q) => q.difficulty === "easy"));
    const fake = [
      { question_id: "x1", topic_id: "SOCIAL", difficulty: "hard" },
      { question_id: "x2", topic_id: "SOCIAL", difficulty: "easy" },
      { question_id: "x3", topic_id: "SOCIAL", difficulty: "medium" },
      { question_id: "x4", topic_id: "SQL", difficulty: "hard" },
    ];
    const hardE = Dg.worldStages().find((s) => s.id === "dse-E-hard");
    const filled = Dg.stagePool(hardE, fake, rng(3));
    assert.equal(filled[0].question_id, "x1");
    assert.equal(filled.length, 3);
  });

  test("dungeons: harder stages have more questions, a stronger boss and more drops", () => {
    const a = Dg.DIFFICULTY_ORDER.map((k) => Dg.worldStages().find((s) => s.id === `dse-A-${k}`));
    for (let i = 1; i < a.length; i++) {
      assert.ok(a[i].questionCount > a[i - 1].questionCount);
      assert.ok(a[i].boss.maxHp > a[i - 1].boss.maxHp);
      assert.ok(a[i].drops.count > a[i - 1].drops.count);
    }
    // Clearable: all-correct damage with the base formula beats the boss with room for mistakes.
    for (const st of a) {
      let dmg = 0;
      for (let c = 1; c <= st.questionCount; c++) dmg += B.damageFor(c);
      assert.ok(dmg >= st.boss.maxHp * 1.2, st.id);
    }
  });

  test("dungeons: drops come from the stage's world; ultimate adds 傳說核心; losing drops nothing", () => {
    const st = Dg.worldStages().find((s) => s.id === "dse-C-ultimate");
    assert.deepEqual(Dg.materialDrops(st, { outcome: "lost" }, data, rng(1)), {});
    const d = Dg.materialDrops(st, { outcome: "won" }, data, rng(1));
    assert.equal(d["MAT-RARE"], 1);
    const worldTotal = Object.entries(d).filter(([id]) => id !== "MAT-RARE").reduce((s, [id, n]) => (assert.ok(["MAT-NET", "MAT-SEC"].includes(id), id), s + n), 0);
    assert.equal(worldTotal, 4);
    assert.deepEqual(Dg.materialDrops(Dg.worldStages().find((s) => s.id === "dse-D-easy"), { outcome: "won" }, data, rng(1)), { "MAT-PY": 1 });
  });

  test("dungeons: mixed practice (no drops entry) gives one random topic material", () => {
    const d = Dg.materialDrops(ITE.stages[0], { outcome: "won" }, data, () => 0.9999);
    assert.deepEqual(d, { "MAT-PY": 1 });
    assert.deepEqual(Dg.materialDrops(null, { outcome: "won" }, data, () => 0), { "MAT-EXCEL": 1 });
  });

  test("dungeons: today's limited stage follows the workbook weekly rotation (HKT)", () => {
    const mon = Dg.limitedStage(data, MON);
    assert.equal(mon.id, "limited-MON-MAT");
    assert.deepEqual(mon.topicIds, ["PY_BASIC"]);
    assert.deepEqual(Dg.materialDrops(mon, { outcome: "won" }, data, rng(1)), { "MAT-PY": 5 });
    const sun = Dg.limitedStage(data, SUN);
    assert.equal(sun.id, "limited-SUN-MIX");
    assert.equal(sun.topicIds, null);
    assert.equal(sun.questionCount, 15);
    assert.deepEqual(Dg.materialDrops(sun, { outcome: "won" }, data, rng(1)), { "MAT-RARE": 2 });
    assert.equal(Dg.limitedStage({ ...data, events: [] }, MON), null);
    const ids = Dg.allStages(data, MON).map((s) => s.id);
    assert.ok(ids.includes("stage-1") && ids.includes("dse-E-ultimate") && ids.includes("limited-MON-MAT"));
    assert.equal(new Set(ids).size, ids.length);
  });
})();
