// Balance 2026-11-01 (user 「套用建議數值」): bosses grow with the team, 帝王試煉
// shards need an answer rate, equipment has SSR pity 50.
(function () {
  const data = ITE.gameData;
  const P = ITE.profile, B = ITE.battle, T = ITE.trial, G = ITE.gacha;
  const rngOf = (seed) => ITE.rng.createRng(seed);
  const pool = ["easy", "medium", "hard"].flatMap((d) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => ({ question_id: `Q-${d}-${i}`, topic_id: ITE.dungeons.WORLDS[0].topics[0], difficulty: d, stem: "Q", option_a: "a", option_b: "b", option_c: "c", option_d: "d", answer: "A", explanation: "e", review_status: "approved" })));
  const teamOf = (ids, level, evo) => {
    const growth = { characters: Object.fromEntries(ids.map((id) => [id, { level, evo }])) };
    return P.teamSnapshot({ ...P.defaultProfile(data), team: ids, growth }, data);
  };
  const five = ["CH-ITDOG", "CH-DB", "CH-OFFICE", "CH-HACK", "CH-BROADBAND"];

  test("balance: DSE / limited / trial bosses grow with the team; story bosses and weak teams do not", () => {
    const st = ITE.dungeons.worldStages(ITE.dungeons.WORLDS[0]).find((s) => s.difficulty === "ultimate");
    const strong = teamOf(five, 40, 3);
    const t = P.teamStats(strong);
    const s = B.createBattle(st, pool, rngOf(1), strong, []);
    const f = (v) => Math.pow(v / 100, B.BALANCE.bossScaleExp);
    assert.equal(s.boss.maxHp, Math.round((st.boss.maxHp * f(t.attack)) / 10) * 10);
    assert.equal(s.boss.attack, Math.round(st.boss.attack * f(t.hp)));
    assert.ok(s.boss.maxHp > st.boss.maxHp * 2);
    // A new player's lone IT狗 (attack 95, HP 105): never below the stage's
    // numbers, and hardly above.
    const weak = B.createBattle(st, pool, rngOf(1), teamOf(["CH-ITDOG"], 1, 0), []);
    assert.equal(weak.boss.maxHp, st.boss.maxHp);
    assert.ok(weak.boss.attack >= st.boss.attack && weak.boss.attack <= st.boss.attack + 1);
    const trial = B.createBattle(T.stage("master"), pool, rngOf(1), strong, []);
    assert.ok(trial.boss.maxHp > T.stage("master").boss.maxHp);
    const story = { ...ITE.stages[0], topicIds: null };
    assert.equal(B.createBattle(story, pool, rngOf(1), strong, []).boss.maxHp, story.boss.maxHp);
  });

  test("balance: 帝王試煉 shards need 60/70/75/80% correct; the week's claim stays open", () => {
    assert.deepEqual(T.TRIAL_RULES.order.map((k) => T.TRIAL_RULES.tiers[k].minAccuracy), [60, 70, 75, 80]);
    const p = P.defaultProfile(data);
    const now = Date.UTC(2026, 10, 2, 4);
    const low = T.claim(p, "master", "won", now, () => 0, 79);
    assert.deepEqual([low.shards, low.belowAccuracy], [0, 80]);
    assert.ok(!T.clearedThisWeek(low.profile, now).includes("master"));
    const ok = T.claim(low.profile, "master", "won", now, () => 0, 80);
    assert.equal(ok.shards, 3);
    // 魔王限時 has no answer-rate line.
    assert.equal(T.claim(p, "demon-easy", "won", now, () => 0, 10).shards, 1);
  });

  test("balance: equipment box has SSR pity 50 with its own counter", () => {
    assert.equal(G.pityThreshold(data, "equipment"), 50);
    let p = { ...P.defaultProfile(data), gems: 1000, pity: { character: 3, equipment: 49 } };
    assert.equal(G.drawsUntilPity(p, data, "equipment"), 1);
    const rolled = G.rollBoxes(p, "equipment", data, rngOf(5));
    assert.ok(rolled.pity && rolled.boxes.every((b) => b.rarity === "SSR"));
    p = G.openBox(p, rolled, 0, data).profile;
    assert.deepEqual(p.pity, { character: 3, equipment: 0 });
    const r = G.draw(p, "equipment", data, () => 0).profile;
    assert.deepEqual(r.pity, { character: 3, equipment: 1 });
  });
})();
