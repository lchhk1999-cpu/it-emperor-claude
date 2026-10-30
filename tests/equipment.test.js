(function () {
  const E = ITE.equipment;
  const B = ITE.battle;
  const P = ITE.profile;
  const data = ITE.gameData;
  const stage = ITE.stages[0];
  const pool = ITE.questionBank.questions;
  const ownAll = { characters: data.characters.map((c) => c.id), equipment: data.equipment.map((e) => e.id) };
  const profileWith = (team, equipment) => ({ ...P.defaultProfile(data), level: 12, team, equipment: equipment || {}, owned: ownAll });
  const battleWith = (equipment, seed = 1) => {
    const p = profileWith(["CH-DB", "CH-HACK"], equipment);
    return B.createBattle(stage, pool, ITE.rng.createRng(seed), P.teamSnapshot(p, data), E.battleLoadout(p, data));
  };
  const right = (s) => B.answer(s, B.currentQuestion(s).answer);
  const wrong = (s) => B.answer(s, ITE.questions.ANSWERS.find((l) => l !== B.currentQuestion(s).answer));

  test("equipment: five workbook items with parsed level-1 effects; glasses not yet usable", () => {
    const byId = (id) => E.itemById(data, id);
    assert.deepEqual(data.equipment.map((e) => e.id), ["EQ-AI", "EQ-EYEDROP", "EQ-COMPUTER", "EQ-ANTIVIRUS", "EQ-GLASSES"]);
    assert.deepEqual([byId("EQ-AI").levels[0].remove, byId("EQ-AI").levels[0].cooldown], [1, 6]);
    assert.equal(byId("EQ-EYEDROP").levels[0].heal, 10);
    assert.deepEqual([byId("EQ-COMPUTER").levels[0].cooldown, byId("EQ-COMPUTER").levels[0].bonus], [6, 40]);
    assert.equal(byId("EQ-ANTIVIRUS").levels[0].reduce_pct, 10);
    assert.equal(byId("EQ-GLASSES").supported, false);
    assert.ok(data.equipment.every((e) => e.levels.length === 3), "all three evolution levels parsed");
  });

  test("equipment: one item per team member, each item held once, moving it takes it away", () => {
    let p = profileWith(["CH-DB", "CH-HACK"]);
    p = E.assign(p, "CH-DB", "EQ-AI", data).profile;
    assert.deepEqual(p.equipment, { "CH-DB": "EQ-AI" });
    p = E.assign(p, "CH-HACK", "EQ-AI", data).profile;
    assert.deepEqual(p.equipment, { "CH-HACK": "EQ-AI" }, "moved, not copied");
    p = E.assign(p, "CH-DB", "EQ-EYEDROP", data).profile;
    p = E.assign(p, "CH-DB", "EQ-COMPUTER", data).profile;
    assert.equal(p.equipment["CH-HACK"], "EQ-AI");
    assert.equal(p.equipment["CH-DB"], "EQ-COMPUTER", "one slot each: replaced");
    assert.equal(Object.keys(p.equipment).length, 2);
    p = E.assign(p, "CH-HACK", null, data).profile;
    assert.deepEqual(p.equipment, { "CH-DB": "EQ-COMPUTER" });
    assert.equal(E.assign(p, "CH-GOLD", "EQ-AI", data).error, "not_in_team");
    assert.equal(E.assign(p, "CH-DB", "EQ-GLASSES", data).error, "not_supported");
    assert.equal(E.assign(p, "CH-DB", "EQ-NOPE", data).error, "unknown_equipment");
  });

  test("equipment: leaving the team drops the item from the loadout", () => {
    const p = profileWith(["CH-DB"], { "CH-DB": "EQ-AI", "CH-HACK": "EQ-EYEDROP" });
    assert.deepEqual(E.battleLoadout(p, data).map((x) => x.id), ["EQ-AI"]);
  });

  test("equipment: AI hint removes wrong options only, never the answer, then cools down 6 questions", () => {
    let s = battleWith({ "CH-DB": "EQ-AI" });
    const q = B.currentQuestion(s);
    s = E.useSkill(s, "EQ-AI");
    const hidden = E.hiddenOptions(s);
    assert.equal(hidden.length, 1);
    assert.ok(!hidden.includes(q.answer), "the correct answer is never removed");
    assert.equal(E.skillStatus(s, s.loadout[0]).usable, false, "cannot be used again on the same question");
    assert.equal(E.skillStatus(s, s.loadout[0]).wait, 6, "shows how many questions until ready");
    s = B.next(right(s));
    assert.deepEqual(E.hiddenOptions(s), [], "next question starts with all options");
    assert.equal(E.skillStatus(s, s.loadout[0]).reason, "cooldown");
    assert.equal(E.skillStatus(s, s.loadout[0]).wait, 5);
    // mix in wrong answers so the boss is still alive after 6 answers
    for (let i = 0; i < 4; i++) s = B.next(wrong(s));
    assert.equal(E.skillStatus(s, s.loadout[0]).wait, 1);
    s = B.next(right(s));
    assert.equal(s.phase, "question");
    assert.ok(E.skillStatus(s, s.loadout[0]).usable, "ready again after 6 answers");
  });

  test("equipment: the same question always loses the same wrong options", () => {
    const q = pool[0];
    assert.deepEqual(E.pickWrong(q, 2), E.pickWrong(q, 2));
    assert.equal(E.pickWrong(q, 3).length, 2, "always leaves one wrong option");
  });

  test("equipment: computer bonus lands only on a correct next answer", () => {
    let s = battleWith({ "CH-DB": "EQ-COMPUTER" });
    s = E.useSkill(s, "EQ-COMPUTER");
    assert.equal(s.armedBonus, 40);
    const base = right(battleWith({}, 1)).lastResult.damage;
    const hit = right(s);
    assert.equal(hit.lastResult.equipBonus, 40);
    assert.equal(hit.lastResult.damage, base + 40);
    let miss = E.useSkill(battleWith({ "CH-DB": "EQ-COMPUTER" }), "EQ-COMPUTER");
    miss = wrong(miss);
    assert.equal(miss.lastResult.equipBonus, 0);
    assert.equal(miss.armedBonus, 0, "a wrong answer uses up the bonus");
  });

  test("equipment: eye drops heal once per battle and never above max HP", () => {
    let s = battleWith({ "CH-DB": "EQ-EYEDROP" });
    const item = s.loadout[0];
    assert.equal(E.skillStatus(s, item).reason, "full_hp");
    s = B.next(wrong(s));
    const hurt = s.party.hp;
    s = E.useSkill(s, "EQ-EYEDROP");
    assert.equal(s.party.hp, Math.min(s.party.maxHp, hurt + 10));
    s = B.next(wrong(s));
    assert.equal(E.skillStatus(s, item).reason, "used");
  });

  test("equipment: antivirus reduces damage taken by 10%", () => {
    const plain = wrong(battleWith({}));
    const shielded = wrong(battleWith({ "CH-HACK": "EQ-ANTIVIRUS" }));
    assert.equal(plain.lastResult.taken, stage.boss.attack);
    assert.equal(shielded.lastResult.taken, Math.round(stage.boss.attack * 0.9));
  });

  test("equipment: battles without equipment are unchanged and skill state survives resume", () => {
    const s = B.createBattle(stage, ITE.devSampleQuestions, ITE.rng.createRng(2));
    assert.deepEqual([s.loadout, s.armedBonus], [[], 0]);
    let e = E.useSkill(battleWith({ "CH-DB": "EQ-AI" }), "EQ-AI");
    const resumed = B.rebindDeck(JSON.parse(JSON.stringify(e)), pool);
    assert.deepEqual(E.hiddenOptions(resumed), E.hiddenOptions(e));
    assert.ok(ITE.save.isValidBattle(resumed));
  });

  test("equipment: profile equipment is saved; bad entries are dropped", () => {
    const S = ITE.save;
    const store = S.createMemoryStorage();
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null, profile: { level: 2, exp: 0, coins: 0, gems: 0, team: ["CH-DB"], equipment: { "CH-DB": "EQ-AI", x: 5 } } }));
    const r = S.load(store);
    assert.deepEqual(r.save.profile.equipment, { "CH-DB": "EQ-AI" });
  });
})();
