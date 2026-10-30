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
    return ITE.rng.shuffle(unique, rng).slice(0, count);
  }

  function optionsOf(q) {
    return ANSWERS.map((letter, i) => ({ letter, text: q[OPTION_KEYS[i]] }));
  }

  ITE.questions = { TOPICS, ANSWERS, STATUSES, validateQuestion, validateBank, filterForMode, drawQuestions, optionsOf };
})(globalThis);
