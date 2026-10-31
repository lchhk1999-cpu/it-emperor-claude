// Prototype UI: home -> stage select -> boss battle -> result.
// Question text is always set via textContent (bank data is untrusted input).
(function (root) {
  const { battle: B, questions: Q, save: S, sprites } = root.ITE;

  // "dev": draft/review sample questions are allowed and clearly labelled.
  // "release": set by `./scripts/build.sh release`, which also leaves the dev
  // samples out of the bundle; only approved questions can appear.
  const BUILD_MODE = root.ITE.BUILD_MODE === "release" ? "release" : "dev";
  // 單機版 (offline) has no guild; online features come back in the online edition.
  const ONLINE = root.ITE.EDITION !== "offline";
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
  const P = root.ITE.profile;
  const gameData = root.ITE.gameData;
  {
    const base = P.ensureOwned(save.profile || P.defaultProfile(gameData), gameData);
    const team = P.cleanTeam(base.team, base.level, gameData, base.owned);
    const equipment = root.ITE.equipment.cleanEquipment(base.equipment || {}, team, gameData, base.owned);
    save = { ...save, profile: { ...base, team, equipment } };
  }
  const Mi = root.ITE.missions;
  save = { ...save, progress: Mi.rollover(save.progress || Mi.defaultProgress(Date.now()), Date.now()) };
  let lastReward = null; // shown on the DSE result screen
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
    for (const c of children.flat(Infinity)) {
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

  // Screens marked with data-tab get the bottom tab bar (主頁 A, user choice 2026-10-31).
  // The 單機版 swaps 公會 for 任務.
  const TABS = [
    ["home", "主頁", () => showHome()],
    ["team", "隊伍", () => root.ITE.teamUi.show()],
    ["growth", "培養", () => root.ITE.growthUi.show()],
    ["gacha", "抽蛋", () => root.ITE.gachaUi.show()],
    ONLINE ? ["guild", "公會", () => root.ITE.guildUi.show()] : ["missions", "任務", () => root.ITE.missionsUi.show()],
  ];

  function tabBar(active) {
    return h(
      "nav",
      { class: "tabbar", "aria-label": "主要功能" },
      TABS.map(([id, label, go]) =>
        h(
          "button",
          {
            class: id === active ? "tab-btn active" : "tab-btn",
            onclick: go,
            ...(id === active ? { "aria-current": "page" } : {}),
            ...(id === "missions" && claimableNow() ? { "aria-label": `${label}，${claimableNow()} 個獎勵可領取` } : {}),
          },
          h("span", { class: "tab-icon", html: icons[id] }),
          id === "missions" && claimableNow() ? h("span", { class: "badge" }, String(claimableNow())) : null,
          h("span", { class: "tab-label" }, label)
        )
      )
    );
  }

  function render(screen) {
    const tab = screen.getAttribute && screen.getAttribute("data-tab");
    app.classList.toggle("with-tabbar", !!tab);
    // devBanner() is null in release builds; replaceChildren would print it as "null".
    app.replaceChildren(...[devBanner(), screen, tab ? tabBar(tab) : null].filter(Boolean));
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
  // Original line icons (24px grid) for the home screen and tab bar.
  const ICON_PATHS = {
    home: '<path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z"/>',
    team: '<circle cx="8" cy="9" r="3.2"/><circle cx="16" cy="9" r="3.2"/><path d="M2.5 20 C3 15 13 15 13.5 20"/><path d="M10.5 20 C11 15 21 15 21.5 20"/>',
    growth: '<path d="M12 20 V9"/><path d="M12 13 C7 13 5 9 5 6 C9 6 12 8 12 13Z"/><path d="M12 11 C16 11 19 8 19 5 C15 5 12 7 12 11Z"/>',
    gacha: '<ellipse cx="12" cy="13" rx="7" ry="8.5"/><path d="M5.5 12 L9 10 L12 13 L15 10 L18.5 12"/>',
    guild: '<path d="M4 20 V9 L12 4 L20 9 V20 Z"/><path d="M9.5 20 V14 H14.5 V20"/><path d="M12 4 V1.5 H16"/>',
    bag: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M8.5 8 V6 C8.5 3.5 15.5 3.5 15.5 6 V8"/><path d="M4 13 H20"/>',
    missions: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 9 L10.5 11 L15.5 6.5"/><path d="M8.5 15 H15.5"/>',
    mission: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 9 L10.5 11 L15.5 6.5"/><path d="M8.5 15 H15.5"/>',
    book: '<path d="M3.5 5 C7 4 10 4.5 12 6.5 C14 4.5 17 4 20.5 5 V19 C17 18 14 18.5 12 20 C10 18.5 7 18 3.5 19 Z"/><path d="M12 6.5 V20"/>',
    sword: '<path d="M5 19 L15.5 8.5"/><path d="M13 4 L20 4 L20 11"/><path d="M4 16 L8 20"/><path d="M15 4.5 L19.5 9"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5 V16.5"/><path d="M9.5 9.5 H13.5 C15 9.5 15 12 13.5 12 H10.5 C9 12 9 14.5 10.5 14.5 H14.5"/>',
    gem: '<path d="M6 4 H18 L22 9.5 L12 21 L2 9.5 Z"/><path d="M2 9.5 H22"/><path d="M9 4 L12 21 L15 4"/>',
  };
  const ICON_FILL = { coin: "#f4d36b", gem: "#8fc3e8" };
  const icons = Object.fromEntries(
    Object.entries(ICON_PATHS).map(([k, d]) => [
      k,
      `<svg viewBox="0 0 24 24" aria-hidden="true" fill="${ICON_FILL[k] || "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`,
    ])
  );

  // Home status bar: level, coins, gems, experience and stamina bars.
  function statusBar() {
    const p = save.profile;
    const need = P.PROFILE_RULES.expToNext(p.level);
    const st = root.ITE.stamina.current(p, gameData.config, Date.now());
    const meter = (label, value, max, cls) =>
      h(
        "div",
        { class: "meter", role: "meter", "aria-label": label, "aria-valuenow": String(value), "aria-valuemin": "0", "aria-valuemax": String(max) },
        h("span", { class: "meter-label" }, label),
        h("span", { class: "meter-track" }, h("span", { class: `meter-fill ${cls}`, style: `width: ${Math.min(100, Math.round((value / max) * 100))}%` })),
        h("span", { class: "meter-num" }, `${value} / ${max}`)
      );
    const title = Mi.equippedTitle(save.progress, gameData.titles);
    return h(
      "header",
      { class: "status-bar" },
      h(
        "div",
        { class: "status-row" },
        h("span", { class: "lv" }, `Lv ${p.level}`),
        title ? h("span", { class: "title-badge" }, title.name) : h("span", { class: "status-spacer" }),
        h("span", { class: "currency", "aria-label": `金幣 ${p.coins}` }, h("span", { class: "cur-icon", html: icons.coin }), String(p.coins)),
        h("span", { class: "currency", "aria-label": `寶石 ${p.gems || 0}` }, h("span", { class: "cur-icon", html: icons.gem }), String(p.gems || 0))
      ),
      meter("經驗", p.exp, need, "fill-exp"),
      meter("體力", st.value, st.max, "fill-stamina")
    );
  }

  function claimableNow() {
    return Mi.claimableCount(save.progress, gameData.missions, Date.now());
  }

  function sideChip(iconName, label, onclick, badge) {
    return h(
      "button",
      { class: "side-chip", onclick, "aria-label": badge ? `${label}，${badge} 個獎勵可領取` : label },
      h("span", { class: "chip-icon", html: icons[iconName] }),
      badge ? h("span", { class: "badge" }, String(badge)) : null,
      h("span", { class: "chip-label" }, label)
    );
  }

  function showHome() {
    const resume = !!save.activeBattle;
    const leader = save.profile.team[0];
    const next = root.ITE.storyUi && root.ITE.storyUi.nextLevel();
    const limited = root.ITE.dungeons.limitedStage(gameData, Date.now());
    const claimable = claimableNow();
    render(
      h(
        "main",
        { class: "screen home", "data-tab": "home" },
        statusBar(),
        h(
          "section",
          { class: "home-stage" },
          h(
            "div",
            { class: "side-chips" },
            ONLINE ? sideChip("mission", "任務", () => root.ITE.missionsUi.show(), claimable) : null,
            sideChip("bag", "背包", () => root.ITE.inventoryUi.show())
          ),
          next
            ? h("button", { class: "speech", onclick: () => root.ITE.storyUi.showIntro(next.id) }, `繼續學習：${next.id} ${next.name}`)
            : h("p", { class: "speech" }, "答啱 ICT 題，打倒 Bug 王！"),
          h("div", { class: "hero-stage", html: leader ? sprites.character(leader, "happy") : sprites.hero("idle") }),
          h("div", { class: "hero-shadow" })
        ),
        resume ? h("button", { class: "btn btn-primary resume", onclick: resumeBattle }, "繼續 DSE 挑戰") : null,
        h(
          "div",
          { class: "home-tiles" },
          h(
            "button",
            { class: "home-tile tile-story", onclick: () => root.ITE.storyUi.show() },
            h("span", { class: "tile-icon", html: icons.book }),
            h("span", { class: "tile-name" }, "故事模式"),
            h("span", { class: "tile-sub" }, next ? `${next.world.name}・${next.id}` : root.ITE.storyUi.anyPlayable() ? "已開放關卡全部完成" : "等待老師審核題目")
          ),
          h(
            "button",
            { class: "home-tile tile-dse", onclick: showStages },
            h("span", { class: "tile-icon", html: icons.sword }),
            h("span", { class: "tile-name" }, "DSE 挑戰"),
            h("span", { class: "tile-sub" }, "A–E 世界・四個難度")
          )
        ),
        limited
          ? h(
              "button",
              { class: "limited-banner", onclick: () => startBattle(limited) },
              h("span", { class: "limited-boss", html: sprites.bugKing("smug") }),
              h(
                "span",
                { class: "limited-info" },
                h("span", { class: "limited-tag" }, "今日限定"),
                h("span", { class: "limited-name" }, limited.chapter.replace("今日限定｜", "")),
                h("span", { class: "limited-sub" }, limited.description)
              )
            )
          : null,
        BUILD_MODE === "dev" && root.ITE.reviewUi
          ? h("button", { class: "btn btn-review", onclick: () => root.ITE.reviewUi.show() }, "教師審核（開發版）")
          : null,
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
  // DSE stages: today's limited stage, worlds A–E x four difficulties, mixed practice.
  function findStage(id) {
    return root.ITE.dungeons.allStages(gameData, Date.now()).find((st) => st.id === id) || null;
  }

  function stageStatus(id) {
    const rec = save.stages[id];
    return rec ? `${rec.cleared ? "★ 已通關" : "未通關"}｜最佳 ${rec.bestAccuracy}%` : "未挑戰";
  }

  function stageCard(stage) {
    return h(
      "button",
      { class: `stage-card${stage.kind === "limited" ? " stage-limited" : ""}`, onclick: () => startBattle(stage) },
      h("div", { class: "stage-boss", html: sprites.bugKing("smug") }),
      h(
        "div",
        { class: "stage-info" },
        h("div", { class: "stage-chapter" }, stage.chapter),
        h("div", { class: "stage-name" }, stage.name),
        h("div", { class: "stage-desc" }, stage.description, root.ITE.stamina.stageCost(stage) ? `｜體力 ${root.ITE.stamina.stageCost(stage)}` : "｜不用體力・只得經驗"),
        h("div", { class: "stage-meta" }, stageStatus(stage.id))
      )
    );
  }

  function showStages() {
    const Dg = root.ITE.dungeons;
    const limited = Dg.limitedStage(gameData, Date.now());
    const all = Dg.worldStages();
    const matName = (id) => (root.ITE.inventory.materialById(gameData, id) || { name: id }).name;
    render(
      h(
        "main",
        { class: "screen stages" },
        h("header", { class: "topbar" }, h("button", { class: "btn-back", onclick: showHome, "aria-label": "返回" }, "‹"), h("h1", {}, "DSE 題庫挑戰")),
        profileBar(),
        limited ? stageCard(limited) : null,
        Dg.WORLDS.map((w) =>
          h(
            "section",
            { class: "panel world-panel" },
            h("h2", {}, `${w.id}｜${w.name}`),
            h("p", { class: "hint" }, `素材：${w.materials.map(matName).join("、")}`),
            h(
              "div",
              { class: "diff-grid" },
              all
                .filter((st) => st.world === w.id)
                .map((st) => {
                  const rec = save.stages[st.id];
                  const d = Dg.DIFFICULTIES[st.difficulty];
                  return h(
                    "button",
                    { class: `diff-btn diff-${st.difficulty}${rec && rec.cleared ? " cleared" : ""}`, onclick: () => startBattle(st), "aria-label": `${st.name}，${d.questionCount} 題，${stageStatus(st.id)}` },
                    h("span", { class: "diff-name" }, d.name, rec && rec.cleared ? " ★" : ""),
                    h("span", { class: "diff-meta" }, `${d.questionCount} 題｜體力 ${root.ITE.stamina.stageCost(st)}｜素材 ×${d.drops}${d.rare ? "＋傳說核心" : ""}`)
                  );
                })
            )
          )
        ),
        h("h2", { class: "section-title" }, "混合練習"),
        (root.ITE.stages || []).map(stageCard)
      )
    );
  }

  // ---------- 體力 ----------
  function staminaNow() {
    return root.ITE.stamina.current(save.profile, gameData.config, Date.now());
  }

  function showStaminaPrompt(stage, cost) {
    const c = staminaNow();
    const mins = Math.ceil(root.ITE.stamina.nextPointIn(save.profile, gameData.config, Date.now()) / 60000);
    render(
      h(
        "main",
        { class: "screen" },
        h("header", { class: "topbar" }, h("button", { class: "btn-back", onclick: showStages, "aria-label": "返回" }, "‹"), h("h1", {}, "體力不足")),
        h(
          "section",
          { class: "panel" },
          h("p", {}, `「${stage.name}」需要 ${cost} 體力，你現在有 ${c.value} / ${c.max}。`),
          h("p", { class: "hint" }, `每 5 分鐘回復 1 點${mins ? `（下一點約 ${mins} 分鐘後）` : ""}；升級會回滿體力。`),
          h("p", { class: "hint" }, "體力只限制取得素材及金幣，不限制學習：你仍然可以用練習模式作答，只會獲得經驗。故事模式不用體力。")
        ),
        h(
          "div",
          { class: "menu" },
          h("button", { class: "btn btn-primary", onclick: () => startBattle(stage, { practice: true }) }, "練習模式（只得經驗）"),
          h("button", { class: "btn", onclick: showStages }, "返回選關")
        )
      )
    );
  }

  // ---------- Battle ----------
  // Stages that cost stamina give materials and coins; mixed practice, or
  // playing without enough stamina, gives experience only (practice).
  function startBattle(stage, opts) {
    const cost = root.ITE.stamina.stageCost(stage);
    const practice = cost === 0 || !!(opts && opts.practice);
    let paid = null;
    if (!practice) {
      const r = root.ITE.stamina.spend(save.profile, cost, gameData.config, Date.now());
      if (r.error) return showStaminaPrompt(stage, cost);
      paid = r.profile;
    }
    try {
      const team = P.teamSnapshot(save.profile, gameData);
      const loadout = root.ITE.equipment.battleLoadout(save.profile, gameData);
      const rng = root.ITE.rng.createRng(Date.now());
      battleState = { ...B.createBattle(stage, root.ITE.dungeons.stagePool(stage, questionPool, rng), rng, team, loadout), practice };
    } catch (e) {
      showMessage("暫時未有可用題目", BUILD_MODE === "release" ? "正式版只會顯示已核准（approved）的題目。" : String(e.message));
      return;
    }
    if (paid) save = { ...save, profile: paid };
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
    const before = battleState;
    battleState = B.answer(battleState, letter);
    if (battleState !== before) recordAnswer(B.currentQuestion(battleState), battleState.lastResult.correct, false);
    save = S.withActiveBattle(save, battleState);
    persist();
    showBattle();
  }

  function onNext() {
    battleState = B.next(battleState);
    if (battleState.phase === "won" || battleState.phase === "lost") {
      const sum = B.summary(battleState);
      save = S.recordStageResult(save, battleState.stageId, sum);
      if (sum.outcome === "won") recordStageClear();
      const base = P.dseRewards(sum);
      lastReward = battleState.practice
        ? grantReward({ exp: base.exp, coins: 0 })
        : grantReward({ ...base, materials: root.ITE.dungeons.materialDrops(findStage(battleState.stageId), sum, gameData, root.ITE.rng.createRng(Date.now() ^ Math.floor(Math.random() * 2 ** 31))) });
      lastReward.practice = !!battleState.practice;
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

    const removed = feedback ? [] : root.ITE.equipment.hiddenOptions(s);
    const options = Q.optionsOf(q).map(({ letter, text }) => {
      let cls = "opt";
      const gone = removed.includes(letter);
      if (feedback) {
        if (letter === q.answer) cls += " opt-correct";
        else if (letter === r.choice) cls += " opt-wrong";
        else cls += " opt-dim";
      } else if (gone) cls += " opt-removed";
      return h(
        "button",
        {
          class: cls,
          onclick: () => onAnswer(letter),
          ...(feedback || gone ? { disabled: "" } : {}),
          ...(gone ? { "aria-label": `${letter}（AI 已刪去）` } : {}),
        },
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
            h("div", { class: `sprite-wrap ${heroHit ? "shake" : ""}`, html: leaderSprite(s, heroHit ? "speechless" : bossHit ? "happy" : "idle") }),
            heroHit ? h("div", { class: "dmg-pop dmg-hero" }, `-${r.taken}`) : null,
            bar(s.team && s.team.length ? `我的隊伍（${s.team.length} 人）` : "我的隊伍", s.party.hp, s.party.maxHp, "party")
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
          skillBar(s),
          h("div", { class: "options" }, options)
        ),
        feedback
          ? h(
              "section",
              { class: `explain ${r.correct ? "explain-ok" : "explain-ng"}`, "aria-live": "polite" },
              h("div", { class: "explain-title" }, r.correct ? `答對！造成 ${r.damage} 傷害` : `答錯了… 正確答案是 ${q.answer}`),
              r.correct && r.bonus ? h("p", { class: "bonus-tip" }, `${r.bonus.name} 專長加成 +${Math.round(r.bonus.bonus * 100)}%`) : null,
              r.equipBonus ? h("p", { class: "bonus-tip" }, `電腦額外傷害 +${r.equipBonus}`) : null,
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

  // ---------- Equipment skills (DSE battle only) ----------
  const SKILL_LABELS = { hint: "AI 提示", healing: "眼藥水", damage: "電腦攻擊" };
  const SKILL_REASONS = { used: "已用", full_hp: "HP 已滿", armed: "已準備", used_here: "已用", wait: "" };

  function skillBar(s) {
    const items = s.loadout || [];
    if (!items.length) return null;
    const EQ = root.ITE.equipment;
    return h(
      "div",
      { class: "skill-bar" },
      items.map((item) => {
        if (item.type === "defense") return h("span", { class: "chip skill-passive" }, `${item.name}：受傷 -${item.reduce_pct}%`);
        const st = EQ.skillStatus(s, item);
        const label = SKILL_LABELS[item.type] || item.name;
        const note = st.usable ? "" : st.reason === "cooldown" ? `（${st.wait} 題後）` : SKILL_REASONS[st.reason] ? `（${SKILL_REASONS[st.reason]}）` : "";
        return h(
          "button",
          {
            class: st.usable ? "skill-btn" : "skill-btn off",
            onclick: () => useSkill(item.id),
            ...(st.usable ? {} : { disabled: "" }),
          },
          label + note
        );
      })
    );
  }

  function useSkill(id) {
    battleState = root.ITE.equipment.useSkill(battleState, id);
    save = S.withActiveBattle(save, battleState);
    persist();
    showBattle();
  }

  // ---------- Profile & rewards ----------
  function profileBar() {
    const p = save.profile;
    return h(
      "p",
      { class: "profile-bar" },
      h("span", { class: "lv" }, `Lv ${p.level}`),
      h("span", {}, `經驗 ${p.exp} / ${P.PROFILE_RULES.expToNext(p.level)}`),
      h("span", {}, `金幣 ${p.coins}`),
      h("span", {}, `寶石 ${p.gems || 0}`),
      (() => {
        const c = staminaNow();
        return h("span", { class: "stamina" }, `體力 ${c.value} / ${c.max}`);
      })(),
      (() => {
        const t = Mi.equippedTitle(save.progress, gameData.titles);
        return t ? h("span", { class: "title-badge" }, t.name) : null;
      })()
    );
  }

  // Every answered question in any mode counts towards missions and titles.
  function recordAnswer(q, correct, doPersist = true) {
    save = { ...save, progress: Mi.recordAnswer(save.progress, q, correct, Date.now()) };
    if (doPersist) persist();
  }

  function recordStageClear() {
    save = { ...save, progress: Mi.recordStageClear(save.progress, Date.now()) };
    persist();
  }

  function leaderSprite(state, expr) {
    const leader = state.team && state.team[0];
    return leader ? sprites.character(leader.id, expr) : sprites.hero(expr);
  }

  // Adds a reward to the profile, saves, and returns what to show the player.
  function grantReward(reward) {
    const r = P.addReward(save.profile, reward, gameData);
    let profile = reward.materials ? root.ITE.inventory.addMaterials(r.profile, reward.materials, gameData) : r.profile;
    if (r.levelsGained) profile = root.ITE.stamina.refill(profile, gameData.config, Date.now());
    save = { ...save, profile: { ...profile, team: P.cleanTeam(profile.team, profile.level, gameData, profile.owned) } };
    persist();
    return { reward, levelsGained: r.levelsGained, slotsUnlocked: r.slotsUnlocked, level: r.profile.level };
  }

  function rewardPanel(g) {
    return h(
      "section",
      { class: "reward", "aria-live": "polite" },
      h("p", { class: "reward-line" }, `+${g.reward.exp} 經驗`, g.reward.coins ? `　+${g.reward.coins} 金幣` : ""),
      Object.entries(g.reward.materials || {}).map(([id, n]) => {
        const m = root.ITE.inventory.materialById(gameData, id);
        return m ? h("p", { class: "reward-line reward-material" }, `獲得素材：${m.name} ×${n}`) : null;
      }),
      g.practice ? h("p", { class: "hint" }, "練習模式：只獲得經驗（不扣體力，沒有素材及金幣）") : null,
      g.levelsGained ? h("p", { class: "reward-level" }, `升級！現在是 Lv ${g.level}，體力已回滿`) : null,
      g.slotsUnlocked ? h("p", { class: "reward-level" }, `解鎖新隊伍位置！到「角色隊伍」加入新成員`) : null
    );
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
        lastReward ? rewardPanel(lastReward) : null,
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
          h("button", { class: "btn btn-primary", onclick: () => (findStage(s.stageId) ? startBattle(findStage(s.stageId)) : showStages()) }, "再挑戰"),
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
    online: ONLINE,
    storage,
    grantReward,
    rewardPanel,
    profileBar,
    recordAnswer,
    recordStageClear,
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
