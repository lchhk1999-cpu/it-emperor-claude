// 答題衝刺 (user request 2026-11-01): the team leader runs forward; each
// question comes with three doors (the answer and two wrong options). The
// right door adds time, a wrong one takes time away, and the run ends when the
// clock reaches zero. The further the run, the more shards of the UR item
// 「雷神鍵盤」 (RUSH_RULES.unlockShards make the item). Three rewarded runs per Hong Kong day
// (more runs are practice), no stamina.
// PROTOTYPE numbers until playtested.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  // Longer clock (user 2026-11-01: 「時間太短」): 60 s to start, +6 s / −4 s,
  // and it speeds up only every 10 doors.
  const RUSH_RULES = {
    startMs: 60000,
    maxMs: 90000,
    correctMs: 6000,
    wrongMs: 4000,
    // The clock runs faster as the run goes on: +10% per 10 doors, up to 1.6×.
    speedEvery: 10,
    speedStep: 0.1,
    maxSpeed: 1.6,
    dailyRewards: 3,
    // [doors passed, shards]: the best line reached counts.
    shardSteps: [[5, 1], [10, 2], [15, 3], [20, 4], [30, 5]],
    itemId: "EQ-THUNDERKEY",
    // 80 since balance 2026-11-01 (40 took a strong student 4 days).
    unlockShards: 80,
  };

  const dayKey = (now) => ITE.guildRaid.hktDayKey(now);

  // Three doors: the answer and two wrong options, in a shuffled order.
  function doors(q, rng) {
    const letters = ITE.questions.ANSWERS;
    const text = ITE.questions.optionsOf(q);
    const wrong = ITE.rng.shuffle(letters.filter((l) => l !== q.answer), rng).slice(0, 2);
    return ITE.rng.shuffle([q.answer].concat(wrong), rng).map((l) => ({ letter: l, text: text.find((o) => o.letter === l).text }));
  }

  function start(questions, rng) {
    if (!questions.length) return null;
    const order = ITE.questions.shuffleLinked(questions, rng);
    return { order, index: 0, timeMs: RUSH_RULES.startMs, passed: 0, wrong: 0, wrongIds: [], current: { q: order[0], doors: doors(order[0], rng) }, over: false, last: null };
  }

  function speed(state) {
    return Math.min(RUSH_RULES.maxSpeed, 1 + RUSH_RULES.speedStep * Math.floor(state.passed / RUSH_RULES.speedEvery));
  }

  // Real time passing; the run ends at zero.
  function tick(state, dtMs) {
    if (state.over || !(dtMs > 0)) return state;
    const timeMs = Math.max(0, state.timeMs - dtMs * speed(state));
    return { ...state, timeMs, over: timeMs === 0 };
  }

  // Goes through a door; the next question follows straight away.
  function choose(state, letter, rng) {
    if (state.over || !state.current) return state;
    const q = state.current.q;
    const correct = letter === q.answer;
    const timeMs = correct ? Math.min(RUSH_RULES.maxMs, state.timeMs + RUSH_RULES.correctMs) : Math.max(0, state.timeMs - RUSH_RULES.wrongMs);
    let index = state.index + 1;
    let order = state.order;
    if (index >= order.length) {
      order = ITE.questions.shuffleLinked(order, rng);
      index = 0;
    }
    const nextQ = order[index];
    return {
      ...state,
      order,
      index,
      timeMs,
      passed: state.passed + (correct ? 1 : 0),
      wrong: state.wrong + (correct ? 0 : 1),
      wrongIds: correct ? state.wrongIds : state.wrongIds.concat([q.question_id]),
      current: { q: nextQ, doors: doors(nextQ, rng) },
      over: timeMs === 0,
      last: { questionId: q.question_id, choice: letter, correct, answer: q.answer },
    };
  }

  function shardsFor(passed) {
    return RUSH_RULES.shardSteps.reduce((n, [need, s]) => (passed >= need ? s : n), 0);
  }

  function playsToday(profile, now) {
    const r = profile.rush;
    return r && r.day === dayKey(now) ? r.plays : 0;
  }

  // At the end of a run: shards if a rewarded run is left today.
  // Returns { profile, shards, rewarded }.
  function claim(profile, passed, now) {
    const used = playsToday(profile, now);
    const best = Math.max(passed, (profile.rush && profile.rush.best) || 0);
    if (used >= RUSH_RULES.dailyRewards) return { profile: { ...profile, rush: { day: dayKey(now), plays: used, best } }, shards: 0, rewarded: false };
    const n = shardsFor(passed);
    const id = RUSH_RULES.itemId;
    return {
      profile: {
        ...profile,
        rush: { day: dayKey(now), plays: used + 1, best },
        shards: n ? { ...(profile.shards || {}), [id]: ((profile.shards || {})[id] || 0) + n } : profile.shards || {},
      },
      shards: n,
      rewarded: true,
    };
  }

  function shardsOf(profile) {
    return (profile.shards && profile.shards[RUSH_RULES.itemId]) || 0;
  }

  function canUnlock(profile) {
    return !profile.owned.equipment.includes(RUSH_RULES.itemId) && shardsOf(profile) >= RUSH_RULES.unlockShards;
  }

  // RUSH_RULES.unlockShards shards make the UR item 雷神鍵盤.
  function unlock(profile, gameData) {
    const id = RUSH_RULES.itemId;
    if (!(gameData.equipment || []).some((e) => e.id === id)) return { profile, error: "unknown_item" };
    if (profile.owned.equipment.includes(id)) return { profile, error: "owned" };
    if (shardsOf(profile) < RUSH_RULES.unlockShards) return { profile, error: "not_enough_shards" };
    return {
      profile: {
        ...profile,
        owned: { ...profile.owned, equipment: profile.owned.equipment.concat([id]) },
        shards: { ...profile.shards, [id]: shardsOf(profile) - RUSH_RULES.unlockShards },
      },
    };
  }

  ITE.rush = { RUSH_RULES, doors, start, speed, tick, choose, shardsFor, playsToday, claim, shardsOf, canUnlock, unlock };
})(globalThis);
