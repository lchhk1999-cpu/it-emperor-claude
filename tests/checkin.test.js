(function () {
  const C = ITE.checkin;
  const P = ITE.profile;
  const S = ITE.save;
  const data = ITE.gameData;
  const HOUR = 3600 * 1000;
  const mon = Date.UTC(2026, 10, 2, 1, 0); // Monday 09:00 HKT
  const rng = () => 0;

  test("checkin: once per Hong Kong day; a new day starts at 00:00 HKT", () => {
    let p = P.defaultProfile(data);
    assert.ok(C.canCheckIn(p, mon));
    const r = C.checkIn(p, data, mon, rng);
    assert.deepEqual(r.profile.checkin, { days: 1, lastDay: "2026-11-02" });
    assert.equal(C.checkIn(r.profile, data, mon + 5 * HOUR, rng).error, "already_checked_in");
    assert.equal(C.canCheckIn(r.profile, mon + 14 * HOUR), false, "23:00 HKT same day");
    assert.equal(C.canCheckIn(r.profile, mon + 15 * HOUR + 1), true, "00:00 HKT next day");
  });

  test("checkin: 7-day reward cycle (user approved): coins, gems, materials, 傳說核心", () => {
    const rewards = [0, 1, 2, 3, 4, 5, 6].map((i) => C.rewardFor(i, data, () => 0));
    assert.deepEqual(rewards.map((r) => [r.coins, r.gems]), [[100, 0], [0, 5], [0, 0], [200, 0], [0, 5], [0, 0], [0, 10]]);
    assert.deepEqual(rewards[2].materials, { "MAT-EXCEL": 3 });
    assert.deepEqual(rewards[5].materials, { "MAT-RARE": 1 });
    assert.equal(rewards.reduce((s, r) => s + r.gems, 0), 20, "20 gems a week");
  });

  test("checkin: missing days does not restart the cycle; day 8 starts a new cycle", () => {
    let p = P.defaultProfile(data);
    const days = [0, 1, 5, 6, 9, 10, 20, 21];
    const got = [];
    for (const d of days) {
      const r = C.checkIn(p, data, mon + d * 24 * HOUR, rng);
      got.push(r.index);
      p = r.profile;
    }
    assert.deepEqual(got, [0, 1, 2, 3, 4, 5, 6, 0]);
    assert.equal(p.checkin.days, 8);
  });

  test("checkin: survives save/load; damaged data starts again", () => {
    const store = S.createMemoryStorage();
    const p = C.checkIn(P.defaultProfile(data), data, mon, rng).profile;
    S.persist(store, { ...S.defaultSave(), profile: p });
    assert.deepEqual(S.load(store).save.profile.checkin, { days: 1, lastDay: "2026-11-02" });
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null, profile: { level: 1, exp: 0, coins: 0, gems: 0, team: [], checkin: { days: -1, lastDay: "x" } } }));
    assert.equal(S.load(store).save.profile.checkin, undefined);
  });
})();
