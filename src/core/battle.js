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
    // Balance 2026-11-01 (user 「套用建議數值」): in DSE, limited and 帝王/魔王
    // stages the boss grows with the team, (team stat / 100) ^ 0.7, so a strong
    // team still has to answer well. Story and practice stages stay fixed.
    bossScaleExp: 0.7,
    bossScaleKinds: ["world", "limited", "trial"],
  };

  // Boss HP and attack for this team: never weaker than the stage's numbers.
  function scaledBoss(stage, team) {
    const b = stage.boss;
    if (!team || !team.length || !BALANCE.bossScaleKinds.includes(stage.kind)) return { hp: b.maxHp, attack: b.attack };
    const t = ITE.profile.teamStats(team);
    const f = (v) => Math.max(1, Math.pow(v / 100, BALANCE.bossScaleExp));
    return { hp: Math.round((b.maxHp * f(t.attack)) / 10) * 10, attack: Math.round(b.attack * f(t.hp)) };
  }

  // team (optional): character snapshots from ITE.profile.teamSnapshot. With a
  // team, party HP is the members' average HP and damage scales with their
  // average attack plus the best specialty bonus for the question's topic.
  // loadout (optional): equipment from ITE.equipment.battleLoadout.
  // seen (optional): times each question was answered on this device; the
  // least-seen questions are drawn first (ITE.questions.drawQuestions).
  function createBattle(stage, questions, rng, team, loadout, seen) {
    if (!questions.length) throw new Error("no questions available for this stage");
    const deck = ITE.questions
      .drawQuestions(questions, stage.questionCount, rng, stage.topicIds, seen)
      .map((q) => ITE.questions.shuffleOptions(q, rng));
    if (!deck.length) throw new Error("no questions match this stage's topics");
    return {
      stageId: stage.id,
      phase: "question",
      boss: (() => {
        const b = scaledBoss(stage, team);
        return { name: stage.boss.name, hp: b.hp, maxHp: b.hp, attack: b.attack };
      })(),
      party: (() => {
        const hp = team && team.length ? ITE.profile.teamStats(team).hp : BALANCE.partyMaxHp;
        return { hp, maxHp: hp };
      })(),
      team: team && team.length ? team : [],
      loadout: loadout || [],
      skills: {},
      hidden: {},
      armedBonus: 0,
      deck,
      index: 0,
      combo: 0,
      outcome: null,
      lastResult: null,
      log: [],
      // 魔王限時: HP drain per second (src/core/trial.js tick); null otherwise.
      timed: stage.timed ? { drainPct: stage.timed.drainPct, qIndex: 0, qElapsed: 0, drained: 0 } : null,
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
    const team = state.team || [];
    const bonus = correct && team.length ? ITE.profile.specialtyBonus(team, q.topic_id) : null;
    let damage = correct ? damageFor(combo) : 0;
    if (correct && team.length) {
      damage = Math.round((damage * ITE.profile.teamStats(team).attack) / 100 * (1 + (bonus ? bonus.bonus : 0)));
    }
    // 電腦 bonus is consumed by this answer and lands only if it is correct.
    // 雷神鍵盤 (UR combo item): more damage the longer the Combo.
    const comboGear = correct ? (state.loadout || []).filter((x) => x.type === "combo").reduce((s, x) => s + (x.per_combo || 0), 0) * combo : 0;
    const equipBonus = (correct ? state.armedBonus || 0 : 0) + comboGear;
    damage += equipBonus;
    const taken = correct ? 0 : ITE.equipment ? ITE.equipment.damageTaken(state, state.boss.attack) : state.boss.attack;
    const boss = { ...state.boss, hp: Math.max(0, state.boss.hp - damage) };
    const party = { ...state.party, hp: Math.max(0, state.party.hp - taken) };

    let outcome = null;
    if (boss.hp === 0) outcome = "won";
    else if (party.hp === 0) outcome = "lost";
    else if (state.index + 1 >= state.deck.length) outcome = "lost"; // ran out of questions

    const lastResult = { questionId: q.question_id, choice, correct, damage, taken, combo, bonus, equipBonus };
    return {
      ...state,
      phase: "feedback",
      boss,
      party,
      combo,
      outcome,
      lastResult,
      armedBonus: 0,
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
  // never shown) in the saved option order; returns null if any saved question is
  // no longer in the pool or its saved order is malformed.
  function rebindDeck(state, pool) {
    const byId = new Map(pool.map((q) => [q.question_id, q]));
    const deck = state.deck.map((saved) => {
      const live = saved && byId.get(saved.question_id);
      if (!live) return null;
      if (saved.option_order === undefined) return live;
      return ITE.questions.isOptionOrder(saved.option_order) ? ITE.questions.applyOptionOrder(live, saved.option_order) : null;
    });
    if (deck.some((q) => !q)) return null;
    return { ...state, deck };
  }

  ITE.battle = { BALANCE, createBattle, currentQuestion, damageFor, answer, next, summary, rebindDeck };
})(globalThis);
