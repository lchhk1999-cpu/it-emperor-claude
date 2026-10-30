// School Guild League scoring (PROPOSAL, docs/07_SCHOOL_GUILD_BATTLE.md).
// Rules are a prototype for the user to judge; nothing here is an approved rule.
// Fictitious data only; no real schools, names or student identifiers.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const DEFAULT_RULES = {
    topN: 5, // best N eligible members count towards the school score
    minParticipants: 3, // schools below this are listed but unranked
    weights: { accuracy: 0.7, completion: 0.25, speed: 0.05 }, // speed deliberately low
    dailyAttempts: 3,
  };

  function clamp01(x) {
    return typeof x === "number" && isFinite(x) ? Math.min(1, Math.max(0, x)) : 0;
  }

  // result: { answered, total, correct, secondsUsed, secondsLimit } -> 0..100
  function individualScore(result, rules) {
    const w = (rules || DEFAULT_RULES).weights;
    const total = result && result.total > 0 ? result.total : 0;
    if (!total) return 0;
    const accuracy = clamp01(result.correct / total);
    const completion = clamp01(result.answered / total);
    const speed = result.secondsLimit > 0 ? clamp01(1 - result.secondsUsed / result.secondsLimit) : 0;
    const raw = w.accuracy * accuracy + w.completion * completion + w.speed * speed;
    return Math.round(raw * 1000) / 10;
  }

  // Mean of the best topN member scores, so a big school gains no edge from headcount.
  function schoolScore(memberScores, rules) {
    const r = rules || DEFAULT_RULES;
    const clean = (memberScores || []).filter((s) => typeof s === "number" && isFinite(s));
    const top = clean.slice().sort((a, b) => b - a).slice(0, r.topN);
    const eligible = clean.length >= r.minParticipants && top.length > 0;
    const score = top.length ? Math.round((top.reduce((a, b) => a + b, 0) / top.length) * 10) / 10 : 0;
    return { score, counted: top.length, participants: clean.length, eligible };
  }

  // schools: [{ id, name, members: [{ nickname, result }] }]. Ranked first, then
  // unranked (too few participants). Ties break on participants then id: deterministic.
  function standings(schools, rules) {
    const r = rules || DEFAULT_RULES;
    const rows = (schools || []).map((s) => {
      const scores = (s.members || []).map((m) => individualScore(m.result, r));
      const agg = schoolScore(scores, r);
      return { id: s.id, name: s.name, score: agg.score, counted: agg.counted, participants: agg.participants, eligible: agg.eligible };
    });
    rows.sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      if (b.participants !== a.participants) return b.participants - a.participants;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    let rank = 0;
    rows.forEach((row) => {
      row.rank = row.eligible ? ++rank : null;
    });
    return rows;
  }

  ITE.guild = { DEFAULT_RULES, individualScore, schoolScore, standings };
})(globalThis);
