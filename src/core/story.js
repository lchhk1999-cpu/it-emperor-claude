// Offline story mode (PROTOTYPE rules, docs/09_BACKLOG.md P3-06).
// A level = practice questions drawn from its pool, then one mini-Boss question.
// Correct answers deal the question's points as damage; the boss HP equals the
// total points, so the level clears exactly when every question is answered
// correctly. Wrong answers show the explanation and the question comes back at
// the end of the queue: there is no losing, and stars reward first-try accuracy.
// Clearing a level unlocks the next one (in Levels-sheet order).
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const STORY_RULES = {
    practiceCount: 2,
    // Rolled out step by step; other levels show 「即將開放」.
    enabledLevels: ["A-01", "A-02", "A-03", "A-04", "A-05", "A-06", "A-07", "A-08", "A-09"],
  };

  // Levels in order, each with the questions this build mode may show.
  function buildLevels(bank, mode, rules) {
    const r = rules || STORY_RULES;
    const allowed = ITE.questions.filterForMode(bank.questions, mode);
    return bank.levels.map((level) => {
      const questions = allowed.filter((q) => q.level_id === level.id);
      const enabled = r.enabledLevels.includes(level.id);
      const ready = questions.some((q) => q.boss);
      return {
        ...level,
        world: bank.worlds[level.world_id] || { id: level.world_id, name: level.world_id },
        questions,
        enabled,
        playable: enabled && ready,
        // why a level cannot be played, for the map label
        blocked: !enabled ? "coming_soon" : !ready ? "awaiting_review" : null,
      };
    });
  }

  function levelProgress(progress, levelId) {
    return (progress && progress.levels && progress.levels[levelId]) || { cleared: false, stars: 0, plays: 0 };
  }

  function isUnlocked(levels, progress, levelId) {
    const i = levels.findIndex((l) => l.id === levelId);
    if (i < 0) return false;
    return i === 0 || levelProgress(progress, levels[i - 1].id).cleared;
  }

  function createRun(level, rng, rules) {
    const r = rules || STORY_RULES;
    const shuffle = ITE.rng.shuffle;
    const practice = shuffle(level.questions.filter((q) => !q.boss), rng).slice(0, r.practiceCount);
    const boss = shuffle(level.questions.filter((q) => q.boss), rng).slice(0, 1);
    if (!boss.length) throw new Error(`level ${level.id} has no mini-Boss question`);
    const queue = practice.concat(boss).map((q) => ITE.questions.shuffleOptions(q, rng));
    const total = queue.reduce((s, q) => s + q.points, 0);
    return {
      levelId: level.id,
      seed: Math.floor(rng() * 2 ** 31), // reshuffles retried questions deterministically
      phase: "question",
      queue,
      questionCount: queue.length,
      bossHp: total,
      bossMaxHp: total,
      firstTry: {},
      mistakes: 0,
      answered: 0,
      lastResult: null,
      log: [],
      shown: {}, // last displayed copy of each question, for the review list
    };
  }

  function current(run) {
    return run.queue[0] || null;
  }

  function isBossQuestion(run) {
    const q = current(run);
    return !!(q && q.boss);
  }

  function answer(run, choice) {
    if (run.phase !== "question") return run;
    const q = current(run);
    const correct = choice === q.answer;
    const firstTry = { ...run.firstTry };
    if (!(q.question_id in firstTry)) firstTry[q.question_id] = correct;
    const damage = correct ? q.points : 0;
    const rest = run.queue.slice(1);
    const lastResult = { questionId: q.question_id, choice, correct, damage, boss: q.boss };
    // A retried question comes back with its options in a new order, so it is
    // answered from understanding rather than from the remembered position.
    const retry = correct ? null : ITE.questions.shuffleOptions(q, ITE.rng.createRng(run.seed + run.answered + 1));
    return {
      ...run,
      phase: "feedback",
      question: q, // the question being explained
      queue: correct ? rest : rest.concat([retry]), // wrong: comes back later
      shown: { ...run.shown, [q.question_id]: q },
      bossHp: Math.max(0, run.bossHp - damage),
      firstTry,
      mistakes: run.mistakes + (correct ? 0 : 1),
      answered: run.answered + 1,
      lastResult,
      log: run.log.concat([lastResult]),
    };
  }

  function next(run) {
    if (run.phase !== "feedback") return run;
    return { ...run, phase: run.queue.length ? "question" : "cleared", question: null };
  }

  function stars(run) {
    const ids = Object.keys(run.firstTry);
    const misses = ids.filter((id) => !run.firstTry[id]).length;
    return misses === 0 ? 3 : misses === 1 ? 2 : 1;
  }

  function summary(run) {
    const ids = Object.keys(run.firstTry);
    const firstTryCorrect = ids.filter((id) => run.firstTry[id]).length;
    return {
      levelId: run.levelId,
      cleared: run.phase === "cleared",
      stars: run.phase === "cleared" ? stars(run) : 0,
      questions: run.questionCount,
      firstTryCorrect,
      mistakes: run.mistakes,
      wrongQuestionIds: ids.filter((id) => !run.firstTry[id]),
    };
  }

  function recordClear(progress, sum) {
    const levels = { ...((progress && progress.levels) || {}) };
    const prev = levelProgress(progress, sum.levelId);
    levels[sum.levelId] = {
      cleared: prev.cleared || sum.cleared,
      stars: Math.max(prev.stars, sum.stars),
      plays: prev.plays + 1,
    };
    return { ...(progress || {}), levels };
  }

  function nextLevel(levels, levelId) {
    const i = levels.findIndex((l) => l.id === levelId);
    return i >= 0 ? levels[i + 1] || null : null;
  }

  // Teacher review decisions -> CSV for tools/import_story_bank.py --reviews.
  // decisions: { [question_id]: { decision: "approved"|"rejected", reviewer, reviewed_at, note } }
  const REVIEW_CSV_HEADER = ["question_id", "decision", "reviewer", "reviewed_at", "note"];

  function csvCell(value) {
    let s = String(value == null ? "" : value).replace(/\r?\n/g, " ");
    if (/^[=+\-@\t]/.test(s)) s = "'" + s; // stop Excel treating notes as formulas
    return /[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function reviewsToCsv(decisions) {
    const rows = Object.keys(decisions)
      .sort()
      .filter((id) => ["approved", "rejected"].includes(decisions[id].decision))
      .map((id) => {
        const d = decisions[id];
        return [id, d.decision, d.reviewer, d.reviewed_at, d.note].map(csvCell).join(",");
      });
    return [REVIEW_CSV_HEADER.join(",")].concat(rows).join("\n") + "\n";
  }

  ITE.story = {
    STORY_RULES,
    reviewsToCsv,
    buildLevels,
    levelProgress,
    isUnlocked,
    createRun,
    current,
    isBossQuestion,
    answer,
    next,
    stars,
    summary,
    recordClear,
    nextLevel,
  };
})(globalThis);
