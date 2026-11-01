// 設定 screen: 暱稱, sound effects and music on/off, replay the tutorial, 進度備份碼, version info.
(function (root) {
  const app = root.ITE.app;
  const { h } = app;

  const SAMPLES = [
    ["stageStart", "入關"], ["correct", "答對"], ["wrong", "答錯"], ["win", "勝利"], ["lose", "失敗"], ["levelUp", "升級"],
    ["reward", "領獎"], ["gacha", "開盲盒"], ["gachaSSR", "抽中 SSR"], ["evolve", "進化"], ["tap", "按分頁"],
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

  // 進度備份碼 (D6). Restoring needs a second tap and then reloads the app so
  // every screen starts from the restored save.
  const IMPORT_ERRORS = {
    empty: "請先貼上備份碼。",
    format: "這不是《IT帝》的備份碼，請檢查是否完整複製。",
    checksum: "備份碼不完整或有錯字，請重新複製整段。",
    invalid: "備份碼無法讀取，可能來自不同版本。",
  };
  let backup = { code: "", copied: false, pending: null, error: "" };

  function makeCode() {
    backup = { code: root.ITE.save.exportCode(app.getSave()), copied: false, pending: null, error: "" };
    show();
  }

  function copyCode(textarea) {
    textarea.select();
    const done = () => ((backup = { ...backup, copied: true }), show());
    if (root.navigator && root.navigator.clipboard) root.navigator.clipboard.writeText(backup.code).then(done, () => {});
    else if (document.execCommand && document.execCommand("copy")) done();
  }

  function checkCode(text) {
    const r = root.ITE.save.importCode(text);
    backup = { ...backup, pending: r.ok ? r.save : null, error: r.ok ? "" : IMPORT_ERRORS[r.reason] };
    show();
  }

  function restore() {
    app.setSave(backup.pending);
    root.location.reload();
  }

  function backupPanel() {
    const out = h("textarea", { class: "backup-code", readonly: "readonly", rows: "4", "aria-label": "你的備份碼" }, backup.code);
    const input = h("textarea", { class: "backup-code", rows: "4", placeholder: "在這裡貼上備份碼", "aria-label": "貼上備份碼" });
    const p = backup.pending && backup.pending.profile;
    return h(
      "section",
      { class: "panel" },
      h("h2", {}, "備份進度"),
      h("p", { class: "hint" }, "換手機或刪除 App 前，先取得備份碼並保存好（例如傳給自己或寫在筆記）。在新手機貼上即可取回進度。"),
      h("button", { class: "btn", onclick: makeCode }, backup.code ? "重新產生備份碼" : "取得備份碼"),
      backup.code ? [out, h("button", { class: "btn", onclick: () => copyCode(out) }, backup.copied ? "已複製 ✓" : "複製備份碼")] : null,
      h("h3", { class: "rates-title" }, "還原進度"),
      backup.pending
        ? [
            h("p", { class: "note" }, `找到進度：等級 ${p ? p.level : 1}${p ? `、角色 ${p.owned ? p.owned.characters.length : 1} 個` : ""}。還原後，這部裝置現有的進度會被取代。`),
            h("button", { class: "btn btn-primary", onclick: restore }, "確定還原"),
            h("button", { class: "btn", onclick: () => ((backup = { ...backup, pending: null }), show()) }, "取消"),
          ]
        : [input, h("button", { class: "btn", onclick: () => checkCode(input.value) }, "檢查備份碼"), backup.error ? h("p", { class: "note", role: "alert" }, backup.error) : null]
    );
  }

  // 老師示範版: drop the demo save and start again from the rich profile.
  let confirmReset = false;
  function resetDemo(e) {
    if (!confirmReset) {
      confirmReset = true;
      e.target.textContent = "再按一次確定重設";
      return;
    }
    app.storage.removeItem(root.ITE.save.SAVE_KEY);
    root.location.reload();
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
        root.ITE.nameUi ? root.ITE.nameUi.settingsPanel(show) : null,
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
          h("p", { class: "hint" }, "入關、答對、答錯、勝利、升級及開盲盒都有音效。上課時可以關掉。"),
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
          h("button", { class: "btn", onclick: () => (app.showHome(), root.ITE.tutorialUi.show(0)) }, "再看一次新手教學"),
          root.ITE.guideUi ? h("button", { class: "btn", onclick: () => root.ITE.guideUi.show() }, "遊戲指南（全部玩法及裝備策略）") : null
        ),
        app.demo
          ? h(
              "section",
              { class: "panel" },
              h("h2", {}, "老師示範版"),
              h("p", { class: "hint" }, "示範資料與正式版分開儲存。重設後回到資源全開的起點，並附示範進度：不同級別的稱號、知識修練館已讀及待複習的卡。"),
              h("button", { class: "btn", onclick: resetDemo }, "重設示範資料")
            )
          : null,
        backupPanel(),
        root.ITE.installUi ? root.ITE.installUi.settingsPanel(show) : null,
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "版本"),
          h("p", { class: "hint" }, `版本 ${app.version}｜${app.online ? "連線版" : "單機版"}｜${app.buildMode === "release" ? "正式版" : "開發測試版"}`),
          h("p", { class: "hint" }, "進度只儲存在這部裝置，換機請使用備份碼。")
        )
      )
    );
  }

  root.ITE.settingsUi = { show };
})(globalThis);
