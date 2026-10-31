// 角色隊伍 screen: team slots (opened by player level) and the character list.
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
      const profile = { ...r.profile, equipment: root.ITE.equipment.cleanEquipment(r.profile.equipment || {}, r.profile.team, data) };
      app.setSave({ ...app.getSave(), profile });
      show();
    };

    const equip = (characterId, equipmentId) => {
      const r = root.ITE.equipment.assign(app.getSave().profile, characterId, equipmentId || null, data);
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
        h(
          "section",
          { class: "panel" },
          h("h2", {}, `我的隊伍（${team.length} / ${slots}）`),
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
          h("p", { class: "hint" }, `隊伍攻擊 ${stats.attack}｜HP ${stats.hp}（成員平均）`),
          h("p", { class: "hint" }, "答對隊員專長課題的題目可加傷害。隊伍課題越多元，越多題目有加成。"),
          h("p", { class: "hint" }, "隊伍只用於「DSE 題庫挑戰」；故事模式及校際公會不受影響。")
        ),
        message ? h("p", { class: "form-error", role: "alert" }, message) : null,
        equipmentPanel(profile, team, equip),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "角色"),
          P.familyGroups(data.characters).map((g) => [
            g.characters.length > 1 || g.characters[0].family
              ? h("h3", { class: "family-title" }, g.name, h("span", { class: "family-count" }, `${g.characters.filter((c) => P.owns(profile, c.id)).length} / ${g.characters.length}`))
              : null,
            h(
            "div",
            { class: "char-list" },
            g.characters.map((c) => {
              const inTeam = profile.team.includes(c.id);
              if (!P.owns(profile, c.id)) {
                return h(
                  "button",
                  { class: "char-card not-owned", onclick: () => show(ERRORS.not_owned), "aria-label": `${c.name}（未擁有）` },
                  h("span", { class: "char-sprite", html: sprites.character(c.id, "idle") }),
                  h(
                    "span",
                    { class: "char-info" },
                    h("span", { class: "char-name" }, c.name, h("span", { class: `rarity rarity-${c.rarity}` }, c.rarity)),
                    h("span", { class: "char-spec" }, `專長：${topicName(c.specialty)}`),
                    h("span", { class: "char-action" }, "未擁有（抽蛋取得）")
                  )
                );
              }
              return h(
                "button",
                { class: inTeam ? "char-card in-team" : "char-card", onclick: () => toggle(c.id), "aria-pressed": inTeam ? "true" : "false" },
                h("span", { class: "char-sprite", html: sprites.character(c.id, inTeam ? "happy" : "idle") }),
                h(
                  "span",
                  { class: "char-info" },
                  h("span", { class: "char-name" }, c.name, h("span", { class: `rarity rarity-${c.rarity}` }, c.rarity)),
                  h("span", { class: "char-spec" }, `專長：${topicName(c.specialty)}　+${Math.round(c.bonus * 100)}%`),
                  (() => {
                    const g = root.ITE.growth.charGrowth(profile, c.id);
                    const st = root.ITE.growth.stats(c, g);
                    return h("span", { class: "char-stats" }, `Lv ${g.level}${g.evo ? `・${root.ITE.growth.EVO_NAMES[g.evo]}` : ""}｜攻擊 ${st.attack}｜HP ${st.hp}`);
                  })(),
                  h(
                    "span",
                    { class: "char-action" },
                    inTeam
                      ? slots === 1 ? "目前出戰" : "已在隊伍（按一下移出）"
                      : slots === 1 ? "按一下換上" : covered.has(c.specialty) ? "加入隊伍（專長重複）" : "加入隊伍"
                  )
                )
              );
            })
          ),
          ]).flat(),
          h("p", { class: "hint" }, `已擁有 ${profile.owned.characters.length} / ${data.characters.length} 個角色。新角色只可在「抽蛋」取得。`)
        )
      )
    );
  }

  const EFFECT_TEXT = (e) => e.levels[0].text;

  // Each team member holds one item (more slots need evolution, not built yet).
  function equipmentPanel(profile, team, equip) {
    const map = profile.equipment || {};
    const usable = data.equipment.filter((e) => e.supported && profile.owned.equipment.includes(e.id));
    const holderOf = (eid) => team.find((c) => map[c.id] === eid);
    return h(
      "section",
      { class: "panel" },
      h("h2", {}, "裝備"),
      h("p", { class: "hint" }, "每位隊員可裝備 1 件（進化後可增至 3 件，未開放）。裝備只用於「DSE 題庫挑戰」。"),
      h("p", { class: "hint" }, `已擁有裝備：${usable.map((e) => e.name).join("、") || "沒有"}（更多裝備可在「抽蛋」取得）`),
      team.map((c) => {
        const select = h(
          "select",
          { class: "input equip-select", id: `eq-${c.id}`, "aria-label": `${c.name} 的裝備` },
          h("option", { value: "" }, "（不裝備）"),
          usable.map((e) => {
            const holder = holderOf(e.id);
            const label = holder && holder.id !== c.id ? `${e.name}（由 ${holder.name} 使用中）` : e.name;
            const opt = h("option", { value: e.id }, label);
            if (map[c.id] === e.id) opt.selected = true;
            return opt;
          })
        );
        select.addEventListener("change", () => equip(c.id, select.value));
        const current = map[c.id] && data.equipment.find((e) => e.id === map[c.id]);
        return h(
          "div",
          { class: "equip-row" },
          h("span", { class: "equip-sprite", html: sprites.character(c.id, "idle") }),
          h(
            "div",
            { class: "equip-info" },
            h("label", { class: "label", for: `eq-${c.id}` }, c.name),
            select,
            h("span", { class: "hint" }, current ? EFFECT_TEXT(current) : "未裝備")
          )
        );
      }),
      h(
        "p",
        { class: "hint" },
        "即將開放：",
        data.equipment.filter((e) => !e.supported).map((e) => `${e.name}（${EFFECT_TEXT(e)}，需要限時戰鬥）`).join("、") || "沒有"
      )
    );
  }

  root.ITE.teamUi = { show: () => show() };
})(globalThis);
