// Daily / weekly missions and titles (P3-08). Mission and title definitions
// come from the workbook (ITE.gameData.missions / .titles). Counting is done
// here from every answered question in any mode (DSE challenge, story, guild),
// because the goal is to encourage regular self-study.
//
// progress = {
//   daily:    counters for the current HKT day,
//   weekly:   counters for the current HKT week (Monday 00:00),
//   lifetime: counters since the save began,
//   claimed:  { [missionId]: periodKey of the last claim },
//   titles:   { equipped: titleId | null },
// }
// counters = { key, answered, correct, stageClears, byTopic: { [topic]: correct }, sqlJoinCorrect,
//              streak, bestStreak, ultimateClears, drillAnswered }
// All time-dependent functions take `now` (ms) for testability.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const MISSION_METRICS = { answer_questions: "answered", answer_correct: "correct", clear_stage: "stageClears" };
  const CYCLE_COUNTERS = { daily: "daily", weekly: "weekly", once: "lifetime" };

  const dayKey = (now) => ITE.guildRaid.hktDayKey(now);
  const weekKey = (now) => ITE.guildRaid.hktWeekKey(now);

  function emptyCounters(key) {
    return { key, answered: 0, correct: 0, stageClears: 0, byTopic: {}, sqlJoinCorrect: 0, streak: 0, bestStreak: 0, ultimateClears: 0, drillAnswered: 0 };
  }

  function defaultProgress(now) {
    return {
      daily: emptyCounters(dayKey(now)),
      weekly: emptyCounters(weekKey(now)),
      lifetime: emptyCounters("all"),
      claimed: {},
      titles: { equipped: null },
    };
  }

  // Starts fresh daily/weekly counters when the HKT day or week has changed.
  function rollover(progress, now) {
    const p = progress || defaultProgress(now);
    const daily = p.daily && p.daily.key === dayKey(now) ? p.daily : emptyCounters(dayKey(now));
    const weekly = p.weekly && p.weekly.key === weekKey(now) ? p.weekly : emptyCounters(weekKey(now));
    if (daily === p.daily && weekly === p.weekly) return p;
    return { ...p, daily, weekly };
  }

  function isSqlJoin(q) {
    return q.topic_id === "SQL" && /JOIN/i.test(q.tags || "");
  }

  function bump(c, q, correct, opts) {
    const byTopic = { ...c.byTopic };
    if (correct && q.topic_id) byTopic[q.topic_id] = (byTopic[q.topic_id] || 0) + 1;
    const streak = correct ? (c.streak || 0) + 1 : 0;
    return {
      ...c,
      answered: c.answered + 1,
      correct: c.correct + (correct ? 1 : 0),
      byTopic,
      sqlJoinCorrect: c.sqlJoinCorrect + (correct && isSqlJoin(q) ? 1 : 0),
      streak,
      bestStreak: Math.max(c.bestStreak || 0, streak),
      ultimateClears: c.ultimateClears || 0,
      drillAnswered: (c.drillAnswered || 0) + (opts && opts.drill ? 1 : 0),
    };
  }

  // opts.drill: answered in 操練區 (counts for the 操練狂人 title).
  function recordAnswer(progress, q, correct, now, opts) {
    const p = rollover(progress, now);
    return { ...p, daily: bump(p.daily, q, correct, opts), weekly: bump(p.weekly, q, correct, opts), lifetime: bump(p.lifetime, q, correct, opts) };
  }

  // A cleared stage: DSE challenge won or story level cleared. info.difficulty
  // "ultimate" also counts towards the 究極挑戰者 title.
  function recordStageClear(progress, now, info) {
    const p = rollover(progress, now);
    const ultimate = info && info.difficulty === "ultimate" ? 1 : 0;
    const inc = (c) => ({ ...c, stageClears: c.stageClears + 1, ultimateClears: (c.ultimateClears || 0) + ultimate });
    return { ...p, daily: inc(p.daily), weekly: inc(p.weekly), lifetime: inc(p.lifetime) };
  }

  function periodKey(progress, mission) {
    return progress[CYCLE_COUNTERS[mission.cycle]].key;
  }

  function missionStatus(progress, mission, now) {
    const p = rollover(progress, now);
    if (!mission.supported) return { value: 0, target: mission.target, done: false, claimed: false, supported: false };
    const value = p[CYCLE_COUNTERS[mission.cycle]][MISSION_METRICS[mission.condition]] || 0;
    const claimed = p.claimed[mission.id] === periodKey(p, mission);
    return { value: Math.min(value, mission.target), target: mission.target, done: value >= mission.target, claimed, supported: true };
  }

  // Returns { progress, reward } or { progress, error }. A mission can be
  // claimed once per period (once per day / week; "once" missions once ever).
  function claimMission(progress, mission, now) {
    const p = rollover(progress, now);
    const st = missionStatus(p, mission, now);
    if (!st.supported) return { progress: p, error: "not_supported" };
    if (!st.done) return { progress: p, error: "not_done" };
    if (st.claimed) return { progress: p, error: "already_claimed" };
    return {
      progress: { ...p, claimed: { ...p.claimed, [mission.id]: periodKey(p, mission) } },
      reward: { gems: mission.gems, coins: mission.coins },
    };
  }

  function claimableCount(progress, missions, now) {
    return missions.filter((m) => {
      const st = missionStatus(progress, m, now);
      return st.done && !st.claimed;
    }).length;
  }

  // Title conditions the game can count (more titles approved 2026-10-31).
  // ctx = { profile, story, stages } from the save, for conditions that are not
  // answer counts (check-ins, collection, evolution, cleared stages, story).
  const TITLE_CONDITIONS = [
    "total_correct", "topic_correct", "sql_join_correct", "world_correct", "best_streak", "ultimate_clear",
    "all_world_stages", "story_complete", "checkin_days", "evolve_max", "own_characters", "drill_answers",
  ];

  function titleValue(progress, title, ctx) {
    const c = progress.lifetime;
    const x = ctx || {};
    switch (title.condition) {
      case "total_correct": return c.correct;
      case "topic_correct": return c.byTopic[title.topic] || 0;
      case "sql_join_correct": return c.sqlJoinCorrect;
      case "world_correct": {
        const w = ITE.dungeons && ITE.dungeons.WORLDS.find((v) => v.id === title.topic);
        return w ? w.topics.reduce((s, t) => s + (c.byTopic[t] || 0), 0) : 0;
      }
      case "best_streak": return c.bestStreak || 0;
      case "ultimate_clear": return c.ultimateClears || 0;
      case "drill_answers": return c.drillAnswered || 0;
      case "all_world_stages": {
        const ids = ITE.dungeons ? ITE.dungeons.worldStages().map((s) => s.id) : [];
        return ids.filter((id) => x.stages && x.stages[id] && x.stages[id].cleared).length;
      }
      case "story_complete": return Object.values((x.story && x.story.levels) || {}).filter((l) => l && l.cleared).length;
      case "checkin_days": return (x.profile && x.profile.checkin && x.profile.checkin.days) || 0;
      case "evolve_max": return Object.values((x.profile && x.profile.growth && x.profile.growth.characters) || {}).filter((g) => g.evo >= 3).length;
      case "own_characters": return (x.profile && x.profile.owned && x.profile.owned.characters.length) || 0;
      default: return 0;
    }
  }

  // 稱號級別 (user 2026-11-01: titles were all earned too soon). Each title has
  // up to five tiers; tier Ⅰ is the workbook target, later tiers multiply it.
  // Titles with a natural end (all stages, all story levels) keep one tier;
  // collection titles stop at what the game holds. PROTOTYPE numbers.
  // TODO(ChatGPT): move tier targets into the workbook Titles sheet if wanted.
  const TITLE_TIER_NAMES = ["銅", "銀", "金", "白金", "鑽石"];
  const TIER_STEPS = {
    default: [1, 2, 5, 10, 20],
    best_streak: [1, 1.5, 2, 3, 5],
    ultimate_clear: [1, 5, 20, 50, 100],
    evolve_max: [1, 3, 5, 10, 20],
  };
  const SINGLE_TIER = ["all_world_stages", "story_complete", "season_rank"];

  function titleTiers(title, ctx) {
    const base = title.target;
    if (SINGLE_TIER.includes(title.condition)) return [base];
    const characters = ((ctx && ctx.characterCount) || (ITE.gameData && ITE.gameData.characters && ITE.gameData.characters.length)) || 0;
    if (title.condition === "own_characters") {
      const out = [];
      for (let t = base; t < characters && out.length < 4; t += 5) out.push(t);
      return characters > base ? out.concat([characters]) : [base];
    }
    const steps = TIER_STEPS[title.condition] || TIER_STEPS.default;
    const out = steps.map((m) => Math.round(base * m)).filter((t, i, a) => a.indexOf(t) === i);
    return title.condition === "evolve_max" && characters ? out.filter((t) => t <= characters) : out;
  }

  // Titles are earned automatically once the count reaches tier Ⅰ, and climb
  // tiers as the count grows. target/value refer to the next tier (or the
  // last one when maxed), so progress bars keep moving.
  function titleStatus(progress, title, ctx) {
    if (!title.supported) return { value: 0, target: title.target, earned: false, supported: false, tier: 0, tiers: 1, tierName: null, maxed: false };
    const raw = titleValue(progress, title, ctx);
    const tiers = titleTiers(title, ctx);
    const tier = tiers.filter((t) => raw >= t).length;
    const maxed = tier === tiers.length;
    const target = maxed ? tiers[tiers.length - 1] : tiers[tier];
    return { value: Math.min(raw, target), target, earned: tier >= 1, supported: true, tier, tiers: tiers.length, tierName: tier ? (tiers.length > 1 ? TITLE_TIER_NAMES[tier - 1] : null) : null, maxed };
  }

  // 「公式達人・金」 for tiered titles, the plain name otherwise.
  function titleLabel(progress, title, ctx) {
    const st = titleStatus(progress, title, ctx);
    return st.tierName ? `${title.name}・${st.tierName}` : title.name;
  }

  function equipTitle(progress, title, ctx) {
    if (title && !titleStatus(progress, title, ctx).earned) return { progress, error: "not_earned" };
    return { progress: { ...progress, titles: { equipped: title ? title.id : null } }, error: null };
  }

  function equippedTitle(progress, titles, ctx) {
    const id = progress && progress.titles && progress.titles.equipped;
    const t = id && titles.find((x) => x.id === id);
    return t && titleStatus(progress, t, ctx).earned ? t : null;
  }

  ITE.missions = {
    TITLE_CONDITIONS,
    defaultProgress,
    rollover,
    recordAnswer,
    recordStageClear,
    missionStatus,
    claimMission,
    claimableCount,
    titleStatus,
    titleTiers,
    titleLabel,
    TITLE_TIER_NAMES,
    equipTitle,
    equippedTitle,
    isSqlJoin,
  };
})(globalThis);
