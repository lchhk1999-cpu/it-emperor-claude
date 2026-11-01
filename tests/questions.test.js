(function () {
  const Q = ITE.questions;
  const valid = () => ({
    question_id: "T-1",
    topic_id: "sql",
    stem: "題幹",
    option_a: "甲",
    option_b: "乙",
    option_c: "丙",
    option_d: "丁",
    answer: "B",
    explanation: "解說",
    review_status: "approved",
  });

  test("questions: valid question has no errors", () => {
    assert.deepEqual(Q.validateQuestion(valid()), []);
  });

  test("questions: answer must point at A-D", () => {
    const q = { ...valid(), answer: "E" };
    assert.ok(Q.validateQuestion(q).some((e) => e.includes("answer")));
    assert.ok(Q.validateQuestion({ ...valid(), answer: "b" }).length > 0, "lowercase rejected");
  });

  test("questions: all four options required and distinct", () => {
    assert.ok(Q.validateQuestion({ ...valid(), option_d: "" }).some((e) => e.includes("option_d")));
    assert.ok(Q.validateQuestion({ ...valid(), option_d: "甲" }).some((e) => e.includes("distinct")));
  });

  test("questions: unknown topic, empty stem/explanation, bad status rejected", () => {
    const errs = Q.validateQuestion({ ...valid(), topic_id: "art", stem: " ", explanation: null, review_status: "ok" });
    assert.equal(errs.length, 4);
  });

  test("questions: formula option kept as literal text", () => {
    const q = { ...valid(), option_a: "=SUM(A1:A3)" };
    assert.deepEqual(Q.validateQuestion(q), []);
    assert.equal(Q.optionsOf(q)[0].text, "=SUM(A1:A3)");
    assert.ok(Q.validateQuestion({ ...valid(), option_a: 6 }).some((e) => e.includes("text")), "computed number rejected");
  });

  test("questions: duplicate IDs reported, not silently dropped", () => {
    const res = Q.validateBank([valid(), valid(), { ...valid(), question_id: "T-2" }]);
    assert.equal(res.report.accepted, 2);
    assert.equal(res.report.rejected, 1);
    assert.equal(res.report.duplicates, 1);
    assert.equal(res.rejected[0].index, 1);
  });

  test("questions: duplicate IDs detected across type and whitespace", () => {
    const res = Q.validateBank([{ ...valid(), question_id: 1 }, { ...valid(), question_id: "1" }, { ...valid(), question_id: " 1 " }]);
    assert.equal(res.report.duplicates, 2);
  });

  test("questions: bank report counts topics and invalid rows", () => {
    const res = Q.validateBank([valid(), { ...valid(), question_id: "T-3", topic_id: "python" }, { question_id: "" }]);
    assert.equal(res.report.total, 3);
    assert.equal(res.report.topics, 2);
    assert.equal(res.report.rejected, 1);
  });

  test("questions: release mode shows only approved", () => {
    const bank = ["draft", "review", "approved", "rejected"].map((s, i) => ({ ...valid(), question_id: "S" + i, review_status: s }));
    assert.deepEqual(Q.filterForMode(bank, "release").map((q) => q.review_status), ["approved"]);
    assert.deepEqual(Q.filterForMode(bank, "dev").map((q) => q.review_status), ["draft", "review", "approved"]);
    assert.throws(() => Q.filterForMode(bank, "prod"));
  });

  test("questions: dev samples are all valid and none reach release", () => {
    const res = Q.validateBank(ITE.devSampleQuestions);
    assert.equal(res.report.rejected, 0, JSON.stringify(res.rejected));
    assert.equal(Q.filterForMode(ITE.devSampleQuestions, "release").length, 0);
  });

  test("questions: draw gives distinct questions and respects topics", () => {
    const rng = ITE.rng.createRng(42);
    const drawn = Q.drawQuestions(ITE.devSampleQuestions, 10, rng);
    assert.equal(drawn.length, 10);
    assert.equal(new Set(drawn.map((q) => q.question_id)).size, 10);
    const sqlOnly = Q.drawQuestions(ITE.devSampleQuestions, 10, rng, ["sql"]);
    assert.ok(sqlOnly.length > 0 && sqlOnly.every((q) => q.topic_id === "sql"));
  });

  test("questions: draw is reproducible with the same seed", () => {
    const a = Q.drawQuestions(ITE.devSampleQuestions, 5, ITE.rng.createRng(7)).map((q) => q.question_id);
    const b = Q.drawQuestions(ITE.devSampleQuestions, 5, ITE.rng.createRng(7)).map((q) => q.question_id);
    assert.deepEqual(a, b);
  });

  test("questions: shuffled options keep the same four texts and the same correct text", () => {
    const q = { ...valid(), option_a: "甲", option_b: "乙", option_c: "丙", option_d: "丁", answer: "B" };
    const rng = ITE.rng.createRng(5);
    for (let i = 0; i < 50; i++) {
      const s = Q.shuffleOptions(q, rng);
      const texts = Q.optionsOf(s).map((o) => o.text);
      assert.deepEqual(texts.slice().sort(), ["丁", "丙", "乙", "甲"].sort());
      assert.equal(s[`option_${s.answer.toLowerCase()}`], "乙", "answer letter follows the text");
      assert.equal(s.stem, q.stem);
      assert.deepEqual(Q.validateQuestion(s), []);
    }
    assert.equal(q.answer, "B", "original question is not modified");
  });

  test("questions: shuffling spreads answers over A-D even when the bank never uses D", () => {
    const noD = ITE.storyBank.questions;
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    const rng = ITE.rng.createRng(11);
    for (let round = 0; round < 20; round++) noD.forEach((q) => counts[Q.shuffleOptions(q, rng).answer]++);
    const total = 20 * noD.length;
    for (const letter of Q.ANSWERS) assert.ok(counts[letter] / total > 0.2 && counts[letter] / total < 0.3, `${letter}: ${counts[letter]}`);
  });

  test("questions: re-shuffling a shown copy and applying a saved order stay consistent", () => {
    const q = { ...valid(), option_a: "甲", option_b: "乙", option_c: "丙", option_d: "丁", answer: "C" };
    const shown = Q.applyOptionOrder(q, ["D", "C", "B", "A"]);
    assert.deepEqual(Q.optionsOf(shown).map((o) => o.text), ["丁", "丙", "乙", "甲"]);
    assert.equal(shown.answer, "B");
    const again = Q.applyOptionOrder(shown, ["C", "A", "B", "D"]); // order is always in ORIGINAL letters
    assert.deepEqual(Q.optionsOf(again).map((o) => o.text), ["丙", "甲", "乙", "丁"]);
    assert.equal(again.answer, "A");
    assert.throws(() => Q.applyOptionOrder(q, ["A", "A", "B", "C"]));
    assert.ok(!Q.isOptionOrder(["A", "B", "C"]));
  });

  test("questions: a 承上題 always comes straight after the question it follows", () => {
    const Q = ITE.questions;
    const mk = (id, stem) => ({ question_id: id, stem });
    const pool = [mk("X-01", "a"), mk("X-02", "b"), mk("X-03", "承上題，c"), mk("X-04", "d"), mk("Y-1", "e")];
    assert.equal(Q.predecessorId(pool[2]), "X-02");
    assert.equal(Q.predecessorId(pool[1]), null);
    assert.equal(Q.previousOf(pool[2], pool).stem, "b");
    for (let seed = 1; seed <= 30; seed++) {
      const out = Q.shuffleLinked(pool, ITE.rng.createRng(seed));
      assert.equal(out.length, pool.length);
      const i = out.findIndex((q) => q.question_id === "X-03");
      assert.equal(out[i - 1].question_id, "X-02", `seed ${seed}`);
    }
    const real = ITE.questionBank.questions;
    const follower = real.find((q) => q.question_id === "ICT-2025-IA-35");
    if (follower) assert.equal(Q.previousOf(follower, real).question_id, "ICT-2025-IA-34");
  });
})();
