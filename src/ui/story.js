// Story mode screens: map (worlds and levels) -> level intro -> level battle ->
// clear screen. Fully offline: questions are bundled (src/data/story_bank.js)
// and progress lives in the save (save.story). Rules: src/core/story.js.
(function (root) {
  const St = root.ITE.story;
  const Q = root.ITE.questions;
  const app = root.ITE.app;
  const { h } = app;
  const sprites = root.ITE.sprites;
  const bank = root.ITE.storyBank;

  let run = null;
  let runLevel = null;

  const levels = () => St.buildLevels(bank, app.buildMode);
  const progress = () => app.getSave().story;

  function topbar(title, onBack, extra) {
    return h(
      "header",
      { class: "topbar" },
      h("button", { class: "btn-back", onclick: onBack, "aria-label": "返回" }, "‹"),
      h("h1", {}, title),
      extra || h("span", {})
    );
  }

  function starText(n) {
    return "★".repeat(n) + "☆".repeat(3 - n);
  }

  const lockIcon = `<svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><rect x="1.5" y="7" width="11" height="8" rx="2" fill="currentColor"/><path d="M4 7 V4.8 a3 3 0 0 1 6 0 V7" stroke="currentColor" stroke-width="2" fill="none"/></svg>`;

  // ---------- Map ----------
  function showMap() {
    if (!bank) return app.showHome();
    const all = levels();
    const prog = progress();
    const worlds = [];
    for (const l of all) {
      let w = worlds.find((x) => x.id === l.world_id);
      if (!w) worlds.push((w = { id: l.world_id, name: l.world.name, levels: [] }));
      w.levels.push(l);
    }
    const totalStars = all.reduce((s, l) => s + St.levelProgress(prog, l.id).stars, 0);
    const allCleared = all.every((l) => St.levelProgress(prog, l.id).cleared);

    app.render(
      h(
        "main",
        { class: "screen story" },
        topbar("故事模式", app.showHome, h("span", { class: "chip chip-stars", "aria-label": `已取得 ${totalStars} 粒星` }, `★ ${totalStars}`)),
        app.buildMode === "dev" ? h("p", { class: "hint center" }, "開發版：題目狀態為 review（未經教師核准），只作測試。") : null,
        allCleared
          ? h("p", { class: "all-clear" }, `全部 ${all.length} 關完成！星數 ${totalStars} / ${all.length * 3}`)
          : null,
        worlds.map((w) =>
          h(
            "section",
            { class: "panel world" },
            h("h2", {}, `世界 ${w.id}・${w.name}`),
            h(
              "div",
              { class: "level-grid" },
              w.levels.map((l) => {
                const p = St.levelProgress(prog, l.id);
                const unlocked = St.isUnlocked(all, prog, l.id);
                const canPlay = l.playable && unlocked;
                let sub;
                if (!l.enabled) sub = "即將開放";
                else if (!l.playable) sub = "等待老師審核";
                else if (!unlocked) sub = "未解鎖";
                else sub = p.cleared ? starText(p.stars) : "挑戰！";
                const cls = ["level-btn", p.cleared ? "cleared" : "", canPlay && !p.cleared ? "current" : "", canPlay ? "" : "locked"].join(" ");
                return h(
                  "button",
                  { class: cls, onclick: () => showIntro(l.id), ...(canPlay ? {} : { disabled: "", "aria-disabled": "true" }) },
                  h("span", { class: "level-id" }, l.id, !canPlay && l.enabled ? h("span", { class: "lock", html: lockIcon }) : null),
                  h("span", { class: "level-name" }, l.name),
                  h("span", { class: "level-sub" }, sub)
                );
              })
            )
          )
        )
      )
    );
  }

  // ---------- Level intro ----------
  function showIntro(levelId) {
    const l = levels().find((x) => x.id === levelId);
    const p = St.levelProgress(progress(), levelId);
    app.render(
      h(
        "main",
        { class: "screen story" },
        topbar(`${l.id} ${l.name}`, showMap),
        h(
          "section",
          { class: "panel intro" },
          h("div", { class: "intro-sprite", html: sprites.bugKing("smug") }),
          h("p", { class: "intro-scene" }, `任務：${l.story_scene}`),
          h(
            "dl",
            { class: "intro-facts" },
            h("dt", {}, "學習目標"), h("dd", {}, l.learning_goal),
            h("dt", {}, "知識範圍"), h("dd", {}, l.knowledge_scope),
            h("dt", {}, "流程"), h("dd", {}, `練習 ${St.STORY_RULES.practiceCount} 題＋小 Boss 1 題`)
          ),
          p.cleared ? h("p", { class: "hint" }, `最佳成績 ${starText(p.stars)}｜已玩 ${p.plays} 次`) : null
        ),
        h("p", { class: "hint center" }, "答錯不會失敗：看完解說，題目稍後會再出現。"),
        h("button", { class: "btn btn-primary", onclick: () => startLevel(l.id) }, "出發！")
      )
    );
  }

  // ---------- Level battle ----------
  function startLevel(levelId) {
    runLevel = levels().find((x) => x.id === levelId);
    run = St.createRun(runLevel, root.ITE.rng.createRng(Date.now()));
    app.sfx("stageStart");
    showQuestion();
  }

  function onAnswer(letter) {
    const before = run;
    run = St.answer(run, letter);
    if (run !== before) app.recordAnswer(run.question, run.lastResult.correct);
    showQuestion();
  }

  function onNext() {
    run = St.next(run);
    if (run.phase === "cleared") return finishLevel();
    showQuestion();
  }

  function showQuestion() {
    const feedback = run.phase === "feedback";
    const q = feedback ? run.question : St.current(run);
    const r = run.lastResult;
    const bossHit = feedback && r.correct;
    const heroMiss = feedback && !r.correct;
    const solved = run.questionCount - run.queue.length; // questions answered correctly so far
    const isBoss = q.boss;

    const options = Q.optionsOf(q).map(({ letter, text }) => {
      let cls = "opt";
      if (feedback) cls += letter === q.answer ? " opt-correct" : letter === r.choice ? " opt-wrong" : " opt-dim";
      return h(
        "button",
        { class: cls, onclick: () => onAnswer(letter), ...(feedback ? { disabled: "" } : {}) },
        h("span", { class: "opt-letter" }, letter),
        h("span", { class: "opt-text" }, text)
      );
    });

    app.render(
      h(
        "main",
        { class: "screen battle story" },
        topbar(
          `${runLevel.id} ${runLevel.name}`,
          showIntro.bind(null, runLevel.id),
          h("span", { class: "chip" }, `答對 ${solved} / ${run.questionCount}`)
        ),
        h(
          "section",
          { class: "arena" },
          h(
            "div",
            { class: "fighter boss" },
            app.bar(isBoss ? "小 Boss" : "Bug 小兵", run.bossHp, run.bossMaxHp, "boss"),
            h("div", { class: `sprite-wrap ${bossHit ? "shake" : ""}`, html: sprites.bugKing(bossHit ? "hurt" : heroMiss ? "smug" : "idle") }),
            bossHit ? h("div", { class: "dmg-pop" }, `-${r.damage}`) : null
          ),
          h(
            "div",
            { class: "fighter hero" },
            h("div", { class: "sprite-wrap", html: sprites.hero(heroMiss ? "speechless" : bossHit ? "happy" : "idle") })
          )
        ),
        h(
          "section",
          { class: "question-card" },
          h(
            "div",
            { class: "q-meta" },
            isBoss ? h("span", { class: "chip chip-boss" }, "小 Boss 題") : h("span", { class: "chip" }, "練習"),
            q.review_status !== "approved" ? h("span", { class: "chip chip-warn" }, `狀態：${q.review_status}`) : null
          ),
          h("p", { class: "stem" }, q.stem),
          h("div", { class: "options" }, options)
        ),
        feedback
          ? h(
              "section",
              { class: `explain ${r.correct ? "explain-ok" : "explain-ng"}`, "aria-live": "polite" },
              h("div", { class: "explain-title" }, r.correct ? `答對！造成 ${r.damage} 傷害` : `答錯了… 正確答案是 ${q.answer}`),
              h("p", {}, q.explanation),
              !r.correct ? h("p", { class: "wrong-tip" }, "這題稍後會再出現，記住解說再試一次！") : null,
              h("button", { class: "btn btn-primary", onclick: onNext }, run.queue.length ? "下一題" : "完成關卡")
            )
          : null
      )
    );
    if (feedback) {
      const panel = document.querySelector(".explain");
      if (panel) panel.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }

  // ---------- Clear ----------
  function finishLevel() {
    app.sfx("win");
    const sum = St.summary(run);
    const save = app.getSave();
    const firstClear = !St.levelProgress(save.story, sum.levelId).cleared;
    app.setSave({ ...save, story: St.recordClear(save.story, sum) });
    app.recordStageClear();
    const gained = app.grantReward(root.ITE.profile.storyRewards(firstClear));
    const all = levels();
    const nxt = St.nextLevel(all, sum.levelId);
    const canNext = nxt && nxt.playable && St.isUnlocked(all, progress(), nxt.id);
    // As the student last saw them (shuffled letters), not the bank's order.
    const wrongQs = sum.wrongQuestionIds.map((id) => run.shown[id]).filter(Boolean);
    const finished = runLevel;
    run = null;

    app.render(
      h(
        "main",
        { class: "screen result story" },
        h("h1", { class: "win" }, "關卡完成！"),
        h("p", { class: "stars-big", "aria-label": `${sum.stars} 粒星` }, starText(sum.stars)),
        h("div", { class: "result-sprite", html: sprites.hero("happy") }),
        h(
          "dl",
          { class: "stats" },
          h("dt", {}, "一次答對"), h("dd", {}, `${sum.firstTryCorrect} / ${sum.questions}`),
          h("dt", {}, "答錯次數"), h("dd", {}, String(sum.mistakes))
        ),
        app.rewardPanel(gained),
        nxt && canNext ? h("p", { class: "note" }, `已解鎖 ${nxt.id} ${nxt.name}！`) : null,
        nxt && !nxt.enabled ? h("p", { class: "note" }, `下一關 ${nxt.id} 即將開放。`) : null,
        !nxt
          ? h(
              "p",
              { class: "all-clear" },
              all.every((l) => St.levelProgress(progress(), l.id).cleared)
                ? `恭喜！你已完成全部 ${all.length} 關故事模式，成為 IT 帝！`
                : "這是最後一關！地圖上還有未完成的關卡。"
            )
          : null,
        wrongQs.length
          ? h(
              "section",
              { class: "review" },
              h("h2", {}, "溫習答錯過的題目"),
              wrongQs.map((q) =>
                h(
                  "div",
                  { class: "review-item" },
                  h("p", { class: "stem" }, q.stem),
                  h("p", { class: "review-ans" }, `正確答案：${q.answer}. ${Q.optionsOf(q).find((o) => o.letter === q.answer).text}`),
                  h("p", { class: "review-exp" }, q.explanation)
                )
              )
            )
          : null,
        h(
          "div",
          { class: "menu" },
          canNext ? h("button", { class: "btn btn-primary", onclick: () => showIntro(nxt.id) }, `下一關：${nxt.id}`) : null,
          h("button", { class: canNext ? "btn" : "btn btn-primary", onclick: () => startLevel(finished.id) }, "再玩一次"),
          h("button", { class: "btn", onclick: showMap }, "返回地圖")
        )
      )
    );
  }

  // First playable, unlocked level not cleared yet (home "繼續學習" bubble), or
  // null. Release builds have no playable level until teachers approve the bank.
  function nextLevel() {
    if (!bank) return null;
    const all = levels();
    const prog = progress();
    return all.find((l) => l.playable && St.isUnlocked(all, prog, l.id) && !St.levelProgress(prog, l.id).cleared) || null;
  }

  function anyPlayable() {
    return !!bank && levels().some((l) => l.playable);
  }

  root.ITE.storyUi = { show: showMap, nextLevel, anyPlayable, showIntro };
})(globalThis);
