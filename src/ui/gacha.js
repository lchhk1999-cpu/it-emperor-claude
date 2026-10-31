// 抽蛋 screen. Free gems only (from learning missions); no purchase screen.
// Rates are published here, with the pity countdown and recent history.
(function (root) {
  const G = root.ITE.gacha;
  const Q = root.ITE.questions;
  const app = root.ITE.app;
  const { h } = app;
  const sprites = root.ITE.sprites;
  const data = root.ITE.gameData;

  let lastResult = null;

  // Simple placeholder icon for an equipment result (no per-item art yet).
  const EQUIP_ICON = `<svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true"><rect x="10" y="22" width="60" height="44" rx="10" fill="#c4b0e0" stroke="#3b3330" stroke-width="3"/><path d="M28 22 V14 h24 v8" fill="none" stroke="#3b3330" stroke-width="3" stroke-linejoin="round"/><rect x="34" y="38" width="12" height="12" rx="3" fill="#f4d36b" stroke="#3b3330" stroke-width="2.5"/></svg>`;

  const ERRORS = {
    not_enough_gems: `寶石不足（每次 ${G.GACHA_RULES.cost} 顆）。完成每日／每週任務可以取得寶石。`,
    pool_empty: "這個池暫時沒有可抽的項目。",
  };

  function topicName(id) {
    return id === "ALL" ? "全部課題" : Q.TOPICS[id] || id;
  }

  function doDraw(type) {
    const r = G.draw(app.getSave().profile, type, data, root.ITE.rng.createRng(Date.now() ^ Math.floor(Math.random() * 2 ** 31)));
    if (r.error) return show(ERRORS[r.error]);
    app.setSave({ ...app.getSave(), profile: r.profile });
    lastResult = r.result;
    app.sfx(r.result.rarity === "SSR" ? "gachaSSR" : "gacha");
    show();
  }

  function resultCard(res) {
    const isChar = res.type === "character";
    const ch = isChar ? data.characters.find((c) => c.id === res.id) : null;
    const eq = isChar ? null : data.equipment.find((e) => e.id === res.id);
    return h(
      "section",
      { class: `panel gacha-result rarity-bg-${res.rarity || "EQ"}`, "aria-live": "polite" },
      h("p", { class: "gacha-result-title" }, res.duplicate ? "已擁有" : "獲得！", res.pity ? "（保底）" : ""),
      isChar
        ? h("div", { class: "gacha-sprite", html: sprites.character(res.id, res.duplicate ? "idle" : "happy") })
        : h("div", { class: "gacha-equip", html: EQUIP_ICON }),
      h(
        "p",
        { class: "gacha-name" },
        res.name,
        res.rarity ? h("span", { class: `rarity rarity-${res.rarity}` }, res.rarity) : null
      ),
      isChar ? h("p", { class: "hint" }, ch.familyName ? `${ch.familyName}｜專長：${topicName(ch.specialty)}` : `專長：${topicName(ch.specialty)}`) : h("p", { class: "hint" }, eq.levels[0].text),
      res.duplicate ? h("p", { class: "note" }, `重複：換成碎片 ×${res.shards}（第三階段進化用）`) : h("p", { class: "note" }, isChar ? "可以到「角色隊伍」加入隊伍" : "可以到「角色隊伍」為隊員裝備")
    );
  }

  function show(message) {
    const profile = app.getSave().profile;
    const gems = profile.gems || 0;
    const rates = G.characterRates(data);
    const untilPity = G.drawsUntilPity(profile, data);
    const equipList = G.equipmentCandidates(data);
    const canDraw = gems >= G.GACHA_RULES.cost;
    const nameOf = (entry) => {
      const item = entry.type === "character" ? data.characters.find((c) => c.id === entry.id) : data.equipment.find((e) => e.id === entry.id);
      return item ? item.name : entry.id;
    };

    app.render(
      h(
        "main",
        { class: "screen gacha", "data-tab": "gacha" },
        h(
          "header",
          { class: "topbar" },
          h("button", { class: "btn-back", onclick: () => ((lastResult = null), app.showHome()), "aria-label": "返回" }, "‹"),
          h("h1", {}, "抽蛋")
        ),
        app.profileBar(),
        h("p", { class: "hint center" }, `每次 ${G.GACHA_RULES.cost} 顆寶石。寶石只可透過學習任務免費取得，不設現金購買。`),
        message ? h("p", { class: "form-error", role: "alert" }, message) : null,
        lastResult ? resultCard(lastResult) : null,
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "角色蛋"),
          untilPity !== null ? h("p", { class: "hint" }, `再抽 ${untilPity} 次內必定獲得 SSR 角色（保底）`) : null,
          h("button", { class: "btn btn-primary", onclick: () => doDraw("character"), ...(canDraw ? {} : { disabled: "" }) }, `抽 1 次（${G.GACHA_RULES.cost} 寶石）`),
          h("h3", { class: "rates-title" }, "公開機率"),
          h(
            "table",
            { class: "rates" },
            h("thead", {}, h("tr", {}, h("th", {}, "稀有度"), h("th", {}, "機率"), h("th", {}, "角色（同稀有度內機率相同）"))),
            h(
              "tbody",
              {},
              rates.map((r) =>
                h(
                  "tr",
                  {},
                  h("td", {}, h("span", { class: `rarity rarity-${r.rarity}` }, r.rarity)),
                  h("td", {}, `${r.pct}%`),
                  h("td", {}, r.characters.map((c) => c.name).join("、"))
                )
              )
            )
          ),
          h("p", { class: "hint" }, `重複角色換成該角色的碎片 ×${G.GACHA_RULES.duplicateShards}，用於第三階段進化。`)
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "裝備蛋"),
          h("button", { class: "btn btn-primary", onclick: () => doDraw("equipment"), ...(canDraw ? {} : { disabled: "" }) }, `抽 1 次（${G.GACHA_RULES.cost} 寶石）`),
          h("h3", { class: "rates-title" }, "公開機率"),
          h("p", { class: "hint" }, `${equipList.map((e) => e.name).join("、")}：每件 ${Math.round((100 / equipList.length) * 10) / 10}%`),
          h("p", { class: "hint" }, `裝備暫未設稀有度，所以每件機率相同。重複裝備換成該裝備的碎片 ×${G.GACHA_RULES.duplicateShards}，用於第三階進化。`)
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "最近紀錄"),
          (profile.gachaLog || []).length
            ? h(
                "ol",
                { class: "gacha-log" },
                profile.gachaLog.map((e) =>
                  h("li", {}, nameOf(e), e.rarity ? h("span", { class: `rarity rarity-${e.rarity}` }, e.rarity) : null, e.duplicate ? (e.shards ? `　重複 → 碎片 ×${e.shards}` : `　重複 → 金幣 ${e.coins || 0}`) : "　新獲得")
                )
              )
            : h("p", { class: "hint" }, "未有紀錄。")
        )
      )
    );
  }

  root.ITE.gachaUi = { show: () => ((lastResult = null), show()) };
})(globalThis);
