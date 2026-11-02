// 錯題本: wrong answers are kept, chosen and revisited; two right in a row masters one.
(function () {
  const M = ITE.mistakes;
  const fresh = () => ITE.profile.defaultProfile(ITE.gameData);
  const T = Date.UTC(2026, 10, 3, 2); // 10:00 HKT
  const q = (id, topic) => ({ question_id: id, topic_id: topic || "SQL", stem: id, option_a: "a", option_b: "b", option_c: "c", option_d: "d", answer: "A", explanation: "e", review_status: "approved" });

  test("mistakes: wrong answers are kept once per question with a count; newest first or most wrong first", () => {
    let p = M.recordWrong(fresh(), q("Q1"), T);
    p = M.recordWrong(p, q("Q2", "HARDWARE"), T + 1000);
    p = M.recordWrong(p, q("Q1"), T + 2000);
    const pool = [q("Q1"), q("Q2", "HARDWARE")];
    assert.deepEqual(M.list(p, pool).map((e) => [e.id, e.wrong]), [["Q1", 2], ["Q2", 1]]);
    p = M.recordWrong(p, q("Q2", "HARDWARE"), T + 3000);
    assert.deepEqual(M.list(p, pool, { sort: "recent" }).map((e) => e.id), ["Q2", "Q1"]);
    p = M.recordWrong(p, q("Q2", "HARDWARE"), T + 4000);
    assert.deepEqual(M.list(p, pool, { sort: "most" }).map((e) => e.id), ["Q2", "Q1"]);
    assert.deepEqual(M.list(p, pool, { world: "B" }).map((e) => e.id), ["Q2"], "HARDWARE is world B");
    assert.deepEqual(M.list(p, pool, { world: "A" }).map((e) => e.id), ["Q1"], "SQL is world A");
    // A question the build no longer has is not listed.
    assert.equal(M.list(p, [q("Q1")]).length, 1);
    assert.equal(M.worldOf({ topic_id: "story_C" }), "C");
  });

  test("mistakes: two right answers in a row master a question; a wrong one starts again", () => {
    let p = M.recordWrong(fresh(), q("Q1"), T);
    let r = M.reviewAnswer(p, "Q1", true, T + 1);
    assert.deepEqual([r.exp, r.mastered, r.profile.mistakes.items.Q1.streak], [M.MISTAKE_RULES.fixExp, false, 1]);
    r = M.reviewAnswer(r.profile, "Q1", false, T + 2);
    assert.deepEqual([r.profile.mistakes.items.Q1.streak, r.profile.mistakes.items.Q1.wrong], [0, 2]);
    r = M.reviewAnswer(r.profile, "Q1", true, T + 3);
    assert.equal(r.exp, 0, "only the first fix pays");
    r = M.reviewAnswer(r.profile, "Q1", true, T + 4);
    assert.ok(r.mastered);
    assert.equal(r.profile.mistakes.items.Q1, undefined);
    assert.equal(r.profile.mistakes.mastered, 1);
    // Wrong again later: back in the book.
    p = M.recordWrong(r.profile, q("Q1"), T + 5);
    assert.equal(p.mistakes.items.Q1.wrong, 1);
  });

  test("mistakes: first-fix EXP is capped at 50 a Hong Kong day; removing by hand works", () => {
    let p = fresh();
    for (let i = 0; i < 8; i++) p = M.recordWrong(p, q(`Q${i}`), T);
    let total = 0;
    for (let i = 0; i < 8; i++) {
      const r = M.reviewAnswer(p, `Q${i}`, true, T + 10 + i);
      total += r.exp;
      p = r.profile;
    }
    assert.equal(total, M.MISTAKE_RULES.dailyExpCap);
    const next = M.recordWrong(p, q("Q9"), T + 100);
    assert.equal(M.reviewAnswer(next, "Q9", true, Date.UTC(2026, 10, 3, 16, 1)).exp, 10, "new HKT day");
    p = M.remove(p, "Q0");
    assert.equal(p.mistakes.items.Q0, undefined);
  });

  test("mistakes: only the latest 300 are kept; the book survives save/load and bad entries are dropped", () => {
    let p = fresh();
    for (let i = 0; i < 305; i++) p = M.recordWrong(p, q(`Q${i}`), T + i);
    assert.equal(Object.keys(p.mistakes.items).length, 300);
    assert.equal(p.mistakes.items.Q0, undefined, "oldest dropped");
    const S = ITE.save;
    const store = S.createMemoryStorage();
    p = M.reviewAnswer(p, "Q300", true, T + 999).profile;
    S.persist(store, { ...S.defaultSave(), profile: p });
    assert.equal(S.load(store).status, "ok");
    assert.deepEqual(S.load(store).save.profile.mistakes, p.mistakes);
    store.setItem(S.SAVE_KEY, JSON.stringify({ ...S.defaultSave(), profile: { ...p, mistakes: { items: { "bad id!": { wrong: 1, lastWrong: 5 }, Q1: { wrong: 0, lastWrong: 5 }, Q2: { wrong: 2, lastWrong: 9, streak: 7 } } } } }));
    assert.deepEqual(S.load(store).save.profile.mistakes.items, { Q2: { wrong: 2, lastWrong: 9, streak: 1 } });
  });
})();
