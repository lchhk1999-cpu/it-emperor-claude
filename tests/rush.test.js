(function () {
  const R = ITE.rush;
  const data = ITE.gameData;
  const pool = ITE.questionBank.questions;
  const DAY = Date.UTC(2026, 10, 2, 2, 0); // 10:00 HKT
  const fresh = () => ITE.profile.ensureOwned(ITE.profile.defaultProfile(data), data);
  const rngOf = (seed) => ITE.rng.createRng(seed);

  test("rush: three doors hold the answer and two wrong options", () => {
    const q = pool[0];
    for (let seed = 1; seed < 20; seed++) {
      const d = R.doors(q, rngOf(seed));
      assert.equal(d.length, 3);
      assert.equal(d.filter((x) => x.letter === q.answer).length, 1);
      assert.equal(new Set(d.map((x) => x.letter)).size, 3);
    }
  });

  test("rush: right doors add time, wrong doors take it away, the clock speeds up and ends the run", () => {
    let s = R.start(pool, rngOf(3));
    assert.equal(s.timeMs, R.RUSH_RULES.startMs);
    s = R.choose(s, s.current.q.answer, rngOf(4));
    assert.equal(s.timeMs, 34000);
    assert.equal(s.passed, 1);
    const wrongLetter = s.current.doors.find((d) => d.letter !== s.current.q.answer).letter;
    s = R.choose(s, wrongLetter, rngOf(5));
    assert.equal(s.timeMs, 29000);
    assert.equal(s.wrongIds.length, 1);
    for (let i = 0; i < 9; i++) s = R.choose(s, s.current.q.answer, rngOf(10 + i));
    assert.equal(s.timeMs, R.RUSH_RULES.maxMs, "capped at 60 s");
    assert.equal(R.speed(s), 1.2, "10 doors → 1.2×");
    s = R.tick(s, 10000);
    assert.equal(s.timeMs, 48000);
    s = R.tick(s, 100000);
    assert.equal(s.over, true);
    assert.equal(R.choose(s, "A", rngOf(1)), s, "no doors after the end");
  });

  test("rush: shards by distance, three rewarded runs per Hong Kong day", () => {
    assert.deepEqual([4, 5, 12, 20, 45].map(R.shardsFor), [0, 1, 2, 4, 5]);
    let p = fresh();
    for (const passed of [12, 30, 5]) p = R.claim(p, passed, DAY).profile;
    assert.equal(R.shardsOf(p), 2 + 5 + 1);
    const fourth = R.claim(p, 30, DAY);
    assert.equal(fourth.rewarded, false);
    assert.equal(fourth.shards, 0);
    assert.equal(fourth.profile.rush.best, 30);
    assert.equal(R.playsToday(p, DAY + 24 * 3600 * 1000), 0, "new day");
  });

  test("rush: 40 shards make the UR 雷神鍵盤, never drawn from the box, and it adds damage per Combo", () => {
    const p = { ...fresh(), shards: { "EQ-THUNDERKEY": 41 } };
    const r = R.unlock(p, data);
    assert.ok(r.profile.owned.equipment.includes("EQ-THUNDERKEY"));
    assert.equal(R.shardsOf(r.profile), 1);
    assert.ok(!ITE.gacha.equipmentCandidates(data).some((e) => e.id === "EQ-THUNDERKEY"));
    const prof = { ...r.profile, team: ["CH-DB"], equipment: { "CH-DB": ["EQ-THUNDERKEY"] } };
    let s = ITE.battle.createBattle(ITE.stages[0], pool, rngOf(2), ITE.profile.teamSnapshot(prof, data), ITE.equipment.battleLoadout(prof, data));
    s = ITE.battle.next(ITE.battle.answer(s, ITE.battle.currentQuestion(s).answer));
    s = ITE.battle.answer(s, ITE.battle.currentQuestion(s).answer);
    assert.equal(s.lastResult.combo, 2);
    assert.equal(s.lastResult.equipBonus, 20, "10 per Combo step × 2");
  });

  test("rush: daily runs survive save/load; damaged entries are dropped", () => {
    const S = ITE.save;
    const store = S.createMemoryStorage();
    const p = R.claim(fresh(), 12, DAY).profile;
    S.persist(store, { ...S.defaultSave(), profile: p });
    assert.deepEqual(S.load(store).save.profile.rush, { day: ITE.guildRaid.hktDayKey(DAY), plays: 1, best: 12 });
    store.setItem(S.SAVE_KEY, JSON.stringify({ ...S.defaultSave(), profile: { ...p, rush: { day: "x", plays: -1 } } }));
    assert.equal(S.load(store).save.profile.rush, undefined);
  });
})();
