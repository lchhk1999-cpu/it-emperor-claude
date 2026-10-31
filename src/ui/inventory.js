// 背包 screen (P5-01): evolution materials, shards and owned equipment.
// Materials and shards are used in 培養 (P5-04).
(function (root) {
  const I = root.ITE.inventory;
  const app = root.ITE.app;
  const { h } = app;
  const data = root.ITE.gameData;

  // Placeholder material icon, coloured by rarity (no per-item art yet).
  const RARITY_FILL = { common: "#bfe3d0", rare: "#8fc3e8", legendary: "#f4d36b" };
  const icon = (rarity) =>
    `<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true"><path d="M24 4 L42 16 L36 40 H12 L6 16 Z" fill="${RARITY_FILL[rarity] || "#e2e5ea"}" stroke="#3b3330" stroke-width="3" stroke-linejoin="round"/><path d="M16 18 L24 12 L32 18" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/></svg>`;

  function show() {
    const profile = app.getSave().profile;
    const list = I.materialList(profile, data);
    const owned = list.filter((m) => m.count > 0);
    const equipment = (data.equipment || []).filter((e) => profile.owned.equipment.includes(e.id));
    const shards = Object.entries(profile.shards || {});
    const nameOf = (id) => ((data.characters || []).concat(data.equipment || []).find((x) => x.id === id) || { name: id }).name;

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
          h(
            "ul",
            { class: "mat-list" },
            list.map((m) =>
              h(
                "li",
                { class: m.count ? "mat-item" : "mat-item mat-empty" },
                h("span", { class: "mat-icon", html: icon(m.rarity) }),
                h(
                  "span",
                  { class: "mat-info" },
                  h("span", { class: "mat-name" }, m.name, h("span", { class: `mat-rarity mat-${m.rarity}` }, I.RARITY_NAMES[m.rarity])),
                  h("span", { class: "mat-desc" }, m.description)
                ),
                h("span", { class: "mat-count" }, `×${m.count}`)
              )
            )
          )
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "碎片"),
          shards.length
            ? h("ul", { class: "mat-list" }, shards.map(([id, n]) => h("li", { class: "mat-item" }, h("span", { class: "mat-info" }, h("span", { class: "mat-name" }, nameOf(id)), h("span", { class: "mat-desc" }, "第三階段進化用")), h("span", { class: "mat-count" }, `×${n}`))))
            : h("p", { class: "hint" }, "未有碎片。抽蛋抽到重複的角色或裝備會換成碎片。")
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "裝備"),
          equipment.length
            ? h("ul", { class: "mat-list" }, equipment.map((e) => h("li", { class: "mat-item" }, h("span", { class: "mat-info" }, h("span", { class: "mat-name" }, e.name), h("span", { class: "mat-desc" }, e.levels[0].text)))))
            : h("p", { class: "hint" }, "未有裝備。"),
          h("p", { class: "hint" }, "到「角色隊伍」為隊員裝備。")
        )
      )
    );
  }

  root.ITE.inventoryUi = { show };
})(globalThis);
