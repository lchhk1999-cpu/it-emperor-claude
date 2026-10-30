(function () {
  const R = ITE.guildRaid;
  // Wed 2026-10-28 10:00 HKT == 02:00 UTC
  const WED = Date.UTC(2026, 9, 28, 2, 0, 0);
  const HOUR = 3600 * 1000;
  const DAY = 24 * HOUR;
  const rules = { ...R.DEFAULT_RAID_RULES, attackSeconds: 120, questionsPerAttack: 12 };
  const pool = ITE.devSampleQuestions;
  const rng = () => ITE.rng.createRng(11);
  const guild = () => R.joinGuild(R.joinGuild(R.createGuild("g1", "虛構測試學會", "阿一"), "阿二"), "阿三");
  const answerAllCorrect = (s, now) => {
    while (!s.finished) s = R.answerAttack(s, s.deck[s.index].answer, now);
    return s;
  };

  test("guildRaid: HKT day and Monday week keys", () => {
    assert.equal(R.hktDayKey(WED), "2026-10-28");
    assert.equal(R.hktWeekKey(WED), "2026-10-26");
    // Sun 23:59 HKT is still the same week; Mon 00:00 HKT starts the next one
    const sunLate = Date.UTC(2026, 10, 1, 15, 59, 0);
    const monStart = Date.UTC(2026, 10, 1, 16, 0, 0);
    assert.equal(R.hktWeekKey(sunLate), "2026-10-26");
    assert.equal(R.hktWeekKey(monStart), "2026-11-02");
    // 23:30 UTC is already the next HKT day
    assert.equal(R.hktDayKey(Date.UTC(2026, 9, 28, 23, 30)), "2026-10-29");
  });

  test("guildRaid: founding a guild under the player's own name", () => {
    const g = R.createGuild("g", "  虛構  學會 ", "阿一");
    assert.equal(g.name, "虛構 學會");
    assert.equal(g.founder, "阿一");
    assert.deepEqual(g.members, ["阿一"]);
    assert.throws(() => R.createGuild("g", " ", "阿一"));
    assert.throws(() => R.createGuild("g", "名".repeat(21), "阿一"));
    assert.equal(R.joinGuild(g, "阿一").members.length, 1, "joining twice is a no-op");
  });

  test("guildRaid: correct answers damage the shared boss; wrong answers do not", () => {
    const g = guild();
    let raid = R.createRaid("g1", WED, rules);
    let s = R.startAttack(raid, g, "阿一", pool, rng(), WED, rules);
    const q = s.deck[0];
    s = R.answerAttack(s, ITE.questions.ANSWERS.find((l) => l !== q.answer), WED);
    assert.equal(s.damage, 0);
    s = R.answerAttack(s, s.deck[1].answer, WED);
    assert.equal(s.damage, ITE.battle.damageFor(1));
    s = answerAllCorrect(s, WED);
    raid = R.recordAttack(raid, s);
    assert.equal(raid.totalDamage, s.damage);
    assert.equal(R.bossHpLeft(raid), rules.bossMaxHp - s.damage);
  });

  test("guildRaid: answers after the time limit are ignored and end the attack", () => {
    let s = R.startAttack(R.createRaid("g1", WED, rules), guild(), "阿一", pool, rng(), WED, rules);
    s = R.answerAttack(s, s.deck[0].answer, WED + 119 * 1000);
    assert.equal(s.correct, 1);
    assert.equal(R.secondsLeft(s, WED + 119 * 1000), 1);
    const late = R.answerAttack(s, s.deck[1].answer, WED + 120 * 1000);
    assert.ok(late.finished);
    assert.equal(late.correct, 1);
    assert.equal(late.damage, s.damage);
    assert.equal(R.answerAttack(late, "A", WED), late, "finished attacks ignore further answers");
  });

  test("guildRaid: each member may attack once per HKT day", () => {
    const g = guild();
    let raid = R.createRaid("g1", WED, rules);
    raid = R.recordAttack(raid, answerAllCorrect(R.startAttack(raid, g, "阿一", pool, rng(), WED, rules), WED));
    assert.equal(R.canAttack(raid, g, "阿一", WED + HOUR).reason, "already_attacked_today");
    assert.throws(() => R.startAttack(raid, g, "阿一", pool, rng(), WED + HOUR, rules));
    assert.ok(R.canAttack(raid, g, "阿二", WED + HOUR).ok, "other members still can");
    assert.ok(R.canAttack(raid, g, "阿一", WED + DAY).ok, "next day is allowed");
    assert.equal(R.canAttack(raid, g, "路人", WED).reason, "not_member");
  });

  test("guildRaid: two parallel sessions on the same day only count once", () => {
    const g = guild();
    let raid = R.createRaid("g1", WED, rules);
    const a = answerAllCorrect(R.startAttack(raid, g, "阿一", pool, rng(), WED, rules), WED);
    const b = answerAllCorrect(R.startAttack(raid, g, "阿一", pool, rng(), WED, rules), WED);
    raid = R.recordAttack(R.recordAttack(raid, a), b);
    assert.equal(raid.attacks.length, 1);
    assert.equal(raid.totalDamage, a.damage);
  });

  test("guildRaid: weekly rollover starts a fresh boss; stale sessions are not recorded", () => {
    const g = guild();
    let raid = R.createRaid("g1", WED, rules);
    const session = answerAllCorrect(R.startAttack(raid, g, "阿一", pool, rng(), WED, rules), WED);
    raid = R.recordAttack(raid, session);
    const nextWeek = WED + 7 * DAY;
    const fresh = R.currentRaid(raid, nextWeek, rules);
    assert.equal(fresh.weekKey, "2026-11-02");
    assert.equal(fresh.totalDamage, 0);
    assert.equal(fresh.guildId, "g1");
    assert.equal(R.currentRaid(raid, WED + HOUR, rules), raid, "same week keeps the raid");
    assert.equal(R.recordAttack(fresh, session), fresh, "last week's session cannot score this week");
    assert.equal(R.canAttack(raid, g, "阿二", nextWeek).reason, "week_over");
  });

  test("guildRaid: overkill damage still counts towards the weekly total", () => {
    const small = { ...rules, bossMaxHp: 100 };
    const g = guild();
    let raid = R.createRaid("g1", WED, small);
    raid = R.recordAttack(raid, answerAllCorrect(R.startAttack(raid, g, "阿一", pool, rng(), WED, small), WED));
    assert.ok(raid.totalDamage > 100);
    assert.equal(R.bossHpLeft(raid), 0);
  });

  test("guildRaid: weekly standings rank by total damage, bigger guilds can win", () => {
    const monday = Date.UTC(2026, 9, 25, 16, 0, 0); // Mon 2026-10-26 00:00 HKT
    const d = ITE.demoGuilds;
    assert.ok(d.label.indexOf("虛構") >= 0);
    d.guilds.forEach((g) => assert.ok(g.name.indexOf("虛構") === 0, "guild name must be marked fictitious: " + g.name));
    const entries = d.guilds.map((g) => {
      const raid = d.sampleAttacks
        .filter(([gid]) => gid === g.id)
        .reduce((acc, [, nickname, dayOffset, damage, correct, answered]) => {
          const dayKey = R.hktDayKey(monday + dayOffset * DAY);
          return R.recordAttack(acc, { nickname, dayKey, weekKey: acc.weekKey, damage, correct, answered });
        }, R.createRaid(g.id, monday));
      return { guild: g, raid };
    });
    const rows = R.weeklyStandings(entries);
    assert.deepEqual(rows.map((r) => r.guildId), ["demo-moon", "demo-sun", "demo-wave"]);
    assert.deepEqual(rows.map((r) => r.totalDamage), [2410, 1750, 900]);
    assert.deepEqual(rows.map((r) => r.rank), [1, 2, 3]);
    assert.equal(rows[0].attackers, 4);
  });

  test("guildRaid: standings ties break on attackers then guild id", () => {
    const mk = (id, attacks) => ({
      guild: { id, name: id, members: attacks.map((a) => a[0]) },
      raid: { weekKey: "w", bossMaxHp: 100, totalDamage: attacks.reduce((s, a) => s + a[1], 0), attacks: attacks.map(([nickname, damage]) => ({ nickname, damage })) },
    });
    const rows = R.weeklyStandings([mk("b", [["x", 100]]), mk("a", [["x", 100]]), mk("c", [["x", 50], ["y", 50]])]);
    assert.deepEqual(rows.map((r) => r.guildId), ["c", "a", "b"]);
  });

  test("guildRaid: week start and time until weekly settlement", () => {
    assert.equal(R.weekStart(WED), Date.UTC(2026, 9, 25, 16, 0, 0)); // Mon 26 Oct 00:00 HKT
    assert.equal(R.msUntilNextWeek(WED), 4 * DAY + 14 * HOUR); // Wed 10:00 -> Mon 00:00
  });

  test("guildRaid: buildRaid keeps only this week's records up to today, once per day", () => {
    const rec = (nickname, dayKey, weekKey, damage) => ({ nickname, dayKey, weekKey, damage, correct: 1, answered: 1 });
    const raid = R.buildRaid("g1", WED, [
      rec("甲", "2026-10-26", "2026-10-26", 100),
      rec("甲", "2026-10-26", "2026-10-26", 999), // duplicate day: ignored
      rec("乙", "2026-10-28", "2026-10-26", 50),
      rec("乙", "2026-10-29", "2026-10-26", 70), // tomorrow: ignored
      rec("丙", "2026-10-20", "2026-10-19", 500), // last week: ignored
    ]);
    assert.equal(raid.totalDamage, 150);
    assert.equal(raid.attacks.length, 2);
  });

  test("guildRaid: demo attacks appear day by day through the week", () => {
    const monday = R.weekStart(WED);
    const mondayIds = R.buildRaid("demo-moon", monday + HOUR, R.demoAttacks(ITE.demoGuilds, "demo-moon", monday + HOUR));
    const wedIds = R.buildRaid("demo-moon", WED, R.demoAttacks(ITE.demoGuilds, "demo-moon", WED));
    assert.equal(mondayIds.totalDamage, 620 + 480);
    assert.equal(wedIds.totalDamage, 2410);
    assert.ok(R.demoAttacks(ITE.demoGuilds, "demo-moon", WED).every((a) => a.weekKey === "2026-10-26"));
  });

  test("guildRaid: attack log keeps every answer for the review screen", () => {
    let s = R.startAttack(R.createRaid("g1", WED, rules), guild(), "阿一", pool, rng(), WED, rules);
    s = R.answerAttack(s, s.deck[0].answer, WED);
    s = R.answerAttack(s, null, WED);
    assert.equal(s.log.length, 2);
    assert.deepEqual(s.log.map((l) => l.correct), [true, false]);
    assert.equal(s.log[0].damage, 50);
    assert.equal(s.log[1].questionId, s.deck[1].question_id);
  });

  test("guildRaid: attack questions have shuffled options", () => {
    const s = R.startAttack(R.createRaid("g1", WED, rules), guild(), "阿一", pool, rng(), WED, rules);
    assert.ok(s.deck.every((q) => ITE.questions.isOptionOrder(q.option_order)));
    assert.ok(s.deck.some((q) => q.option_order.join("") !== "ABCD"));
  });
})();
