(function () {
  // Imported bank from tools/import_question_bank.py (both build variants).
  const devBank = ITE.questionBank;
  load("src/data/question_bank.release.js");
  const releaseBank = ITE.questionBank;
  ITE.questionBank = devBank;
  const Q = ITE.questions;
  const withTopics = (bank) => {
    Object.assign(Q.TOPICS, bank.topics);
    return Q.validateBank(bank.questions);
  };

  test("bank: every imported question passes the game's own validation", () => {
    const res = withTopics(devBank);
    assert.equal(res.report.rejected, 0, JSON.stringify(res.rejected.slice(0, 3)));
    assert.equal(res.report.accepted, devBank.meta.accepted);
    assert.ok(devBank.questions.length > 0);
  });

  test("bank: release file holds approved questions only, and all of them", () => {
    assert.ok(releaseBank.questions.every((q) => q.review_status === "approved"));
    const approvedInDev = devBank.questions.filter((q) => q.review_status === "approved").map((q) => q.question_id);
    assert.deepEqual(releaseBank.questions.map((q) => q.question_id), approvedInDev);
    assert.deepEqual(Q.filterForMode(devBank.questions, "release").map((q) => q.question_id), approvedInDev);
  });

  test("bank: Excel formula options are kept as formula text", () => {
    const q = devBank.questions.find((x) => x.question_id === "ICT-NEW-002");
    if (!q) return; // only meaningful for the current workbook
    assert.equal(q.option_a, "=$B3*D$1");
    assert.ok(devBank.questions.every((x) => ["option_a", "option_b", "option_c", "option_d"].every((k) => !/^#(VALUE|REF|NAME|DIV)/.test(x[k]))));
  });

  test("bank: a battle can be built from the release pool", () => {
    const pool = Q.filterForMode(releaseBank.questions, "release");
    const b = ITE.battle.createBattle(ITE.stages[0], pool, ITE.rng.createRng(1));
    assert.equal(b.deck.length, Math.min(ITE.stages[0].questionCount, pool.length));
  });
})();
