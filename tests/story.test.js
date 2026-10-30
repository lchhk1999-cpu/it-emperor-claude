(function () {
  const St = ITE.story;
  const bank = ITE.storyBank;
  const rng = (seed = 3) => ITE.rng.createRng(seed);
  const devLevels = () => St.buildLevels(bank, "dev");
  const level = (id) => devLevels().find((l) => l.id === id);
  const wrongOf = (q) => ITE.questions.ANSWERS.find((l) => l !== q.answer);
  const playAll = (run, pickWrongFor) => {
    while (run.phase !== "cleared") {
      if (run.phase === "feedback") run = St.next(run);
      else {
        const q = St.current(run);
        const wrongOnce = pickWrongFor && pickWrongFor.has(q.question_id) && !(q.question_id in run.firstTry);
        run = St.answer(run, wrongOnce ? wrongOf(q) : q.answer);
      }
    }
    return run;
  };

  test("story: 43 levels in sheet order, enabled levels playable in dev, rest coming soon", () => {
    const levels = devLevels();
    assert.equal(levels.length, 43);
    assert.deepEqual(levels.slice(0, 3).map((l) => l.id), ["A-01", "A-02", "A-03"]);
    assert.deepEqual(levels.filter((l) => l.playable).map((l) => l.id), St.STORY_RULES.enabledLevels);
    const firstClosed = levels.find((l) => !St.STORY_RULES.enabledLevels.includes(l.id));
    assert.equal(firstClosed.blocked, "coming_soon");
    assert.ok(levels.every((l) => l.questions.every((q) => q.level_id === l.id)), "questions matched by level_id");
  });

  test("story: release build shows only approved questions, so review levels wait for teachers", () => {
    const rel = St.buildLevels(bank, "release");
    const a01 = rel.find((l) => l.id === "A-01");
    assert.ok(a01.questions.every((q) => q.review_status === "approved"));
    if (!a01.questions.some((q) => q.boss)) {
      assert.equal(a01.playable, false);
      assert.equal(a01.blocked, "awaiting_review");
    }
  });

  test("story: a run draws practice questions then the mini-Boss last", () => {
    const run = St.createRun(level("A-01"), rng());
    assert.equal(run.queue.length, 3);
    assert.ok(!run.queue[0].boss && !run.queue[1].boss && run.queue[2].boss);
    assert.equal(run.bossMaxHp, run.queue.reduce((s, q) => s + q.points, 0));
  });

  test("story: practice draw order varies with the seed but always uses the level pool", () => {
    const orders = new Set([1, 2, 3, 4, 5, 6].map((s) => St.createRun(level("A-02"), rng(s)).queue.map((q) => q.question_id).join()));
    assert.ok(orders.size > 1, "practice questions are shuffled");
    const run = St.createRun({ ...level("A-02"), questions: level("A-02").questions }, rng(1), { ...St.STORY_RULES, practiceCount: 1 });
    assert.equal(run.queue.length, 2);
  });

  test("story: correct answer attacks the boss by the question's points", () => {
    let run = St.createRun(level("A-01"), rng());
    const q = St.current(run);
    run = St.answer(run, q.answer);
    assert.equal(run.phase, "feedback");
    assert.equal(run.bossHp, run.bossMaxHp - q.points);
    assert.ok(run.lastResult.correct);
  });

  test("story: wrong answer deals no damage, keeps explanation and re-queues the question", () => {
    let run = St.createRun(level("A-01"), rng());
    const q = St.current(run);
    run = St.answer(run, wrongOf(q));
    assert.equal(run.bossHp, run.bossMaxHp);
    assert.equal(run.question.question_id, q.question_id);
    assert.ok(run.question.explanation.length > 0, "Chinese explanation available");
    assert.equal(run.queue[run.queue.length - 1].question_id, q.question_id, "comes back at the end");
    assert.equal(St.answer(run, q.answer), run, "no answering during feedback");
  });

  test("story: all correct first time clears with 3 stars and boss HP 0", () => {
    const run = playAll(St.createRun(level("A-03"), rng()));
    const sum = St.summary(run);
    assert.ok(sum.cleared);
    assert.equal(run.bossHp, 0);
    assert.equal(sum.stars, 3);
    assert.equal(sum.firstTryCorrect, 3);
  });

  test("story: mistakes still clear the level but lower the stars", () => {
    const base = St.createRun(level("A-02"), rng());
    const ids = base.queue.map((q) => q.question_id);
    const one = St.summary(playAll(base, new Set([ids[0]])));
    assert.equal(one.stars, 2);
    assert.equal(one.mistakes, 1);
    const two = St.summary(playAll(base, new Set([ids[0], ids[2]])));
    assert.equal(two.stars, 1);
    assert.deepEqual(two.wrongQuestionIds.sort(), [ids[0], ids[2]].sort());
  });

  test("story: clearing unlocks the next level, in order", () => {
    const levels = devLevels();
    let progress = { levels: {} };
    assert.ok(St.isUnlocked(levels, progress, "A-01"));
    assert.ok(!St.isUnlocked(levels, progress, "A-02"));
    progress = St.recordClear(progress, St.summary(playAll(St.createRun(level("A-01"), rng()))));
    assert.ok(St.isUnlocked(levels, progress, "A-02"));
    assert.ok(!St.isUnlocked(levels, progress, "A-03"));
    assert.equal(St.nextLevel(levels, "A-01").id, "A-02");
  });

  test("story: replays keep the best stars and count plays", () => {
    let progress = St.recordClear({ levels: {} }, { levelId: "A-01", cleared: true, stars: 3 });
    progress = St.recordClear(progress, { levelId: "A-01", cleared: true, stars: 1 });
    assert.deepEqual(progress.levels["A-01"], { cleared: true, stars: 3, plays: 2 });
  });

  test("story: a level without a mini-Boss question cannot start", () => {
    const l = level("A-01");
    assert.throws(() => St.createRun({ ...l, questions: l.questions.filter((q) => !q.boss) }, rng()));
  });

  test("story: code questions keep their line breaks in the bank", () => {
    const q = bank.questions.find((x) => x.question_id === "STORY-D-03-03");
    assert.ok(q && q.stem.split("\n").length === 4, "question line + three code lines");
  });

  test("story: imported bank passes the game's question validation", () => {
    const res = ITE.questions.validateBank(bank.questions.map((q) => ({ ...q, topic_id: "sql" })));
    assert.equal(res.report.rejected, 0, JSON.stringify(res.rejected.slice(0, 2)));
  });

  test("story: progress survives save/load; damaged records are repaired", () => {
    const S = ITE.save;
    const store = S.createMemoryStorage();
    const story = { levels: { "A-01": { cleared: true, stars: 2, plays: 1 } } };
    S.persist(store, S.withStory(S.defaultSave(), story));
    assert.deepEqual(S.load(store).save.story, story);
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null, story: { levels: { "A-01": { cleared: "yes", stars: 9 } } } }));
    const r = S.load(store);
    assert.equal(r.status, "repaired");
    assert.deepEqual(r.save.story.levels["A-01"], { cleared: false, stars: 3, plays: 0 });
  });

  test("story: teacher review CSV matches the importer's columns and escapes safely", () => {
    const csv = St.reviewsToCsv({
      "STORY-A-01-02": { decision: "rejected", reviewer: "LCH", reviewed_at: "2026-10-30", note: '用詞要改，"驗證"→核對, 再審' },
      "STORY-A-01-01": { decision: "approved", reviewer: "LCH", reviewed_at: "2026-10-30", note: "" },
      "STORY-A-01-03": { decision: "maybe", reviewer: "LCH", reviewed_at: "2026-10-30", note: "" },
      "STORY-A-02-01": { decision: "approved", reviewer: "=HYPERLINK(1)", reviewed_at: "2026-10-30", note: "+1\nnext" },
    });
    const lines = csv.trim().split("\n");
    assert.equal(lines[0], "question_id,decision,reviewer,reviewed_at,note");
    assert.equal(lines.length, 4, "invalid decisions are left out; newlines in notes do not split rows");
    assert.equal(lines[1], "STORY-A-01-01,approved,LCH,2026-10-30,");
    assert.equal(lines[2], 'STORY-A-01-02,rejected,LCH,2026-10-30,"用詞要改，""驗證""→核對, 再審"');
    assert.equal(lines[3], "STORY-A-02-01,approved,'=HYPERLINK(1),2026-10-30,'+1 next");
  });

  test("story: options are shuffled and a retried question comes back in a new order", () => {
    let run = St.createRun(level("A-01"), rng(4));
    assert.ok(run.queue.every((q) => ITE.questions.isOptionOrder(q.option_order)));
    const q = St.current(run);
    const correctText = q[`option_${q.answer.toLowerCase()}`];
    run = St.answer(run, wrongOf(q));
    const back = run.queue[run.queue.length - 1];
    assert.equal(back.question_id, q.question_id);
    assert.equal(back[`option_${back.answer.toLowerCase()}`], correctText, "same correct text");
    assert.equal(run.shown[q.question_id], q, "review list keeps the copy the student saw");
    const orders = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => {
      let r = St.createRun(level("A-01"), rng(s));
      const first = St.current(r);
      r = St.answer(r, wrongOf(first));
      return first.option_order.join("") + ">" + r.queue[r.queue.length - 1].option_order.join("");
    }));
    assert.ok([...orders].some((o) => o.split(">")[0] !== o.split(">")[1]), "retry order differs at least sometimes");
  });
  test("story: every enabled level can be cleared in order, unlocking the next one", () => {
    const levels = devLevels();
    const enabled = St.STORY_RULES.enabledLevels;
    assert.deepEqual(enabled, levels.slice(0, enabled.length).map((l) => l.id), "enabled levels are a prefix, so unlocks never skip");
    let progress = { levels: {} };
    for (const id of enabled) {
      assert.ok(St.isUnlocked(levels, progress, id), `${id} unlocked after the previous level`);
      const l = levels.find((x) => x.id === id);
      assert.ok(l.questions.length >= 3 && l.questions.some((q) => q.boss), `${id} has practice and a mini-Boss`);
      const run = playAll(St.createRun(l, rng(enabled.indexOf(id) + 1)));
      assert.equal(run.bossHp, 0, `${id} boss defeated`);
      progress = St.recordClear(progress, St.summary(run));
    }
    const after = St.nextLevel(levels, enabled[enabled.length - 1]);
    if (after) assert.ok(St.isUnlocked(levels, progress, after.id) && !after.playable, "next level is unlocked but still coming soon");
  });

  test("story: worlds A-D are fully open (A-01..A-09, B-01..B-08, C-01..C-10, D-01..D-10)", () => {
    for (const [world, count] of [["A", 9], ["B", 8], ["C", 10], ["D", 10]]) {
      const levels = devLevels().filter((l) => l.world_id === world);
      assert.equal(levels.length, count, `world ${world} level count`);
      assert.ok(levels.every((l) => l.playable), `world ${world} playable`);
    }
    assert.ok(St.isUnlocked(devLevels(), { levels: { "A-09": { cleared: true, stars: 1, plays: 1 } } }, "B-01"), "clearing A-09 opens world B");
    assert.ok(St.isUnlocked(devLevels(), { levels: { "B-08": { cleared: true, stars: 1, plays: 1 } } }, "C-01"), "clearing B-08 opens world C");
    assert.ok(St.isUnlocked(devLevels(), { levels: { "C-10": { cleared: true, stars: 1, plays: 1 } } }, "D-01"), "clearing C-10 opens world D");
  });
})();
