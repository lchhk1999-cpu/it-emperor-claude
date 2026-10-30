// Prototype UI: home -> stage select -> boss battle -> result.
// Question text is always set via textContent (bank data is untrusted input).
(function (root) {
  const { battle: B, questions: Q, save: S, sprites } = root.ITE;

  // "dev": draft/review sample questions are allowed and clearly labelled.
  // "release": set by `./scripts/build.sh release`, which also leaves the dev
  // samples out of the bundle; only approved questions can appear.
  const BUILD_MODE = root.ITE.BUILD_MODE === "release" ? "release" : "dev";
  // The imported bank (tools/import_question_bank.py) replaces the dev samples
  // when present. Its topics join Q.TOPICS so every screen can name them.
  const bank = root.ITE.questionBank || null;
  if (bank) Object.assign(Q.TOPICS, bank.topics);
  const bankCheck = Q.validateBank(bank ? bank.questions : root.ITE.devSampleQuestions || []);
  if (bankCheck.report.rejected) console.warn("question bank rows rejected in game:", bankCheck.rejected);
  const questionPool = Q.filterForMode(bankCheck.accepted, BUILD_MODE);
  const storage = (() => {
    try {
      root.localStorage.setItem("it-emperor.probe", "1");
      return root.localStorage;
    } catch (e) {
      return S.createMemoryStorage();
    }
  })();

  const loaded = S.load(storage);
  let save = loaded.save;
  // Drop a saved battle whose questions this build no longer allows.
  if (save.activeBattle && !B.rebindDeck(save.activeBattle, questionPool)) {
    save = S.withActiveBattle(save, null);
    S.persist(storage, save);
  }
  let battleState = null;
  const app = document.getElementById("app");

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "html") el.innerHTML = v; // only for trusted, bundled SVG
      else el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c === null || c === undefined || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  function devBanner() {
    return BUILD_MODE === "dev"
      ? h(
          "div",
          { class: "dev-banner", role: "note" },
          bank ? "開發測試版｜包含未經教師核准（review）的題目" : "開發測試版｜題目為測試樣例，非 DSE 正式題庫"
        )
      : null;
  }

  function persist() {
    S.persist(storage, save);
  }

  function render(screen) {
    app.replaceChildren(devBanner(), screen);
    root.scrollTo(0, 0);
  }

  function bar(label, hp, max, kind) {
    const pct = max > 0 ? Math.round((hp / max) * 100) : 0;
    return h(
      "div",
      { class: `hp hp-${kind}`, role: "meter", "aria-label": label, "aria-valuemin": "0", "aria-valuemax": String(max), "aria-valuenow": String(hp) },
      h("div", { class: "hp-label" }, h("span", {}, label), h("span", { class: "hp-num" }, `${hp} / ${max}`)),
      h("div", { class: "hp-track" }, h("div", { class: "hp-fill", style: `width:${pct}%` }))
    );
  }

  // ---------- Home ----------
  function showHome() {
    const resume = !!save.activeBattle;
    render(
      h(
        "main",
        { class: "screen home" },
        h("div", { class: "logo" }, h("span", { class: "logo-it" }, "IT"), h("span", { class: "logo-emp" }, "帝")),
        h("p", { class: "tagline" }, "答啱 ICT 題，打倒 Bug 王！"),
        h("div", { class: "hero-stage", html: sprites.hero("idle") }),
        h(
          "div",
          { class: "menu" },
          resume ? h("button", { class: "btn btn-primary", onclick: resumeBattle }, "繼續 DSE 挑戰") : null,
          h("button", { class: resume ? "btn" : "btn btn-primary", onclick: () => root.ITE.storyUi.show() }, "故事模式"),
          h("button", { class: "btn", onclick: showStages }, "DSE 題庫挑戰"),
          h("button", { class: "btn btn-guild", onclick: () => root.ITE.guildUi.show() }, "校際公會"),
          h("button", { class: "btn", disabled: "" }, "角色隊伍（未開放）"),
          BUILD_MODE === "dev" && root.ITE.reviewUi
            ? h("button", { class: "btn btn-review", onclick: () => root.ITE.reviewUi.show() }, "教師審核（開發版）")
            : null
        ),
        loaded.status === "recovered" ? h("p", { class: "note" }, "存檔讀取失敗，已建立新存檔（舊資料已備份）。") : null,
        loaded.status === "repaired" ? h("p", { class: "note" }, "存檔部分資料損壞，已自動修復。") : null,
        BUILD_MODE === "dev" && bankCheck.report.rejected
          ? h("p", { class: "note" }, `題庫檢查：${bankCheck.report.accepted} 條通過，${bankCheck.report.rejected} 條被拒絕（見 console）`)
          : null,
        h("p", { class: "placeholder-note" }, "PLACEHOLDER 美術｜非正式設計")
      )
    );
  }

  // ---------- Stage select ----------
  function showStages() {
    render(
      h(
        "main",
        { class: "screen" },
        h("header", { class: "topbar" }, h("button", { class: "btn-back", onclick: showHome, "aria-label": "返回" }, "‹"), h("h1", {}, "選擇關卡")),
        ...root.ITE.stages.map((stage) => {
          const rec = save.stages[stage.id];
          return h(
            "button",
            { class: "stage-card", onclick: () => startBattle(stage) },
            h("div", { class: "stage-boss", html: sprites.bugKing("smug") }),
            h(
              "div",
              { class: "stage-info" },
              h("div", { class: "stage-chapter" }, stage.chapter),
              h("div", { class: "stage-name" }, stage.name),
              h("div", { class: "stage-desc" }, stage.description),
              h(
                "div",
                { class: "stage-meta" },
                rec ? `${rec.cleared ? "★ 已通關" : "未通關"}｜最佳正確率 ${rec.bestAccuracy}%` : "未挑戰"
              )
            )
          );
        })
      )
    );
  }

  // ---------- Battle ----------
  function startBattle(stage) {
    try {
      battleState = B.createBattle(stage, questionPool, root.ITE.rng.createRng(Date.now()));
    } catch (e) {
      showMessage("暫時未有可用題目", BUILD_MODE === "release" ? "正式版只會顯示已核准（approved）的題目。" : String(e.message));
      return;
    }
    save = S.withActiveBattle(save, battleState);
    persist();
    showBattle();
  }

  function resumeBattle() {
    battleState = save.activeBattle && B.rebindDeck(save.activeBattle, questionPool);
    if (!battleState) {
      save = S.withActiveBattle(save, null);
      persist();
      showHome();
      return;
    }
    showBattle();
  }

  function showMessage(title, body) {
    render(
      h(
        "main",
        { class: "screen" },
        h("header", { class: "topbar" }, h("button", { class: "btn-back", onclick: showStages, "aria-label": "返回" }, "‹"), h("h1", {}, title)),
        h("p", { class: "note" }, body)
      )
    );
  }

  function onAnswer(letter) {
    battleState = B.answer(battleState, letter);
    save = S.withActiveBattle(save, battleState);
    persist();
    showBattle();
  }

  function onNext() {
    battleState = B.next(battleState);
    if (battleState.phase === "won" || battleState.phase === "lost") {
      save = S.recordStageResult(save, battleState.stageId, B.summary(battleState));
      persist();
      showResult();
      return;
    }
    save = S.withActiveBattle(save, battleState);
    persist();
    showBattle();
  }

  function quitBattle() {
    // Progress is already saved; home offers "繼續戰鬥".
    showHome();
  }

  function showBattle() {
    const s = battleState;
    const q = B.currentQuestion(s);
    const r = s.lastResult;
    const feedback = s.phase === "feedback";

    const options = Q.optionsOf(q).map(({ letter, text }) => {
      let cls = "opt";
      if (feedback) {
        if (letter === q.answer) cls += " opt-correct";
        else if (letter === r.choice) cls += " opt-wrong";
        else cls += " opt-dim";
      }
      return h(
        "button",
        { class: cls, onclick: () => onAnswer(letter), ...(feedback ? { disabled: "" } : {}) },
        h("span", { class: "opt-letter" }, letter),
        h("span", { class: "opt-text" }, text)
      );
    });

    const bossHit = feedback && r.correct;
    const heroHit = feedback && !r.correct;

    render(
      h(
        "main",
        { class: "screen battle" },
        h(
          "header",
          { class: "topbar" },
          h("button", { class: "btn-back", onclick: quitBattle, "aria-label": "暫停並返回主畫面" }, "‹"),
          h("h1", {}, `第 ${s.index + 1} / ${s.deck.length} 題`),
          s.combo > 1 ? h("span", { class: "combo" }, `${s.combo} COMBO`) : h("span", {})
        ),
        h(
          "section",
          { class: "arena" },
          h(
            "div",
            { class: "fighter boss" },
            bar(s.boss.name, s.boss.hp, s.boss.maxHp, "boss"),
            h("div", { class: `sprite-wrap ${bossHit ? "shake" : ""}`, html: sprites.bugKing(bossHit ? "hurt" : heroHit ? "smug" : "idle") }),
            bossHit ? h("div", { class: "dmg-pop" }, `-${r.damage}`) : null
          ),
          h(
            "div",
            { class: "fighter hero" },
            h("div", { class: `sprite-wrap ${heroHit ? "shake" : ""}`, html: sprites.hero(heroHit ? "speechless" : bossHit ? "happy" : "idle") }),
            heroHit ? h("div", { class: "dmg-pop dmg-hero" }, `-${r.taken}`) : null,
            bar("我的隊伍", s.party.hp, s.party.maxHp, "party")
          )
        ),
        h(
          "section",
          { class: "question-card" },
          h(
            "div",
            { class: "q-meta" },
            h("span", { class: "chip" }, Q.TOPICS[q.topic_id]),
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
              !r.correct && q.wrong_tip ? h("p", { class: "wrong-tip" }, `提示：${q.wrong_tip}`) : null,
              h("button", { class: "btn btn-primary", onclick: onNext }, s.outcome ? "查看結果" : "下一題")
            )
          : null
      )
    );
    if (feedback) {
      const panel = app.querySelector(".explain");
      if (panel) panel.scrollIntoView({ block: "end", behavior: "smooth" });
    }
  }

  // ---------- Result ----------
  function showResult() {
    const s = battleState;
    const sum = B.summary(s);
    const won = sum.outcome === "won";
    const wrongQs = s.deck.filter((q) => sum.wrongQuestionIds.includes(q.question_id));
    render(
      h(
        "main",
        { class: "screen result" },
        h("h1", { class: won ? "win" : "lose" }, won ? "勝利！" : "挑戰失敗"),
        h("div", { class: "result-sprite", html: won ? sprites.hero("happy") : sprites.bugKing("smug") }),
        h(
          "dl",
          { class: "stats" },
          h("dt", {}, "答對"), h("dd", {}, `${sum.correct} / ${sum.answered}`),
          h("dt", {}, "正確率"), h("dd", {}, `${sum.accuracy}%`),
          h("dt", {}, "最高 Combo"), h("dd", {}, String(sum.maxCombo))
        ),
        wrongQs.length
          ? h(
              "section",
              { class: "review" },
              h("h2", {}, "溫習答錯的題目"),
              wrongQs.map((q) =>
                h(
                  "div",
                  { class: "review-item" },
                  h("p", { class: "stem" }, q.stem),
                  h("p", { class: "review-ans" }, `正確答案：${q.answer}. ${Q.optionsOf(q).find((o) => o.letter === q.answer).text}`),
                  h("p", { class: "review-exp" }, q.explanation),
                  q.wrong_tip ? h("p", { class: "review-exp wrong-tip" }, `提示：${q.wrong_tip}`) : null
                )
              )
            )
          : h("p", { class: "note" }, "全部答對，非常好！"),
        h(
          "div",
          { class: "menu" },
          h("button", { class: "btn btn-primary", onclick: () => startBattle(root.ITE.stages.find((st) => st.id === s.stageId)) }, "再挑戰"),
          h("button", { class: "btn", onclick: showHome }, "返回主畫面")
        )
      )
    );
  }

  // Shared with src/ui/guild.js.
  root.ITE.app = {
    showHome,
    h,
    render,
    bar,
    questionPool,
    buildMode: BUILD_MODE,
    storage,
    getSave: () => save,
    setSave: (next) => {
      save = next;
      persist();
    },
  };
  // Wait for every script (guild, story, review screens) before the first render.
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showHome);
  else showHome();
})(globalThis);
