// 遊戲指南 (user request 2026-11-01): every feature explained in one place, with
// an equipment strategy section. Numbers come from the live rules and workbook
// data, so the guide stays right when balance changes. Opened from the home
// 「指南」 button, the last 新手教學 card and 設定.
(function (root) {
  const app = root.ITE.app;
  const { h } = app;
  const data = root.ITE.gameData;
  const Dg = root.ITE.dungeons;
  const T = root.ITE.trial;
  const G = root.ITE.gacha;

  // When each item is worth it (strategy, not numbers).
  // When each kind of item is worth it (strategy, not numbers). R / SR / SSR
  // items of a kind work the same way; higher rarity is stronger.
  const GEAR_TIPS = {
    hint: { when: "遇到沒有把握的難題時才按。", note: "只會刪去錯誤選項，永遠不會刪正確答案；用後要冷卻幾題。" },
    damage: { when: "有把握答對、或 Combo 連勝時先按，再答題。", note: "下一題答對才有額外傷害；答錯就浪費了，冷卻後才可再用。" },
    healing: { when: "HP 跌到一半以下時用。", note: "每件每場只可用一次，HP 滿時不能用。" },
    defense: { when: "長關卡、究極、帝王試煉最難一級。", note: "不用按，被動減少答錯時受到的傷害；隊伍內只計最高一件。" },
    time: { when: "魔王限時必備。", note: "每題開頭有幾秒不扣血，讓你看清題目；其他模式沒有作用。" },
  };


  const BUILDS = [
    ["新手穩陣", "提示類＋回血類（例如 AI 模型＋眼藥水）", "容錯高，先求過關。"],
    ["高難度長戰", "減傷類＋回血類（例如防火牆＋急救工具箱）", "究極、30 題以上關卡，靠減傷和回血撐到最後。"],
    ["速攻爆發", "傷害類＋提示類（例如伺服器機櫃＋量子 AI 核心）", "熟悉的世界，用提示確保答對，再加大傷害。"],
    ["魔王限時", "時間類＋回血類（例如時光沙漏＋眼藥水）", "減少扣血時間並補血；有第 3 格可加減傷類。"],
    ["分散配置", "5 位隊員各帶不同類別", "同一類別的減傷只計最高一件，分給不同隊員更有效。"],
  ];

  function section(title, open, ...body) {
    return h("details", { class: "panel guide-sec", ...(open ? { open: "" } : {}) }, h("summary", {}, title), h("div", { class: "guide-body" }, body));
  }

  const p = (text) => h("p", {}, text);
  const li = (items) => h("ul", { class: "guide-list" }, items.map((t) => h("li", {}, t)));

  function gearSection() {
    const rank = { UR: 0, SSR: 1, SR: 2, R: 3 };
    const order = ["hint", "damage", "healing", "defense", "time"];
    const items = (data.equipment || []).filter((e) => e.supported).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || (rank[a.rarity] ?? 9) - (rank[b.rarity] ?? 9));
    return section(
      "⚔ 裝備策略",
      true,
      p("每位隊員有 2 個裝備格，角色第三階進化後開第 3 格。每件裝備同一時間只可由一位隊員使用。裝備分 R、SR、SSR（盲盒取得）及 UR（答題衝刺取得），同類裝備功能一樣，稀有度越高越強。裝備用於 DSE 挑戰及 UR 副本；故事模式不受影響。"),
      items.map((e) => {
        const tip = GEAR_TIPS[e.type] || { when: "", note: "" };
        return h(
          "div",
          { class: "guide-gear" },
          h("span", { class: "guide-gear-icon", html: root.ITE.gear.icon(e.id, 1) }),
          h(
            "div",
            {},
            h("b", {}, e.name, e.rarity ? h("span", { class: `rarity rarity-${e.rarity}` }, e.rarity) : null),
            h("p", { class: "hint" }, e.levels.map((lv, i) => `第 ${i + 1} 階：${lv.text}`).join("｜")),
            tip.when ? h("p", { class: "guide-when" }, `何時用：${tip.when}`) : null,
            tip.note ? h("p", { class: "hint" }, tip.note) : null
          )
        );
      }),
      h("h3", {}, "推薦配搭"),
      h(
        "table",
        { class: "guide-table" },
        h("thead", {}, h("tr", {}, h("th", {}, "情況"), h("th", {}, "裝備"), h("th", {}, "原因"))),
        h("tbody", {}, BUILDS.map(([a, b, c]) => h("tr", {}, h("td", {}, a), h("td", {}, b), h("td", {}, c))))
      ),
      li(["隊長（第一位隊員）身上的裝備會在戰鬥畫面顯示。", "裝備可在「培養 → 裝備」進化，效果更強；第 3 階要該裝備的碎片。", "裝備可從裝備盲盒取得，重複的會變成碎片。"])
    );
  }

  function show() {
    const slots = root.ITE.profile.PROFILE_RULES.teamSlotLevels;
    const caps = root.ITE.growth.GROWTH_RULES.levelCaps;
    const rates = G.characterRates(data).map((r) => `${r.rarity} ${r.pct}%`).join("、");
    const tierText = (R) => R.order.map((k) => { const t = R.tiers[k]; return `${t.name} ${t.questionCount} 題（碎片 ${t.shards[0] === t.shards[1] ? t.shards[0] : `${t.shards[0]}–${t.shards[1]}`}）`; }).join("、");
    app.render(
      h(
        "main",
        { class: "screen guide" },
        h("header", { class: "topbar" }, h("button", { class: "btn-back", onclick: () => app.showHome(), "aria-label": "返回" }, "‹"), h("h1", {}, "遊戲指南")),
        h("p", { class: "hint center" }, "點標題展開。想重看新手教學，可到「設定」。"),
        section("📝 答題與戰鬥", false, li(["每題 4 個選項，答對就攻擊 Boss，連續答對有 Combo 加成。", "答錯會被反擊扣隊伍 HP，並即時看到解說和提示。", "打倒 Boss 即勝利；HP 歸零或題目用完仍未打倒就失敗。", "每次出題選項次序都會打亂，要真的明白才答得對。"])),
        section("📖 故事模式", false, li(["A–E 五個世界共 43 關，按 DSE 課程次序學習。", "每關先練習再挑戰小 Boss；答錯的題目稍後會再出現，直至答對。", "按表現取得 1–3 粒 ★；完成一關才解鎖下一關。", "不扣體力，最適合第一次學習某個課題。"])),
        section("⚔ DSE 挑戰", false,
          li([
            `五個世界（${Dg.WORLDS.map((w) => `${w.id} ${w.name}`).join("、")}），各有${Dg.DIFFICULTY_ORDER.map((k) => Dg.DIFFICULTIES[k].name).join("、")}四個難度。`,
            `題數：${Dg.DIFFICULTY_ORDER.map((k) => `${Dg.DIFFICULTIES[k].name} ${Dg.DIFFICULTIES[k].questionCount} 題`).join("、")}；扣同等體力。`,
            `勝出得金幣（${Dg.DIFFICULTY_ORDER.map((k) => Dg.DIFFICULTIES[k].winCoins).join("／")}）及該世界的進化素材；中等和困難有機會額外得傳說核心，究極必得。`,
            "「今日限定」每日不同主題，勝出可得大量指定素材。",
            "「混合練習」不用體力，只得經驗。",
          ])),
        section("⚡ 體力與操練區", false, li([
          `體力上限 = 40 + 每級 2；每 5 分鐘回 1 點，每日香港時間 00:00 及每次升級都會回滿。`,
          "體力不夠時仍可用「練習模式」作答，只得經驗。",
          "「操練區」可揀世界及難度隨機出題，不扣體力、不設獎勵，答完即看解說，隨時離開。",
        ])),
        section("👥 隊伍與專長", false, li([
          `隊伍最多 5 人，位置在 Lv ${slots.join("、")} 解鎖。`,
          "每個角色有專長課題，答對該課題的題目傷害提升；加成幅度在角色卡上顯示。",
          "隊伍攻擊和 HP 是成員平均值，再按人數加成：每多一位隊員攻擊 +10%、HP +15%（5 人共 +40%／+60%）。課題越多元，越多題目有專長加成。",
          "隊伍和裝備只影響 DSE 挑戰及 UR 副本；故事模式人人公平。",
        ])),
        gearSection(),
        section("🌱 培養", false, li([
          `角色用金幣升級；等級上限按進化階段為 ${caps.join("／")}。`,
          "到上限後進化：一階要專長素材＋金幣；二階再加傳說核心；三階再加該角色碎片。",
          "專長「全部課題」的角色用經驗芯片進化。",
          "可升級或進化的角色在培養頁有橙色 ▲。",
        ])),
        section("🎁 盲盒", false, li([
          `寶石只可靠學習取得（任務、簽到、升級），不設購買。每次 ${G.GACHA_RULES.cost} 寶石。`,
          `每次 ${G.BOX_COUNT} 個盲盒揀 1 個，每個都按公開機率獨立決定：${rates}。`,
          `${G.GACHA_RULES.ssrPity} 次內必定有 SSR（保底時 6 個都是 SSR）。`,
          "重複的角色或裝備會變成碎片，用於第三階進化。",
        ])),
        section("👑 UR 副本", false, li([
          `帝王試煉：${tierText(T.TRIAL_RULES)}。集齊 ${T.TRIAL_RULES.unlockShards} 碎片合成 UR「IT帝」。`,
          `魔王限時：${tierText(T.DEMON_RULES)}。答題時每秒扣隊伍 HP，看解說時暫停；集齊 ${T.DEMON_RULES.unlockShards} 碎片合成 UR「Bug 魔王」。`,
          "每個難度每星期（星期一 00:00 重置）可領一次碎片；輸了可以再挑戰，不扣體力。",
          "UR 角色不會在盲盒出現。",
          "答題衝刺：角色向前跑，每題三道門，開始有 60 秒，走對門 +6 秒、走錯門 −4 秒，時間用完結束；通過 5／10／15／20／30 道門得 1–5 個碎片，每日 3 次領獎。集齊 40 個合成 UR 裝備「雷神鍵盤」（每連擊一題額外傷害 +10／15／20）。",
        ])),
        section("📅 每日目標", false, li([
          "每日首次打開會彈出簽到，7 日一循環，累積計算，缺席不會重新開始。",
          "每日／每週任務完成後到「任務」領寶石和金幣。",
          "達成條件會自動取得稱號，可佩戴一個顯示在名字旁。",
          "背包可查看進化素材、角色碎片和裝備。",
        ])),
        section("⚙ 設定與存檔", false, li([
          "可分別開關背景音樂和音效，上堂時可以關掉。",
          "進度只存在這部裝置。換機前在「設定 → 備份進度」取得備份碼，在新機貼上即可還原。",
          "可在設定更改暱稱及重看新手教學。",
        ]))
      )
    );
  }

  root.ITE.guideUi = { show };
})(globalThis);
