// 帝王試煉 screen (UR 副本, 2026-11-01): the UR 「IT帝」, shard progress, the
// combine button and the four weekly tiers. Rules in src/core/trial.js.
(function (root) {
  const T = root.ITE.trial;
  const app = root.ITE.app;
  const { h } = app;
  const sprites = root.ITE.sprites;
  const data = root.ITE.gameData;
  const R = T.TRIAL_RULES;

  function unlock() {
    const r = T.unlock(app.getSave().profile, data);
    if (r.error) return show();
    app.setSave({ ...app.getSave(), profile: r.profile });
    app.sfx("gachaSSR");
    show("合成成功！「IT帝」已加入你的角色，可以到「角色隊伍」加入隊伍。");
  }

  function show(message) {
    const profile = app.getSave().profile;
    const owned = profile.owned.characters.includes(R.characterId);
    const have = T.shardsOf(profile);
    const done = T.clearedThisWeek(profile, Date.now());
    const pct = Math.min(100, Math.round((have / R.unlockShards) * 100));
    app.render(
      h(
        "main",
        { class: "screen trial" },
        h("header", { class: "topbar" }, h("button", { class: "btn-back", onclick: app.showStages, "aria-label": "返回" }, "‹"), h("h1", {}, "帝王試煉")),
        app.profileBar(),
        message ? h("p", { class: "note", role: "status" }, message) : null,
        h(
          "section",
          { class: "panel trial-hero" },
          h("div", { class: "trial-sprite", html: sprites.character(R.characterId, owned ? "happy" : "idle") }),
          h("p", { class: "gacha-name" }, "IT帝", h("span", { class: "rarity rarity-UR" }, "UR")),
          h("p", { class: "hint center" }, "傳說中的 IT 帝王。不會在抽蛋出現，只可以用碎片合成。全部課題 +15%。"),
          owned
            ? h("p", { class: "note" }, `已擁有 ✓　多出的碎片：${have}（第三階進化用）`)
            : [
                h(
                  "div",
                  { class: "meter", role: "meter", "aria-label": "IT帝碎片", "aria-valuenow": String(have), "aria-valuemin": "0", "aria-valuemax": String(R.unlockShards) },
                  h("span", { class: "meter-label" }, "碎片"),
                  h("span", { class: "meter-track" }, h("span", { class: "meter-fill fill-exp", style: `width: ${pct}%` })),
                  h("span", { class: "meter-num" }, `${have} / ${R.unlockShards}`)
                ),
                h("button", { class: "btn btn-primary", onclick: unlock, ...(T.canUnlock(profile) ? {} : { disabled: "" }) }, `合成 IT帝（${R.unlockShards} 碎片）`),
              ]
        ),
        h("p", { class: "hint center" }, "每個難度每星期可領一次碎片（香港時間星期一 00:00 重置）。輸了不計次數，可以再挑戰。不扣體力。"),
        R.order.map((key) => {
          const t = R.tiers[key];
          const st = T.stage(key);
          const cleared = done.includes(key);
          return h(
            "button",
            { class: `stage-card trial-card${cleared ? " trial-done" : ""}`, onclick: () => app.startBattle(st) },
            h("span", { class: "stage-name" }, `${t.name}・${t.questionCount} 題`),
            h("span", { class: "stage-desc" }, `碎片 ${t.shards[0] === t.shards[1] ? t.shards[0] : `${t.shards[0]}–${t.shards[1]}`} 個`),
            h("span", { class: "stage-status" }, cleared ? "本週已領取 ✓（可再練習）" : "本週未領取")
          );
        })
      )
    );
  }

  root.ITE.trialUi = { show: () => show() };
})(globalThis);
