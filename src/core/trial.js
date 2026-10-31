// 帝王試煉 (UR 副本, user request 2026-11-01). The UR character 「IT帝」 is
// never in the 抽蛋 pool: players earn its shards here and combine them.
// - Four tiers (user spec): 初級 5 題 → 1 碎片, 中級 15 → 1–3, 高級 30 → 2–4,
//   最難 50 → 3–5. Each tier gives shards once per Hong Kong week (Monday 00:00);
//   a lost battle uses nothing, so players may retry.
// - No stamina: the weekly limit already caps it, and it is all questions.
// - 40 shards combine into the UR; later shards go to its third evolution.
// 魔王限時 (user request 2026-11-01) works the same way for a second UR,
// 「Bug 魔王」, in timed battles: party HP drains every second while a question
// is open (never while reading the explanation), so answer fast. 眼鏡 gives
// drain-free seconds at the start of each question.
// PROTOTYPE numbers (boss attack, HP factor, drain, 40 shards) until playtested.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const TRIAL_RULES = {
    characterId: "CH-ITEMPEROR",
    unlockShards: 40,
    // attack: lower on long tiers so about a quarter of the answers may be wrong.
    tiers: {
      beginner: { name: "初級", questionCount: 5, questions: ["easy"], shards: [1, 1], hpFactor: 0.6, attack: 25 },
      intermediate: { name: "中級", questionCount: 15, questions: ["medium"], shards: [1, 3], hpFactor: 0.7, attack: 20 },
      advanced: { name: "高級", questionCount: 30, questions: ["hard", "medium"], shards: [2, 4], hpFactor: 0.75, attack: 14 },
      master: { name: "最難", questionCount: 50, questions: ["hard"], shards: [3, 5], hpFactor: 0.8, attack: 9 },
    },
    order: ["beginner", "intermediate", "advanced", "master"],
    boss: "IT帝的影子",
    title: "帝王試煉",
    shardName: "IT帝碎片",
  };

  // drainPct: % of the party's max HP lost per second of an open question.
  const DEMON_RULES = {
    characterId: "CH-BUGLORD",
    unlockShards: 40,
    tiers: {
      "demon-easy": { name: "簡單", questionCount: 15, questions: ["easy"], shards: [1, 1], hpFactor: 0.4, attack: 15, drainPct: 0.7 },
      "demon-medium": { name: "中等", questionCount: 20, questions: ["medium"], shards: [1, 3], hpFactor: 0.45, attack: 18, drainPct: 0.8 },
      "demon-hard": { name: "困難", questionCount: 25, questions: ["hard", "medium"], shards: [2, 4], hpFactor: 0.5, attack: 22, drainPct: 0.9 },
      "demon-ultimate": { name: "究極", questionCount: 30, questions: ["hard"], shards: [3, 5], hpFactor: 0.55, attack: 25, drainPct: 1 },
    },
    order: ["demon-easy", "demon-medium", "demon-hard", "demon-ultimate"],
    boss: "Bug 魔王",
    title: "魔王限時",
    shardName: "Bug 魔王碎片",
  };
  const LINES = [TRIAL_RULES, DEMON_RULES];
  const rulesOf = (key) => LINES.find((r) => r.tiers[key]) || null;

  const weekKey = (now) => ITE.guildRaid.hktWeekKey(now);

  function stage(key) {
    const R = rulesOf(key);
    if (!R) return null;
    const t = R.tiers[key];
    const n = t.shards[0] === t.shards[1] ? t.shards[0] : `${t.shards[0]}–${t.shards[1]}`;
    const level = R.order.indexOf(key);
    return {
      id: `trial-${key}`,
      kind: "trial",
      trial: key,
      world: null,
      difficulty: ["easy", "medium", "hard", "ultimate"][level],
      chapter: R.title,
      name: `${R.title}・${t.name}`,
      description: `${t.questionCount} 題｜勝出可得${R.shardName} ${n} 個（每週一次）`,
      questionCount: t.questionCount,
      topicIds: null,
      questionDifficulties: t.questions,
      timed: t.drainPct ? { drainPct: t.drainPct } : null,
      boss: { name: R.boss, maxHp: Math.round((t.questionCount * ITE.battle.BALANCE.baseDamage * t.hpFactor) / 10) * 10, attack: t.attack },
    };
  }

  // Every trial stage of both lines (battles look stages up by id).
  function stages(rules) {
    return (rules ? [rules] : LINES).flatMap((R) => R.order.map(stage));
  }

  // Tiers already rewarded this week.
  function clearedThisWeek(profile, now) {
    const t = profile.trials;
    return t && t.week === weekKey(now) ? t.cleared : [];
  }

  function shardsOf(profile, rules) {
    return (profile.shards && profile.shards[(rules || TRIAL_RULES).characterId]) || 0;
  }

  // After a battle: a win on a tier not yet rewarded this week gives shards.
  // Returns { profile, shards } (shards 0 when nothing was given).
  function claim(profile, key, outcome, now, rng) {
    const R = rulesOf(key);
    if (!R || outcome !== "won" || clearedThisWeek(profile, now).includes(key)) return { profile, shards: 0 };
    const [lo, hi] = R.tiers[key].shards;
    const n = lo + Math.min(hi - lo, Math.floor(rng() * (hi - lo + 1)));
    const id = R.characterId;
    return {
      profile: {
        ...profile,
        shards: { ...(profile.shards || {}), [id]: shardsOf(profile, R) + n },
        trials: { week: weekKey(now), cleared: clearedThisWeek(profile, now).concat([key]) },
      },
      shards: n,
    };
  }

  function canUnlock(profile, rules) {
    const R = rules || TRIAL_RULES;
    return !profile.owned.characters.includes(R.characterId) && shardsOf(profile, R) >= R.unlockShards;
  }

  // Combines 40 shards into the line's UR character. Returns { profile } or { profile, error }.
  function unlock(profile, gameData, rules) {
    const R = rules || TRIAL_RULES;
    const id = R.characterId;
    if (!gameData.characters.some((c) => c.id === id)) return { profile, error: "unknown_character" };
    if (profile.owned.characters.includes(id)) return { profile, error: "owned" };
    if (shardsOf(profile, R) < R.unlockShards) return { profile, error: "not_enough_shards" };
    return {
      profile: {
        ...profile,
        owned: { ...profile.owned, characters: profile.owned.characters.concat([id]) },
        shards: { ...profile.shards, [id]: shardsOf(profile, R) - R.unlockShards },
      },
    };
  }

  // ---------- 魔王限時: HP drain ----------
  // Drain-free seconds at the start of each question: the best 眼鏡 in the loadout.
  function graceSeconds(state) {
    return Math.max(0, ...(state.loadout || []).filter((x) => x.type === "time").map((x) => x.seconds || 0));
  }

  // Advances a timed battle by dtMs of real time. Only an open question drains;
  // a new question restarts its grace period. Returns the state unchanged for
  // untimed battles or other phases; party HP 0 ends the battle as lost.
  function tick(state, dtMs) {
    if (!state.timed || state.phase !== "question" || !(dtMs > 0)) return state;
    const t = state.timed;
    const prev = t.qIndex === state.index ? t.qElapsed : 0;
    const grace = graceSeconds(state) * 1000;
    const drainMs = Math.max(0, prev + dtMs - grace) - Math.max(0, prev - grace);
    const loss = (state.party.maxHp * t.drainPct * drainMs) / 100000;
    const hp = Math.max(0, Math.round((state.party.hp - loss) * 100) / 100);
    const timed = { ...t, qIndex: state.index, qElapsed: prev + dtMs, drained: Math.round(((t.drained || 0) + loss) * 100) / 100 };
    if (hp > 0) return { ...state, timed, party: { ...state.party, hp } };
    return { ...state, timed, party: { ...state.party, hp: 0 }, phase: "lost", outcome: "lost" };
  }

  // Seconds of drain-free time left on the open question (for the screen).
  function graceLeft(state) {
    if (!state.timed) return 0;
    const used = state.timed.qIndex === state.index ? state.timed.qElapsed : 0;
    return Math.max(0, Math.ceil((graceSeconds(state) * 1000 - used) / 1000));
  }

  ITE.trial = { TRIAL_RULES, DEMON_RULES, rulesOf, stage, stages, clearedThisWeek, shardsOf, claim, canUnlock, unlock, graceSeconds, tick, graceLeft };
})(globalThis);
