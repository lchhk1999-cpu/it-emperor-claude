(function () {
  const M = ITE.missions;
  const data = ITE.gameData;
  const HOUR = 3600 * 1000;
  const DAY = 24 * HOUR;
  const WED = Date.UTC(2026, 9, 28, 2, 0, 0); // Wed 2026-10-28 10:00 HKT
  const mission = (id) => data.missions.find((m) => m.id === id);
  const title = (id) => data.titles.find((t) => t.id === id);
  const q = (topic, tags) => ({ question_id: "x", topic_id: topic, tags: tags || "" });
  const answerN = (p, n, correct, topic, tags, now = WED) => {
    for (let i = 0; i < n; i++) p = M.recordAnswer(p, q(topic || "OS", tags), correct, now);
    return p;
  };

  test("missions: workbook missions and titles imported; unsupported ones flagged", () => {
    assert.deepEqual(data.missions.map((m) => m.id), ["M-DAILY-01", "M-DAILY-02", "M-WEEK-01", "M-WEEK-02", "M-ACH-01"]);
    assert.deepEqual(data.missions.filter((m) => !m.supported).map((m) => m.id), ["M-WEEK-02", "M-ACH-01"]);
    assert.deepEqual(data.titles.filter((t) => !t.supported).map((t) => t.id), ["T-PVP"]);
    assert.equal(title("T-EXCEL").topic, "EXCEL");
  });

  test("missions: daily 10 answers counts right and wrong answers from any mode", () => {
    let p = M.defaultProgress(WED);
    p = answerN(p, 6, true);
    p = answerN(p, 3, false);
    assert.deepEqual(M.missionStatus(p, mission("M-DAILY-01"), WED), { value: 9, target: 10, done: false, claimed: false, supported: true });
    p = answerN(p, 1, false);
    assert.ok(M.missionStatus(p, mission("M-DAILY-01"), WED).done);
  });

  test("missions: claiming gives the workbook reward once per period", () => {
    let p = answerN(M.defaultProgress(WED), 10, true);
    assert.equal(M.claimMission(M.defaultProgress(WED), mission("M-DAILY-01"), WED).error, "not_done");
    const r = M.claimMission(p, mission("M-DAILY-01"), WED);
    assert.deepEqual(r.reward, { gems: 3, coins: 0 });
    p = r.progress;
    assert.equal(M.claimMission(p, mission("M-DAILY-01"), WED + HOUR).error, "already_claimed");
    assert.equal(M.claimableCount(p, data.missions, WED), 0);
    assert.equal(M.claimMission(p, mission("M-ACH-01"), WED).error, "not_supported");
  });

  test("missions: daily counters reset at HKT midnight; weekly on Monday", () => {
    let p = answerN(M.defaultProgress(WED), 10, true);
    p = M.claimMission(p, mission("M-DAILY-01"), WED).progress;
    const thuEarly = Date.UTC(2026, 9, 28, 16, 30); // Thu 00:30 HKT
    assert.equal(M.missionStatus(p, mission("M-DAILY-01"), thuEarly).value, 0, "new day, new count");
    assert.equal(M.missionStatus(p, mission("M-DAILY-01"), thuEarly).claimed, false, "can claim again tomorrow");
    assert.equal(M.missionStatus(p, mission("M-WEEK-01"), thuEarly).value, 10, "week keeps counting");
    const nextMon = Date.UTC(2026, 10, 1, 16, 0); // Mon 2 Nov 00:00 HKT
    assert.equal(M.missionStatus(p, mission("M-WEEK-01"), nextMon).value, 0, "new week");
    assert.equal(M.rollover(p, nextMon).lifetime.correct, 10, "lifetime never resets");
  });

  test("missions: stage clears count for the daily clear mission", () => {
    let p = M.recordStageClear(M.defaultProgress(WED), WED);
    const st = M.missionStatus(p, mission("M-DAILY-02"), WED);
    assert.ok(st.done);
    assert.deepEqual(M.claimMission(p, mission("M-DAILY-02"), WED).reward, { gems: 2, coins: 50 });
  });

  test("missions: titles are earned from lifetime counts (total, topic, SQL JOIN)", () => {
    let p = M.defaultProgress(WED);
    p = answerN(p, 49, true, "OS");
    assert.equal(M.titleStatus(p, title("T-NEW")).earned, false);
    p = answerN(p, 1, true, "OS");
    assert.equal(M.titleStatus(p, title("T-NEW")).earned, true);
    p = answerN(p, 99, true, "EXCEL");
    p = answerN(p, 5, false, "EXCEL");
    assert.deepEqual(M.titleStatus(p, title("T-EXCEL")), { value: 99, target: 100, earned: false, supported: true });
    p = answerN(p, 1, true, "EXCEL");
    assert.ok(M.titleStatus(p, title("T-EXCEL")).earned);
    p = answerN(p, 100, true, "SQL", "WHERE;SELECT");
    assert.equal(M.titleStatus(p, title("T-SQL")).value, 0, "only JOIN-tagged SQL questions count");
    p = answerN(p, 100, true, "SQL", "JOIN;LEFT JOIN");
    assert.ok(M.titleStatus(p, title("T-SQL")).earned);
    assert.equal(M.titleStatus(p, title("T-PVP")).supported, false);
  });

  test("missions: only earned titles can be equipped and shown", () => {
    let p = M.defaultProgress(WED);
    assert.equal(M.equipTitle(p, title("T-NEW")).error, "not_earned");
    p = answerN(p, 50, true);
    p = M.equipTitle(p, title("T-NEW")).progress;
    assert.equal(M.equippedTitle(p, data.titles).name, "IT 新人王");
    p = M.equipTitle(p, null).progress;
    assert.equal(M.equippedTitle(p, data.titles), null);
  });

  test("missions: the real bank has JOIN-tagged SQL questions for the JOIN title", () => {
    assert.ok(ITE.questionBank.questions.some((x) => M.isSqlJoin(x)));
  });

  test("missions: progress and gems survive save/load; bad values are repaired", () => {
    const S = ITE.save;
    const store = S.createMemoryStorage();
    const progress = M.recordStageClear(answerN(M.defaultProgress(WED), 3, true, "EXCEL"), WED);
    S.persist(store, { ...S.defaultSave(), progress, profile: { level: 2, exp: 0, coins: 0, gems: 5, team: ["CH-DB"], equipment: {} } });
    const r = S.load(store);
    assert.equal(r.status, "ok");
    assert.deepEqual(r.save.progress, progress);
    assert.equal(r.save.profile.gems, 5);
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null, progress: { daily: { key: "2026-10-28", answered: -4, byTopic: { SQL: "x", OS: 2 } }, claimed: { a: 7 }, titles: { equipped: 3 } } }));
    const bad = S.load(store);
    assert.equal(bad.status, "repaired");
    assert.equal(bad.save.progress.daily.answered, 0);
    assert.deepEqual(bad.save.progress.daily.byTopic, { OS: 2 });
    assert.deepEqual(bad.save.progress.claimed, {});
    assert.equal(bad.save.progress.titles.equipped, null);
  });

  test("missions: mission gems are added to the profile (free currency only)", () => {
    const r = ITE.profile.addReward({ ...ITE.profile.defaultProfile(data), gems: 0 }, { gems: 3, coins: 50 }, data);
    assert.deepEqual([r.profile.gems, r.profile.coins], [3, 50]);
    assert.equal(data.config.gacha_paid_enabled, 0);
  });
})();
