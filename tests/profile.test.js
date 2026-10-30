(function () {
  const P = ITE.profile;
  const B = ITE.battle;
  const data = ITE.gameData;
  const stage = ITE.stages[0];
  const fresh = () => P.defaultProfile(data);
  const byId = (id) => P.characterById(data, id);

  test("profile: workbook data imported (7 characters, specialties, config)", () => {
    assert.equal(data.characters.length, 7);
    assert.deepEqual(data.characters.map((c) => c.specialty).sort(), ["ALL", "EXCEL", "HARDWARE", "NET_DEVICE", "PY_BASIC", "SECURITY", "SQL"]);
    assert.equal(byId("CH-AIBOT").bonus, 0.1);
    assert.equal(byId("CH-DB").bonus, 0.2);
    assert.equal(data.config.team_slots_max, 5);
    assert.equal(data.config.initial_team_slots, 1);
    assert.equal(data.config.gacha_paid_enabled, 0);
  });

  test("profile: new player is level 1 with one team slot and one member", () => {
    const p = fresh();
    assert.deepEqual([p.level, p.exp, p.coins, p.gems, p.team.length], [1, 0, 0, 0, 1]);
    assert.equal(P.teamSlots(1, data.config), 1);
  });

  test("profile: team slots open by level and stop at the workbook maximum", () => {
    assert.deepEqual([1, 2, 3, 4, 5, 7, 8, 11, 12, 50].map((lv) => P.teamSlots(lv, data.config)), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });

  test("profile: toggling members respects free slots and never empties the team", () => {
    let p = fresh();
    let r = P.toggleMember(p, "CH-DB", data);
    assert.equal(r.error, null, "with one slot, picking another character swaps it in");
    assert.deepEqual(r.profile.team, ["CH-DB"]);
    r = P.toggleMember(r.profile, "CH-DB", data);
    assert.equal(r.error, "team_needs_one");
    p = { ...p, level: 5 };
    p = P.toggleMember(p, "CH-DB", data).profile;
    p = P.toggleMember(p, "CH-HACK", data).profile;
    assert.equal(p.team.length, 3);
    assert.equal(P.toggleMember(p, "CH-GOLD", data).error, "team_full");
    p = P.toggleMember(p, "CH-DB", data).profile;
    assert.deepEqual(p.team, [fresh().team[0], "CH-HACK"]);
    assert.equal(P.toggleMember(p, "CH-NOPE", data).error, "unknown_character");
  });

  test("profile: rewards level up (several at once) and report unlocked slots", () => {
    let r = P.addReward(fresh(), { exp: 40, coins: 30 }, data);
    assert.deepEqual([r.profile.level, r.profile.exp, r.profile.coins, r.levelsGained], [1, 40, 30, 0]);
    r = P.addReward(r.profile, { exp: 10 }, data); // 50 needed for Lv1 -> 2
    assert.deepEqual([r.profile.level, r.profile.exp, r.levelsGained, r.slotsUnlocked], [2, 0, 1, 0]);
    r = P.addReward(r.profile, { exp: 100 + 150 }, data); // Lv2 -> 3 (100), Lv3 -> 4 (150)
    assert.deepEqual([r.profile.level, r.profile.exp, r.levelsGained, r.slotsUnlocked], [4, 0, 2, 1]);
  });

  test("profile: cleanTeam drops unknown, duplicate and over-limit members", () => {
    assert.deepEqual(P.cleanTeam(["CH-DB", "CH-DB", "CH-NOPE", "CH-HACK", "CH-GOLD"], 3, data), ["CH-DB", "CH-HACK"]);
    assert.deepEqual(P.cleanTeam([], 1, data), [data.characters[0].id]);
  });

  test("profile: specialty bonus matches the question topic, best member wins", () => {
    const team = P.teamSnapshot({ team: ["CH-DB", "CH-AIBOT"] }, data);
    assert.equal(P.specialtyBonus(team, "SQL").name, "數據庫師");
    assert.equal(P.specialtyBonus(team, "SQL").bonus, 0.2);
    assert.equal(P.specialtyBonus(team, "OS").name, "人工智能機械人", "ALL covers other topics at 10%");
    assert.equal(P.specialtyBonus(P.teamSnapshot({ team: ["CH-DB"] }, data), "OS"), null);
  });

  test("profile: team stats are averages, so team size alone does not add damage", () => {
    const one = P.teamStats(P.teamSnapshot({ team: ["CH-HACK"] }, data));
    const two = P.teamStats(P.teamSnapshot({ team: ["CH-HACK", "CH-ITDOG"] }, data));
    assert.deepEqual(one, { attack: 110, hp: 90 });
    assert.deepEqual(two, { attack: 103, hp: 98 });
  });

  test("profile: DSE battle damage uses team attack and specialty bonus", () => {
    const sqlQ = ITE.questionBank.questions.find((q) => q.topic_id === "SQL");
    const osQ = ITE.questionBank.questions.find((q) => q.topic_id === "OS");
    const team = P.teamSnapshot({ team: ["CH-DB"] }, data); // attack 100, SQL +20%
    const firstHit = (q, t) => {
      const s = B.createBattle({ ...stage, questionCount: 1 }, [q], ITE.rng.createRng(1), t);
      return B.answer(s, B.currentQuestion(s).answer);
    };
    const onSql = firstHit(sqlQ, team);
    assert.equal(onSql.party.maxHp, 95, "party HP from team");
    assert.equal(onSql.lastResult.damage, 60, "50 base x 100% attack x 1.2 specialty");
    assert.equal(onSql.lastResult.bonus.name, "數據庫師");
    const onOs = firstHit(osQ, team);
    assert.equal(onOs.lastResult.damage, 50, "no specialty for OS");
    assert.equal(onOs.lastResult.bonus, null);
    const hacker = firstHit(osQ, P.teamSnapshot({ team: ["CH-HACK"] }, data));
    assert.equal(hacker.lastResult.damage, 55, "attack 110 scales damage");
  });

  test("profile: battles without a team behave exactly as before", () => {
    const s = B.createBattle(stage, ITE.devSampleQuestions, ITE.rng.createRng(3));
    assert.equal(s.party.maxHp, B.BALANCE.partyMaxHp);
    assert.deepEqual(s.team, []);
    const a = B.answer(s, B.currentQuestion(s).answer);
    assert.equal(a.lastResult.damage, B.BALANCE.baseDamage);
    assert.equal(a.lastResult.bonus, null);
  });

  test("profile: rewards for DSE battles and story clears (effort counts even on a loss)", () => {
    assert.deepEqual(P.dseRewards({ outcome: "won", correct: 6 }), { exp: 55, coins: 30 });
    assert.deepEqual(P.dseRewards({ outcome: "lost", correct: 3 }), { exp: 15, coins: 0 });
    assert.deepEqual(P.storyRewards(true), { exp: 25, coins: 30 });
    assert.deepEqual(P.storyRewards(false), { exp: 5, coins: 0 });
  });

  test("profile: save keeps the profile; damaged numbers are repaired; old saves load", () => {
    const S = ITE.save;
    const store = S.createMemoryStorage();
    const profile = { level: 4, exp: 20, coins: 90, gems: 0, team: ["CH-DB", "CH-HACK"], equipment: {} };
    S.persist(store, { ...S.defaultSave(), profile });
    assert.deepEqual(S.load(store).save.profile, profile);
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null, profile: { level: -3, exp: "x", coins: 5, team: ["CH-DB", "CH-DB", 7] } }));
    const r = S.load(store);
    assert.equal(r.status, "repaired");
    assert.deepEqual(r.save.profile, { level: 1, exp: 0, coins: 5, gems: 0, team: ["CH-DB"], equipment: {} });
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null }));
    assert.equal(S.load(store).status, "ok");
    assert.equal(S.load(store).save.profile, null);
  });

  test("profile: a battle with a team survives save and resume", () => {
    const team = P.teamSnapshot({ team: ["CH-DB", "CH-HACK"] }, data);
    const s = B.createBattle(stage, ITE.devSampleQuestions, ITE.rng.createRng(9), team);
    assert.ok(ITE.save.isValidBattle(s));
    const resumed = B.rebindDeck(JSON.parse(JSON.stringify(s)), ITE.devSampleQuestions);
    assert.deepEqual(resumed.team.map((c) => c.id), ["CH-DB", "CH-HACK"]);
  });
})();
