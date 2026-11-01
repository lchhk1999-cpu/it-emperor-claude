// Question schema validation, build-mode gating and drawing.
// Field names follow docs/04_QUESTION_BANK_CONTRACT.md. The real Excel column
// mapping is NOT done yet (no workbook provided) — see P2-01.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const TOPICS = {
    excel: "Excel 試算表",
    sql: "SQL 數據庫",
    hardware: "電腦硬件",
    network_hardware: "網絡硬件",
    network_security: "網絡概念及安全",
    python: "Python 編程",
  };
  const ANSWERS = ["A", "B", "C", "D"];
  const STATUSES = ["draft", "review", "approved", "rejected"];
  const OPTION_KEYS = ["option_a", "option_b", "option_c", "option_d"];

  function isBlank(v) {
    return v === undefined || v === null || String(v).trim() === "";
  }

  // Returns a list of error strings (empty = valid).
  function validateQuestion(q) {
    const errors = [];
    if (!q || typeof q !== "object") return ["not an object"];
    if (isBlank(q.question_id)) errors.push("question_id is empty");
    if (!Object.prototype.hasOwnProperty.call(TOPICS, q.topic_id)) errors.push(`unknown topic_id: ${q.topic_id}`);
    if (isBlank(q.stem)) errors.push("stem is empty");
    for (const k of OPTION_KEYS) {
      if (isBlank(q[k])) errors.push(`${k} is empty`);
      else if (typeof q[k] !== "string") errors.push(`${k} must be text (formulas kept as literal text)`);
    }
    const opts = OPTION_KEYS.map((k) => String(q[k] ?? "").trim());
    if (opts.every((o) => o) && new Set(opts).size !== 4) errors.push("options are not distinct");
    if (!ANSWERS.includes(q.answer)) errors.push(`answer must be A/B/C/D, got: ${q.answer}`);
    if (isBlank(q.explanation)) errors.push("explanation is empty");
    if (!STATUSES.includes(q.review_status)) errors.push(`invalid review_status: ${q.review_status}`);
    return errors;
  }

  // Validates a whole bank: per-row errors plus duplicate IDs. Invalid rows are
  // reported, never silently dropped.
  function validateBank(rows) {
    const accepted = [];
    const rejected = [];
    const seen = new Map();
    const duplicates = [];
    rows.forEach((q, index) => {
      const errors = validateQuestion(q);
      const id = q && !isBlank(q.question_id) ? String(q.question_id).trim() : null;
      if (id !== null) {
        if (seen.has(id)) {
          errors.push(`duplicate question_id (first at row ${seen.get(id)})`);
          duplicates.push(id);
        } else {
          seen.set(id, index);
        }
      }
      if (errors.length) rejected.push({ index, question_id: id, errors });
      else accepted.push(q);
    });
    const topics = new Set(accepted.map((q) => q.topic_id));
    return {
      accepted,
      rejected,
      report: {
        total: rows.length,
        accepted: accepted.length,
        rejected: rejected.length,
        duplicates: duplicates.length,
        topics: topics.size,
      },
    };
  }

  // Release builds may only show approved questions. Dev mode may also show
  // draft/review, which the UI must label clearly. Rejected never appears.
  function filterForMode(questions, mode) {
    if (mode === "release") return questions.filter((q) => q.review_status === "approved");
    if (mode === "dev") return questions.filter((q) => q.review_status !== "rejected");
    throw new Error(`unknown mode: ${mode}`);
  }

  // Draws up to `count` distinct questions, optionally limited to topics.
  // 「承上題」 (user report 2026-11-01: such a question came without the one it
  // follows). A stem starting with 承上題 follows the question whose id ends in
  // the previous number (ICT-2025-IA-35 follows ICT-2025-IA-34).
  function predecessorId(q) {
    if (!q || !/^\s*承上題/.test(q.stem || "")) return null;
    const m = /^(.*?)(\d+)$/.exec(q.question_id || "");
    if (!m || Number(m[2]) < 1) return null;
    return m[1] + String(Number(m[2]) - 1).padStart(m[2].length, "0");
  }

  // The question a 承上題 follows, from `pool`, or null.
  function previousOf(q, pool) {
    const id = predecessorId(q);
    return id ? (pool || []).find((x) => x.question_id === id) || null : null;
  }

  // Shuffles but keeps each 承上題 straight after the question it follows.
  function shuffleLinked(list, rng) {
    const byId = new Map(list.map((q) => [q.question_id, q]));
    const followers = new Map();
    for (const q of list) {
      const id = predecessorId(q);
      if (id && byId.has(id)) followers.set(id, (followers.get(id) || []).concat([q]));
    }
    const units = list.filter((q) => !(predecessorId(q) && byId.has(predecessorId(q)))).map((q) => [q].concat(followers.get(q.question_id) || []));
    return [].concat(...ITE.rng.shuffle(units, rng));
  }

  function drawQuestions(questions, count, rng, topicIds) {
    const pool = topicIds ? questions.filter((q) => topicIds.includes(q.topic_id)) : questions;
    const unique = [];
    const ids = new Set();
    for (const q of pool) {
      if (!ids.has(q.question_id)) {
        ids.add(q.question_id);
        unique.push(q);
      }
    }
    return shuffleLinked(unique, rng).slice(0, count);
  }

  function optionsOf(q) {
    return ANSWERS.map((letter, i) => ({ letter, text: q[OPTION_KEYS[i]] }));
  }

  function isOptionOrder(order) {
    return Array.isArray(order) && order.length === 4 && ANSWERS.every((l) => order.includes(l));
  }

  // Shows the options in `order`, where order[i] is the ORIGINAL letter shown at
  // position i (user decision 2026-10-30: shuffle options so answer positions —
  // e.g. no D answers in the story bank — cannot be guessed). Works on an
  // already-displayed copy too, by mapping back through its option_order.
  // Question text stays exactly as reviewed; only the display order changes.
  function applyOptionOrder(q, order) {
    if (!isOptionOrder(order)) throw new Error(`invalid option order: ${order}`);
    const current = q.option_order || ANSWERS;
    const original = {};
    ANSWERS.forEach((letter, i) => (original[current[i]] = q[OPTION_KEYS[i]]));
    const originalAnswer = current[ANSWERS.indexOf(q.answer)];
    const out = { ...q, option_order: order.slice(), answer: ANSWERS[order.indexOf(originalAnswer)] };
    order.forEach((origLetter, i) => (out[OPTION_KEYS[i]] = original[origLetter]));
    return out;
  }

  function shuffleOptions(q, rng) {
    return applyOptionOrder(q, ITE.rng.shuffle(ANSWERS, rng));
  }

  ITE.questions = {
    TOPICS,
    ANSWERS,
    STATUSES,
    validateQuestion,
    validateBank,
    filterForMode,
    drawQuestions,
    predecessorId,
    previousOf,
    shuffleLinked,
    optionsOf,
    isOptionOrder,
    applyOptionOrder,
    shuffleOptions,
  };
})(globalThis);
