// 知識修練館: cards, search, progress, review dates, reward caps and labs.
(function () {
  const R = ITE.revision;
  const L = ITE.revisionLabs;
  const data = ITE.gameData;
  const fresh = () => ITE.profile.defaultProfile(data);
  const T0 = Date.UTC(2026, 10, 2, 2); // 10:00 HKT
  const DAY = 24 * 3600 * 1000;
  const rngOf = (seed) => ITE.rng.createRng(seed);

  test("revision: 47 chapters A01–E04 in five topics; D10 is a bridging exercise; electives are entries only", () => {
    const ids = R.chapters().map((c) => c.id);
    assert.equal(ids.length, 47);
    assert.deepEqual(R.TOPICS.map((t) => [t.id, R.chapters().filter((c) => c.topic === t.id).length]), [["A", 16], ["B", 6], ["C", 9], ["D", 12], ["E", 4]]);
    assert.equal(R.chapterById("D10").scope, "bridge");
    assert.equal(R.chapters().filter((c) => c.scope === "bridge").length, 1);
    assert.deepEqual(R.ELECTIVES.map((e) => e.id), ["2A", "2B", "2C"]);
    assert.ok(R.chapters().every((c) => c.selfTest.length >= 2 && c.selfTest.every((t) => t.q && t.a)));
  });

  test("revision: cards keep the chapter ID (A11-01…), labs sit before 易錯 and keep stable IDs", () => {
    assert.deepEqual(R.cardsOf(R.chapterById("A11")).map((c) => `${c.id}:${c.kind}`), ["A11-01:concept", "A11-02:example", "A11-05:lab", "A11-03:mistake", "A11-04:selftest"]);
    assert.deepEqual(R.cardsOf(R.chapterById("A13")).map((c) => c.id), ["A13-01", "A13-02", "A13-04"], "no 常見錯法 section, no card");
    assert.equal(R.cardById("C07-05").lab, "C07-lab");
    assert.deepEqual(R.backLinks("D11-05").map((c) => c.id), ["D11-01", "D11-03"]);
    // Nothing is lost: every section of a chapter is on some card.
    for (const ch of R.chapters()) {
      const used = R.cardsOf(ch).flatMap((c) => c.sections);
      assert.equal(used.length, ch.sections.length, ch.id);
    }
  });

  test("revision: search matches IDs, titles, keywords and text; title hits first", () => {
    assert.equal(R.search("VLOOKUP")[0].id, "A13");
    assert.equal(R.search("a11")[0].id, "A11");
    assert.equal(R.search("MFA")[0].id, "C07");
    assert.ok(R.search("追蹤表").some((c) => c.id === "D11"));
    assert.deepEqual(R.search("   "), []);
    assert.deepEqual(R.search("不存在的字眼xyz"), []);
  });

  test("revision: reading gives a little EXP once; reopening resumes where the student left off", () => {
    let p = R.open(fresh(), "A11-01", T0);
    assert.equal(R.lastCard(p).id, "A11-01");
    assert.equal(R.status(p, "A11-01", T0), "learning");
    const r1 = R.finishReading(p, "A11-01", T0);
    assert.equal(r1.exp, 5);
    const r2 = R.finishReading(r1.profile, "A11-01", T0 + 1000);
    assert.equal(r2.exp, 0, "no second reward for reading again");
    assert.equal(R.status(r2.profile, "A11-01", T0 + DAY), "due", "review due after 1 day");
    // Survives save/load.
    const store = ITE.save.createMemoryStorage();
    const save = { ...ITE.save.defaultSave(), profile: r2.profile };
    ITE.save.persist(store, save);
    const back = ITE.save.load(store);
    assert.equal(back.status, "ok");
    assert.deepEqual(back.save.profile.revision, r2.profile.revision);
  });

  test("revision: rewards — new example, putting a mistake right, due review; capped per card per day", () => {
    const E = R.REVISION_RULES.exp;
    let r = R.answer(fresh(), "A11-05", { correct: false, graded: true }, T0);
    assert.equal(r.exp, 0, "a wrong answer costs nothing and gives nothing");
    assert.equal(R.status(r.profile, "A11-05", T0), "learning");
    r = R.answer(r.profile, "A11-05", { correct: true, graded: true }, T0 + 1000);
    assert.deepEqual(r.reasons.map((x) => x.key), ["firstDone", "fixed"]);
    assert.equal(r.exp, E.firstDone + E.fixed);
    r = R.answer(r.profile, "A11-05", { correct: true, graded: true }, T0 + 2000);
    assert.equal(r.exp, E.newCorrect);
    r = R.answer(r.profile, "A11-05", { correct: true, graded: true }, T0 + 3000);
    assert.equal(r.exp, 0, "30 a day per card reached");
    assert.ok(r.capped);
    // Next day the review is due: the biggest reward, and the next review is 3 days later.
    r = R.answer(r.profile, "A11-05", { correct: true, graded: true }, T0 + DAY + 5000);
    assert.equal(r.reasons[0].key, "reviewCorrect");
    assert.equal(r.exp, E.reviewCorrect);
    assert.equal(r.profile.revision.cards["A11-05"].due, T0 + DAY + 5000 + 3 * DAY);
    // A wrong review goes back to the first step and is due again today.
    r = R.answer(r.profile, "A11-05", { correct: false, graded: true }, T0 + 5 * DAY);
    assert.deepEqual([r.profile.revision.cards["A11-05"].step, R.status(r.profile, "A11-05", T0 + 5 * DAY)], [0, "due"]);
    assert.ok(R.dueCards(r.profile, T0 + 5 * DAY).some((c) => c.id === "A11-05"));
  });

  test("revision: self-assessed self-tests schedule reviews but give no EXP beyond the first finish", () => {
    let r = R.answer(fresh(), "C07-04", { correct: true, graded: false }, T0);
    assert.equal(r.exp, R.REVISION_RULES.exp.firstDone);
    r = R.answer(r.profile, "C07-04", { correct: true, graded: false }, T0 + DAY + 1);
    assert.equal(r.exp, 0);
    assert.equal(r.profile.revision.cards["C07-04"].step, 1, "still moves the review date");
  });

  test("revision: damaged progress is cleaned on load; unknown card IDs are dropped", () => {
    const clean = R.sanitize({ last: { cardId: "Z99-01" }, cards: { "A01-01": { attempts: -3, passed: "yes", due: "x", step: 9 }, hack: {} }, font: 7 });
    assert.deepEqual(Object.keys(clean.cards), ["A01-01"]);
    assert.deepEqual([clean.cards["A01-01"].attempts, clean.cards["A01-01"].passed, clean.cards["A01-01"].due, clean.cards["A01-01"].step], [0, false, null, 3]);
    assert.equal(clean.last, null);
    assert.equal(clean.font, 0);
  });

  test("labs: A11 — 60 and 2 tries wins, 59 does not; the > bug loses at 60; values really recalculate", () => {
    assert.equal(L.a11Breakdown(60, 2).result, "獲獎");
    assert.equal(L.a11Breakdown(59, 2).result, "未達標");
    assert.equal(L.a11Breakdown(60, 1).result, "未達標");
    assert.equal(L.a11Breakdown(60, 2, ">").result, "未達標");
    assert.deepEqual(L.a11Breakdown(72, 3).parts.map((p) => p.value), ["TRUE", "TRUE", "TRUE"]);
    const tasks = L.tasks("A11-lab", rngOf(3));
    assert.deepEqual(tasks.map((t) => t.id), ["predict", "explore", "bug", "new"]);
    assert.equal(tasks[0].answer, "獲獎");
    assert.equal(tasks[2].answer, "未達標");
    for (let s = 1; s < 30; s++) {
      const t = L.tasks("A11-lab", rngOf(s))[3];
      const [, score, tries] = /分數 (\d+)、挑戰次數 (\d+)/.exec(t.prompt).map(Number);
      assert.equal(t.answer, score >= 60 && tries >= 2 ? "獲獎" : "未達標", t.prompt);
    }
  });

  test("labs: D11 — the notes' trace table and output; generated examples are checked by the tracer", () => {
    const t = L.d11Table(L.d11Program([4, 7, 2], ">", 3));
    assert.deepEqual(t.rows.map((r) => [r.when, r.x, r.count, r.total]), [
      ["初始化後", "尚未賦值", "0", "0"],
      ["第一次循環後", "4", "1", "4"],
      ["第二次循環後", "7", "2", "11"],
      ["第三次循環後", "2", "2", "11"],
    ]);
    assert.equal(t.output, "2 11");
    for (let s = 1; s < 30; s++) {
      const tasks = L.tasks("D11-lab", rngOf(s));
      assert.equal(tasks[0].answer, "2 11");
      assert.equal(tasks[2].answer, "1 7");
      const n = tasks[3];
      assert.ok(n.options.includes(n.answer) && new Set(n.options).size === n.options.length);
      const items = JSON.parse(/for x in (\[.*\])/.exec(n.code)[1]);
      const [, op, limit] = /if x (>=|>) (\d+)/.exec(n.code);
      const hit = items.filter((x) => (op === ">" ? x > +limit : x >= +limit));
      assert.equal(n.answer, `${hit.length} ${hit.reduce((a, b) => a + b, 0)}`);
    }
    const kinds = { "15": "正常", "10": "有效邊界", "20": "有效邊界", "9": "邊界外／無效", "21": "邊界外／無效", "12.5": "邊界外／無效" };
    for (let s = 1; s < 40; s++) {
      const q = L.tasks("D11-lab", rngOf(s))[4];
      const v = /測試值 (\S+) 屬/.exec(q.prompt)[1];
      if (kinds[v]) assert.equal(q.answer, kinds[v], v);
    }
  });

  test("labs: C07 — factor kinds and MFA follow the notes (two different categories)", () => {
    const f = Object.fromEntries(L.FACTORS.map((x) => [x.name, x]));
    assert.ok(!L.isMfa(f["密碼"], f["PIN"]), "password + PIN is still one category");
    assert.ok(L.isMfa(f["密碼"], f["實體安全權標"]));
    assert.ok(L.isMfa(f["指紋"], f["PIN"]));
    for (let s = 1; s < 20; s++) {
      const tasks = L.tasks("C07-lab", rngOf(s));
      assert.deepEqual(tasks.map((t) => t.id), ["factor", "mfa", "access", "measure"]);
      tasks.forEach((t) => assert.ok(t.options.includes(t.answer), t.id));
    }
    assert.ok(L.tasks("C07-lab", rngOf(1)).every((t) => t.graded));
  });
})();
