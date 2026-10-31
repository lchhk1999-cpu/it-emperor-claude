// 角色隊伍 screen: team slots (opened by player level), then 角色 / 裝備 sub-tabs.
// Tap a character to add or remove it. Team effects apply to the DSE 題庫挑戰
// only (see src/core/profile.js). Ownership rules wait for the gacha feature,
// so every character is available for now (PROTOTYPE).
(function (root) {
  const P = root.ITE.profile;
  const Q = root.ITE.questions;
  const app = root.ITE.app;
  const { h } = app;
  const sprites = root.ITE.sprites;
  const data = root.ITE.gameData;

  const ERRORS = {
    team_full: "隊伍已滿。升級可以解鎖更多位置，或先移除一名成員。",
    team_needs_one: "隊伍最少要有一名成員。",
    not_owned: "未擁有這個角色。可以用學習任務得到的寶石抽蛋取得。",
  };

  function topicName(id) {
    return id === "ALL" ? "全部課題" : Q.TOPICS[id] || id;
  }

  // Sub-tab ("chars" | "gear") and character filter, kept while on this screen.
  let view = "chars";
  let filter = "owned";

  function show(message) {
    const save = app.getSave();
    const profile = save.profile;
    const slots = P.teamSlots(profile.level, data.config);
    const team = P.teamSnapshot(profile, data);
    const stats = P.teamStats(team);
    const covered = new Set(team.map((c) => c.specialty));
    const slotLevels = P.PROFILE_RULES.teamSlotLevels;

    const toggle = (id) => {
      const r = P.toggleMember(app.getSave().profile, id, data);
      if (r.error) return show(ERRORS[r.error] || "未能更改隊伍。");
      // Equipment follows the team: items of a removed member are returned.
      const profile = { ...r.profile, equipment: root.ITE.equipment.cleanEquipment(r.profile.equipment || {}, r.profile.team, data, r.profile.owned, r.profile) };
      app.setSave({ ...app.getSave(), profile });
      show();
    };

    const equip = (characterId, equipmentId, slot) => {
      const r = root.ITE.equipment.assign(app.getSave().profile, characterId, equipmentId || null, data, slot);
      if (r.error) return show("未能更換裝備。");
      app.setSave({ ...app.getSave(), profile: r.profile });
      show();
    };

    app.render(
      h(
        "main",
        { class: "screen team", "data-tab": "team" },
        h(
          "header",
          { class: "topbar" },
          h("button", { class: "btn-back", onclick: app.showHome, "aria-label": "返回" }, "‹"),
          h("h1", {}, "角色隊伍")
        ),
        app.profileBar(),
        // Compact team strip; below it 角色 / 裝備 sub-tabs, so the page no
        // longer scrolls through every section (user 2026-11-01).
        h(
          "section",
          { class: "panel team-strip" },
          h("h2", {}, `我的隊伍 ${team.length} / ${slots}`, h("span", { class: "team-stats" }, `攻擊 ${stats.attack}｜HP ${stats.hp}`)),
          h(
            "div",
            { class: "team-slots" },
            Array.from({ length: data.config.team_slots_max }, (_, i) => {
              const c = team[i];
              if (c) {
                return h(
                  "button",
                  { class: "slot filled", onclick: () => toggle(c.id), "aria-label": `移出 ${c.name}` },
                  h("span", { class: "slot-sprite", html: sprites.character(c.id, "idle") }),
                  h("span", { class: "slot-name" }, c.name),
                  i === 0 ? h("span", { class: "slot-tag" }, "隊長") : null
                );
              }
              const open = i < slots;
              return h(
                "div",
                { class: open ? "slot empty" : "slot locked" },
                open ? h("span", { class: "slot-name" }, "空位") : h("span", { class: "slot-name" }, `Lv ${slotLevels[i]}`, h("br", {}), "解鎖")
              );
            })
          ),
          h("p", { class: "hint" }, "按角色加入或移出。答對隊員專長課題可加傷害；只用於「DSE 題庫挑戰」。")
        ),
        message ? h("p", { class: "form-error", role: "alert" }, message) : null,
        h(
          "div",
          { class: "seg team-tabs", role: "tablist" },
          [["chars", `角色 ${profile.owned.characters.length}/${data.characters.length}`], ["gear", "裝備"]].map(([key, label]) =>
            h("button", { class: view === key ? "seg-btn active" : "seg-btn", role: "tab", "aria-selected": view === key ? "true" : "false", onclick: () => ((view = key), app.sfx("tap"), show()) }, label)
          )
        ),
        view === "gear" ? equipmentPanel(profile, team, equip) : charactersPanel(profile, toggle, slots, covered)
      )
    );
  }

  // 角色 grid: filter chips (已擁有 / 全部 / each family), three cards per row.
  function charactersPanel(profile, toggle, slots, covered) {
    const groups = P.familyGroups(data.characters);
    const filters = [["owned", "已擁有"], ["all", "全部"]].concat(groups.map((g) => [g.id, g.name]));
    const list = data.characters.filter((c) =>
      filter === "owned" ? P.owns(profile, c.id) : filter === "all" ? true : (groups.find((g) => g.id === filter) || { characters: [] }).characters.includes(c)
    );
    const rank = { UR: 0, SSR: 1, SR: 2, R: 3 };
    list.sort((a, b) => (profile.team.includes(b.id) - profile.team.includes(a.id)) || (P.owns(profile, b.id) - P.owns(profile, a.id)) || (rank[a.rarity] - rank[b.rarity]));
    return h(
      "section",
      { class: "panel" },
      h(
        "div",
        { class: "filter-chips", role: "tablist", "aria-label": "篩選角色" },
        filters.map(([key, label]) => h("button", { class: filter === key ? "chip-btn active" : "chip-btn", role: "tab", "aria-selected": filter === key ? "true" : "false", onclick: () => ((filter = key), show()) }, label))
      ),
      list.length
        ? h(
            "div",
            { class: "char-grid" },
            list.map((c) => {
              const owned = P.owns(profile, c.id);
              const inTeam = profile.team.includes(c.id);
              const g = root.ITE.growth.charGrowth(profile, c.id);
              const label = !owned ? "未擁有" : inTeam ? (slots === 1 ? "出戰中" : "隊伍中") : covered.has(c.specialty) ? "專長重複" : `Lv ${g.level}${g.evo ? `・${root.ITE.growth.EVO_NAMES[g.evo]}` : ""}`;
              return h(
                "button",
                {
                  class: `char-tile${inTeam ? " in-team" : ""}${owned ? "" : " not-owned"}`,
                  onclick: () => (owned ? toggle(c.id) : show(ERRORS.not_owned)),
                  "aria-pressed": inTeam ? "true" : "false",
                  "aria-label": `${c.name} ${c.rarity}，專長 ${topicName(c.specialty)}，${label}`,
                },
                inTeam ? h("span", { class: "tile-check", "aria-hidden": "true" }, "✓") : null,
                h("span", { class: `rarity rarity-${c.rarity} tile-rarity` }, c.rarity),
                h("span", { class: "tile-sprite", html: sprites.character(c.id, inTeam ? "happy" : "idle") }),
                h("span", { class: "tile-name" }, c.name),
                h("span", { class: "tile-spec" }, topicName(c.specialty)),
                h("span", { class: "tile-state" }, label),
                (profile.shards || {})[c.id] ? h("span", { class: "tile-shards" }, `碎片 ×${profile.shards[c.id]}`) : null
              );
            })
          )
        : h("p", { class: "hint" }, "沒有角色。"),
      h("p", { class: "hint" }, "新角色只可在「抽蛋」取得；UR 角色由帝王試煉／魔王限時的碎片合成。")
    );
  }

  const E = root.ITE.equipment;
  const tierOf = (profile, eid) => Math.min(3, root.ITE.growth ? root.ITE.growth.equipmentTier(profile, eid) : 1);
  const effectText = (profile, e) => e.levels[tierOf(profile, e.id) - 1].text;

  // Which slot's item list is open: { cid, slot } or null.
  let picking = null;

  // 裝備欄 (2026-11-01): 2 slots per member, a 3rd after the third evolution.
  function equipmentPanel(profile, team, equip) {
    const map = E.cleanEquipment(profile.equipment || {}, profile.team, data, profile.owned, profile);
    const usable = data.equipment.filter((e) => e.supported && profile.owned.equipment.includes(e.id));
    const holderOf = (eid) => team.find((c) => (map[c.id] || []).includes(eid));
    const item = (eid) => data.equipment.find((e) => e.id === eid);
    const rerender = () => show();

    const picker = (c, slot, current) =>
      h(
        "div",
        { class: "gear-picker", role: "listbox", "aria-label": `${c.name} 的第 ${slot + 1} 格` },
        usable.length
          ? usable.map((e) => {
              const holder = holderOf(e.id);
              const here = current === e.id;
              return h(
                "button",
                { class: here ? "gear-option current" : "gear-option", role: "option", "aria-selected": here ? "true" : "false", onclick: () => ((picking = null), here ? rerender() : equip(c.id, e.id, slot)) },
                h("span", { class: "gear-option-icon", html: root.ITE.gear.icon(e.id, tierOf(profile, e.id)) }),
                h("span", { class: "gear-option-text" }, h("b", {}, e.name), h("span", { class: "hint" }, effectText(profile, e))),
                h("span", { class: "gear-option-tag" }, here ? "使用中" : holder ? `${holder.name} 使用中` : "")
              );
            })
          : h("p", { class: "hint" }, "未有裝備。可以在「抽蛋」取得。"),
        current ? h("button", { class: "btn", onclick: () => ((picking = null), equip(c.id, null, slot)) }, "卸下") : null,
        h("button", { class: "btn", onclick: () => ((picking = null), rerender()) }, "取消")
      );

    return h(
      "section",
      { class: "panel" },
      h("h2", {}, "裝備"),
      h("p", { class: "hint" }, "每位隊員有 2 個裝備格，角色第三階進化後開第 3 格。點格子揀裝備。裝備只用於「DSE 題庫挑戰」。"),
      team.map((c) => {
        const mine = map[c.id] || [];
        const slots = E.slotsFor(profile, c.id);
        const cells = [0, 1, 2].map((i) => {
          if (i >= slots) return h("span", { class: "gear-slot locked", title: "第三階進化後開放" }, "🔒");
          const eid = mine[i];
          const open = picking && picking.cid === c.id && picking.slot === i;
          return h(
            "button",
            { class: open ? "gear-slot open" : "gear-slot", "aria-label": eid ? `第 ${i + 1} 格：${item(eid).name}` : `第 ${i + 1} 格：空`, onclick: () => ((picking = open ? null : { cid: c.id, slot: Math.min(i, mine.length) }), app.sfx("tap"), rerender()) },
            eid ? h("span", { class: "gear-slot-icon", html: root.ITE.gear.icon(eid, tierOf(profile, eid)) }) : "＋"
          );
        });
        const pick = picking && picking.cid === c.id ? picker(c, picking.slot, mine[picking.slot]) : null;
        return h(
          "div",
          { class: "equip-row" },
          h("span", { class: "equip-sprite", html: root.ITE.gear.dressed(sprites.character(c.id, "idle"), mine.map((id) => ({ id, tier: tierOf(profile, id) }))) }),
          h(
            "div",
            { class: "equip-info" },
            h("span", { class: "label" }, c.name),
            h("div", { class: "gear-slots" }, cells),
            h("span", { class: "hint" }, mine.length ? mine.map((id) => `${item(id).name}：${effectText(profile, item(id))}`).join("；") : "未裝備")
          ),
          pick
        );
      }),
      h("p", { class: "hint" }, `已擁有裝備：${usable.map((e) => e.name).join("、") || "沒有"}（更多裝備可在「抽蛋」取得）`),
      h(
        "p",
        { class: "hint" },
        "即將開放：",
        data.equipment.filter((e) => !e.supported).map((e) => `${e.name}（${e.levels[0].text}，用於魔王限時模式）`).join("、") || "沒有"
      )
    );
  }

  root.ITE.teamUi = { show: () => ((picking = null), (view = "chars"), show()) };
})(globalThis);
