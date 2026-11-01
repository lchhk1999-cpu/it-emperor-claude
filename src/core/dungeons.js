// DSE 題庫挑戰 stages (P5-02, user request 2026-10-31).
// - Five worlds follow the DSE ICT compulsory parts A–E; each has four
//   difficulties (簡單／中等／困難／究極). Clearing one drops that world's
//   evolution materials; harder stages drop more.
// - Mixed practice (src/data/stages.js) stays free and drops nothing.
// - One limited stage a day, from the workbook Events/Stages sheets (a weekly
//   rotation); it drops many of its material.
// PROTOTYPE numbers: question counts, boss HP/attack and drop amounts are
// placeholders until playtested. Boss HP comes from the damage formula
// (ITE.battle BALANCE) so a stage can be cleared with some wrong answers;
// the workbook boss_hp values do not fit that formula and are not used.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const WORLDS = [
    // boss: the world's monster (art in src/ui/monsters.js).
    { id: "A", name: "資訊處理", topics: ["INFO_PROCESS", "DATA_REP", "EXCEL", "EXCEL_CHART", "DATABASE", "SQL", "MULTIMEDIA"], materials: ["MAT-EXCEL", "MAT-SQL"], boss: "表格史萊姆" },
    { id: "B", name: "電腦系統基礎", topics: ["HARDWARE", "IO", "OS"], materials: ["MAT-HW"], boss: "過熱 CPU 蟹" },
    { id: "C", name: "互聯網及其應用", topics: ["NET_DEVICE", "NET_CONCEPT", "SECURITY", "WEB"], materials: ["MAT-NET", "MAT-SEC"], boss: "釣魚魚" },
    { id: "D", name: "計算思維及程式編寫", topics: ["PY_BASIC", "PY_ADV"], materials: ["MAT-PY"], boss: "無限迴圈蛇" },
    { id: "E", name: "資訊科技的社會影響", topics: ["SOCIAL"], materials: ["MAT-EXP"], boss: "假新聞鸚鵡" },
  ];

  // questions: preferred question difficulties (others fill in when a world has too few).
  // hpFactor: boss HP = questionCount x baseDamage x hpFactor.
  // winCoins and rareChance (chance of one more 傳說核心) from the balance
  // approved 2026-10-31 (docs/BALANCE_REPORT.md).
  const DIFFICULTIES = {
    easy: { name: "簡單", questionCount: 5, questions: ["easy"], hpFactor: 0.6, attack: 15, drops: 1, rare: 0, rareChance: 0, winCoins: 20 },
    medium: { name: "中等", questionCount: 8, questions: ["medium"], hpFactor: 0.7, attack: 20, drops: 2, rare: 0, rareChance: 0.08, winCoins: 35 },
    hard: { name: "困難", questionCount: 10, questions: ["hard"], hpFactor: 0.8, attack: 25, drops: 3, rare: 0, rareChance: 0.25, winCoins: 50 },
    // 究極 傳說核心: was always 1; 50% since balance 2026-11-01 (hoarding).
    ultimate: { name: "究極", questionCount: 15, questions: ["hard", "medium"], hpFactor: 0.85, attack: 30, drops: 4, rare: 0, rareChance: 0.5, winCoins: 70 },
  };
  const DIFFICULTY_ORDER = ["easy", "medium", "hard", "ultimate"];
  // Limited stages drop many of one material (fewer when it is rarer).
  const LIMITED_DROPS = { common: 5, rare: 3, legendary: 2 };
  const RARE_MATERIAL = "MAT-RARE";

  function bossHp(questionCount, hpFactor) {
    return Math.round((questionCount * ITE.battle.BALANCE.baseDamage * hpFactor) / 10) * 10;
  }

  function worldStage(world, key) {
    const d = DIFFICULTIES[key];
    return {
      id: `dse-${world.id}-${key}`,
      kind: "world",
      world: world.id,
      difficulty: key,
      chapter: `${world.id}｜${world.name}`,
      name: `${world.name}・${d.name}`,
      description: `${d.questionCount} 題｜課題 ${world.id}`,
      questionCount: d.questionCount,
      topicIds: world.topics,
      questionDifficulties: d.questions,
      boss: { name: world.boss, maxHp: bossHp(d.questionCount, d.hpFactor), attack: d.attack },
      drops: { pick: world.materials, count: d.drops, extra: d.rare ? { [RARE_MATERIAL]: d.rare } : {}, chance: d.rareChance ? { [RARE_MATERIAL]: d.rareChance } : {} },
    };
  }

  // 今日限定 themes by HKT weekday (user 2026-11-01: each day should feel
  // different and worth playing — Saturday lots of coins, Sunday lots of
  // experience, other days materials). The workbook Events/Stages give each
  // day's questions; these set the look and the reward. PROTOTYPE balance:
  // weekday material days give 5 of one material for 5–6 stamina; Friday adds
  // the rarer 防火牆核心; Saturday +250 coins (≈4× an 究極 win); Sunday +400
  // experience and a 傳說核心.
  const LIMITED_THEMES = {
    1: { icon: "🐍", name: "Python 素材日", color: "#a7d8a0", drops: { "MAT-PY": 5 } },
    2: { icon: "📊", name: "Excel 素材日", color: "#9fd4b4", drops: { "MAT-EXCEL": 5 } },
    3: { icon: "🗄", name: "SQL 素材日", color: "#8fc7f0", drops: { "MAT-SQL": 5 } },
    4: { icon: "🔧", name: "硬件素材日", color: "#c9ced8", drops: { "MAT-HW": 5 } },
    5: { icon: "🛡", name: "網絡保安日", color: "#c4b0e0", drops: { "MAT-NET": 4, "MAT-SEC": 2 } },
    6: { icon: "🪙", name: "週六金幣狂歡", color: "#f4d36b", drops: {}, bonus: { coins: 250 } },
    7: { icon: "⭐", name: "週日經驗狂歡", color: "#f4a3b8", drops: { "MAT-RARE": 1 }, bonus: { exp: 400 } },
  };
  const DAY_NAMES = ["", "一", "二", "三", "四", "五", "六", "日"];

  const weekdayOf = (now) => ((new Date(now + 8 * 3600 * 1000).getUTCDay() + 6) % 7) + 1; // 1 = Monday

  // What a theme gives, in words.
  function themeReward(theme, gameData) {
    const name = (id) => ((gameData.materials || []).find((m) => m.id === id) || { name: id }).name;
    const parts = Object.entries(theme.drops || {}).map(([id, n]) => `${name(id)} ×${n}`);
    if (theme.bonus && theme.bonus.coins) parts.unshift(`金幣 +${theme.bonus.coins}`);
    if (theme.bonus && theme.bonus.exp) parts.unshift(`經驗 +${theme.bonus.exp}`);
    return parts.join("、");
  }

  // The 7-day plan for the calendar strip: [{ weekday, day, icon, name, color, reward, today }].
  function weekPlan(gameData, now) {
    const today = weekdayOf(now);
    return [1, 2, 3, 4, 5, 6, 7].map((w) => {
      const t = LIMITED_THEMES[w];
      return { weekday: w, day: DAY_NAMES[w], icon: t.icon, name: t.name, color: t.color, reward: themeReward(t, gameData), today: w === today };
    });
  }

  // Today's limited stage (HKT weekday), or null when the workbook has none.
  function limitedStage(gameData, now) {
    const weekday = weekdayOf(now);
    const event = (gameData.events || []).find((e) => e.weekday === weekday);
    const st = event && (gameData.eventStages || []).find((s) => s.id === event.stage);
    const material = st && (gameData.materials || []).find((m) => m.id === st.material);
    if (!material) return null;
    const d = DIFFICULTIES[st.difficulty];
    const world = worldOfTopic(st.topic);
    const theme = LIMITED_THEMES[weekday];
    return {
      id: `limited-${event.id}`,
      kind: "limited",
      world: world ? world.id : null,
      difficulty: st.difficulty,
      chapter: `今日限定｜${theme.name}`,
      name: st.title,
      description: `${st.questionCount} 題｜勝出可得 ${themeReward(theme, gameData)}`,
      questionCount: st.questionCount,
      topicIds: st.topic === "ALL" ? null : [st.topic],
      questionDifficulties: d.questions,
      staminaCost: st.stamina || 0,
      boss: { name: world ? world.boss : "Bug 王", maxHp: bossHp(st.questionCount, d.hpFactor), attack: d.attack },
      drops: { pick: [], count: 0, extra: { ...theme.drops } },
      theme: { weekday, icon: theme.icon, name: theme.name, color: theme.color, bonus: theme.bonus || {} },
    };
  }

  // 今日限定 reward limit (user 2026-11-01): three rewarded wins per Hong Kong
  // day; after that the stage is free play — no stamina, no rewards.
  const LIMITED_RULES = { dailyRewards: 3 };

  function limitedWinsToday(profile, now) {
    const l = profile.limited;
    return l && l.day === ITE.guildRaid.hktDayKey(now) ? l.wins : 0;
  }

  const limitedRewardsLeft = (profile, now) => Math.max(0, LIMITED_RULES.dailyRewards - limitedWinsToday(profile, now));

  // Counts one rewarded win today.
  function claimLimited(profile, now) {
    return { ...profile, limited: { day: ITE.guildRaid.hktDayKey(now), wins: limitedWinsToday(profile, now) + 1 } };
  }

  // The world a question topic belongs to, or null (e.g. "ALL").
  function worldOfTopic(topic) {
    return WORLDS.find((w) => w.topics.includes(topic)) || null;
  }

  function worldStages() {
    return WORLDS.flatMap((w) => DIFFICULTY_ORDER.map((key) => worldStage(w, key)));
  }

  // Every playable DSE stage: the mixed practice stage(s), the world stages and today's limited stage.
  function allStages(gameData, now) {
    const limited = limitedStage(gameData, now);
    return (ITE.stages || []).concat(worldStages(), limited ? [limited] : [], ITE.trial ? ITE.trial.stages() : []);
  }

  // Questions a stage draws from: matching topics, preferred difficulties first;
  // when there are not enough, other difficulties of the same topics fill in.
  // Returns exactly questionCount questions when possible.
  function stagePool(stage, questions, rng) {
    const inTopic = stage.topicIds ? questions.filter((q) => stage.topicIds.includes(q.topic_id)) : questions.slice();
    if (!stage.questionDifficulties) return inTopic;
    const preferred = inTopic.filter((q) => stage.questionDifficulties.includes(q.difficulty));
    if (preferred.length >= stage.questionCount) return preferred;
    const others = ITE.rng.shuffle(inTopic.filter((q) => !stage.questionDifficulties.includes(q.difficulty)), rng);
    return preferred.concat(others.slice(0, stage.questionCount - preferred.length));
  }

  // Experience and coins for a finished DSE battle: coins by stage difficulty;
  // stages without one (mixed practice) use the flat profile rule.
  function rewards(stage, summary) {
    const base = ITE.profile.dseRewards(summary);
    const d = stage && DIFFICULTIES[stage.difficulty];
    if (!d || summary.outcome !== "won") return base;
    const bonus = (stage.theme && stage.theme.bonus) || {};
    return { ...base, coins: d.winCoins + (bonus.coins || 0), exp: base.exp + (bonus.exp || 0) };
  }

  // Materials for a finished battle: { material_id: count }. Losing drops
  // nothing; neither does mixed practice (it costs no stamina, P5-03).
  function materialDrops(stage, summary, gameData, rng) {
    if (summary.outcome !== "won" || !stage || !stage.drops) return {};
    const known = new Set((gameData.materials || []).map((m) => m.id));
    const spec = stage.drops;
    const pick = spec.pick.filter((id) => known.has(id));
    const out = {};
    for (let i = 0; i < spec.count && pick.length; i++) {
      const id = pick[Math.min(pick.length - 1, Math.floor(rng() * pick.length))];
      out[id] = (out[id] || 0) + 1;
    }
    for (const [id, n] of Object.entries(spec.extra || {})) if (known.has(id)) out[id] = (out[id] || 0) + n;
    // chance: { material_id: probability } of one more (e.g. 傳說核心 on hard stages).
    for (const [id, p] of Object.entries(spec.chance || {})) if (known.has(id) && rng() < p) out[id] = (out[id] || 0) + 1;
    return out;
  }

  ITE.dungeons = { LIMITED_RULES, limitedWinsToday, limitedRewardsLeft, claimLimited, LIMITED_THEMES, weekPlan, WORLDS, DIFFICULTIES, DIFFICULTY_ORDER, LIMITED_DROPS, worldOfTopic, worldStages, limitedStage, allStages, stagePool, rewards, materialDrops };
})(globalThis);
