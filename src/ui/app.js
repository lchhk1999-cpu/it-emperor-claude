// Prototype UI: home -> stage select -> boss battle -> result.
// Question text is always set via textContent (bank data is untrusted input).
(function (root) {
  const { battle: B, questions: Q, save: S, sprites } = root.ITE;

  // "dev": draft/review sample questions are allowed and clearly labelled.
  // "release": set by `./scripts/build.sh release`, which also leaves the dev
  // samples out of the bundle; only approved questions can appear.
  const BUILD_MODE = root.ITE.BUILD_MODE === "release" ? "release" : "dev";
  // App version shown in 設定 (App Store version for the first release: 1.0.0).
  const APP_VERSION = "1.0.0";
  // 單機版 (offline) has no guild; online features come back in the online edition.
  const ONLINE = root.ITE.EDITION !== "offline";
  // The imported bank (tools/import_question_bank.py) replaces the dev samples
  // when present. Its topics join Q.TOPICS so every screen can name them.
  const bank = root.ITE.questionBank || null;
  if (bank) Object.assign(Q.TOPICS, bank.topics);
  const bankCheck = Q.validateBank(bank ? bank.questions : root.ITE.devSampleQuestions || []);
  if (bankCheck.report.rejected) console.warn("question bank rows rejected in game:", bankCheck.rejected);
  const questionPool = Q.filterForMode(bankCheck.accepted, BUILD_MODE);
  const DEMO = !!(root.ITE.demo && root.ITE.demo.enabled());
  const storage = (() => {
    let base;
    try {
      root.localStorage.setItem("it-emperor.probe", "1");
      base = root.localStorage;
    } catch (e) {
      base = S.createMemoryStorage();
    }
    // 老師示範版 keeps its own save next to a real one.
    return DEMO ? root.ITE.demo.prefixedStorage(base) : base;
  })();

  const loaded = S.load(storage);
  let save = loaded.save;
  const sfx = (name, pitch) => root.ITE.sound && root.ITE.sound.play(name, pitch);
  if (root.ITE.sound) root.ITE.sound.setEnabled(save.settings.sound);
  if (root.ITE.music) root.ITE.music.setEnabled(save.settings.music);
  const P = root.ITE.profile;
  const gameData = root.ITE.gameData;
  {
    const fresh = DEMO ? root.ITE.demo.seedProfile(gameData) : P.defaultProfile(gameData);
    const base = P.ensureOwned(save.profile || fresh, gameData);
    const team = P.cleanTeam(base.team, base.level, gameData, base.owned);
    const equipment = root.ITE.equipment.cleanEquipment(base.equipment || {}, team, gameData, base.owned, base);
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
    if (DEMO) return h("div", { class: "dev-banner demo-banner", role: "note" }, "老師示範版｜資源全開・所有關卡已開放・進度與正式版分開");
    return BUILD_MODE === "dev"
      ? h(
          "div",
          { class: "dev-banner", role: "note" },
          !bank ? "開發測試版｜題目為測試樣例，非 DSE 正式題庫"
            : bank.questions.some((q) => q.review_status !== "approved") ? "開發測試版｜包含未經教師核准（review）的題目"
            : "開發測試版｜只供測試"
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
    ["gacha", "盲盒", () => root.ITE.gachaUi.show()],
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
            onclick: () => (sfx("tap"), go()),
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

  // Background music follows the kind of screen: battles, story levels, silent
  // results (so the win / lose jingle stands out), everything else 主頁 music.
  function musicFor(screen) {
    const c = screen.classList;
    if (!c) return "home";
    if (c.contains("result")) return null;
    if (c.contains("battle") && c.contains("story")) return "story";
    if (c.contains("battle") || c.contains("raid")) return "battle";
    return "home";
  }

  // Page background theme: the screen's own class (team, gacha, …), see style.css.
  const PAGE_THEMES = ["home", "stages", "battle", "result", "team", "growth", "gacha", "missions", "inventory", "settings", "story", "guild"];
  function pageTheme(screen) {
    const c = screen.classList;
    if (!c) return "home";
    if (c.contains("result")) return "result";
    if (c.contains("battle") || c.contains("raid")) return "battle";
    if (c.contains("drill")) return "stages";
    return PAGE_THEMES.find((t) => c.contains(t)) || "home";
  }

  function render(screen) {
    root.document.body.setAttribute("data-screen", pageTheme(screen));
    if (root.ITE.music) root.ITE.music.play(musicFor(screen));
    const tab = screen.getAttribute && screen.getAttribute("data-tab");
    app.classList.toggle("with-tabbar", !!tab);
    // devBanner() is null in release builds; replaceChildren would print it as "null".
    app.replaceChildren(...[devBanner(), screen, tab ? tabBar(tab) : null].filter(Boolean));
    root.scrollTo(0, 0);
  }

  function bar(label, hp, max, kind) {
    const pct = max > 0 ? Math.round((hp / max) * 100) : 0;
    const shown = Math.ceil(hp); // 魔王限時 drains in fractions
    return h(
      "div",
      { class: `hp hp-${kind}`, role: "meter", "aria-label": label, "aria-valuemin": "0", "aria-valuemax": String(max), "aria-valuenow": String(shown) },
      h("div", { class: "hp-label" }, h("span", {}, label), h("span", { class: "hp-num" }, `${shown} / ${max}`)),
      h("div", { class: "hp-track" }, h("div", { class: "hp-fill", style: `width:${pct}%` }))
    );
  }

  // ---------- Home ----------
  // Original line icons (24px grid) for the home screen and tab bar.
  const ICON_PATHS = {
    home: '<path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z"/>',
    team: '<circle cx="8" cy="9" r="3.2"/><circle cx="16" cy="9" r="3.2"/><path d="M2.5 20 C3 15 13 15 13.5 20"/><path d="M10.5 20 C11 15 21 15 21.5 20"/>',
    growth: '<path d="M12 20 V9"/><path d="M12 13 C7 13 5 9 5 6 C9 6 12 8 12 13Z"/><path d="M12 11 C16 11 19 8 19 5 C15 5 12 7 12 11Z"/>',
    // 盲盒 (was an egg until the 抽蛋 → 盲盒 rename, 2026-11-01): a gift box with a bow.
    gacha: '<rect x="4" y="10" width="16" height="10" rx="2"/><rect x="3" y="7" width="18" height="4" rx="1.5"/><path d="M12 7 V20"/><path d="M12 7 C9 3 5.5 4.5 7.5 7 M12 7 C15 3 18.5 4.5 16.5 7"/>',
    guild: '<path d="M4 20 V9 L12 4 L20 9 V20 Z"/><path d="M9.5 20 V14 H14.5 V20"/><path d="M12 4 V1.5 H16"/>',
    bag: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M8.5 8 V6 C8.5 3.5 15.5 3.5 15.5 6 V8"/><path d="M4 13 H20"/>',
    missions: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 9 L10.5 11 L15.5 6.5"/><path d="M8.5 15 H15.5"/>',
    mission: '<rect x="5" y="3.5" width="14" height="17" rx="2.5"/><path d="M8.5 9 L10.5 11 L15.5 6.5"/><path d="M8.5 15 H15.5"/>',
    book: '<path d="M3.5 5 C7 4 10 4.5 12 6.5 C14 4.5 17 4 20.5 5 V19 C17 18 14 18.5 12 20 C10 18.5 7 18 3.5 19 Z"/><path d="M12 6.5 V20"/>',
    sword: '<path d="M5 19 L15.5 8.5"/><path d="M13 4 L20 4 L20 11"/><path d="M4 16 L8 20"/><path d="M15 4.5 L19.5 9"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5 V16.5"/><path d="M9.5 9.5 H13.5 C15 9.5 15 12 13.5 12 H10.5 C9 12 9 14.5 10.5 14.5 H14.5"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5 V5.5 M12 18.5 V21.5 M2.5 12 H5.5 M18.5 12 H21.5 M5.3 5.3 L7.4 7.4 M16.6 16.6 L18.7 18.7 M5.3 18.7 L7.4 16.6 M16.6 7.4 L18.7 5.3"/><circle cx="12" cy="12" r="6.5"/>',
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
    const title = Mi.equippedTitle(save.progress, gameData.titles, titleContext());
    return h(
      "header",
      { class: "status-bar" },
      // Kept to two rows (user 2026-11-01: the old four-row bar pushed the
      // stage buttons below the fold).
      h(
        "div",
        { class: "status-row" },
        h("span", { class: "lv" }, `Lv ${p.level}`),
        h(
          "span",
          { class: "status-who" },
          p.name ? h("span", { class: "player-name" }, p.name) : null,
          title ? h("span", { class: "title-badge" }, title.name) : null
        ),
        h("span", { class: "currency", "aria-label": `金幣 ${p.coins}` }, h("span", { class: "cur-icon", html: icons.coin }), String(p.coins)),
        h("span", { class: "currency", "aria-label": `寶石 ${p.gems || 0}` }, h("span", { class: "cur-icon", html: icons.gem }), String(p.gems || 0))
      ),
      h("div", { class: "meter-row" }, meter("經驗", p.exp, need, "fill-exp"), meter("體力", st.value, st.max, "fill-stamina"))
    );
  }

  function claimableNow() {
    return Mi.claimableCount(save.progress, gameData.missions, Date.now());
  }

  // Little scenes for the two big home tiles (original art, same ink style).
  const TILE_ART = {
    // An open storybook with a path winding up to a castle with a waving flag.
    story: `<svg viewBox="0 0 150 76" aria-hidden="true">
      <circle cx="122" cy="16" r="9" fill="#fff6d8" stroke="#3b3330" stroke-width="2"/>
      <g class="tile-twinkle" fill="#fff"><path d="M18 10 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z"/><path d="M60 6 l1.5 3.5 l3.5 1.5 l-3.5 1.5 l-1.5 3.5 l-1.5 -3.5 l-3.5 -1.5 l3.5 -1.5z"/></g>
      <path d="M86 40 L86 22 L92 22 L92 26 L98 26 L98 22 L104 22 L104 26 L110 26 L110 22 L116 22 L116 40Z" fill="#fff" stroke="#3b3330" stroke-width="2.5" stroke-linejoin="round"/>
      <rect x="97" y="31" width="8" height="9" rx="4" fill="#c4b0e0" stroke="#3b3330" stroke-width="2"/>
      <path d="M101 22 V8" stroke="#3b3330" stroke-width="2"/><path class="tile-flag" d="M101 8 L113 11 L101 15Z" fill="#f4a3b8" stroke="#3b3330" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M80 42 Q96 36 124 42 L124 46 L80 46Z" fill="#a7d8a0" stroke="#3b3330" stroke-width="2"/>
      <path d="M8 70 Q8 50 36 46 Q58 44 75 52 Q92 44 114 46 Q142 50 142 70 Q112 62 75 72 Q38 62 8 70Z" fill="#fff" stroke="#3b3330" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M75 52 V72" stroke="#3b3330" stroke-width="2"/>
      <path d="M22 58 h40 M24 64 h34 M88 58 h40 M92 64 h34" stroke="#e8b84a" stroke-width="2" stroke-linecap="round"/>
      <path d="M75 52 Q82 44 90 44 Q100 44 101 40" fill="none" stroke="#e8b84a" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 5"/>
    </svg>`,
    // A </> code bolt striking a grumpy bug monster, with sparks.
    dse: `<svg viewBox="0 0 150 76" aria-hidden="true">
      <g class="tile-twinkle" fill="#fff6d8"><circle cx="20" cy="14" r="2.5"/><circle cx="132" cy="58" r="2"/><circle cx="58" cy="8" r="2"/></g>
      <ellipse cx="104" cy="70" rx="26" ry="4" fill="#3b3330" opacity="0.18"/>
      <g class="tile-monster">
        <path d="M80 66 Q78 34 104 30 Q130 34 128 66Z" fill="#a993cf" stroke="#3b3330" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M92 32 Q86 20 80 22 M116 32 Q122 20 128 22" fill="none" stroke="#3b3330" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="80" cy="22" r="3.5" fill="#9fe8e0" stroke="#3b3330" stroke-width="1.8"/><circle cx="128" cy="22" r="3.5" fill="#9fe8e0" stroke="#3b3330" stroke-width="1.8"/>
        <path d="M93 44 l8 3 M115 44 l-8 3" stroke="#3b3330" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="97" cy="50" r="2.5" fill="#3b3330"/><circle cx="111" cy="50" r="2.5" fill="#3b3330"/>
        <path d="M98 59 q6 -4 12 0" fill="none" stroke="#3b3330" stroke-width="2.5" stroke-linecap="round"/>
        <text x="104" y="40" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="7" font-weight="900" fill="#3b3330">404</text>
      </g>
      <g class="tile-bolt">
        <path d="M12 52 L44 38 L40 46 L70 36" fill="none" stroke="#3b3330" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 52 L44 38 L40 46 L70 36" fill="none" stroke="#f4d36b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="8" y="44" width="26" height="18" rx="6" fill="#fff" stroke="#3b3330" stroke-width="2.5"/>
        <text x="21" y="57" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="10" font-weight="900" fill="#3b3330">&lt;/&gt;</text>
      </g>
      <g class="tile-spark" stroke="#f4d36b" stroke-width="3" stroke-linecap="round"><path d="M74 26 l-4 -6 M78 34 l6 -2 M74 42 l-5 4"/></g>
    </svg>`,
  };

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
          { class: `home-stage time-${root.ITE.scenes.timeOfDay(Date.now())}` },
          h("div", { class: "home-scene", html: root.ITE.scenes.homeScene(Date.now()) }),
          h(
            "div",
            { class: "side-chips" },
            ONLINE ? sideChip("mission", "任務", () => root.ITE.missionsUi.show(), claimable) : null,
            sideChip("bag", "背包", () => root.ITE.inventoryUi.show()),
            // 遊戲指南 (2026-11-01); the 單機版 has room for a third chip.
            !ONLINE && root.ITE.guideUi ? sideChip("book", "指南", () => root.ITE.guideUi.show()) : null,
            sideChip("settings", "設定", () => root.ITE.settingsUi.show())
          ),
          next
            ? h("button", { class: "speech", onclick: () => root.ITE.storyUi.showIntro(next.id) }, `繼續學習：${next.id} ${next.name}`)
            : h("p", { class: "speech" }, "答啱 ICT 題，打倒 Bug 王！"),
          h("div", { class: "hero-stage", html: leader ? homeLeaderSprite(leader) : sprites.hero("idle") }),
          h("div", { class: "hero-shadow" })
        ),
        resume ? h("button", { class: "btn btn-primary resume", onclick: resumeBattle }, "繼續 DSE 挑戰") : null,
        h(
          "div",
          { class: "home-tiles" },
          // Illustrated mode tiles (2026-11-01: the flat ones looked dull).
          (() => {
            const sum = root.ITE.storyUi.summary();
            const pct = sum.total ? Math.round((sum.cleared / sum.total) * 100) : 0;
            return h(
              "button",
              { class: "home-tile tile-story", onclick: () => root.ITE.storyUi.show() },
              h("span", { class: "tile-art", html: TILE_ART.story }),
              h("span", { class: "tile-title" }, "故事模式"),
              h("span", { class: "tile-sub" }, next ? `下一關 ${next.id} ${next.name}` : root.ITE.storyUi.anyPlayable() ? "已開放關卡全部完成！" : "等待老師審核題目"),
              sum.total
                ? h("span", { class: "tile-progress", "aria-label": `完成 ${sum.cleared} / ${sum.total} 關` }, h("span", { class: "tile-progress-fill", style: `width:${pct}%` }), h("span", { class: "tile-progress-text" }, `${sum.cleared}/${sum.total}　★${sum.stars}`))
                : null
            );
          })(),
          (() => {
            const cleared = Object.entries(save.stages).filter(([id, r]) => id.startsWith("dse-") && r.cleared).length;
            return h(
              "button",
              { class: "home-tile tile-dse", onclick: showStages },
              h("span", { class: "tile-art", html: TILE_ART.dse }),
              h("span", { class: "tile-title" }, "DSE 挑戰"),
              h("span", { class: "tile-sub" }, "5 世界・4 難度・UR 試煉"),
              h("span", { class: "tile-progress" }, h("span", { class: "tile-progress-fill", style: `width:${Math.round((cleared / 20) * 100)}%` }), h("span", { class: "tile-progress-text" }, `已勝 ${cleared}/20 關`))
            );
          })()
        ),
        limited
          ? h(
              "button",
              { class: "limited-banner", onclick: () => startBattle(limited) },
              h("span", { class: "limited-boss", html: sprites.monster(root.ITE.scenes.forWorld(limited.world).monster, "smug", { tier: limited.difficulty }) }),
              h(
                "span",
                { class: "limited-info" },
                h("span", { class: "limited-tag" }, "今日限定"),
                h("span", { class: "limited-name" }, limited.chapter.replace("今日限定｜", "")),
                h("span", { class: "limited-sub" }, limited.description)
              )
            )
          : null,
        root.ITE.installUi ? root.ITE.installUi.homeCard() : null,
        BUILD_MODE === "dev" && root.ITE.reviewUi
          ? h("button", { class: "btn btn-review", onclick: () => root.ITE.reviewUi.show() }, "教師審核（開發版）")
          : null,
        loaded.status === "recovered" ? h("p", { class: "note" }, "存檔讀取失敗，已建立新存檔（舊資料已備份）。") : null,
        loaded.status === "repaired" ? h("p", { class: "note" }, "存檔部分資料損壞，已自動修復。") : null,
        BUILD_MODE === "dev" && bankCheck.report.rejected
          ? h("p", { class: "note" }, `題庫檢查：${bankCheck.report.accepted} 條通過，${bankCheck.report.rejected} 條被拒絕（見 console）`)
          : null,
        BUILD_MODE === "dev" ? h("p", { class: "placeholder-note" }, "PLACEHOLDER 美術｜非正式設計") : null
      )
    );
    // First visit: the new-player tutorial (設定 can replay it); after that, the
    // daily check-in once per Hong Kong day.
    // A name is asked first (also once for saves from before names existed).
    const afterName = () => {
      if (!save.settings.tutorialDone && root.ITE.tutorialUi) root.ITE.tutorialUi.show(0);
      else if (root.ITE.checkinUi && root.ITE.checkin.canCheckIn(save.profile, Date.now())) root.ITE.checkinUi.show();
    };
    if (!save.profile.name && root.ITE.nameUi) root.ITE.nameUi.show(showHome);
    else afterName();
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
      h("div", { class: "stage-boss", html: sprites.monster(root.ITE.scenes.forWorld(stage.world).monster, "smug", { tier: stage.difficulty }) }),
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

  const WORLD_SHORT = { A: "資訊處理", B: "電腦系統", C: "互聯網", D: "程式編寫", E: "社會影響" };
  // Which DSE world tab is open ("A".."E" or "mix"); kept while the app runs.
  let stageTab = "A";

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
        // 操練區 and the two UR modes as one row of tiles (2026-11-01: worlds in tabs below).
        h(
          "div",
          { class: "mode-row" },
          h("button", { class: "mode-tile drill-tile", onclick: () => root.ITE.drillUi.show() }, h("span", { class: "mode-icon" }, "📝"), h("span", { class: "mode-name" }, "操練區"), h("span", { class: "mode-sub" }, "不扣體力")),
          root.ITE.trialUi
            ? h("button", { class: "mode-tile trial-entry", onclick: () => root.ITE.trialUi.show() }, h("span", { class: "mode-icon" }, "👑"), h("span", { class: "mode-name" }, "帝王試煉"), h("span", { class: "mode-sub" }, "UR IT帝"))
            : null,
          root.ITE.trialUi
            ? h("button", { class: "mode-tile demon-entry", onclick: () => root.ITE.trialUi.show("demon") }, h("span", { class: "mode-icon" }, "⏱"), h("span", { class: "mode-name" }, "魔王限時"), h("span", { class: "mode-sub" }, "UR Bug 魔王"))
            : null
        ),
        limited ? stageCard(limited) : null,
        h(
          "div",
          { class: "world-tabs", role: "tablist", "aria-label": "DSE 世界" },
          Dg.WORLDS.map((w) => [w.id, w.id, WORLD_SHORT[w.id] || w.name])
            .concat([["mix", "★", "混合"]])
            .map(([key, big, small]) =>
              h(
                "button",
                { class: stageTab === key ? "world-tab active" : "world-tab", role: "tab", "aria-selected": stageTab === key ? "true" : "false", "aria-label": key === "mix" ? "混合練習" : `${key} ${Dg.WORLDS.find((w) => w.id === key).name}`, onclick: () => ((stageTab = key), sfx("tap"), showStages()) },
                h("span", { class: "world-tab-big" }, big),
                h("span", { class: "world-tab-small" }, small)
              )
            )
        ),
        stageTab === "mix"
          ? h("section", { class: "panel" }, h("h2", {}, "混合練習"), h("p", { class: "hint" }, "所有課題隨機出題，不用體力，只得經驗。"), (root.ITE.stages || []).map(stageCard))
          : Dg.WORLDS.filter((w) => w.id === stageTab).map((w) =>
          h(
            "section",
            { class: "panel world-panel" },
            h(
              "div",
              { class: "world-head" },
              h("span", { class: "world-monster", html: sprites.monster(root.ITE.scenes.forWorld(w.id).monster, "smug") }),
              h("div", {}, h("h2", {}, `${w.id}｜${w.name}`), h("p", { class: "hint" }, `Boss：${w.boss}`))
            ),
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
                    h("span", { class: "diff-meta" }, `${d.questionCount} 題｜體力 ${root.ITE.stamina.stageCost(st)}`),
                    h("span", { class: "diff-meta" }, `素材 ×${d.drops}${d.rare ? "＋傳說核心" : ""}`)
                  );
                })
            )
          )
        )
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
          h("p", { class: "hint" }, `每 5 分鐘回復 1 點${mins ? `（下一點約 ${mins} 分鐘後）` : ""}；每晚 12 時及升級時會回滿體力。`),
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
    // 帝王試煉 costs no stamina but is not practice: it gives rewards.
    const practice = (cost === 0 && stage.kind !== "trial") || !!(opts && opts.practice);
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
    sfx("stageStart");
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
    if (battleState.phase === "won" || battleState.phase === "lost") return finishBattle();
    save = S.withActiveBattle(save, battleState);
    persist();
    showBattle();
  }

  // Records the result, gives rewards and shows the result screen.
  function finishBattle() {
    {
      const sum = B.summary(battleState);
      save = S.recordStageResult(save, battleState.stageId, sum);
      if (sum.outcome === "won") recordStageClear({ difficulty: (findStage(battleState.stageId) || {}).difficulty });
      const base = root.ITE.dungeons.rewards(findStage(battleState.stageId), sum);
      lastReward = battleState.practice
        ? grantReward({ exp: base.exp, coins: 0 })
        : grantReward({ ...base, materials: root.ITE.dungeons.materialDrops(findStage(battleState.stageId), sum, gameData, root.ITE.rng.createRng(Date.now() ^ Math.floor(Math.random() * 2 ** 31))) });
      lastReward.practice = !!battleState.practice;
      const stageNow = findStage(battleState.stageId);
      if (stageNow && stageNow.kind === "trial") {
        const t = root.ITE.trial.claim(save.profile, stageNow.trial, sum.outcome, Date.now(), Math.random);
        save = { ...save, profile: t.profile };
        lastReward.trial = { won: sum.outcome === "won", shards: t.shards, rules: root.ITE.trial.rulesOf(stageNow.trial) };
        persist();
      }
      sfx(sum.outcome === "won" ? "win" : "lose");
      showResult();
    }
  }

  // ---------- 魔王限時: HP drain while a question is open ----------
  // A real-time loop drains party HP (src/core/trial.js tick) and updates the
  // bar in place. Each step counts at most 1 s, so time with the app in the
  // background (or the screen locked) does not drain.
  let drainTimer = null;
  let lastTick = 0;
  let lastSave = 0;

  function stopDrain() {
    if (drainTimer) root.clearInterval(drainTimer);
    drainTimer = null;
  }

  function startDrain() {
    if (drainTimer) return;
    lastTick = lastSave = Date.now();
    drainTimer = root.setInterval(drainStep, 200);
  }

  function drainInfo(s) {
    const per = Math.round(s.party.maxHp * s.timed.drainPct) / 100;
    const grace = root.ITE.trial.graceLeft(s);
    return grace > 0 ? `👓 眼鏡：還有 ${grace} 秒不扣血` : `⏱ 限時中：每秒 -${per} HP，快答！`;
  }

  function drainStep() {
    const s = battleState;
    if (!s || !s.timed || s.phase !== "question" || !app.querySelector(".screen.battle")) return stopDrain();
    const now = Date.now();
    const dt = Math.min(1000, now - lastTick);
    lastTick = now;
    battleState = root.ITE.trial.tick(s, dt);
    if (battleState.phase === "lost") {
      stopDrain();
      return finishBattle();
    }
    const p = battleState.party;
    const el = app.querySelector(".hp-party");
    if (el) {
      el.querySelector(".hp-num").textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
      el.querySelector(".hp-fill").style.width = `${Math.round((p.hp / p.maxHp) * 100)}%`;
      el.setAttribute("aria-valuenow", String(Math.ceil(p.hp)));
    }
    const info = app.querySelector(".drain-info");
    if (info) {
      info.textContent = drainInfo(battleState);
      info.classList.toggle("grace", root.ITE.trial.graceLeft(battleState) > 0);
    }
    if (now - lastSave > 2000) {
      lastSave = now;
      save = S.withActiveBattle(save, battleState);
      persist();
    }
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
        (() => {
          const look = stageLook(s.stageId);
          return arena({
            theme: look.theme,
            boss: { label: s.boss.name, hp: s.boss.hp, max: s.boss.maxHp, sprite: look.bossSprite || ((e) => sprites.monster(look.monster, e, { tier: look.tier })) },
            hero: {
              sprite: (e) => leaderSprite(s, e),
              bar: bar(s.team && s.team.length ? `我的隊伍（${s.team.length} 人）` : "我的隊伍", s.party.hp, s.party.maxHp, "party"),
            },
            fx: bossHit ? { hit: "boss", damage: r.damage, combo: r.combo, ko: s.boss.hp <= 0 } : heroHit ? { hit: "hero", taken: r.taken } : null,
          });
        })(),
        s.timed ? h("p", { class: `drain-info${root.ITE.trial.graceLeft(s) > 0 ? " grace" : ""}`, role: "status" }, feedback ? "⏸ 看解說時不扣血" : drainInfo(s)) : null,
        h(
          "section",
          { class: "question-card" },
          h(
            "div",
            { class: "q-meta" },
            h("span", { class: "chip" }, Q.TOPICS[q.topic_id]),
            q.review_status !== "approved" ? h("span", { class: "chip chip-warn" }, `狀態：${q.review_status}`) : null
          ),
          prevQuestionBox(q),
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
    if (s.timed && s.phase === "question") startDrain();
    else stopDrain();
  }

  // A 承上題 shows the question it follows, so it can be read on its own.
  function prevQuestionBox(q) {
    const prev = Q.previousOf(q, questionPool);
    return prev ? h("details", { class: "prev-q", open: "" }, h("summary", {}, "上一題內容"), h("p", {}, prev.stem)) : null;
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
        if (item.type === "time") return h("span", { class: "chip skill-passive" }, s.timed ? `${item.name}：每題首 ${item.seconds} 秒不扣血` : `${item.name}：魔王限時才生效`);
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
  // Sub-pages show the same compact two-row bar as home (2026-11-01: the old
  // one-line bar wrapped untidily on phones).
  function profileBar() {
    return statusBar();
  }


  // Every answered question in any mode counts towards missions and titles.
  // Every mode (DSE, story, guild) reports answers here, so this is also where
  // the correct / wrong sound plays.
  // What title conditions need beyond answer counts.
  function titleContext() {
    return { profile: save.profile, story: save.story, stages: save.stages };
  }

  function recordAnswer(q, correct, doPersist = true, opts) {
    sfx(correct ? "correct" : "wrong");
    save = { ...save, progress: Mi.recordAnswer(save.progress, q, correct, Date.now(), opts) };
    if (doPersist) persist();
  }

  function recordStageClear(info) {
    save = { ...save, progress: Mi.recordStageClear(save.progress, Date.now(), info) };
    persist();
  }

  // Shared battle arena (DSE, story): themed background, monster, hero and the
  // hit animations (user feedback 2026-10-31: more movement).
  //   o.theme       background theme (ITE.scenes)
  //   o.boss        { label, hp, max, sprite: (expr) => svg }
  //   o.hero        { sprite: (expr) => svg, bar: element or null }
  //   o.fx          null, or { hit: "boss", damage, combo, ko } or { hit: "hero", taken }
  function arena(o) {
    const fx = o.fx || {};
    const bossHit = fx.hit === "boss";
    const heroHit = fx.hit === "hero";
    const bossExpr = bossHit ? "hurt" : heroHit ? "smug" : "idle";
    const heroExpr = bossHit ? "happy" : heroHit ? "speechless" : "idle";
    return h(
      "section",
      { class: `arena${heroHit ? " quake" : ""}` },
      h("div", { class: "arena-scene", html: root.ITE.scenes.background(o.theme) }),
      h(
        "div",
        { class: "fighter boss" },
        bar(o.boss.label, o.boss.hp, o.boss.max, "boss"),
        h("div", { class: `sprite-wrap${bossHit ? (fx.ko ? " ko" : " hit") : heroHit ? " lunge-right" : ""}`, html: o.boss.sprite(bossExpr) }),
        bossHit ? h("div", { class: "impact", "aria-hidden": "true" }) : null,
        bossHit ? h("div", { class: `dmg-pop${fx.combo >= 3 ? " big" : ""}` }, `-${fx.damage}`) : null,
        bossHit && fx.combo >= 3 && !fx.ko ? h("div", { class: "combo-pop" }, `COMBO ×${fx.combo}!`) : null,
        fx.ko ? h("div", { class: "ko-pop" }, "KO!") : null
      ),
      h(
        "div",
        { class: "fighter hero" },
        h("div", { class: `sprite-wrap${bossHit ? " lunge-left" : heroHit ? " hit" : " breathe"}`, html: o.hero.sprite(heroExpr) }),
        heroHit && fx.taken ? h("div", { class: "dmg-pop dmg-hero" }, `-${fx.taken}`) : null,
        o.hero.bar || null
      ),
      bossHit ? h("div", { class: "bolt", "aria-hidden": "true" }, "</>") : null
    );
  }

  // Theme and monster for a DSE stage: its world, else the IT lab and Bug 王.
  function stageLook(stageId) {
    const st = findStage(stageId);
    const look = root.ITE.scenes.forWorld(st && st.world);
    // 帝王試煉: the boss is IT帝's shadow (the UR art, darkened in CSS).
    // 魔王限時: Bug 魔王 itself (before it joins you), in full colour.
    const urOf = st && st.kind === "trial" ? root.ITE.trial.rulesOf(st.trial).characterId : null;
    const face = (e) => (e === "hurt" ? "surprised" : e === "smug" ? "happy" : "idle");
    const bossSprite = !urOf ? null
      : urOf === "CH-ITEMPEROR" ? (e) => `<span class="shadow-boss">${sprites.character(urOf, face(e))}</span>`
      : (e) => sprites.character(urOf, face(e));
    return { ...look, tier: (st && st.difficulty) || "easy", bossSprite };
  }

  // The leader wears its equipment in battle (裝備造型, 2026-11-01).
  function leaderSprite(state, expr) {
    const leader = state.team && state.team[0];
    if (!leader) return sprites.hero(expr);
    const items = (state.loadout || []).filter((x) => x.holder === leader.id).map((x) => ({ id: x.id, tier: x.tier }));
    return root.ITE.gear ? root.ITE.gear.dressed(sprites.character(leader.id, expr), items) : sprites.character(leader.id, expr);
  }

  // Home: the leader with its equipped items.
  function homeLeaderSprite(leader) {
    const p = save.profile;
    const ids = root.ITE.equipment.itemsOf((p.equipment || {})[leader]);
    const items = ids.map((id) => ({ id, tier: Math.min(3, root.ITE.growth ? root.ITE.growth.equipmentTier(p, id) : 1) }));
    return root.ITE.gear ? root.ITE.gear.dressed(sprites.character(leader, "happy"), items) : sprites.character(leader, "happy");
  }

  // Adds a reward to the profile, saves, and returns what to show the player.
  function grantReward(reward) {
    const r = P.addReward(save.profile, reward, gameData);
    let profile = reward.materials ? root.ITE.inventory.addMaterials(r.profile, reward.materials, gameData) : r.profile;
    if (r.levelsGained) {
      profile = root.ITE.stamina.refill(profile, gameData.config, Date.now());
      setTimeout(() => sfx("levelUp"), 700); // after the win jingle
    }
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
      g.trial && g.trial.shards ? h("p", { class: "reward-line reward-material" }, `獲得 ${g.trial.rules.shardName} ×${g.trial.shards}（共 ${root.ITE.trial.shardsOf(save.profile, g.trial.rules)} / ${g.trial.rules.unlockShards}）`) : null,
      g.trial && g.trial.won && !g.trial.shards ? h("p", { class: "hint" }, "這個難度本週已領取碎片，下星期一再來！") : null,
      g.levelsGained ? h("p", { class: "reward-level" }, `升級！現在是 Lv ${g.level}，體力已回滿，+${g.levelsGained * P.PROFILE_RULES.levelUpGems} 寶石`) : null,
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
    prevQuestionBox,
    buildMode: BUILD_MODE,
    version: APP_VERSION,
    arena,
    sfx,
    showStages,
    startBattle,
    online: ONLINE,
    demo: DEMO,
    storage,
    grantReward,
    rewardPanel,
    profileBar,
    recordAnswer,
    recordStageClear,
    titleContext,
    getSave: () => save,
    setSave: (next) => {
      save = next;
      persist();
    },
  };
  // Wait for every script (guild, story, review screens) before the first render.
  // The opening animation (splash.js) shows first and then opens the home screen.
  const start = () => (root.ITE.splashUi ? root.ITE.splashUi.show(showHome) : showHome());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(globalThis);
