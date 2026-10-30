// Guild raid (公會副本), rules confirmed by the user 2026-10-30 — see
// docs/07_SCHOOL_GUILD_BATTLE.md. Numbers in DEFAULT_RAID_RULES are PLACEHOLDERS.
//
// - Players found guilds under their own name; members share one weekly boss.
// - Each member may attack once per HKT day; an attack is a timed run where
//   every correct answer deals damage to the shared boss HP.
// - Weekly standings rank guilds by total damage (more members = more damage,
//   by design).
//
// Everything here is client-side. Anti-cheat is deliberately light (user, 2026-10-30:
// rankings are for encouragement); sharing a guild across phones still needs a backend.
// All time-dependent functions take `now` (ms since epoch) for testability.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const DEFAULT_RAID_RULES = {
    bossName: "公會 Boss：超級 Bug 巨獸",
    bossMaxHp: 50000,
    attackSeconds: 120,
    questionsPerAttack: 30, // deck size; the attack also ends if it runs out
  };

  const HKT_OFFSET_MS = 8 * 60 * 60 * 1000; // Asia/Hong_Kong, no DST
  const DAY_MS = 24 * 60 * 60 * 1000;

  function hktDayKey(now) {
    return new Date(now + HKT_OFFSET_MS).toISOString().slice(0, 10);
  }

  // Weeks start Monday 00:00 HKT; the key is that Monday's date.
  function hktWeekKey(now) {
    const shifted = now + HKT_OFFSET_MS;
    const daysSinceMonday = (new Date(shifted).getUTCDay() + 6) % 7;
    return new Date(shifted - daysSinceMonday * DAY_MS).toISOString().slice(0, 10);
  }

  function cleanName(s) {
    return String(s ?? "").trim().replace(/\s+/g, " ");
  }

  function createGuild(id, name, founderNickname) {
    const guildName = cleanName(name);
    const founder = cleanName(founderNickname);
    if (!guildName) throw new Error("guild name is empty");
    if (guildName.length > 20) throw new Error("guild name is longer than 20 characters");
    if (!founder) throw new Error("founder nickname is empty");
    return { id, name: guildName, founder, members: [founder] };
  }

  function joinGuild(guild, nickname) {
    const n = cleanName(nickname);
    if (!n) throw new Error("nickname is empty");
    if (guild.members.includes(n)) return guild;
    return { ...guild, members: guild.members.concat([n]) };
  }

  function createRaid(guildId, now, rules) {
    const r = rules || DEFAULT_RAID_RULES;
    return { guildId, weekKey: hktWeekKey(now), bossName: r.bossName, bossMaxHp: r.bossMaxHp, totalDamage: 0, attacks: [] };
  }

  // Returns this week's raid, starting a fresh one when the week has rolled over.
  function currentRaid(raid, now, rules) {
    return raid && raid.weekKey === hktWeekKey(now) ? raid : createRaid(raid ? raid.guildId : null, now, rules);
  }

  function bossHpLeft(raid) {
    return Math.max(0, raid.bossMaxHp - raid.totalDamage);
  }

  function canAttack(raid, guild, nickname, now) {
    const n = cleanName(nickname);
    if (!guild.members.includes(n)) return { ok: false, reason: "not_member" };
    if (raid.weekKey !== hktWeekKey(now)) return { ok: false, reason: "week_over" };
    const today = hktDayKey(now);
    if (raid.attacks.some((a) => a.nickname === n && a.dayKey === today)) return { ok: false, reason: "already_attacked_today" };
    return { ok: true, reason: null };
  }

  function startAttack(raid, guild, nickname, questions, rng, now, rules) {
    const r = rules || DEFAULT_RAID_RULES;
    const check = canAttack(raid, guild, nickname, now);
    if (!check.ok) throw new Error(`cannot attack: ${check.reason}`);
    const deck = ITE.questions
      .drawQuestions(questions, r.questionsPerAttack, rng)
      .map((q) => ITE.questions.shuffleOptions(q, rng));
    if (!deck.length) throw new Error("no questions available");
    return {
      nickname: cleanName(nickname),
      dayKey: hktDayKey(now),
      weekKey: raid.weekKey,
      endsAt: now + r.attackSeconds * 1000,
      deck,
      index: 0,
      combo: 0,
      damage: 0,
      correct: 0,
      answered: 0,
      finished: false,
      log: [],
    };
  }

  function secondsLeft(session, now) {
    return Math.max(0, Math.ceil((session.endsAt - now) / 1000));
  }

  // Answers after the time limit are ignored and end the attack. Damage per
  // correct answer reuses the single-player formula (placeholder balance).
  function answerAttack(session, choice, now) {
    if (session.finished) return session;
    if (now >= session.endsAt) return { ...session, finished: true };
    const q = session.deck[session.index];
    const correct = choice === q.answer;
    const combo = correct ? session.combo + 1 : 0;
    const dealt = correct ? ITE.battle.damageFor(combo) : 0;
    const lastResult = { questionId: q.question_id, choice, correct, damage: dealt };
    const next = {
      ...session,
      combo,
      damage: session.damage + dealt,
      correct: session.correct + (correct ? 1 : 0),
      answered: session.answered + 1,
      index: session.index + 1,
      lastResult,
      log: (session.log || []).concat([lastResult]),
    };
    if (next.index >= next.deck.length) next.finished = true;
    return next;
  }

  // Records a finished attack. Re-checks the daily limit so a second session
  // started in parallel cannot count twice. Overkill damage still counts
  // towards the weekly total (OPEN_DECISION #2).
  function recordAttack(raid, session) {
    if (session.weekKey !== raid.weekKey) return raid; // week rolled over mid-attack
    if (raid.attacks.some((a) => a.nickname === session.nickname && a.dayKey === session.dayKey)) return raid;
    const attack = {
      nickname: session.nickname,
      dayKey: session.dayKey,
      weekKey: session.weekKey,
      damage: session.damage,
      correct: session.correct,
      answered: session.answered,
    };
    return { ...raid, totalDamage: raid.totalDamage + session.damage, attacks: raid.attacks.concat([attack]) };
  }

  // Monday 00:00 HKT of the week containing `now`, as ms since epoch.
  function weekStart(now) {
    return Date.parse(hktWeekKey(now) + "T00:00:00Z") - HKT_OFFSET_MS;
  }

  function msUntilNextWeek(now) {
    return weekStart(now) + 7 * DAY_MS - now;
  }

  // Rebuilds this week's raid from stored attack records (any order, any week).
  // Records from other weeks or from later days are ignored.
  function buildRaid(guildId, now, attackRecords, rules) {
    const today = hktDayKey(now);
    return (attackRecords || [])
      .filter((a) => a && a.dayKey <= today)
      .reduce((raid, a) => recordAttack(raid, a), createRaid(guildId, now, rules));
  }

  // The fictitious demo attacks that have "happened" so far this week.
  function demoAttacks(demo, guildId, now) {
    const monday = weekStart(now);
    const weekKey = hktWeekKey(now);
    return demo.sampleAttacks
      .filter(([gid]) => gid === guildId)
      .map(([, nickname, dayOffset, damage, correct, answered]) => ({
        nickname,
        dayKey: hktDayKey(monday + dayOffset * DAY_MS),
        weekKey,
        damage,
        correct,
        answered,
      }));
  }

  // Weekly standings: total damage desc; ties -> more attackers, then guild id.
  function weeklyStandings(entries) {
    const rows = entries.map(({ guild, raid }) => ({
      guildId: guild.id,
      name: guild.name,
      members: guild.members.length,
      totalDamage: raid.totalDamage,
      attackers: new Set(raid.attacks.map((a) => a.nickname)).size,
      bossDefeated: bossHpLeft(raid) === 0,
    }));
    rows.sort((a, b) => b.totalDamage - a.totalDamage || b.attackers - a.attackers || (a.guildId < b.guildId ? -1 : a.guildId > b.guildId ? 1 : 0));
    return rows.map((row, i) => ({ ...row, rank: i + 1 }));
  }

  ITE.guildRaid = {
    DEFAULT_RAID_RULES,
    hktDayKey,
    hktWeekKey,
    createGuild,
    joinGuild,
    createRaid,
    currentRaid,
    bossHpLeft,
    canAttack,
    startAttack,
    secondsLeft,
    answerAttack,
    recordAttack,
    weekStart,
    msUntilNextWeek,
    buildRaid,
    demoAttacks,
    weeklyStandings,
  };
})(globalThis);
