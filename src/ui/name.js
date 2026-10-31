// 暱稱 (user request 2026-11-01): asked once before the new-player tutorial
// (and once for older saves without a name); changeable in 設定. The name stays
// on this device in the 單機版. Shown with the equipped title on the home screen.
(function (root) {
  const app = root.ITE.app;
  const { h } = app;
  const S = root.ITE.save;
  const sprites = root.ITE.sprites;

  const PREFIX = ["Python", "SQL", "像素", "二進制", "雲端", "Wi-Fi", "防火牆", "演算法", "CPU", "RAM"];
  const SUFFIX = ["小勇者", "學徒", "騎士", "魔法師", "偵探", "隊長", "達人", "新星"];

  function randomName() {
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    return S.cleanName(pick(PREFIX) + pick(SUFFIX));
  }

  function setName(name) {
    const save = app.getSave();
    app.setSave({ ...save, profile: { ...save.profile, name } });
  }

  let overlay = null;

  function close() {
    if (overlay) overlay.remove();
    overlay = null;
  }

  // Shows the name card over the current screen; `next` runs after confirming.
  function show(next) {
    close();
    const error = h("p", { class: "form-error", role: "alert" });
    const input = h("input", { class: "input name-input", maxlength: String(S.NAME_MAX), placeholder: "例如：阿明", autocomplete: "off", "aria-label": "暱稱" });
    const confirm = () => {
      const name = S.cleanName(input.value);
      if (!name) {
        error.textContent = "請輸入 1–10 個字的暱稱。";
        return;
      }
      setName(name);
      app.sfx("reward");
      close();
      next();
    };
    // preventDefault: otherwise the same Enter press also clicks the tutorial's first button.
    input.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), confirm()));
    const leader = app.getSave().profile.team[0];
    overlay = h(
      "div",
      { class: "tutorial-backdrop" },
      h(
        "section",
        { class: "tutorial-card", role: "dialog", "aria-modal": "true", "aria-labelledby": "name-title" },
        h("div", { class: "tutorial-art", html: leader ? sprites.character(leader, "happy") : sprites.hero("happy") }),
        h("h2", { id: "name-title" }, "你叫甚麼名字？"),
        h("p", { class: "tutorial-text" }, `最多 ${S.NAME_MAX} 個字，之後可以在「設定」更改。`),
        h("div", { class: "name-field" }, input, h("button", { class: "btn name-dice", onclick: () => ((input.value = randomName()), app.sfx("tap")), "aria-label": "隨機名字" }, "🎲")),
        error,
        h("div", { class: "tutorial-actions" }, h("button", { class: "btn btn-primary", onclick: confirm }, "確定"))
      )
    );
    root.document.body.append(overlay);
    input.focus();
  }

  // 設定 panel for changing the name later.
  function settingsPanel(onSaved) {
    const msg = h("p", { class: "hint", role: "status" });
    const input = h("input", { class: "input name-input", maxlength: String(S.NAME_MAX), value: app.getSave().profile.name || "", autocomplete: "off", "aria-label": "暱稱" });
    const save = () => {
      const name = S.cleanName(input.value);
      if (!name) {
        msg.textContent = "請輸入 1–10 個字的暱稱。";
        return;
      }
      setName(name);
      onSaved();
    };
    return h(
      "section",
      { class: "panel" },
      h("h2", {}, "暱稱"),
      h("div", { class: "name-field" }, input, h("button", { class: "btn name-dice", onclick: () => (input.value = randomName()), "aria-label": "隨機名字" }, "🎲")),
      h("button", { class: "btn", onclick: save }, "儲存暱稱"),
      msg
    );
  }

  root.ITE.nameUi = { show, settingsPanel, randomName };
})(globalThis);
