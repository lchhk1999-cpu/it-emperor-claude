// 操練區 (user request 2026-10-31): free practice. No stamina, no experience,
// coins or materials, no HP — pick a world and difficulty and answer random
// questions one after another, with the explanation after each answer.
// Answers still count towards daily missions and titles (they are learning).
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  // Questions for a world ("A".."E" or null = all) and difficulty (null = any).
  function pool(questions, worldId, difficulty) {
    const world = worldId ? ITE.dungeons.WORLDS.find((w) => w.id === worldId) : null;
    return questions.filter((q) => (!world || world.topics.includes(q.topic_id)) && (!difficulty || q.difficulty === difficulty));
  }

  // A drill session: the pool in random order, reshuffled when it runs out.
  function start(questions, worldId, difficulty, rng) {
    const list = pool(questions, worldId, difficulty);
    if (!list.length) return null;
    return { worldId, difficulty, order: ITE.questions.shuffleLinked(list, rng), index: 0, answered: 0, correct: 0, streak: 0, best: 0, current: null, last: null };
  }

  // The next question (options shuffled); a new round starts after the last one.
  function next(session, rng) {
    let { order, index } = session;
    if (index >= order.length) {
      order = ITE.questions.shuffleLinked(order, rng);
      index = 0;
    }
    const current = ITE.questions.shuffleOptions(order[index], rng);
    return { ...session, order, index: index + 1, current, last: null };
  }

  function answer(session, letter) {
    if (!session.current || session.last) return session;
    const correct = letter === session.current.answer;
    const streak = correct ? session.streak + 1 : 0;
    return {
      ...session,
      answered: session.answered + 1,
      correct: session.correct + (correct ? 1 : 0),
      streak,
      best: Math.max(session.best, streak),
      last: { choice: letter, correct },
    };
  }

  ITE.drill = { pool, start, next, answer };
})(globalThis);
