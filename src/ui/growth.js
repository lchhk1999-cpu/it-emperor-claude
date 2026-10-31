// 培養 screen (P5-04): level up and evolve owned characters; evolve owned equipment.
(function (root) {
  const Gr = root.ITE.growth;
  const P = root.ITE.profile;
  const I = root.ITE.inventory;
  const app = root.ITE.app;
  const { h } = app;
  const sprites = root.ITE.sprites;
  const data = root.ITE.gameData;

  let tab = "characters";

  const ERRORS = {
    not_enough_coins: "金幣不足。",
    not_enough_materials: "素材不足。到「DSE 題庫挑戰」取得素材。",
    not_enough_shards: "碎片不足。抽蛋抽到重複角色或裝備會得到碎片。",
    needs_level: "要先升到等級上限。",
    needs_evolution: "已到等級上限，進化後可以再升級。",
    max_level: "已到最高等級。",
    max_evolution: "已完成全部進化。",
    not_owned: "未擁有。",
  };

  function costName(c) {
    if (c.kind === "level") return "等級";
    if (c.kind === "coins") return "金幣";
    if (c.kind === "shards") return "碎片";
    return (I.materialById(data, c.id) || { name: c.id }).name;
  }

  function costList(cost) {
    return h(
      "ul",
      { class: "cost-list" },
      cost.map((c) => h("li", { class: c.have >= c.need ? "cost-ok" : "cost-short" }, `${costName(c)} ${c.have} / ${c.need}`))
    );
  }

  function act(fn, message, sound) {
    const r = fn(app.getSave().profile);
    if (r.error) return show(ERRORS[r.error] || r.error);
    app.sfx(sound || "reward");
    app.setSave({ ...app.getSave(), profile: r.profile });
    show(null, message);
  }

  function characterCard(profile, c) {
    const g = Gr.charGrowth(profile, c.id);
    const cap = Gr.GROWTH_RULES.levelCaps[g.evo];
    const st = Gr.stats(c, g);
    const cost = Gr.evolutionCost(profile, c, data);
    const atCap = g.level >= cap;
    const levelCost = Gr.GROWTH_RULES.levelCoins(g.level);
    return h(
      "section",
      { class: "panel grow-card" },
      h(
        "div",
        { class: "grow-head" },
        h("span", { class: "char-sprite", html: sprites.character(c.id, "idle") }),
        h(
          "div",
          { class: "grow-info" },
          h("span", { class: "char-name" }, c.name, h("span", { class: `rarity rarity-${c.rarity}` }, c.rarity)),
          h("span", {}, `Lv ${g.level} / ${cap}｜${Gr.EVO_NAMES[g.evo]}`),
          h("span", { class: "char-stats" }, `攻擊 ${st.attack}｜HP ${st.hp}`)
        )
      ),
      atCap
        ? null
        : h("button", { class: "btn", onclick: () => act((p) => Gr.levelUp(p, c.id, data), `${c.name} 升到 Lv ${g.level + 1}！`), ...(profile.coins < levelCost ? { disabled: "" } : {}) }, `升級（${levelCost} 金幣）`),
      cost
        ? h(
            "div",
            { class: "evo-box" },
            h("p", { class: "evo-title" }, `${Gr.EVO_NAMES[g.evo + 1]}需要：`),
            costList(cost),
            h(
              "button",
              {
                class: "btn btn-primary",
                onclick: () => act((p) => Gr.evolve(p, c.id, data), `${c.name} 完成${Gr.EVO_NAMES[g.evo + 1]}！`, "evolve"),
                ...(cost.every((x) => x.have >= x.need) ? {} : { disabled: "" }),
              },
              Gr.EVO_NAMES[g.evo + 1]
            )
          )
        : h("p", { class: "note" }, "已完成三階進化")
    );
  }

  function equipmentCard(profile, e) {
    const tier = Gr.equipmentTier(profile, e.id);
    const cost = Gr.equipmentCost(profile, e.id);
    return h(
      "section",
      { class: "panel grow-card" },
      h("p", { class: "char-name" }, e.name, h("span", { class: "evo-tier" }, `第 ${tier} 階`)),
      h("p", { class: "hint" }, `現在：${e.levels[tier - 1].text}`),
      cost
        ? h(
            "div",
            { class: "evo-box" },
            h("p", { class: "evo-title" }, `第 ${tier + 1} 階：${e.levels[tier].text}`),
            costList(cost),
            h(
              "button",
              {
                class: "btn btn-primary",
                onclick: () => act((p) => Gr.evolveEquipment(p, e.id, data), `${e.name} 進化到第 ${tier + 1} 階！`, "evolve"),
                ...(cost.every((x) => x.have >= x.need) ? {} : { disabled: "" }),
              },
              `進化到第 ${tier + 1} 階`
            )
          )
        : h("p", { class: "note" }, "已到最高階")
    );
  }

  function show(error, success) {
    const profile = app.getSave().profile;
    const owned = (id) => profile.owned.characters.includes(id);
    const groups = P.familyGroups(data.characters)
      .map((g) => ({ ...g, characters: g.characters.filter((c) => owned(c.id)) }))
      .filter((g) => g.characters.length);
    const equipment = data.equipment.filter((e) => profile.owned.equipment.includes(e.id));
    app.render(
      h(
        "main",
        { class: "screen growth", "data-tab": "growth" },
        h(
          "header",
          { class: "topbar" },
          h("button", { class: "btn-back", onclick: () => app.showHome(), "aria-label": "返回" }, "‹"),
          h("h1", {}, "培養")
        ),
        app.profileBar(),
        h(
          "div",
          { class: "tabs", role: "tablist" },
          [["characters", "角色"], ["equipment", "裝備"]].map(([id, label]) =>
            h("button", { class: tab === id ? "tab active" : "tab", role: "tab", "aria-selected": tab === id ? "true" : "false", onclick: () => ((tab = id), show()) }, label)
          )
        ),
        error ? h("p", { class: "form-error", role: "alert" }, error) : null,
        success ? h("p", { class: "note success", "aria-live": "polite" }, success) : null,
        tab === "characters"
          ? [
              h("p", { class: "hint" }, "升級用金幣。進化要先到等級上限，並用專長課題的素材（DSE 題庫挑戰）；二階起要傳說核心；三階要該角色的碎片（抽蛋重複所得）。"),
              groups.flatMap((g) => [h("h3", { class: "family-title" }, g.name), g.characters.map((c) => characterCard(profile, c))]),
            ]
          : [
              h("p", { class: "hint" }, "裝備有 3 階效果。第 2 階要傳說核心；第 3 階另要該裝備的碎片。"),
              equipment.map((e) => equipmentCard(profile, e)),
            ]
      )
    );
  }

  root.ITE.growthUi = { show: () => show() };
})(globalThis);
