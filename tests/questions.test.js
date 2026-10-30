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
})();
