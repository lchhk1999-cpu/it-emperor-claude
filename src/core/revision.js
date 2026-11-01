// 知識修練館 (user request 2026-11-01, docs/11_REVISION_HALL.md): the original
// ICT revision notes (src/data/revision_notes.js, ChatGPT track) as short
// cards with self-tests, labs and spaced review. Content is read-only; the
// student's progress lives in profile.revision and never changes the notes.
//
// Rewards favour mastery over time spent: a little EXP the first time a card
// is finished, more for a correct answer to a new example, a correct answer
// when a review is due, or putting right an earlier mistake; capped per card
// per Hong Kong day so repeating a card cannot farm EXP. Wrong answers cost
// nothing and never lock reading.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});
  const DAY = 24 * 60 * 60 * 1000;

  const REVISION_RULES = {
    // Review after 1, 3, 7, 14 days (T04 starting point, adjustable): a right
    // answer moves one step further, a wrong one goes back to the first step.
    intervalsDays: [1, 3, 7, 14],
    exp: { firstDone: 5, newCorrect: 10, fixed: 15, reviewCorrect: 20 },
    cardDailyCap: 30,
  };

  const TOPICS = [
    { id: "A", name: "資訊處理", icon: "📊" },
    { id: "B", name: "電腦系統基礎", icon: "🖥" },
    { id: "C", name: "互聯網及其應用", icon: "🌐" },
    { id: "D", name: "計算思維與編程", icon: "🐍" },
    { id: "E", name: "社會影響", icon: "🤝" },
  ];
  // Elective areas (T01): entry only, no content yet — never shown as finished.
  const ELECTIVES = [
    { id: "2A", name: "數據庫", note: "JOIN、GROUP BY／HAVING 深入應用、子查詢、ER 圖、正規化" },
    { id: "2B", name: "網絡應用程式開發", note: "網絡服務設定、客戶端及伺服器開發" },
    { id: "2C", name: "算法與編程", note: "巢狀循環、二分搜尋、排序、堆疊及隊列" },
  ];

  // Stable card suffixes: progress is keyed by card ID, so adding a lab later
  // never shifts the IDs of existing cards. Labs use 05 onwards.
  const CARD_KINDS = {
    "01": { kind: "concept", label: "概念" },
    "02": { kind: "example", label: "例子" },
    "03": { kind: "mistake", label: "易錯" },
    "04": { kind: "selftest", label: "自測" },
  };

  const notes = () => ITE.revisionNotes || { chapters: [] };
  const chapters = () => notes().chapters;
  const chapterById = (id) => chapters().find((c) => c.id === id) || null;
  const labsFor = (id) => (ITE.revisionLabs && ITE.revisionLabs.forChapter(id)) || [];

  // Cards in reading order: 概念, 例子, labs, 易錯, 自測 (missing ones skipped).
  function cardsOf(chapter) {
    if (!chapter) return [];
    const by = (kind) => chapter.sections.filter((s) => s.kind === kind);
    const concept = by("concept").length ? by("concept") : chapter.sections.slice(0, 1);
    const examples = chapter.sections.filter((s) => s.kind === "example" && !concept.includes(s));
    const card = (n, sections, extra) => ({ id: `${chapter.id}-${n}`, chapterId: chapter.id, ...CARD_KINDS[n], title: CARD_KINDS[n].label, sections, ...extra });
    const out = [card("01", concept)];
    if (examples.length) out.push(card("02", examples));
    labsFor(chapter.id).forEach((lab, i) => out.push({ id: `${chapter.id}-${String(5 + i).padStart(2, "0")}`, chapterId: chapter.id, kind: "lab", label: "實驗室", title: lab.title, lab: lab.id, sections: [] }));
    if (by("mistake").length) out.push(card("03", by("mistake")));
    out.push(card("04", [], { questions: chapter.selfTest }));
    return out;
  }

  function cardById(cardId) {
    const chapter = chapterById(String(cardId).split("-")[0]);
    return cardsOf(chapter).find((c) => c.id === cardId) || null;
  }

  // Where a wrong answer sends the student back to: the concept card, plus the
  // common-mistakes card when the chapter has one.
  function backLinks(cardId) {
    const card = cardById(cardId);
    if (!card) return [];
    return cardsOf(chapterById(card.chapterId)).filter((c) => c.kind === "concept" || c.kind === "mistake");
  }

  // ---------- search ----------
  const plain = (s) => String(s || "").toLowerCase().replace(/\s+/g, "");
  function chapterText(ch) {
    const blocks = ch.sections.flatMap((s) => [s.heading, ...s.blocks.map((b) => (b.t === "table" ? b.rows.flat().join(" ") : b.text))]);
    return [ch.id, ch.title, ch.tagline, ...ch.keywords, ...blocks, ...ch.selfTest.flatMap((t) => [t.q, t.a])].join(" ");
  }
  // Chapters matching every word of the query, best first: ID/title/keyword
  // hits rank above hits in the body text.
  function search(query) {
    const words = String(query || "").split(/\s+/).map(plain).filter(Boolean);
    if (!words.length) return [];
    return chapters()
      .map((ch) => {
        const head = plain([ch.id, ch.title, ...ch.keywords].join(" "));
        const body = plain(chapterText(ch));
        if (!words.every((w) => body.includes(w))) return null;
        return { chapter: ch, score: words.filter((w) => head.includes(w)).length };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.chapter);
  }

  // ---------- progress ----------
  const dayKey = (now) => ITE.guildRaid.hktDayKey(now);
  const stateOf = (profile) => profile.revision || { last: null, cards: {} };
  const recordOf = (profile, cardId) => stateOf(profile).cards[cardId] || null;

  // 未學 / 練習中 / 待複習 / 已鞏固 (T04).
  function status(profile, cardId, now) {
    const r = recordOf(profile, cardId);
    if (!r) return "new";
    if (!r.passed) return "learning";
    if (r.due && r.due <= now) return "due";
    if (r.step >= REVISION_RULES.intervalsDays.length - 1) return "solid";
    return "learning";
  }
  const STATUS_NAMES = { new: "未學", learning: "練習中", due: "待複習", solid: "已鞏固" };

  function chapterProgress(profile, chapter, now) {
    const cards = cardsOf(chapter);
    const st = cards.map((c) => status(profile, c.id, now));
    return { total: cards.length, done: st.filter((s) => s !== "new").length, due: st.filter((s) => s === "due").length, solid: st.filter((s) => s === "solid").length };
  }

  function dueCards(profile, now) {
    return Object.entries(stateOf(profile).cards)
      .filter(([id, r]) => r.passed && r.due && r.due <= now && cardById(id))
      .sort((a, b) => a[1].due - b[1].due)
      .map(([id]) => cardById(id));
  }

  function withCard(profile, cardId, rec, now) {
    const s = stateOf(profile);
    return { ...profile, revision: { ...s, last: { cardId, at: now }, cards: { ...s.cards, [cardId]: rec } } };
  }

  // Marks a card opened (接續上次 remembers it); no reward.
  function open(profile, cardId, now) {
    if (!cardById(cardId)) return profile;
    const rec = recordOf(profile, cardId) || { seen: now, attempts: 0, correct: 0, wrong: 0, hints: 0, passed: false, step: 0, due: null, wrongOpen: false };
    return withCard(profile, cardId, rec, now);
  }

  function capLeft(rec, now) {
    return rec.rewardDay === dayKey(now) ? Math.max(0, REVISION_RULES.cardDailyCap - (rec.rewardExp || 0)) : REVISION_RULES.cardDailyCap;
  }

  // Reading card finished (概念 / 例子 / 易錯). First time: a small reward and a
  // review date; reading again later counts as a review only through a test.
  function finishReading(profile, cardId, now) {
    const card = cardById(cardId);
    if (!card || card.kind === "selftest" || card.kind === "lab") return { profile, exp: 0, reasons: [] };
    const prev = recordOf(profile, cardId) || {};
    if (prev.passed) return { profile: withCard(profile, cardId, { ...prev, lastAt: now }, now), exp: 0, reasons: [] };
    const rec = { ...open(profile, cardId, now).revision.cards[cardId], passed: true, step: 0, due: now + REVISION_RULES.intervalsDays[0] * DAY, lastAt: now };
    return grant(withCard(profile, cardId, rec, now), cardId, [["firstDone", REVISION_RULES.exp.firstDone]], now);
  }

  // An answer on a self-test or lab card.
  //   correct: right or wrong
  //   graded: true when the game checked the answer (labs, question bank);
  //           false for a self-assessed self-test (no EXP beyond first finish,
  //           so honesty is not tempted; it still drives the review dates)
  //   hint:   a hint was used
  function answer(profile, cardId, { correct, graded, hint }, now) {
    if (!cardById(cardId)) return { profile, exp: 0, reasons: [] };
    const prev = recordOf(profile, cardId) || recordOf(open(profile, cardId, now), cardId);
    const wasDue = prev.passed && prev.due && prev.due <= now;
    const firstFinish = !prev.passed;
    const R = REVISION_RULES;
    const last = R.intervalsDays.length - 1;
    const step = correct ? (firstFinish ? 0 : wasDue ? Math.min(last, (prev.step || 0) + 1) : prev.step || 0) : 0;
    const rec = {
      ...prev,
      attempts: (prev.attempts || 0) + 1,
      correct: (prev.correct || 0) + (correct ? 1 : 0),
      wrong: (prev.wrong || 0) + (correct ? 0 : 1),
      hints: (prev.hints || 0) + (hint ? 1 : 0),
      passed: prev.passed || correct,
      step,
      // Wrong: back to the first interval but due again today, so 今日需複習 shows it.
      due: correct ? (wasDue || firstFinish ? now + R.intervalsDays[step] * DAY : prev.due) : now,
      wrongOpen: correct ? false : true,
      lastAt: now,
      lastCorrect: !!correct,
    };
    const reasons = [];
    if (firstFinish && correct) reasons.push(["firstDone", R.exp.firstDone]);
    if (correct && graded) {
      if (wasDue) reasons.push(["reviewCorrect", R.exp.reviewCorrect]);
      else if (prev.wrongOpen) reasons.push(["fixed", R.exp.fixed]);
      else reasons.push(["newCorrect", R.exp.newCorrect]);
    }
    return grant(withCard(profile, cardId, rec, now), cardId, reasons, now);
  }

  const REASON_NAMES = { firstDone: "第一次完成", newCorrect: "新例子答對", fixed: "修正之前的錯誤", reviewCorrect: "到期複習答對" };

  // Applies the per-card daily cap. Returns { profile, exp, reasons: [{ key, name, exp }] }.
  function grant(profile, cardId, reasons, now) {
    const rec = recordOf(profile, cardId);
    let left = capLeft(rec, now);
    const given = [];
    for (const [k, n] of reasons) {
      const exp = Math.min(n, left);
      left -= exp;
      given.push({ key: k, name: REASON_NAMES[k], exp });
    }
    const exp = given.reduce((s, g) => s + g.exp, 0);
    const today = dayKey(now);
    const next = { ...rec, rewardDay: today, rewardExp: (rec.rewardDay === today ? rec.rewardExp || 0 : 0) + exp };
    return { profile: withCard(profile, cardId, next, now), exp, reasons: given, capped: reasons.length > 0 && exp < reasons.reduce((s, r) => s + r[1], 0) };
  }

  // 接續上次: the last opened card, if it still exists.
  function lastCard(profile) {
    const last = stateOf(profile).last;
    return last ? cardById(last.cardId) : null;
  }

  // Save/load: keep only well-formed records for well-formed card IDs. Fields a
  // record never had stay absent, so a clean save does not count as repaired.
  function sanitize(raw) {
    if (!raw || typeof raw !== "object") return undefined;
    const count = (v) => (Number.isInteger(v) && v >= 0 ? Math.min(v, 99999) : 0);
    const time = (v) => (v === null ? null : Number.isFinite(v) && v > 0 ? v : undefined);
    const cards = {};
    for (const [id, r] of Object.entries(raw.cards || {})) {
      if (!/^[A-E]\d\d-\d\d$/.test(id) || !r || typeof r !== "object") continue;
      const rec = {
        seen: time(r.seen),
        attempts: count(r.attempts),
        correct: count(r.correct),
        wrong: count(r.wrong),
        hints: count(r.hints),
        passed: r.passed === true,
        step: Math.min(count(r.step), REVISION_RULES.intervalsDays.length - 1),
        due: time(r.due) === undefined ? null : time(r.due),
        wrongOpen: r.wrongOpen === true,
      };
      if (r.lastAt !== undefined) rec.lastAt = time(r.lastAt);
      if (r.lastCorrect !== undefined) rec.lastCorrect = r.lastCorrect === true;
      if (typeof r.rewardDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.rewardDay)) {
        rec.rewardDay = r.rewardDay;
        rec.rewardExp = Math.min(count(r.rewardExp), REVISION_RULES.cardDailyCap);
      }
      cards[id] = rec;
    }
    const out = { last: null, cards };
    if (raw.last && typeof raw.last.cardId === "string" && cards[raw.last.cardId]) out.last = { cardId: raw.last.cardId, at: time(raw.last.at) };
    if (raw.font !== undefined) out.font = [0, 1, 2].includes(raw.font) ? raw.font : 0;
    return out;
  }

  ITE.revision = {
    REVISION_RULES,
    TOPICS,
    ELECTIVES,
    STATUS_NAMES,
    chapters,
    chapterById,
    cardsOf,
    cardById,
    backLinks,
    search,
    status,
    chapterProgress,
    dueCards,
    open,
    finishReading,
    answer,
    lastCard,
    sanitize,
  };
})(globalThis);
