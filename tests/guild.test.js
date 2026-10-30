(function () {
  const G = ITE.guild;
  const res = (correct, answered, used) => ({ total: 10, correct, answered, secondsUsed: used, secondsLimit: 300 });

  test("guild: individual score weights accuracy over speed", () => {
    const accurateSlow = G.individualScore(res(10, 10, 299));
    const sloppyFast = G.individualScore(res(5, 10, 0));
    assert.ok(accurateSlow > sloppyFast, "accurate-but-slow must beat fast-but-wrong");
    assert.equal(G.individualScore(res(10, 10, 0)), 100);
  });

  test("guild: invalid or empty results score 0, never NaN", () => {
    assert.equal(G.individualScore(null), 0);
    assert.equal(G.individualScore({ total: 0, correct: 0, answered: 0 }), 0);
    assert.equal(G.individualScore({ total: 10, correct: 5, answered: 10, secondsUsed: 1, secondsLimit: 0 }), 60);
  });

  test("guild: school score uses only top N, so headcount adds nothing", () => {
    const base = [90, 80, 70, 60, 50];
    const padded = base.concat([10, 10, 10, 10, 10, 10]);
    assert.equal(G.schoolScore(base).score, 70);
    assert.equal(G.schoolScore(padded).score, 70);
    assert.equal(G.schoolScore(padded).counted, 5);
  });

  test("guild: schools under minParticipants are unranked", () => {
    const r = G.schoolScore([100, 100]);
    assert.equal(r.eligible, false);
    assert.equal(r.participants, 2);
  });

  test("guild: standings rank eligible schools first with deterministic ties", () => {
    const mk = (id, scores) => ({ id, name: id, members: scores.map((c, i) => ({ nickname: "n" + i, result: res(c, 10, 150) })) });
    const rows = G.standings([mk("b", [8, 8, 8]), mk("a", [8, 8, 8]), mk("tiny", [10, 10]), mk("top", [10, 9, 9])]);
    assert.deepEqual(rows.map((r) => r.id), ["top", "a", "b", "tiny"]);
    assert.deepEqual(rows.map((r) => r.rank), [1, 2, 3, null]);
  });

  test("guild: demo data is fictitious-labelled and standings run on it", () => {
    const d = ITE.demoGuilds;
    assert.ok(d.label.indexOf("虛構") >= 0);
    d.schools.forEach((s) => assert.ok(s.name.indexOf("虛構") === 0, "school name must be marked fictitious: " + s.name));
    const rows = G.standings(d.schools);
    assert.equal(rows.length, 3);
    assert.equal(rows[0].id, "demo-sun");
    assert.equal(rows[2].eligible, false);
  });
})();
