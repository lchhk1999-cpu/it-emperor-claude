// 新手教學 (user request 2026-10-31; expanded 2026-11-01): a card walkthrough of
// every feature, shown on the first home visit and again from 設定. Skippable
// at any step; the last card links to the full 遊戲指南 (src/ui/guide.js).
(function (root) {
  const app = root.ITE.app;
  const { h } = app;
  const sprites = root.ITE.sprites;

  // art: which picture to show. online: only in the online edition.
  // Covers every part of the game (user 2026-11-01: the first version missed
  // many features and gave no equipment strategy); 遊戲指南 has the details.
  const STEPS = [
    { art: "leader", title: "歡迎來到《IT帝》！", text: "你是 IT 學院的新生。Bug 王四處搗亂，只有用 ICT 知識才可以打倒牠！以下用一分鐘介紹全部玩法。" },
    { art: "boss", title: "答題就是攻擊", text: "每題 4 個選項。答對就攻擊，連續答對有 Combo 加成；答錯會被反擊扣 HP，但一定會看到解說和提示。" },
    { art: "story", title: "故事模式：跟住課程學", text: "A–E 五個世界共 43 關，按 DSE 課程逐步學。答錯不會失敗，題目稍後再出；答得好可拿 ★。不扣體力。" },
    { art: "boss", title: "DSE 挑戰：考考自己", text: "每個世界有簡單、中等、困難、究極。勝出得金幣和進化素材；每日還有「今日限定」素材關。挑戰會用體力。" },
    { art: "stamina", title: "體力與操練區", text: "體力每 5 分鐘回 1 點，每日 00:00 和升級時回滿。體力不夠仍可用練習模式答題；「操練區」更是完全不扣體力、隨時練。" },
    { art: "team", title: "隊伍與專長", text: "隊伍最多 5 人，隨等級解鎖位置；人越多，攻擊和 HP 越高。每個角色有專長課題，答對該課題的題目傷害更高。" },
    { art: "gear", title: "裝備策略", text: "每人 2 格（三階進化開第 3 格）。AI 模型留給難題刪錯誤選項；電腦在有把握時先按，答對加大傷害；眼藥水在 HP 低時回血；防毒軟件長關卡減傷；眼鏡是魔王限時必備。" },
    { art: "leader", title: "培養：升級與進化", text: "用金幣升級。到等級上限後，用專長素材進化（二階起要傳說核心，三階要碎片），能力大升。裝備亦可進化。" },
    { art: "box", title: "盲盒", text: "寶石只靠學習取得，不設購買。每次 6 個盲盒揀 1 個，機率公開，50 次內必有 SSR；重複的角色會變成碎片。" },
    { art: "ur", title: "UR 副本", text: "「帝王試煉」和「魔王限時」每週可挑戰，收集碎片合成 UR 角色 IT帝 和 Bug 魔王。魔王限時答題時每秒扣血，要快！" },
    { art: "daily", title: "每日目標", text: "每日簽到領獎，完成每日／每週任務得寶石，累積成績解鎖稱號並顯示在名字旁。背包可查看素材和碎片。" },
    { art: "leader", title: "校際公會", text: "與同校同學組成公會，每日一次合力攻擊公會 Boss，每週比較各校總傷害。", online: true },
    { art: "leader", title: "準備好了！", text: "由第一課開始吧！忘記玩法可按主頁「指南」查看完整遊戲指南（包括裝備策略），設定頁亦可重看教學及取得備份碼。" },
  ];

  function steps() {
    return STEPS.filter((s) => !s.online || app.online);
  }

  const INK = "#3b3330";
  const pics = {
    // An open storybook.
    story: `<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M8 80 Q8 46 40 40 Q54 38 60 48 Q66 38 80 40 Q112 46 112 80 Q86 72 60 82 Q34 72 8 80Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M60 48 V82" stroke="${INK}" stroke-width="2.5"/><path d="M20 56 h30 M22 64 h26 M70 56 h30 M72 64 h26" stroke="#e8b84a" stroke-width="3" stroke-linecap="round"/><path d="M52 16 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 l9 -4z" fill="#f4d36b" stroke="${INK}" stroke-width="2"/><path d="M84 10 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5z" fill="#f4a3b8" stroke="${INK}" stroke-width="1.8"/></svg>`,
    // A battery-style stamina gauge with a clock.
    stamina: `<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="10" y="30" width="78" height="34" rx="8" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="88" y="40" width="8" height="14" rx="3" fill="${INK}"/><rect x="16" y="36" width="50" height="22" rx="4" fill="#9fd4b4"/><path d="M42 38 l-8 12 h8 l-6 10 l14 -14 h-8 l6 -8z" fill="#f4d36b" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><circle cx="96" cy="20" r="14" fill="#fff6d8" stroke="${INK}" stroke-width="3"/><path d="M96 12 V20 L102 24" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    // A gift box with a bow.
    box: `<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="28" y="36" width="64" height="46" rx="8" fill="#f4a3b8" stroke="${INK}" stroke-width="3"/><rect x="22" y="26" width="76" height="16" rx="6" fill="#f8c9d6" stroke="${INK}" stroke-width="3"/><rect x="54" y="26" width="12" height="56" fill="#fff" stroke="${INK}" stroke-width="2.5"/><path d="M60 26 C48 8 32 12 40 24 Z M60 26 C72 8 88 12 80 24 Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><text x="60" y="70" text-anchor="middle" font-size="22" font-weight="900" fill="${INK}" font-family="system-ui">?</text></svg>`,
    // A calendar with a tick and a star.
    daily: `<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="24" y="16" width="72" height="66" rx="10" fill="#fff" stroke="${INK}" stroke-width="3"/><rect x="24" y="16" width="72" height="18" rx="9" fill="#9cc8ef" stroke="${INK}" stroke-width="3"/><path d="M40 10 v12 M80 10 v12" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><path d="M42 56 l10 10 l22 -22" fill="none" stroke="#7cc49a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M100 50 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3z" fill="#f4d36b" stroke="${INK}" stroke-width="2"/></svg>`,
  };

  function art(kind) {
    if (kind === "boss") return sprites.bugKing("smug");
    if (pics[kind]) return pics[kind];
    if (kind === "gear") {
      const ids = ["EQ-AI", "EQ-COMPUTER", "EQ-EYEDROP", "EQ-ANTIVIRUS", "EQ-GLASSES"];
      return `<div class="tut-gear">${ids.map((id) => `<span>${root.ITE.gear.icon(id, 1)}</span>`).join("")}</div>`;
    }
    if (kind === "ur") return `<div class="tut-pair"><span>${sprites.character("CH-ITEMPEROR", "happy")}</span><span>${sprites.character("CH-BUGLORD", "happy")}</span></div>`;
    if (kind === "team") {
      const team = app.getSave().profile.team.slice(0, 3);
      const ids = team.length > 1 ? team : ["CH-ITDOG", "CH-DB", "CH-HACK"];
      return `<div class="tut-pair tut-three">${ids.map((id) => `<span>${sprites.character(id, "happy")}</span>`).join("")}</div>`;
    }
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
        h("div", { class: ["gear", "ur", "team"].includes(step.art) ? "tutorial-art wide" : "tutorial-art", html: art(step.art) }),
        h("h2", { id: "tutorial-title" }, step.title),
        h("p", { class: "tutorial-text" }, step.text),
        h("div", { class: "tutorial-dots", "aria-hidden": "true" }, list.map((_, k) => h("span", { class: k === i ? "dot active" : "dot" }))),
        last
          ? h(
              "div",
              { class: "tutorial-actions" },
              h("button", { class: "btn btn-primary", onclick: () => finish(startFirstLesson) }, "開始第一課"),
              root.ITE.guideUi ? h("button", { class: "btn", onclick: () => finish(() => root.ITE.guideUi.show()) }, "查看遊戲指南") : null,
              h("button", { class: "btn-link", onclick: () => finish(app.showHome) }, "自己探索")
            )
          : h(
              "div",
              { class: "tutorial-actions" },
              h(
                "div",
                { class: "tutorial-nav" },
                i > 0 ? h("button", { class: "btn", onclick: () => show(i - 1) }, "上一步") : null,
                h("button", { class: "btn btn-primary", onclick: () => (app.sfx("tap"), show(i + 1)) }, "下一步")
              ),
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
