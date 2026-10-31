// 每日簽到 card: pops up on the first home visit of each Hong Kong day.
(function (root) {
  const C = root.ITE.checkin;
  const I = root.ITE.inventory;
  const app = root.ITE.app;
  const { h } = app;
  const data = root.ITE.gameData;

  let overlay = null;

  function label(index) {
    const r = C.CYCLE[index];
    if (r.coins) return `${r.coins} 金幣`;
    if (r.gems) return `${r.gems} 寶石`;
    if (r.topicMaterials) return `課題素材 ×${r.topicMaterials}`;
    const [id, n] = Object.entries(r.materials)[0];
    return `${(I.materialById(data, id) || { name: id }).name} ×${n}`;
  }

  function close() {
    if (overlay) overlay.remove();
    overlay = null;
  }

  function claim() {
    const save = app.getSave();
    const r = C.checkIn(save.profile, data, Date.now(), root.ITE.rng.createRng(Date.now() ^ Math.floor(Math.random() * 2 ** 31)));
    if (r.error) return close();
    app.setSave({ ...save, profile: r.profile });
    app.grantReward(r.reward);
    app.sfx("reward");
    const got = [r.reward.coins ? `${r.reward.coins} 金幣` : "", r.reward.gems ? `${r.reward.gems} 寶石` : ""]
      .concat(Object.entries(r.reward.materials).map(([id, n]) => `${(I.materialById(data, id) || { name: id }).name} ×${n}`))
      .filter(Boolean)
      .join("、");
    show(`簽到成功！獲得 ${got}`);
  }

  function show(done) {
    close();
    const profile = app.getSave().profile;
    const st = C.state(profile);
    const can = C.canCheckIn(profile, Date.now());
    // Highlight today's reward (before claiming) or the one just claimed.
    const current = can ? C.nextIndex(profile) : (st.days - 1 + C.CYCLE.length) % C.CYCLE.length;
    overlay = h(
      "div",
      { class: "tutorial-backdrop" },
      h(
        "section",
        { class: "tutorial-card checkin-card", role: "dialog", "aria-modal": "true", "aria-labelledby": "checkin-title" },
        h("h2", { id: "checkin-title" }, "每日簽到"),
        h("p", { class: "tutorial-count" }, `已累積簽到 ${st.days} 天（缺席不會重新計算）`),
        h(
          "ol",
          { class: "checkin-days" },
          C.CYCLE.map((_, i) =>
            h(
              "li",
              { class: i === current ? "checkin-day today" : i < current ? "checkin-day past" : "checkin-day" },
              h("span", { class: "checkin-num" }, `第 ${i + 1} 天`),
              h("span", { class: "checkin-reward" }, label(i))
            )
          )
        ),
        done ? h("p", { class: "note success", "aria-live": "polite" }, done) : null,
        h(
          "div",
          { class: "tutorial-actions" },
          can ? h("button", { class: "btn btn-primary", onclick: claim }, `領取：${label(current)}`) : h("button", { class: "btn btn-primary", onclick: () => (close(), app.showHome()) }, "好")
        )
      )
    );
    root.document.body.append(overlay);
    overlay.querySelector(".btn-primary").focus();
  }

  root.ITE.checkinUi = { show, close };
})(globalThis);
