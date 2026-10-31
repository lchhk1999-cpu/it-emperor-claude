// 抽蛋 screen. Free gems only (from learning missions); no purchase screen.
// Rates are published here, with the pity countdown and recent history.
// Each draw is a 盲盒六選一 (user request 2026-11-01): six closed boxes that
// wobble and boing when tapped; the player opens one and the other five are
// then revealed (user choice). Leaving before opening costs nothing.
(function (root) {
  const G = root.ITE.gacha;
  const Q = root.ITE.questions;
  const app = root.ITE.app;
  const { h } = app;
  const sprites = root.ITE.sprites;
  const data = root.ITE.gameData;

  let lastResult = null;
  // Box screen state: { type, rolled, selected, opened, result } or null.
  let stage = null;

  const BOX_COLORS = [["#f4a3b8", "#f8c9d6"], ["#8fc7f0", "#c3e1f7"], ["#f4d36b", "#f9e7a8"], ["#a7d8a0", "#d0ecca"], ["#c4b0e0", "#e0d5f0"], ["#f6b38a", "#fad3ba"]];
  const boxSvg = (i) => {
    const [main, light] = BOX_COLORS[i % BOX_COLORS.length];
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect x="14" y="40" width="72" height="50" rx="8" fill="${main}" stroke="#3b3330" stroke-width="4"/><rect x="8" y="28" width="84" height="18" rx="6" fill="${light}" stroke="#3b3330" stroke-width="4"/><rect x="43" y="28" width="14" height="62" fill="#fff" stroke="#3b3330" stroke-width="3"/><path d="M50 28 C38 10 22 14 30 26 Z M50 28 C62 10 78 14 70 26 Z" fill="#fff" stroke="#3b3330" stroke-width="3.5" stroke-linejoin="round"/><text x="50" y="76" text-anchor="middle" font-size="26" font-weight="900" fill="#3b3330" font-family="system-ui">?</text></svg>`;
  };

  const ERRORS = {
    not_enough_gems: `寶石不足（每次 ${G.GACHA_RULES.cost} 顆）。完成每日／每週任務可以取得寶石。`,
    pool_empty: "這個池暫時沒有可抽的項目。",
    unknown_box: "請先揀一個盲盒。",
  };

  function topicName(id) {
    return id === "ALL" ? "全部課題" : Q.TOPICS[id] || id;
  }

  function doDraw(type) {
    const rolled = G.rollBoxes(app.getSave().profile, type, data, root.ITE.rng.createRng(Date.now() ^ Math.floor(Math.random() * 2 ** 31)));
    if (rolled.error) return show(ERRORS[rolled.error]);
    lastResult = null;
    stage = { type, rolled, selected: null, opened: false, result: null };
    app.sfx("tap");
    show();
    root.scrollTo && root.scrollTo(0, 0);
  }

  // Restarts a CSS animation on an element.
  function replay(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function selectBox(i, el) {
    stage.selected = i;
    app.sfx("boxTap", 1 + i * 0.12);
    for (const b of root.document.querySelectorAll(".blind-box")) b.classList.toggle("selected", b === el);
    replay(el, "box-jiggle");
    const open = root.document.querySelector(".box-open-btn");
    if (open) open.disabled = false;
  }

  function openSelected() {
    if (stage.selected === null) return;
    const r = G.openBox(app.getSave().profile, stage.rolled, stage.selected, data);
    if (r.error) return show(ERRORS[r.error]);
    app.setSave({ ...app.getSave(), profile: r.profile });
    app.sfx("boxOpen");
    const el = root.document.querySelectorAll(".blind-box")[stage.selected];
    root.document.querySelector(".box-open-btn").disabled = true;
    for (const b of root.document.querySelectorAll(".blind-box")) b.disabled = true;
    el.classList.add("box-burst");
    stage = { ...stage, opened: true, result: r.result };
    const reduced = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => {
      app.sfx(r.result.rarity === "SSR" ? "gachaSSR" : "gacha");
      show();
    }, reduced ? 0 : 900);
  }

  function miniArt(box) {
    return box.type === "character" ? sprites.character(box.id, "idle") : root.ITE.gear.icon(box.id, 1);
  }

  function boxStage() {
    const { rolled, opened, result, selected } = stage;
    if (!opened) {
      return h(
        "section",
        { class: "panel box-stage" },
        h("h2", {}, stage.type === "character" ? "角色盲盒：揀一個！" : "裝備盲盒：揀一個！"),
        rolled.pity ? h("p", { class: "note box-pity" }, "保底：今次每個盲盒都是 SSR！") : h("p", { class: "hint center" }, "點擊盲盒會搖動，揀好後按「開啟」。"),
        h(
          "div",
          { class: "box-grid" },
          rolled.boxes.map((_, i) => {
            const el = h("button", { class: "blind-box", style: `--i:${i}`, "aria-label": `盲盒 ${i + 1}`, html: boxSvg(i) });
            el.addEventListener("click", () => selectBox(i, el));
            return el;
          })
        ),
        h("button", { class: "btn btn-primary box-open-btn", onclick: openSelected, ...(selected === null ? { disabled: "" } : {}) }, `開啟！（${G.GACHA_RULES.cost} 寶石）`),
        h("button", { class: "btn", onclick: () => ((stage = null), show()) }, "返回（不扣寶石）")
      );
    }
    return h(
      "div",
      {},
      resultCard(result),
      h(
        "section",
        { class: "panel box-stage" },
        h("h3", { class: "rates-title" }, "其他盲盒的內容"),
        h(
          "div",
          { class: "box-grid revealed" },
          rolled.boxes.map((b, i) =>
            h(
              "div",
              { class: i === selected ? "reveal-cell picked" : "reveal-cell", style: `--i:${i}` },
              h("div", { class: "reveal-art", html: miniArt(b) }),
              h("span", { class: "reveal-name" }, b.name),
              b.rarity ? h("span", { class: `rarity rarity-${b.rarity}` }, b.rarity) : null,
              i === selected ? h("span", { class: "reveal-mine" }, "你的選擇") : null
            )
          )
        ),
        h("p", { class: "hint center" }, "只會獲得你開啟的盲盒；其他盲盒只供觀看。"),
        h("button", { class: "btn btn-primary", onclick: () => doDraw(stage.type), ...((app.getSave().profile.gems || 0) >= G.GACHA_RULES.cost ? {} : { disabled: "" }) }, `再抽一次（${G.GACHA_RULES.cost} 寶石）`),
        h("button", { class: "btn", onclick: () => ((stage = null), show()) }, "完成")
      )
    );
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
        : h("div", { class: "gacha-equip", html: root.ITE.gear.icon(res.id, 1) }),
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
          h("button", { class: "btn-back", onclick: () => ((lastResult = null), (stage = null), app.showHome()), "aria-label": "返回" }, "‹"),
          h("h1", {}, "抽蛋")
        ),
        app.profileBar(),
        h("p", { class: "hint center" }, `每次 ${G.GACHA_RULES.cost} 顆寶石。寶石只可透過學習任務免費取得，不設現金購買。`),
        message ? h("p", { class: "form-error", role: "alert" }, message) : null,
        stage ? boxStage() : null,
        stage ? null : lastResult ? resultCard(lastResult) : null,
        stage ? null : h(
          "section",
          { class: "panel" },
          h("h2", {}, "角色盲盒"),
          untilPity !== null ? h("p", { class: "hint" }, `再抽 ${untilPity} 次內必定獲得 SSR 角色（保底）`) : null,
          h("button", { class: "btn btn-primary", onclick: () => doDraw("character"), ...(canDraw ? {} : { disabled: "" }) }, `抽盲盒（${G.GACHA_RULES.cost} 寶石）`),
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
          h("p", { class: "hint" }, `每次出現 ${G.BOX_COUNT} 個盲盒，每個都按上表機率獨立決定內容，揀哪一個機率都一樣；保底時全部都是 SSR。`),
          h("p", { class: "hint" }, `重複角色換成該角色的碎片 ×${G.GACHA_RULES.duplicateShards}，用於第三階段進化。`)
        ),
        stage ? null : h(
          "section",
          { class: "panel" },
          h("h2", {}, "裝備盲盒"),
          h("button", { class: "btn btn-primary", onclick: () => doDraw("equipment"), ...(canDraw ? {} : { disabled: "" }) }, `抽盲盒（${G.GACHA_RULES.cost} 寶石）`),
          h("h3", { class: "rates-title" }, "公開機率"),
          h("p", { class: "hint" }, `${equipList.map((e) => e.name).join("、")}：每件 ${Math.round((100 / equipList.length) * 10) / 10}%`),
          h("p", { class: "hint" }, `裝備暫未設稀有度，所以每件機率相同。重複裝備換成該裝備的碎片 ×${G.GACHA_RULES.duplicateShards}，用於第三階進化。`)
        ),
        stage ? null : h(
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

  root.ITE.gachaUi = { show: () => ((lastResult = null), (stage = null), show()) };
})(globalThis);
