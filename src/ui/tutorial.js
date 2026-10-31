// 新手教學 (user request 2026-10-31): a short card walkthrough shown on the
// first home visit, and again from 設定. Skippable at any step.
(function (root) {
  const app = root.ITE.app;
  const { h } = app;
  const sprites = root.ITE.sprites;

  // art: which sprite to show. online: only in the online edition.
  const STEPS = [
    { art: "leader", title: "歡迎來到《IT帝》！", text: "你是 IT 學院的新生。Bug 王四處搗亂，只有用 ICT 知識才可以打倒牠！" },
    { art: "boss", title: "答題就是攻擊", text: "每題有 4 個選項。答對就攻擊 Boss，連續答對有 Combo 加成；答錯會被反擊，但一定會看到解說。" },
    { art: "leader", title: "故事模式：慢慢學", text: "跟住 A–E 五個世界逐關學習。答錯不會失敗，題目稍後會再出現，最適合溫習。" },
    { art: "boss", title: "DSE 挑戰：考考自己", text: "用體力挑戰真實 DSE 題，勝出得素材和金幣。體力不足？仍然可以用練習模式答題。" },
    { art: "leader", title: "培養隊伍", text: "用素材為角色升級及進化。完成每日任務可得寶石，用來抽新角色——寶石只可以靠學習取得，不設購買。" },
    { art: "leader", title: "校際公會", text: "與同校同學組成公會，每日一次合力攻擊公會 Boss，每週比較各校總傷害。", online: true },
    { art: "leader", title: "準備好了！", text: "由第一課開始吧。之後可以在主頁「設定」再看一次這個教學。" },
  ];

  function steps() {
    return STEPS.filter((s) => !s.online || app.online);
  }

  function art(kind) {
    if (kind === "boss") return sprites.bugKing("smug");
    const leader = app.getSave().profile.team[0];
    return leader ? sprites.character(leader, "happy") : sprites.hero("happy");
  }

  function finish(next) {
    const save = app.getSave();
    app.setSave({ ...save, settings: { ...save.settings, tutorialDone: true } });
    close();
    next();
  }

  let overlay = null;

  function close() {
    if (overlay) overlay.remove();
    overlay = null;
    root.document.removeEventListener("keydown", onKey);
  }

  function onKey(e) {
    if (e.key === "Escape") finish(app.showHome);
  }

  // Shows step i over the current screen.
  function show(i = 0) {
    const list = steps();
    const step = list[i];
    const last = i === list.length - 1;
    const startFirstLesson = () => {
      const next = root.ITE.storyUi && root.ITE.storyUi.nextLevel();
      if (next) root.ITE.storyUi.showIntro(next.id);
      else app.showStages();
    };
    close();
    overlay = h(
      "div",
      { class: "tutorial-backdrop" },
      h(
        "section",
        { class: "tutorial-card", role: "dialog", "aria-modal": "true", "aria-labelledby": "tutorial-title" },
        h("p", { class: "tutorial-count" }, `新手教學 ${i + 1} / ${list.length}`),
        h("div", { class: "tutorial-art", html: art(step.art) }),
        h("h2", { id: "tutorial-title" }, step.title),
        h("p", { class: "tutorial-text" }, step.text),
        h("div", { class: "tutorial-dots", "aria-hidden": "true" }, list.map((_, k) => h("span", { class: k === i ? "dot active" : "dot" }))),
        last
          ? h(
              "div",
              { class: "tutorial-actions" },
              h("button", { class: "btn btn-primary", onclick: () => finish(startFirstLesson) }, "開始第一課"),
              h("button", { class: "btn", onclick: () => finish(app.showHome) }, "自己探索")
            )
          : h(
              "div",
              { class: "tutorial-actions" },
              h("button", { class: "btn btn-primary", onclick: () => (app.sfx("tap"), show(i + 1)) }, "下一步"),
              i > 0 ? h("button", { class: "btn", onclick: () => show(i - 1) }, "上一步") : null,
              h("button", { class: "btn-link", onclick: () => finish(app.showHome) }, "略過教學")
            )
      )
    );
    root.document.body.append(overlay);
    root.document.addEventListener("keydown", onKey);
    overlay.querySelector(".btn-primary").focus();
  }

  root.ITE.tutorialUi = { STEPS, steps, show, close };
})(globalThis);
