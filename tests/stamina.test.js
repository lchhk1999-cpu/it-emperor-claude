(function () {
  const St = ITE.stamina;
  const P = ITE.profile;
  const S = ITE.save;
  const Dg = ITE.dungeons;
  const data = ITE.gameData;
  const cfg = data.config;
  const MIN = 60 * 1000;
  const T0 = Date.UTC(2026, 10, 2, 2, 0);
  const at = (level, value, updatedAt) => ({ ...P.defaultProfile(data), level, stamina: value === undefined ? undefined : { value, updatedAt } });

  test("stamina: max is 40 at Lv 1 and +2 per level (workbook GameConfig)", () => {
    assert.equal(St.maxStamina(1, cfg), 40);
    assert.equal(St.maxStamina(10, cfg), 58);
    assert.equal(St.maxStamina(1, {}), 40);
  });

  test("stamina: a new or older save starts full", () => {
    const c = St.current(at(1), cfg, T0);
    assert.equal(c.value, 40);
    assert.equal(c.max, 40);
  });

  test("stamina: 1 point back every 5 minutes, kept partial progress, capped at max", () => {
    const p = at(1, 10, T0);
    assert.equal(St.current(p, cfg, T0 + 4 * MIN).value, 10);
    assert.equal(St.current(p, cfg, T0 + 12 * MIN).value, 12);
    assert.equal(St.nextPointIn(p, cfg, T0 + 12 * MIN), 3 * MIN);
    assert.equal(St.current(p, cfg, T0 + 10 * 60 * MIN).value, 40);
    assert.equal(St.nextPointIn(p, cfg, T0 + 10 * 60 * MIN), 0);
    // A clock set backwards gives nothing back.
    assert.equal(St.current(p, cfg, T0 - 60 * MIN).value, 10);
  });

  test("stamina: spending needs enough; partial progress survives a spend", () => {
    let r = St.spend(at(1, 5, T0), 8, cfg, T0);
    assert.equal(r.error, "not_enough_stamina");
    r = St.spend(at(1, 10, T0), 8, cfg, T0 + 7 * MIN);
    assert.equal(r.error, undefined);
    assert.equal(St.current(r.profile, cfg, T0 + 7 * MIN).value, 3);
    assert.equal(St.nextPointIn(r.profile, cfg, T0 + 7 * MIN), 3 * MIN);
    // From full, the timer starts at the spend.
    r = St.spend(at(1), 5, cfg, T0);
    assert.deepEqual(r.profile.stamina, { value: 35, updatedAt: T0 });
    assert.equal(St.spend(at(1, 0, T0), 0, cfg, T0).error, undefined);
  });

  test("stamina: levelling up refills to the new max", () => {
    const p = St.refill({ ...at(1, 3, T0), level: 3 }, cfg, T0);
    assert.deepEqual(p.stamina, { value: 44, updatedAt: T0 });
  });

  test("stamina: world stages cost their question count; limited stage uses the workbook; practice is free", () => {
    const stages = Dg.worldStages();
    assert.equal(St.stageCost(stages.find((s) => s.id === "dse-A-easy")), 5);
    assert.equal(St.stageCost(stages.find((s) => s.id === "dse-A-ultimate")), 15);
    assert.equal(St.stageCost(ITE.stages[0]), 0);
    const sat = Dg.limitedStage(data, Date.UTC(2026, 9, 31, 4, 0)); // Saturday: 金幣之門 (stamina_cost 15)
    assert.equal(St.stageCost(sat), 15);
    const mon = Dg.limitedStage(data, Date.UTC(2026, 10, 2, 4, 0)); // Monday: stamina_cost 0 -> 5 questions
    assert.equal(St.stageCost(mon), 5);
  });

  test("stamina: survives save/load; a damaged entry is dropped and the game starts full", () => {
    const store = S.createMemoryStorage();
    const p = St.spend(at(1), 8, cfg, T0).profile;
    S.persist(store, { ...S.defaultSave(), profile: p });
    assert.deepEqual(S.load(store).save.profile.stamina, { value: 32, updatedAt: T0 });
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null, profile: { level: 1, exp: 0, coins: 0, gems: 0, team: [], stamina: { value: -4, updatedAt: "x" } } }));
    const loaded = S.load(store);
    assert.equal(loaded.save.profile.stamina, undefined);
    assert.equal(St.current(loaded.save.profile, cfg, T0).value, 40);
  });
})();
