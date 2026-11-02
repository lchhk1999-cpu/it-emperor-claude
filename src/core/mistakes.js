// 錯題本 (user request 2026-11-03): every question answered wrong anywhere in
// the game is kept here so the student can pick which ones to revisit. In the
// review, two right answers in a row mark a question 已掌握 and take it out;
// a wrong answer keeps it (and counts again). Putting a mistake right the first
// time gives a little EXP, capped per Hong Kong day so it cannot be farmed.
// Only question IDs and counts are stored; the questions come from the build's
// own (approved) pools, so a question the build no longer allows never shows.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const MISTAKE_RULES = { keep: 300, masterStreak: 2, fixExp: 10, dailyExpCap: 50 };

  const dayKey = (now) => ITE.guildRaid.hktDayKey(now);
  const stateOf = (profile) => profile.mistakes || { items: {}, mastered: 0 };

  // Keeps the most recent `keep` mistakes.
  function trim(items) {
    const ids = Object.keys(items);
    if (ids.length <= MISTAKE_RULES.keep) return items;
    const keep = ids.sort((a, b) => items[b].lastWrong - items[a].lastWrong).slice(0, MISTAKE_RULES.keep);
    return Object.fromEntries(keep.map((id) => [id, items[id]]));
  }

  // A wrong answer in any mode (battles, story, rush, drill). Right answers
  // outside the review leave the book alone.
  function recordWrong(profile, q, now) {
    if (!q || !q.question_id) return profile;
    const s = stateOf(profile);
    const prev = s.items[q.question_id];
    const item = { wrong: (prev ? prev.wrong : 0) + 1, lastWrong: now, streak: 0, ...(prev && prev.fixed ? { fixed: true } : {}) };
    return { ...profile, mistakes: { ...s, items: trim({ ...s.items, [q.question_id]: item }) } };
  }

  // An answer in the 錯題本 review. Returns { profile, exp, mastered }.
  function reviewAnswer(profile, questionId, correct, now) {
    const s = stateOf(profile);
    const item = s.items[questionId];
    if (!item) return { profile, exp: 0, mastered: false };
    if (!correct) {
      const next = { ...item, wrong: item.wrong + 1, lastWrong: now, streak: 0 };
      return { profile: { ...profile, mistakes: { ...s, items: { ...s.items, [questionId]: next } } }, exp: 0, mastered: false };
    }
    const today = dayKey(now);
    const used = s.rewardDay === today ? s.rewardExp || 0 : 0;
    const exp = item.fixed ? 0 : Math.max(0, Math.min(MISTAKE_RULES.fixExp, MISTAKE_RULES.dailyExpCap - used));
    const streak = (item.streak || 0) + 1;
    const mastered = streak >= MISTAKE_RULES.masterStreak;
    const items = { ...s.items };
    if (mastered) delete items[questionId];
    else items[questionId] = { ...item, streak, fixed: true };
    const reward = exp ? { rewardDay: today, rewardExp: used + exp } : {};
    return { profile: { ...profile, mistakes: { ...s, ...reward, items, mastered: (s.mastered || 0) + (mastered ? 1 : 0) } }, exp, mastered };
  }

  // The student takes a question out by hand.
  function remove(profile, questionId) {
    const s = stateOf(profile);
    if (!s.items[questionId]) return profile;
    const items = { ...s.items };
    delete items[questionId];
    return { ...profile, mistakes: { ...s, items } };
  }

  // World A–E of a question: DSE topics by world, story questions by level.
  function worldOf(q) {
    if (/^story_[A-E]$/.test(q.topic_id || "")) return q.topic_id.slice(-1);
    const w = ITE.dungeons && ITE.dungeons.worldOfTopic(q.topic_id);
    return w ? w.id : null;
  }

  // Book entries joined with their questions from `pool` (unknown IDs are
  // skipped). opts: { world: "A".."E" | null, sort: "recent" | "most" }.
  function list(profile, pool, opts) {
    const o = opts || {};
    const byId = new Map(pool.map((q) => [q.question_id, q]));
    const out = Object.entries(stateOf(profile).items)
      .map(([id, item]) => ({ id, ...item, question: byId.get(id) }))
      .filter((e) => e.question && (!o.world || worldOf(e.question) === o.world));
    return out.sort(o.sort === "most" ? (a, b) => b.wrong - a.wrong || b.lastWrong - a.lastWrong : (a, b) => b.lastWrong - a.lastWrong);
  }

  const count = (profile, pool) => list(profile, pool).length;

  // Save/load: keep well-formed entries only; fields an entry never had stay absent.
  function sanitize(raw) {
    if (!raw || typeof raw !== "object") return undefined;
    const items = {};
    for (const [id, it] of Object.entries(raw.items || {})) {
      if (!/^[\w.-]{1,40}$/.test(id) || !it || !Number.isInteger(it.wrong) || it.wrong < 1 || !(it.lastWrong > 0)) continue;
      items[id] = { wrong: Math.min(it.wrong, 9999), lastWrong: it.lastWrong, streak: Number.isInteger(it.streak) && it.streak >= 0 ? Math.min(it.streak, MISTAKE_RULES.masterStreak - 1) : 0 };
      if (it.fixed === true) items[id].fixed = true;
    }
    const out = { items: trim(items), mastered: Number.isInteger(raw.mastered) && raw.mastered >= 0 ? raw.mastered : 0 };
    if (typeof raw.rewardDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.rewardDay)) {
      out.rewardDay = raw.rewardDay;
      out.rewardExp = Number.isInteger(raw.rewardExp) && raw.rewardExp >= 0 ? Math.min(raw.rewardExp, MISTAKE_RULES.dailyExpCap) : 0;
    }
    return out;
  }

  ITE.mistakes = { MISTAKE_RULES, recordWrong, reviewAnswer, remove, worldOf, list, count, sanitize };
})(globalThis);
