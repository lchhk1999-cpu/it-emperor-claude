// 背包 screen (P5-01): evolution materials, shards and owned equipment.
// Materials and shards are used in 培養 (P5-04).
(function (root) {
  const I = root.ITE.inventory;
  const app = root.ITE.app;
  const { h } = app;
  const data = root.ITE.gameData;
  const sprites = root.ITE.sprites;

  // Placeholder material icon, coloured by rarity (no per-item art yet).
  const RARITY_FILL = { common: "#bfe3d0", rare: "#8fc3e8", legendary: "#f4d36b" };
  const icon = (rarity) =>
    `<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true"><path d="M24 4 L42 16 L36 40 H12 L6 16 Z" fill="${RARITY_FILL[rarity] || "#e2e5ea"}" stroke="#3b3330" stroke-width="3" stroke-linejoin="round"/><path d="M16 18 L24 12 L32 18" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/></svg>`;

  function show() {
    const profile = app.getSave().profile;
    const list = I.materialList(profile, data);
    const owned = list.filter((m) => m.count > 0);
    const equipment = (data.equipment || []).filter((e) => profile.owned.equipment.includes(e.id));
    // 碎片 with pictures (user 2026-11-01: 未有顯示角色碎片): characters first.
    const have = profile.shards || {};
    const charShards = (data.characters || []).filter((c) => have[c.id] > 0);
    const equipShards = (data.equipment || []).filter((e) => have[e.id] > 0);
    const T = root.ITE.trial;
    const urRules = T ? [T.TRIAL_RULES, T.DEMON_RULES] : [];
    const shardUse = (c) => {
      const ur = urRules.find((r) => r.characterId === c.id);
      if (ur && !profile.owned.characters.includes(c.id)) return `合成用：${have[c.id]} / ${ur.unlockShards}`;
      return profile.owned.characters.includes(c.id) ? "第三階進化用" : "未擁有角色";
    };
    const shardItem = (art, name, rarity, use, n) =>
      h(
        "li",
        { class: "mat-item shard-item" },
        h("span", { class: "shard-art", html: art }),
        h("span", { class: "mat-info" }, h("span", { class: "mat-name" }, name, rarity ? h("span", { class: `rarity rarity-${rarity}` }, rarity) : null), h("span", { class: "mat-desc" }, use)),
        h("span", { class: "mat-count" }, `×${n}`)
      );

    app.render(
      h(
        "main",
        { class: "screen inventory" },
        h(
          "header",
          { class: "topbar" },
          h("button", { class: "btn-back", onclick: () => app.showHome(), "aria-label": "返回" }, "‹"),
          h("h1", {}, "背包")
        ),
        app.profileBar(),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "進化素材"),
          h("p", { class: "hint" }, `已擁有 ${owned.length} / ${list.length} 種。勝出「DSE 題庫挑戰」可取得素材，用於「培養」進化。`),
          // Three per row (2026-11-01: one per row scrolled a long way).
          h(
            "ul",
            { class: "mat-grid" },
            list.map((m) =>
              h(
                "li",
                { class: m.count ? "mat-cell" : "mat-cell mat-empty", title: m.description },
                h("span", { class: "mat-icon", html: icon(m.rarity) }),
                h("span", { class: "mat-name" }, m.name),
                h("span", { class: `mat-rarity mat-${m.rarity}` }, I.RARITY_NAMES[m.rarity]),
                h("span", { class: "mat-desc" }, m.description),
                h("span", { class: "mat-count" }, `×${m.count}`)
              )
            )
          )
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "角色碎片"),
          charShards.length
            ? h("ul", { class: "mat-list" }, charShards.map((c) => shardItem(sprites.character(c.id, "idle"), c.name, c.rarity, shardUse(c), have[c.id])))
            : h("p", { class: "hint" }, "未有角色碎片。抽蛋抽到重複角色、帝王試煉及魔王限時都會得到碎片。"),
          equipShards.length ? h("h2", { class: "shard-sub" }, "裝備碎片") : null,
          equipShards.length
            ? h("ul", { class: "mat-list" }, equipShards.map((e) => shardItem(root.ITE.gear.icon(e.id, 1), e.name, null, "第三階進化用", have[e.id])))
            : null
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "裝備"),
          equipment.length
            ? h("ul", { class: "mat-list" }, equipment.map((e) => h("li", { class: "mat-item" }, h("span", { class: "shard-art", html: root.ITE.gear.icon(e.id, 1) }), h("span", { class: "mat-info" }, h("span", { class: "mat-name" }, e.name), h("span", { class: "mat-desc" }, e.levels[0].text)))))
            : h("p", { class: "hint" }, "未有裝備。"),
          h("p", { class: "hint" }, "到「角色隊伍」為隊員裝備。")
        )
      )
    );
  }

  root.ITE.inventoryUi = { show };
})(globalThis);
