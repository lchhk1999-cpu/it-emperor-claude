// 驗證碼 screen (src/core/gate.js): shown before the opening animation until
// this device has entered the teacher's code. Builds without a code skip it.
(function (root) {
  const G = root.ITE.gate;

  function stored() {
    try {
      return root.localStorage.getItem(G.STORE_KEY);
    } catch (e) {
      return null;
    }
  }

  function remember(hash) {
    try {
      root.localStorage.setItem(G.STORE_KEY, hash);
    } catch (e) {
      // Private browsing: the code is asked again next time.
    }
  }

  function show(next) {
    const expected = root.ITE_ACCESS;
    if (!G.needsCode(expected, stored())) return next();
    const { h } = root.ITE.app;
    const error = h("p", { class: "form-error", role: "alert" });
    const input = h("input", { class: "input gate-input", maxlength: "20", placeholder: "驗證碼", autocomplete: "off", autocapitalize: "characters", spellcheck: "false", "aria-label": "驗證碼" });
    const enter = () => {
      if (!G.check(expected, input.value)) {
        error.textContent = "驗證碼不正確，請向老師查詢。";
        input.select();
        return;
      }
      remember(expected);
      overlay.remove();
      next();
    };
    input.addEventListener("keydown", (e) => e.key === "Enter" && (e.preventDefault(), enter()));
    const overlay = h(
      "div",
      { class: "gate-screen" },
      h(
        "section",
        { class: "gate-card", role: "dialog", "aria-modal": "true", "aria-labelledby": "gate-title" },
        h("div", { class: "gate-logo", html: root.ITE.sprites.hero("happy") }),
        h("h1", { id: "gate-title" }, "IT帝：ICT 學習冒險"),
        h("p", { class: "gate-text" }, "本試玩版只供本校同學使用。請輸入老師提供的驗證碼（每部裝置只需輸入一次）。"),
        input,
        error,
        h("button", { class: "btn btn-primary gate-go", onclick: enter }, "進入遊戲")
      )
    );
    root.document.body.append(overlay);
    input.focus();
  }

  root.ITE.gateUi = { show };
})(globalThis);
