(function () {
  const D = ITE.drill;
  const pool = ITE.questions.filterForMode(ITE.questionBank.questions, "release");
  const rng = (seed) => ITE.rng.createRng(seed);

  test("drill: pool filters by world and difficulty; null means all", () => {
    assert.equal(D.pool(pool, null, null).length, pool.length);
    const bHard = D.pool(pool, "B", "hard");
    assert.ok(bHard.length > 0);
    assert.ok(bHard.every((q) => q.difficulty === "hard" && ["HARDWARE", "IO", "OS"].includes(q.topic_id)));
    assert.equal(D.start(pool, "E", "hard", rng(1)), null, "no questions -> no session");
  });

  test("drill: random order, no repeats until the pool is used up, then a new round", () => {
    let s = D.start(pool, "B", "hard", rng(2));
    const n = s.order.length;
    const seen = [];
    for (let i = 0; i < n; i++) {
      s = D.next(s, rng(3 + i));
      seen.push(s.current.question_id);
    }
    assert.equal(new Set(seen).size, n);
    s = D.next(s, rng(99));
    assert.equal(s.index, 1, "a new round starts");
    const other = D.start(pool, null, null, rng(7)).order.slice(0, 10).map((q) => q.question_id).join();
    assert.ok(other !== D.start(pool, null, null, rng(8)).order.slice(0, 10).map((q) => q.question_id).join(), "different seeds, different order");
  });

  test("drill: answers keep score and streak; answering twice is ignored; no rewards", () => {
    let s = D.next(D.start(pool, "A", "easy", rng(4)), rng(5));
    const right = s.current.answer;
    s = D.answer(s, right);
    assert.deepEqual([s.answered, s.correct, s.streak, s.last.correct], [1, 1, 1, true]);
    assert.equal(D.answer(s, right), s, "already answered");
    s = D.next(s, rng(6));
    s = D.answer(s, s.current.answer === "A" ? "B" : "A");
    assert.deepEqual([s.answered, s.correct, s.streak, s.best], [2, 1, 0, 1]);
    assert.equal(s.exp, undefined);
    assert.equal(s.coins, undefined);
  });
})();
