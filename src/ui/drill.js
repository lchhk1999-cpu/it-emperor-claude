// 操練區 screen: choose a world and difficulty, then answer random questions
// with no stamina, rewards or HP. Leave at any time.
(function (root) {
  const D = root.ITE.drill;
  const Dg = root.ITE.dungeons;
  const Q = root.ITE.questions;
  const app = root.ITE.app;
  const { h } = app;

  const DIFFS = [[null, "任何"], ["easy", "簡單"], ["medium", "中等"], ["hard", "困難"]];
  let pick = { world: null, difficulty: null };
  let session = null;

  const rng = () => root.ITE.rng.createRng(Date.now() ^ Math.floor(Math.random() * 2 ** 31));

  function topbar(title, onBack) {
    return h("header", { class: "topbar" }, h("button", { class: "btn-back", onclick: onBack, "aria-label": "返回" }, "‹"), h("h1", {}, title));
  }

  function chips(label, items, value, set) {
    return h(
      "div",
      { class: "drill-group", role: "radiogroup", "aria-label": label },
      items.map(([v, text]) =>
        h("button", { class: v === value ? "seg-btn active" : "seg-btn", role: "radio", "aria-checked": v === value ? "true" : "false", onclick: () => set(v) }, text)
      )
    );
  }

  function showPicker() {
    const count = D.pool(app.questionPool, pick.world, pick.difficulty).length;
    app.render(
      h(
        "main",
        { class: "screen drill" },
        topbar("操練區", () => app.showStages()),
        h("p", { class: "hint center" }, "不扣體力、沒有經驗及素材，亦不會輸。隨機出題，答完即看解說，隨時可以離開。"),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "世界"),
          chips("世界", [[null, "全部"]].concat(Dg.WORLDS.map((w) => [w.id, `${w.id} ${w.name}`])), pick.world, (v) => ((pick = { ...pick, world: v }), showPicker())),
          h("h2", {}, "難度"),
          chips("難度", DIFFS, pick.difficulty, (v) => ((pick = { ...pick, difficulty: v }), showPicker())),
          h("p", { class: "hint" }, count ? `共 ${count} 題可以操練。` : "這個組合暫時未有題目。"),
          h("button", { class: "btn btn-primary", onclick: begin, ...(count ? {} : { disabled: "" }) }, "開始操練")
        )
      )
    );
  }

  function begin() {
    const r = rng();
    session = D.start(app.questionPool, pick.world, pick.difficulty, r);
    if (!session) return showPicker();
    session = D.next(session, r);
    showQuestion();
  }

  function onAnswer(letter) {
    const before = session;
    session = D.answer(session, letter);
    if (session !== before) app.recordAnswer(session.current, session.last.correct);
    showQuestion();
  }

  function showQuestion() {
    const q = session.current;
    const r = session.last;
    const options = Q.optionsOf(q).map(({ letter, text }) => {
      let cls = "opt";
      if (r) cls += letter === q.answer ? " opt-correct" : letter === r.choice ? " opt-wrong" : " opt-dim";
      return h(
        "button",
        { class: cls, onclick: () => onAnswer(letter), ...(r ? { disabled: "" } : {}) },
        h("span", { class: "opt-letter" }, letter),
        h("span", { class: "opt-text" }, text)
      );
    });
    const accuracy = session.answered ? Math.round((session.correct / session.answered) * 100) : 0;
    app.render(
      h(
        "main",
        { class: "screen drill" },
        topbar("操練區", finish),
        h(
          "p",
          { class: "drill-stats" },
          h("span", {}, `答對 ${session.correct} / ${session.answered}`),
          h("span", {}, `正確率 ${accuracy}%`),
          h("span", {}, `連續答對 ${session.streak}`)
        ),
        h(
          "section",
          { class: "question-card" },
          h("div", { class: "q-meta" }, h("span", { class: "chip" }, Q.TOPICS[q.topic_id] || q.topic_id), q.review_status !== "approved" ? h("span", { class: "chip chip-warn" }, `狀態：${q.review_status}`) : null),
          h("p", { class: "stem" }, q.stem),
          h("div", { class: "options" }, options)
        ),
        r
          ? h(
              "section",
              { class: `explain ${r.correct ? "explain-ok" : "explain-ng"}`, "aria-live": "polite" },
              h("div", { class: "explain-title" }, r.correct ? "答對了！" : `答錯了… 正確答案是 ${q.answer}`),
              h("p", {}, q.explanation),
              !r.correct && q.wrong_tip ? h("p", { class: "wrong-tip" }, `提示：${q.wrong_tip}`) : null,
              h(
                "div",
                { class: "menu" },
                h("button", { class: "btn btn-primary", onclick: () => ((session = D.next(session, rng())), showQuestion()) }, "下一題"),
                h("button", { class: "btn", onclick: finish }, "結束操練")
              )
            )
          : null
      )
    );
  }

  function finish() {
    if (!session || !session.answered) return showPicker();
    const s = session;
    session = null;
    app.render(
      h(
        "main",
        { class: "screen drill" },
        topbar("操練完成", showPicker),
        h(
          "dl",
          { class: "stats" },
          h("dt", {}, "答題"), h("dd", {}, String(s.answered)),
          h("dt", {}, "答對"), h("dd", {}, String(s.correct)),
          h("dt", {}, "正確率"), h("dd", {}, `${Math.round((s.correct / s.answered) * 100)}%`),
          h("dt", {}, "最長連續答對"), h("dd", {}, String(s.best))
        ),
        h("p", { class: "hint center" }, "操練不設獎勵；答題數會計入每日任務及稱號。"),
        h("div", { class: "menu" }, h("button", { class: "btn btn-primary", onclick: showPicker }, "再操練"), h("button", { class: "btn", onclick: () => app.showStages() }, "返回 DSE 挑戰"))
      )
    );
  }

  root.ITE.drillUi = { show: () => ((session = null), showPicker()) };
})(globalThis);
