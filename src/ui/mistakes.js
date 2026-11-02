// 錯題本 screens (src/core/mistakes.js): the list of wrong questions with
// world filter and sort, tick boxes to choose what to revisit, a quick look at
// a question's answer, and the review run (no stamina, no boss, no losing).
(function (root) {
  const app = root.ITE.app;
  const { h } = app;
  const M = root.ITE.mistakes;
  const Q = root.ITE.questions;
  const R = root.ITE.revision;

  let world = null;
  let sort = "recent";
  let picked = new Set();
  let opened = null; // question ID whose answer is shown in the list
  let back = () => app.showHome();

  const now = () => Date.now();
  const profile = () => app.getSave().profile;
  const setProfile = (p) => app.setSave({ ...app.getSave(), profile: p });

  // Approved DSE questions plus the story questions this build allows.
  function pool() {
    const story = root.ITE.storyBank ? Q.filterForMode(root.ITE.storyBank.questions, app.buildMode) : [];
    return app.questionPool.concat(story);
  }

  const dateText = (t) => {
    const d = new Date(t + 8 * 3600 * 1000);
    return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  };
  const worldName = (id) => (R ? (R.TOPICS.find((t) => t.id === id) || {}).name : id) || "";

  function optionList(q) {
    return h("ol", { class: "mk-options" }, Q.optionsOf(q).map((o) => h("li", { class: o.letter === q.answer ? "mk-right" : "" }, `${o.letter}. ${o.text}`, o.letter === q.answer ? "　✓ 正確答案" : "")));
  }

  function row(e) {
    const q = e.question;
    const on = picked.has(e.id);
    const box = h("input", { type: "checkbox", class: "mk-check", "aria-label": `選擇：${q.stem.slice(0, 30)}`, ...(on ? { checked: "" } : {}) });
    box.addEventListener("change", () => {
      if (box.checked) picked.add(e.id);
      else picked.delete(e.id);
      show();
    });
    const w = M.worldOf(q);
    return h(
      "div",
      { class: on ? "mk-row picked" : "mk-row" },
      h("label", { class: "mk-pick" }, box),
      h(
        "div",
        { class: "mk-main" },
        h("p", { class: "mk-stem" }, q.stem),
        h(
          "p",
          { class: "mk-meta" },
          w ? h("span", { class: "rv-chip" }, `${w} ${worldName(w)}`) : null,
          /^STORY-/.test(e.id) ? h("span", { class: "rv-chip" }, "故事模式") : null,
          ` 錯 ${e.wrong} 次・最近 ${dateText(e.lastWrong)}`,
          e.streak ? `・重溫已答對 ${e.streak}/${M.MISTAKE_RULES.masterStreak}` : ""
        ),
        opened === e.id ? [optionList(q), h("p", { class: "mk-explain" }, q.explanation)] : null,
        h(
          "div",
          { class: "mk-actions" },
          h("button", { class: "btn btn-small", onclick: () => ((opened = opened === e.id ? null : e.id), show()) }, opened === e.id ? "收起答案" : "看答案"),
          h("button", { class: "btn btn-small", onclick: () => (setProfile(M.remove(profile(), e.id)), picked.delete(e.id), show()) }, "移出錯題本")
        )
      )
    );
  }

  function show(backTo) {
    if (backTo) back = backTo;
    const all = M.list(profile(), pool(), { sort });
    const entries = M.list(profile(), pool(), { world, sort });
    // Drop ticks for questions no longer listed.
    picked = new Set([...picked].filter((id) => all.some((e) => e.id === id)));
    const mastered = (profile().mistakes && profile().mistakes.mastered) || 0;
    const chip = (label, active, onclick) => h("button", { class: active ? "mk-chip active" : "mk-chip", "aria-pressed": active ? "true" : "false", onclick }, label);
    const allPicked = entries.length > 0 && entries.every((e) => picked.has(e.id));
    app.render(
      h(
        "main",
        { class: "screen mistakes" },
        h("header", { class: "topbar" }, h("button", { class: "btn-back", onclick: back, "aria-label": "返回" }, "‹"), h("h1", {}, "📕 錯題本")),
        h("p", { class: "hint center" }, `共 ${all.length} 題錯題・已掌握 ${mastered} 題。重溫時連續答對 ${M.MISTAKE_RULES.masterStreak} 次就會移出。`),
        h(
          "div",
          { class: "mk-filters", role: "group", "aria-label": "篩選" },
          chip("全部", !world, () => ((world = null), show())),
          ["A", "B", "C", "D", "E"].map((w) => chip(w, world === w, () => ((world = w), show())))
        ),
        h("div", { class: "mk-filters", role: "group", "aria-label": "排序" }, chip("最近答錯", sort === "recent", () => ((sort = "recent"), show())), chip("錯得最多", sort === "most", () => ((sort = "most"), show()))),
        entries.length
          ? h(
              "section",
              { class: "panel" },
              h(
                "button",
                {
                  class: "btn btn-small mk-all",
                  onclick: () => {
                    entries.forEach((e) => (allPicked ? picked.delete(e.id) : picked.add(e.id)));
                    show();
                  },
                },
                allPicked ? "取消全選" : world ? `全選 ${world} 課題（${entries.length}）` : `全選（${entries.length}）`
              ),
              entries.map(row)
            )
          : h("section", { class: "panel" }, h("p", { class: "hint" }, all.length ? "這個課題沒有錯題。" : "暫時沒有錯題。關卡中答錯的題目會自動放進這裏，方便日後重溫。")),
        h(
          "div",
          { class: "mk-bar" },
          h("span", { class: "mk-count" }, `已選 ${picked.size} 題`),
          h("button", { class: "btn btn-primary", onclick: () => startReview(all.filter((e) => picked.has(e.id)).map((e) => e.question)), ...(picked.size ? {} : { disabled: "" }) }, "開始重溫 ›")
        )
      )
    );
  }

  // ---------- review ----------
  let run = null;

  function startReview(questions) {
    if (!questions.length) return;
    const rng = root.ITE.rng.createRng(now());
    run = { deck: Q.shuffleLinked(questions, rng).map((q) => Q.shuffleOptions(q, rng)), index: 0, right: 0, mastered: 0, exp: 0, answer: null };
    app.sfx("stageStart");
    showQuestion();
  }

  function choose(letter) {
    if (run.answer) return;
    const q = run.deck[run.index];
    const correct = letter === q.answer;
    app.recordAnswer(q, correct, false, { review: true });
    const r = M.reviewAnswer(profile(), q.question_id, correct, now());
    setProfile(r.profile);
    if (r.exp) app.grantReward({ exp: r.exp, coins: 0 });
    run = { ...run, right: run.right + (correct ? 1 : 0), mastered: run.mastered + (r.mastered ? 1 : 0), exp: run.exp + r.exp, answer: { letter, correct, exp: r.exp, mastered: r.mastered } };
    showQuestion();
  }

  function showQuestion() {
    const q = run.deck[run.index];
    if (!q) return showSummary();
    const a = run.answer;
    const item = profile().mistakes && profile().mistakes.items[q.question_id];
    const left = item ? M.MISTAKE_RULES.masterStreak - (item.streak || 0) : 0;
    app.render(
      h(
        "main",
        { class: "screen mistakes" },
        h("header", { class: "topbar" }, h("button", { class: "btn-back", onclick: () => show(), "aria-label": "結束重溫" }, "‹"), h("h1", {}, `錯題重溫 ${run.index + 1}/${run.deck.length}`)),
        h(
          "section",
          { class: "panel" },
          app.prevQuestionBox ? app.prevQuestionBox(q) : null,
          h("p", { class: "stem" }, q.stem),
          h(
            "div",
            { class: "rv-options" },
            Q.optionsOf(q).map((o) => {
              const cls = !a ? "btn rv-option" : o.letter === q.answer ? "btn rv-option rv-option-right" : o.letter === a.letter ? "btn rv-option rv-option-wrong" : "btn rv-option";
              return h("button", { class: cls, onclick: () => choose(o.letter), ...(a ? { disabled: "" } : {}) }, `${o.letter}. ${o.text}`);
            })
          ),
          a
            ? h(
                "div",
                { class: "rv-feedback", "aria-live": "polite" },
                h("p", { class: a.correct ? "rv-ok" : "rv-ng" }, a.correct ? "✓ 答對！" : `✕ 未答對。正確答案是 ${q.answer}`),
                h("p", { class: "rv-p" }, q.explanation),
                a.mastered ? h("p", { class: "rv-reward" }, "🎉 已掌握！這題已移出錯題本。") : a.correct ? h("p", { class: "hint" }, `再連續答對 ${left} 次就會移出錯題本。`) : h("p", { class: "hint" }, "這題會留在錯題本，下次再試。"),
                a.exp ? h("p", { class: "rv-reward" }, `+${a.exp} 經驗（第一次改正這題）`) : null,
                h("button", { class: "btn btn-primary rv-next", onclick: () => ((run = { ...run, index: run.index + 1, answer: null }), showQuestion()) }, run.index + 1 < run.deck.length ? "下一題 ›" : "看結果")
              )
            : null
        )
      )
    );
    root.scrollTo && root.scrollTo(0, 0);
  }

  function showSummary() {
    app.sfx(run.right === run.deck.length ? "win" : "tap");
    app.render(
      h(
        "main",
        { class: "screen mistakes" },
        h("header", { class: "topbar" }, h("button", { class: "btn-back", onclick: () => show(), "aria-label": "返回錯題本" }, "‹"), h("h1", {}, "重溫完成")),
        h(
          "section",
          { class: "panel" },
          h("p", { class: "rv-p" }, `答對 ${run.right} / ${run.deck.length} 題`),
          h("p", { class: "rv-p" }, `已掌握並移出：${run.mastered} 題`),
          run.exp ? h("p", { class: "rv-reward" }, `+${run.exp} 經驗`) : h("p", { class: "hint" }, `第一次改正每題 +${M.MISTAKE_RULES.fixExp} 經驗，每日最多 +${M.MISTAKE_RULES.dailyExpCap}。`),
          h("button", { class: "btn btn-primary", onclick: () => show() }, "返回錯題本")
        )
      )
    );
  }

  const count = () => M.count(profile(), pool());

  root.ITE.mistakesUi = { show, count };
})(globalThis);
