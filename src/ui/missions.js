// 任務與稱號 screen: daily / weekly / one-off missions with progress and claim
// buttons, and titles that can be worn on the home screen. Definitions come
// from the workbook; conditions the game cannot count yet show 「即將開放」.
(function (root) {
  const Mi = root.ITE.missions;
  const app = root.ITE.app;
  const { h } = app;
  const data = root.ITE.gameData;

  const CYCLES = [
    ["daily", "每日任務", "每日 00:00（香港時間）重置"],
    ["weekly", "每週任務", "每星期一 00:00 重置"],
    ["once", "成就", "只可完成一次"],
  ];
  const ERRORS = { not_done: "任務未完成。", already_claimed: "這個獎勵已經領取了。", not_supported: "這個任務即將開放。" };

  function progressBar(value, target) {
    const pct = Math.round((value / target) * 100);
    return h(
      "div",
      { class: "mbar", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(target), "aria-valuenow": String(value) },
      h("div", { class: "mbar-fill", style: `width:${pct}%` })
    );
  }

  function rewardText(m) {
    return [m.gems ? `寶石 ${m.gems}` : "", m.coins ? `金幣 ${m.coins}` : ""].filter(Boolean).join("＋");
  }

  function show(message) {
    const now = Date.now();
    const save = app.getSave();
    const progress = Mi.rollover(save.progress, now);

    const claim = (m) => {
      const r = Mi.claimMission(app.getSave().progress, m, Date.now());
      if (r.error) return show(ERRORS[r.error]);
      app.setSave({ ...app.getSave(), progress: r.progress });
      const g = app.grantReward(r.reward);
      show(`已領取：${rewardText(m)}${g.levelsGained ? `，升級到 Lv ${g.level}！` : ""}`);
    };

    const equip = (t) => {
      const r = Mi.equipTitle(app.getSave().progress, t);
      if (r.error) return show("未取得這個稱號。");
      app.setSave({ ...app.getSave(), progress: r.progress });
      show(t ? `已佩戴稱號「${t.name}」` : "已取下稱號");
    };

    const equipped = Mi.equippedTitle(progress, data.titles);

    app.render(
      h(
        "main",
        { class: "screen missions" },
        h(
          "header",
          { class: "topbar" },
          h("button", { class: "btn-back", onclick: app.showHome, "aria-label": "返回" }, "‹"),
          h("h1", {}, "任務與稱號")
        ),
        app.profileBar(),
        message ? h("p", { class: "note", role: "status" }, message) : null,
        CYCLES.map(([cycle, heading, hint]) => {
          const list = data.missions.filter((m) => m.cycle === cycle);
          if (!list.length) return null;
          return h(
            "section",
            { class: "panel" },
            h("h2", {}, heading),
            h("p", { class: "hint" }, hint),
            list.map((m) => {
              const st = Mi.missionStatus(progress, m, now);
              let action;
              if (!st.supported) action = h("span", { class: "chip" }, "即將開放");
              else if (st.claimed) action = h("span", { class: "chip chip-ok" }, "已領取");
              else if (st.done) action = h("button", { class: "btn btn-small btn-primary", onclick: () => claim(m) }, "領取");
              else action = h("span", { class: "mission-count" }, `${st.value} / ${st.target}`);
              return h(
                "div",
                { class: st.supported ? "mission-row" : "mission-row unsupported" },
                h(
                  "div",
                  { class: "mission-info" },
                  h("span", { class: "mission-name" }, m.name),
                  h("span", { class: "hint" }, `獎勵：${rewardText(m)}`),
                  st.supported ? progressBar(st.value, st.target) : null
                ),
                action
              );
            })
          );
        }),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "稱號"),
          h("p", { class: "hint" }, equipped ? `目前佩戴：${equipped.name}` : "取得稱號後可以佩戴，會顯示在主畫面。"),
          data.titles.map((t) => {
            const st = Mi.titleStatus(progress, t);
            const isOn = equipped && equipped.id === t.id;
            let action;
            if (!st.supported) action = h("span", { class: "chip" }, "即將開放");
            else if (isOn) action = h("button", { class: "btn btn-small", onclick: () => equip(null) }, "取下");
            else if (st.earned) action = h("button", { class: "btn btn-small btn-primary", onclick: () => equip(t) }, "佩戴");
            else action = h("span", { class: "mission-count" }, `${st.value} / ${st.target}`);
            return h(
              "div",
              { class: st.supported ? "mission-row" : "mission-row unsupported" },
              h(
                "div",
                { class: "mission-info" },
                h("span", { class: "mission-name" }, t.name, st.earned ? h("span", { class: "chip chip-ok" }, "已取得") : null),
                h("span", { class: "hint" }, t.description),
                st.supported && !st.earned ? progressBar(st.value, st.target) : null
              ),
              action
            );
          })
        ),
        h("p", { class: "hint center" }, "寶石是遊戲內免費貨幣，只能透過學習任務取得，不設現金購買。")
      )
    );
  }

  root.ITE.missionsUi = { show: () => show() };
})(globalThis);
