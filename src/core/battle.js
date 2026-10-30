// Boss battle state machine (PROTOTYPE). All numbers below are placeholder
// balance values — wrong-answer penalty, damage formula and time limits are
// OPEN_DECISION in docs/05_DECISIONS.md.
//
// Battle state is plain JSON so it can be saved and resumed mid-battle.
// Phases: "question" -> answer() -> "feedback" -> next() -> "question" | "won" | "lost"
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const BALANCE = {
    baseDamage: 50,
    comboBonusPerHit: 10, // extra damage per consecutive correct answer after the first
    comboBonusCap: 30,
    partyMaxHp: 100,
  };

  function createBattle(stage, questions, rng) {
    if (!questions.length) throw new Error("no questions available for this stage");
    const deck = ITE.questions.drawQuestions(questions, stage.questionCount, rng, stage.topicIds);
    if (!deck.length) throw new Error("no questions match this stage's topics");
    return {
      stageId: stage.id,
      phase: "question",
      boss: { name: stage.boss.name, hp: stage.boss.maxHp, maxHp: stage.boss.maxHp, attack: stage.boss.attack },
      party: { hp: BALANCE.partyMaxHp, maxHp: BALANCE.partyMaxHp },
      deck,
      index: 0,
      combo: 0,
      outcome: null,
      lastResult: null,
      log: [],
    };
  }

  function currentQuestion(state) {
    return state.deck[state.index] || null;
  }

  function damageFor(combo) {
    return BALANCE.baseDamage + Math.min(BALANCE.comboBonusCap, Math.max(0, combo - 1) * BALANCE.comboBonusPerHit);
  }

  // choice: "A".."D", or null for a skipped/timed-out question (counts as wrong).
  function answer(state, choice) {
    if (state.phase !== "question") return state; // guards double-taps
    const q = currentQuestion(state);
    const correct = choice === q.answer;
    const combo = correct ? state.combo + 1 : 0;
    const damage = correct ? damageFor(combo) : 0;
    const taken = correct ? 0 : state.boss.attack;
    const boss = { ...state.boss, hp: Math.max(0, state.boss.hp - damage) };
    const party = { ...state.party, hp: Math.max(0, state.party.hp - taken) };

    let outcome = null;
    if (boss.hp === 0) outcome = "won";
    else if (party.hp === 0) outcome = "lost";
    else if (state.index + 1 >= state.deck.length) outcome = "lost"; // ran out of questions

    const lastResult = { questionId: q.question_id, choice, correct, damage, taken, combo };
    return {
      ...state,
      phase: "feedback",
      boss,
      party,
      combo,
      outcome,
      lastResult,
      log: state.log.concat([lastResult]),
    };
  }

  function next(state) {
    if (state.phase !== "feedback") return state;
    if (state.outcome) return { ...state, phase: state.outcome };
    return { ...state, phase: "question", index: state.index + 1, lastResult: null };
  }

  function summary(state) {
    const answered = state.log.length;
    const correct = state.log.filter((r) => r.correct).length;
    return {
      outcome: state.outcome,
      answered,
      correct,
      accuracy: answered ? Math.round((correct / answered) * 100) : 0,
      maxCombo: state.log.reduce((m, r) => Math.max(m, r.combo), 0),
      wrongQuestionIds: state.log.filter((r) => !r.correct).map((r) => r.questionId),
    };
  }

  // A resumed battle must only use questions the current build allows. Replaces
  // each saved deck entry with the live pool's copy (so stale/edited saved text is
  // never shown); returns null if any saved question is no longer in the pool.
  function rebindDeck(state, pool) {
    const byId = new Map(pool.map((q) => [q.question_id, q]));
    const deck = state.deck.map((q) => q && byId.get(q.question_id));
    if (deck.some((q) => !q)) return null;
    return { ...state, deck };
  }

  ITE.battle = { BALANCE, createBattle, currentQuestion, damageFor, answer, next, summary, rebindDeck };
})(globalThis);
