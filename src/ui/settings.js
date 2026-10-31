// 設定 screen: sound effects and music on/off, replay the tutorial, version info.
(function (root) {
  const app = root.ITE.app;
  const { h } = app;

  const SAMPLES = [
    ["stageStart", "入關"], ["correct", "答對"], ["wrong", "答錯"], ["win", "勝利"], ["lose", "失敗"], ["levelUp", "升級"],
    ["reward", "領獎"], ["gacha", "抽蛋"], ["gachaSSR", "抽中 SSR"], ["evolve", "進化"], ["tap", "按分頁"],
  ];

  function setSound(on) {
    const save = app.getSave();
    app.setSave({ ...save, settings: { ...save.settings, sound: on } });
    root.ITE.sound.setEnabled(on);
    if (on) app.sfx("correct");
    show();
  }

  function setMusic(on) {
    const save = app.getSave();
    app.setSave({ ...save, settings: { ...save.settings, music: on } });
    root.ITE.music.setEnabled(on);
    show();
  }

  function onOff(label, value, set) {
    return h(
      "div",
      { class: "seg", role: "radiogroup", "aria-label": label },
      [[true, "開"], [false, "關"]].map(([on, text]) =>
        h("button", { class: value === on ? "seg-btn active" : "seg-btn", role: "radio", "aria-checked": value === on ? "true" : "false", onclick: () => set(on) }, text)
      )
    );
  }

  function show() {
    const settings = app.getSave().settings;
    app.render(
      h(
        "main",
        { class: "screen settings" },
        h(
          "header",
          { class: "topbar" },
          h("button", { class: "btn-back", onclick: () => app.showHome(), "aria-label": "返回" }, "‹"),
          h("h1", {}, "設定")
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "背景音樂"),
          onOff("背景音樂", settings.music, setMusic),
          h("p", { class: "hint" }, "主頁、故事模式及戰鬥各有原創背景音樂。")
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "音效"),
          onOff("音效", settings.sound, setSound),
          h("p", { class: "hint" }, "入關、答對、答錯、勝利、升級及抽蛋都有音效。上課時可以關掉。"),
          h("h3", { class: "rates-title" }, "試聽"),
          settings.sound
            ? h(
                "div",
                { class: "sound-grid" },
                SAMPLES.map(([name, label]) => h("button", { class: "btn sound-btn", onclick: () => root.ITE.sound.play(name) }, `▶ ${label}`))
              )
            : h("p", { class: "hint" }, "音效已關閉。")
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "新手教學"),
          h("button", { class: "btn", onclick: () => (app.showHome(), root.ITE.tutorialUi.show(0)) }, "再看一次新手教學")
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "版本"),
          h("p", { class: "hint" }, `${app.online ? "連線版" : "單機版"}｜${app.buildMode === "release" ? "正式版" : "開發測試版"}`),
          h("p", { class: "hint" }, "進度只儲存在這部裝置。")
        )
      )
    );
  }

  root.ITE.settingsUi = { show };
})(globalThis);
