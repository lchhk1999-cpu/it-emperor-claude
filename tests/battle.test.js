(function () {
  const B = ITE.battle;
  const stage = ITE.stages[0];
  const start = (seed = 1) => B.createBattle(stage, ITE.devSampleQuestions, ITE.rng.createRng(seed));
  const right = (s) => B.currentQuestion(s).answer;
  const wrong = (s) => ITE.questions.ANSWERS.find((l) => l !== B.currentQuestion(s).answer);

  test("battle: starts in question phase with full HP", () => {
    const s = start();
    assert.equal(s.phase, "question");
    assert.equal(s.boss.hp, stage.boss.maxHp);
    assert.equal(s.party.hp, B.BALANCE.partyMaxHp);
    assert.equal(s.deck.length, stage.questionCount);
  });

  test("battle: correct answer damages boss, party untouched", () => {
    const s = B.answer(start(), right(start()));
    assert.equal(s.phase, "feedback");
    assert.ok(s.lastResult.correct);
    assert.equal(s.boss.hp, stage.boss.maxHp - B.BALANCE.baseDamage);
    assert.equal(s.party.hp, B.BALANCE.partyMaxHp);
  });

  test("battle: wrong answer leaves boss, party takes boss attack, combo resets", () => {
    let s = B.next(B.answer(start(), right(start())));
    s = B.answer(s, wrong(s));
    assert.equal(s.lastResult.correct, false);
    assert.equal(s.combo, 0);
    assert.equal(s.boss.hp, stage.boss.maxHp - B.BALANCE.baseDamage);
    assert.equal(s.party.hp, B.BALANCE.partyMaxHp - stage.boss.attack);
  });

  test("battle: skipped/timeout (null) counts as wrong", () => {
    const s = B.answer(start(), null);
    assert.equal(s.lastResult.correct, false);
  });

  test("battle: combo bonus grows and is capped", () => {
    assert.equal(B.damageFor(1), 50);
    assert.equal(B.damageFor(2), 60);
    assert.equal(B.damageFor(4), 80);
    assert.equal(B.damageFor(9), 80);
  });

  test("battle: answering twice in feedback phase is ignored", () => {
    const s1 = B.answer(start(), right(start()));
    const s2 = B.answer(s1, right(start()));
    assert.equal(s2, s1);
  });

  test("battle: all correct wins and boss HP never negative", () => {
    let s = start();
    while (s.phase === "question") s = B.next(B.answer(s, right(s)));
    assert.equal(s.phase, "won");
    assert.equal(s.boss.hp, 0);
    const sum = B.summary(s);
    assert.equal(sum.accuracy, 100);
    assert.equal(sum.outcome, "won");
  });

  test("battle: all wrong loses when party HP hits 0", () => {
    let s = start();
    while (s.phase === "question") s = B.next(B.answer(s, wrong(s)));
    assert.equal(s.phase, "lost");
    assert.equal(s.party.hp, 0);
    assert.equal(B.summary(s).answered, Math.ceil(B.BALANCE.partyMaxHp / stage.boss.attack));
  });

  test("battle: running out of questions with boss alive is a loss", () => {
    const tiny = { ...stage, questionCount: 2 };
    let s = B.createBattle(tiny, ITE.devSampleQuestions, ITE.rng.createRng(3));
    s = B.next(B.answer(s, right(s)));
    s = B.answer(s, right(s));
    assert.equal(s.outcome, "lost");
    assert.equal(B.next(s).phase, "lost");
  });

  test("battle: summary lists wrong question IDs for review", () => {
    let s = start();
    const firstId = B.currentQuestion(s).question_id;
    s = B.next(B.answer(s, wrong(s)));
    assert.deepEqual(B.summary(s).wrongQuestionIds, [firstId]);
  });

  test("battle: empty pool throws a clear error", () => {
    assert.throws(() => B.createBattle(stage, [], ITE.rng.createRng(1)));
    assert.throws(() => B.createBattle({ ...stage, topicIds: ["nope"] }, ITE.devSampleQuestions, ITE.rng.createRng(1)));
  });

  test("battle: resume rebinds deck to live pool and refuses unapproved questions (QA blocker)", () => {
    const s = start();
    const saved = JSON.parse(JSON.stringify(s));
    saved.deck[0].stem = "TAMPERED";
    const rebound = B.rebindDeck(saved, ITE.devSampleQuestions);
    assert.ok(rebound);
    assert.ok(rebound.deck[0].stem !== "TAMPERED", "uses live question text, not saved text");
    const releasePool = ITE.questions.filterForMode(ITE.devSampleQuestions, "release");
    assert.equal(B.rebindDeck(saved, releasePool), null, "draft questions cannot resume in release");
  });

  test("battle: state survives JSON round trip mid-battle", () => {
    let s = B.answer(start(), right(start()));
    const restored = JSON.parse(JSON.stringify(s));
    assert.deepEqual(B.next(restored), B.next(s));
  });
})();
