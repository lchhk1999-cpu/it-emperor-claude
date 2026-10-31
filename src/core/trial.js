// 帝王試煉 (UR 副本, user request 2026-11-01). The UR character 「IT帝」 is
// never in the 抽蛋 pool: players earn its shards here and combine them.
// - Four tiers (user spec): 初級 5 題 → 1 碎片, 中級 15 → 1–3, 高級 30 → 2–4,
//   最難 50 → 3–5. Each tier gives shards once per Hong Kong week (Monday 00:00);
//   a lost battle uses nothing, so players may retry.
// - No stamina: the weekly limit already caps it, and it is all questions.
// - 40 shards combine into the UR; later shards go to its third evolution.
// PROTOTYPE numbers (boss attack, HP factor, 40 shards) until playtested.
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
  };

  const weekKey = (now) => ITE.guildRaid.hktWeekKey(now);

  function stage(key) {
    const t = TRIAL_RULES.tiers[key];
    if (!t) return null;
    return {
      id: `trial-${key}`,
      kind: "trial",
      trial: key,
      world: null,
      difficulty: key === "master" ? "ultimate" : key === "advanced" ? "hard" : key === "intermediate" ? "medium" : "easy",
      chapter: "帝王試煉",
      name: `帝王試煉・${t.name}`,
      description: `${t.questionCount} 題｜勝出可得 IT帝碎片 ${t.shards[0] === t.shards[1] ? t.shards[0] : `${t.shards[0]}–${t.shards[1]}`} 個（每週一次）`,
      questionCount: t.questionCount,
      topicIds: null,
      questionDifficulties: t.questions,
      boss: { name: TRIAL_RULES.boss, maxHp: Math.round((t.questionCount * ITE.battle.BALANCE.baseDamage * t.hpFactor) / 10) * 10, attack: t.attack },
    };
  }

  function stages() {
    return TRIAL_RULES.order.map(stage);
  }

  // Tiers already rewarded this week.
  function clearedThisWeek(profile, now) {
    const t = profile.trials;
    return t && t.week === weekKey(now) ? t.cleared : [];
  }

  function shardsOf(profile) {
    return (profile.shards && profile.shards[TRIAL_RULES.characterId]) || 0;
  }

  // After a battle: a win on a tier not yet rewarded this week gives shards.
  // Returns { profile, shards } (shards 0 when nothing was given).
  function claim(profile, key, outcome, now, rng) {
    const t = TRIAL_RULES.tiers[key];
    if (!t || outcome !== "won" || clearedThisWeek(profile, now).includes(key)) return { profile, shards: 0 };
    const [lo, hi] = t.shards;
    const n = lo + Math.min(hi - lo, Math.floor(rng() * (hi - lo + 1)));
    const id = TRIAL_RULES.characterId;
    return {
      profile: {
        ...profile,
        shards: { ...(profile.shards || {}), [id]: shardsOf(profile) + n },
        trials: { week: weekKey(now), cleared: clearedThisWeek(profile, now).concat([key]) },
      },
      shards: n,
    };
  }

  function canUnlock(profile) {
    return !profile.owned.characters.includes(TRIAL_RULES.characterId) && shardsOf(profile) >= TRIAL_RULES.unlockShards;
  }

  // Combines 40 shards into the UR character. Returns { profile } or { profile, error }.
  function unlock(profile, gameData) {
    const id = TRIAL_RULES.characterId;
    if (!gameData.characters.some((c) => c.id === id)) return { profile, error: "unknown_character" };
    if (profile.owned.characters.includes(id)) return { profile, error: "owned" };
    if (shardsOf(profile) < TRIAL_RULES.unlockShards) return { profile, error: "not_enough_shards" };
    return {
      profile: {
        ...profile,
        owned: { ...profile.owned, characters: profile.owned.characters.concat([id]) },
        shards: { ...profile.shards, [id]: shardsOf(profile) - TRIAL_RULES.unlockShards },
      },
    };
  }

  ITE.trial = { TRIAL_RULES, stage, stages, clearedThisWeek, shardsOf, claim, canUnlock, unlock };
})(globalThis);
