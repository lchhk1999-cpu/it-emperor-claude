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
  const DIFFICULTIES = {
    easy: { name: "簡單", questionCount: 5, questions: ["easy"], hpFactor: 0.6, attack: 15, drops: 1, rare: 0 },
    medium: { name: "中等", questionCount: 8, questions: ["medium"], hpFactor: 0.7, attack: 20, drops: 2, rare: 0 },
    hard: { name: "困難", questionCount: 10, questions: ["hard"], hpFactor: 0.8, attack: 25, drops: 3, rare: 0 },
    ultimate: { name: "究極", questionCount: 15, questions: ["hard", "medium"], hpFactor: 0.85, attack: 30, drops: 4, rare: 1 },
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
      drops: { pick: world.materials, count: d.drops, extra: d.rare ? { [RARE_MATERIAL]: d.rare } : {} },
    };
  }

  // Today's limited stage (HKT weekday), or null when the workbook has none.
  function limitedStage(gameData, now) {
    const weekday = ((new Date(now + 8 * 3600 * 1000).getUTCDay() + 6) % 7) + 1; // 1 = Monday
    const event = (gameData.events || []).find((e) => e.weekday === weekday);
    const st = event && (gameData.eventStages || []).find((s) => s.id === event.stage);
    const material = st && (gameData.materials || []).find((m) => m.id === st.material);
    if (!material) return null;
    const d = DIFFICULTIES[st.difficulty];
    const world = worldOfTopic(st.topic);
    return {
      id: `limited-${event.id}`,
      kind: "limited",
      world: world ? world.id : null,
      difficulty: st.difficulty,
      chapter: `今日限定｜${event.name}`,
      name: st.title,
      description: `${st.questionCount} 題｜勝出可得 ${material.name} ×${LIMITED_DROPS[material.rarity]}`,
      questionCount: st.questionCount,
      topicIds: st.topic === "ALL" ? null : [st.topic],
      questionDifficulties: d.questions,
      staminaCost: st.stamina || 0,
      boss: { name: world ? world.boss : "Bug 王", maxHp: bossHp(st.questionCount, d.hpFactor), attack: d.attack },
      drops: { pick: [], count: 0, extra: { [material.id]: LIMITED_DROPS[material.rarity] } },
    };
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
    return (ITE.stages || []).concat(worldStages(), limited ? [limited] : []);
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

  ITE.dungeons = { WORLDS, DIFFICULTIES, DIFFICULTY_ORDER, LIMITED_DROPS, worldOfTopic, worldStages, limitedStage, allStages, stagePool, materialDrops };
})(globalThis);
