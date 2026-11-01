// 答題衝刺 screen (2026-11-01). Rules in src/core/rush.js. The leader runs on a
// road; three doors carry the answers. A real-time loop drains the clock and
// updates the bar in place; choosing a door redraws the screen.
(function (root) {
  const R = root.ITE.rush;
  const app = root.ITE.app;
  const { h } = app;
  const sprites = root.ITE.sprites;
  const data = root.ITE.gameData;
  const RR = R.RUSH_RULES;

  let state = null;
  let timer = null;
  let lastTick = 0;
  let flash = null; // { correct, answerText } shown briefly after a door

  const rng = () => root.ITE.rng.createRng(Date.now() ^ Math.floor(Math.random() * 2 ** 31));

  function stop() {
    if (timer) root.clearInterval(timer);
    timer = null;
  }

  function loop() {
    if (!state || state.over || !root.document.querySelector(".screen.rush-run")) return stop();
    const now = Date.now();
    state = R.tick(state, Math.min(1000, now - lastTick)); // time away does not count
    lastTick = now;
    if (state.over) return finish();
    const fill = root.document.querySelector(".rush-time-fill");
    const num = root.document.querySelector(".rush-time-num");
    if (fill) fill.style.width = `${Math.round((state.timeMs / RR.maxMs) * 100)}%`;
    if (num) num.textContent = `${Math.ceil(state.timeMs / 1000)} 秒`;
    if (fill) fill.classList.toggle("low", state.timeMs < 8000);
  }

  function begin() {
    const pool = app.questionPool;
    state = R.start(pool, rng());
    if (!state) return;
    flash = null;
    app.sfx("stageStart");
    lastTick = Date.now();
    run();
    stop();
    timer = root.setInterval(loop, 100);
  }

  function choose(letter) {
    if (!state || state.over) return;
    const q = state.current.q;
    state = R.choose(state, letter, rng());
    app.recordAnswer(q, state.last.correct, false);
    const ans = root.ITE.questions.optionsOf(q).find((o) => o.letter === q.answer).text;
    flash = { correct: state.last.correct, answerText: ans, key: Date.now() };
    app.sfx(state.last.correct ? "correct" : "wrong");
    if (state.over) return finish();
    run();
  }

  let result = null;
  function finish() {
    stop();
    const save = app.getSave();
    const r = R.claim(save.profile, state.passed, Date.now());
    app.setSave({ ...save, profile: r.profile });
    result = { passed: state.passed, wrong: state.wrong, wrongIds: state.wrongIds, shards: r.shards, rewarded: r.rewarded };
    app.sfx(state.passed >= 10 ? "win" : "lose");
    state = null;
    showResult();
  }

  const DIFF = { easy: "簡單", medium: "中等", hard: "困難" };
  const BITS = ["01", "10", "</>", "0x", "{}", "11", "IP", "&&"];

  // Computer-themed run screen (user 2026-11-01: 「欠電腦主題設計」): a RUSH.exe
  // window over a neon data highway, the question as a program window titled
  // with its topic, and the doors as PORT 01–03 server gates.
  function run() {
    const s = state;
    const q = s.current.q;
    const leader = app.getSave().profile.team[0];
    const timePct = Math.round((s.timeMs / RR.maxMs) * 100);
    const topic = root.ITE.questions.TOPICS[q.topic_id] || q.topic_id;
    app.render(
      h(
        "main",
        { class: "screen battle rush-run" },
        h(
          "section",
          { class: "rush-window" },
          h(
            "div",
            { class: "rush-titlebar" },
            h("span", { class: "rush-dots", "aria-hidden": "true" }, h("i"), h("i"), h("i")),
            h("span", { class: "rush-title" }, "RUSH.exe ─ 答題衝刺"),
            h("button", { class: "rush-quit", onclick: () => (stop(), finish()), "aria-label": "結束衝刺" }, "✕")
          ),
          h(
            "div",
            { class: "rush-hud" },
            h("div", { class: "rush-time", role: "meter", "aria-label": "剩餘時間" }, h("div", { class: `rush-time-fill${s.timeMs < 10000 ? " low" : ""}`, style: `width:${timePct}%` }), h("span", { class: "rush-time-num" }, `${Math.ceil(s.timeMs / 1000)} 秒`)),
            h("span", { class: "rush-led" }, `🚪 ${s.passed}`),
            h("span", { class: "rush-led small" }, `×${R.speed(s).toFixed(1)}`)
          ),
          h(
            "div",
            { class: "rush-scene" },
            h("div", { class: "rush-grid", "aria-hidden": "true" }),
            h("div", { class: "rush-bits", "aria-hidden": "true" }, BITS.map((b, i) => h("span", { style: `--i:${i}` }, b))),
            h("div", { class: "rush-lane", "aria-hidden": "true" }, h("span"), h("span"), h("span")),
            flash ? h("div", { class: `rush-flash ${flash.correct ? "ok" : "ng"}` }, flash.correct ? `+${RR.correctMs / 1000} 秒` : `−${RR.wrongMs / 1000} 秒`) : null,
            h("div", { class: "rush-runner", html: leader ? sprites.character(leader, flash && !flash.correct ? "speechless" : "happy") : sprites.hero("happy") })
          )
        ),
        flash && !flash.correct ? h("p", { class: "rush-answer" }, `✖ 正確答案：${flash.answerText}`) : null,
        h(
          "section",
          { class: "rush-qwin" },
          h("div", { class: "rush-qbar" }, h("span", { class: "rush-chip" }, `📂 ${topic}`), q.difficulty ? h("span", { class: `rush-chip diff-${q.difficulty}` }, DIFF[q.difficulty] || q.difficulty) : null),
          h("div", { class: "rush-qbody" }, app.prevQuestionBox(q), h("p", { class: "stem" }, q.stem))
        ),
        h(
          "div",
          { class: "rush-doors" },
          s.current.doors.map((d, i) =>
            h(
              "button",
              { class: `rush-door door-${i}`, onclick: () => choose(d.letter), "aria-label": `門 ${i + 1}：${d.text}` },
              h("span", { class: "rush-port" }, h("i"), `PORT 0${i + 1}`),
              h("span", { class: "rush-door-text" }, d.text)
            )
          )
        )
      )
    );
  }

  function showResult() {
    const r = result;
    const profile = app.getSave().profile;
    const wrongQs = r.wrongIds.map((id) => app.questionPool.find((q) => q.question_id === id)).filter(Boolean);
    app.render(
      h(
        "main",
        { class: "screen result rush-result" },
        h("h1", { class: r.passed >= 10 ? "win" : "lose" }, "衝刺結束！"),
        h("div", { class: "result-sprite", html: root.ITE.gear.icon(RR.itemId, 1) }),
        h("dl", { class: "stats" }, h("dt", {}, "通過的門"), h("dd", {}, String(r.passed)), h("dt", {}, "答錯"), h("dd", {}, String(r.wrong)), h("dt", {}, "最佳紀錄"), h("dd", {}, String((profile.rush && profile.rush.best) || r.passed))),
        r.rewarded
          ? h("p", { class: "reward-line reward-material" }, r.shards ? `獲得 雷神鍵盤碎片 ×${r.shards}（共 ${R.shardsOf(profile)} / ${RR.unlockShards}）` : `通過 ${RR.shardSteps[0][0]} 道門才有碎片，再試一次！`)
          : h("p", { class: "hint center" }, "今日 3 次領獎已用完，這一局是練習。明天再來！"),
        wrongQs.length
          ? h("section", { class: "review" }, h("h2", {}, "溫習答錯的題目"), wrongQs.map((q) => h("div", { class: "review-item" }, h("p", { class: "stem" }, q.stem), h("p", { class: "review-ans" }, `正確答案：${root.ITE.questions.optionsOf(q).find((o) => o.letter === q.answer).text}`), h("p", { class: "review-exp" }, q.explanation))))
          : null,
        h("div", { class: "menu" }, h("button", { class: "btn btn-primary", onclick: begin }, "再衝一次"), h("button", { class: "btn", onclick: () => show() }, "返回"))
      )
    );
  }

  function unlock() {
    const r = R.unlock(app.getSave().profile, data);
    if (r.error) return show();
    app.setSave({ ...app.getSave(), profile: r.profile });
    app.sfx("gachaSSR");
    show("合成成功！「雷神鍵盤」已加入你的裝備，可以到「角色隊伍 → 裝備」裝上。");
  }

  function show(message) {
    stop();
    state = null;
    const profile = app.getSave().profile;
    const item = data.equipment.find((e) => e.id === RR.itemId);
    const owned = profile.owned.equipment.includes(RR.itemId);
    const have = R.shardsOf(profile);
    const used = R.playsToday(profile, Date.now());
    app.render(
      h(
        "main",
        { class: "screen trial rush" },
        h("header", { class: "topbar" }, h("button", { class: "btn-back", onclick: app.showStages, "aria-label": "返回" }, "‹"), h("h1", {}, "答題衝刺")),
        app.profileBar(),
        message ? h("p", { class: "note", role: "status" }, message) : null,
        h(
          "section",
          { class: "panel trial-hero" },
          h("div", { class: "trial-sprite rush-item", html: root.ITE.gear.icon(RR.itemId, 1) }),
          h("p", { class: "gacha-name" }, item ? item.name : "雷神鍵盤", h("span", { class: "rarity rarity-UR" }, "UR")),
          h("p", { class: "hint center" }, item ? `${item.levels.map((l, i) => `第 ${i + 1} 階：${l.text}`).join("｜")}。不會在盲盒出現。` : ""),
          owned
            ? h("p", { class: "note" }, `已擁有 ✓　多出的碎片：${have}（第三階進化用）`)
            : [
                h("div", { class: "meter", role: "meter", "aria-label": "雷神鍵盤碎片" }, h("span", { class: "meter-label" }, "碎片"), h("span", { class: "meter-track" }, h("span", { class: "meter-fill fill-exp", style: `width:${Math.min(100, Math.round((have / RR.unlockShards) * 100))}%` })), h("span", { class: "meter-num" }, `${have} / ${RR.unlockShards}`)),
                h("button", { class: "btn btn-primary", onclick: unlock, ...(R.canUnlock(profile) ? {} : { disabled: "" }) }, `合成雷神鍵盤（${RR.unlockShards} 碎片）`),
              ]
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "玩法"),
          h("ul", { class: "guide-list" }, [
            `開始有 ${RR.startMs / 1000} 秒，時間不停減少，越跑越快。`,
            `每題有三道門，走進正確答案的門 +${RR.correctMs / 1000} 秒，走錯 −${RR.wrongMs / 1000} 秒。`,
            `時間用完便結束。通過 5／10／15／20／30 道門分別得 1／2／3／4／5 個碎片。`,
            `每日 ${RR.dailyRewards} 次領獎（香港時間 00:00 重置），之後可繼續練習。不扣體力。`,
          ].map((t) => h("li", {}, t))),
          h("p", { class: "note" }, `今日領獎：${Math.min(used, RR.dailyRewards)} / ${RR.dailyRewards}　最佳：${(profile.rush && profile.rush.best) || 0} 道門`),
          h("button", { class: "btn btn-primary", onclick: begin }, used >= RR.dailyRewards ? "練習衝刺" : "開始衝刺")
        )
      )
    );
  }

  root.ITE.rushUi = { show: () => show() };
})(globalThis);
