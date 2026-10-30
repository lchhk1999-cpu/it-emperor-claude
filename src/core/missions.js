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
// counters = { key, answered, correct, stageClears, byTopic: { [topic]: correct }, sqlJoinCorrect }
// All time-dependent functions take `now` (ms) for testability.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const MISSION_METRICS = { answer_questions: "answered", answer_correct: "correct", clear_stage: "stageClears" };
  const CYCLE_COUNTERS = { daily: "daily", weekly: "weekly", once: "lifetime" };

  const dayKey = (now) => ITE.guildRaid.hktDayKey(now);
  const weekKey = (now) => ITE.guildRaid.hktWeekKey(now);

  function emptyCounters(key) {
    return { key, answered: 0, correct: 0, stageClears: 0, byTopic: {}, sqlJoinCorrect: 0 };
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

  function bump(c, q, correct) {
    const byTopic = { ...c.byTopic };
    if (correct && q.topic_id) byTopic[q.topic_id] = (byTopic[q.topic_id] || 0) + 1;
    return {
      ...c,
      answered: c.answered + 1,
      correct: c.correct + (correct ? 1 : 0),
      byTopic,
      sqlJoinCorrect: c.sqlJoinCorrect + (correct && isSqlJoin(q) ? 1 : 0),
    };
  }

  function recordAnswer(progress, q, correct, now) {
    const p = rollover(progress, now);
    return { ...p, daily: bump(p.daily, q, correct), weekly: bump(p.weekly, q, correct), lifetime: bump(p.lifetime, q, correct) };
  }

  // A cleared stage: DSE challenge won or story level cleared.
  function recordStageClear(progress, now) {
    const p = rollover(progress, now);
    const inc = (c) => ({ ...c, stageClears: c.stageClears + 1 });
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

  function titleValue(progress, title) {
    const c = progress.lifetime;
    if (title.condition === "total_correct") return c.correct;
    if (title.condition === "topic_correct") return c.byTopic[title.topic] || 0;
    if (title.condition === "sql_join_correct") return c.sqlJoinCorrect;
    return 0;
  }

  // Titles are earned automatically once the lifetime count reaches the target.
  function titleStatus(progress, title) {
    if (!title.supported) return { value: 0, target: title.target, earned: false, supported: false };
    const value = titleValue(progress, title);
    return { value: Math.min(value, title.target), target: title.target, earned: value >= title.target, supported: true };
  }

  function equipTitle(progress, title) {
    if (title && !titleStatus(progress, title).earned) return { progress, error: "not_earned" };
    return { progress: { ...progress, titles: { equipped: title ? title.id : null } }, error: null };
  }

  function equippedTitle(progress, titles) {
    const id = progress && progress.titles && progress.titles.equipped;
    const t = id && titles.find((x) => x.id === id);
    return t && titleStatus(progress, t).earned ? t : null;
  }

  ITE.missions = {
    defaultProgress,
    rollover,
    recordAnswer,
    recordStageClear,
    missionStatus,
    claimMission,
    claimableCount,
    titleStatus,
    equipTitle,
    equippedTitle,
    isSqlJoin,
  };
})(globalThis);
