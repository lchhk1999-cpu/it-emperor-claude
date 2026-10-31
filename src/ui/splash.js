// 開場動畫 (user request 2026-11-01): shown once each time the app opens.
// The 「IT帝」 letters pop in, a crown drops onto them, the team leader bounces
// in and code symbols float up; 「點擊開始」 then opens the home screen. The
// tap also unlocks audio on iOS, so the home music can start straight away.
// Reduced-motion players get the same screen without movement (CSS).
(function (root) {
  const app = root.ITE.app;
  const { h } = app;
  const sprites = root.ITE.sprites;

  const CROWN = `<svg viewBox="0 0 120 70" aria-hidden="true"><path d="M10 60 L16 18 L40 42 L60 8 L80 42 L104 18 L110 60 Z" fill="#f4d36b" stroke="#3b3330" stroke-width="5" stroke-linejoin="round"/><rect x="10" y="56" width="100" height="10" rx="4" fill="#e8b84a" stroke="#3b3330" stroke-width="5"/><circle cx="60" cy="34" r="6" fill="#f08a9c" stroke="#3b3330" stroke-width="3"/><circle cx="16" cy="16" r="5" fill="#f4d36b" stroke="#3b3330" stroke-width="3"/><circle cx="104" cy="16" r="5" fill="#f4d36b" stroke="#3b3330" stroke-width="3"/><circle cx="60" cy="7" r="5" fill="#f4d36b" stroke="#3b3330" stroke-width="3"/></svg>`;
  const SYMBOLS = ["</>", "{ }", "01", "SQL", "if", "Wi-Fi", "=SUM", "def"];

  let shown = false;

  function show(next) {
    if (shown) return next();
    shown = true;
    const leader = app.getSave().profile.team[0];
    let done = false;
    const start = () => {
      if (done) return;
      done = true;
      app.sfx("stageStart");
      overlay.classList.add("splash-out");
      next();
      setTimeout(() => overlay.remove(), 450);
    };
    const overlay = h(
      "div",
      { class: "splash", role: "button", tabindex: "0", "aria-label": "IT帝。點擊開始", onclick: start, onkeydown: (e) => (e.key === "Enter" || e.key === " ") && start() },
      h("div", { class: "splash-symbols", "aria-hidden": "true" }, SYMBOLS.map((s, i) => h("span", { style: `--i:${i}` }, s))),
      h(
        "div",
        { class: "splash-logo", "aria-hidden": "true" },
        h("div", { class: "splash-crown", html: CROWN }),
        h("div", { class: "splash-word" }, ["I", "T", "帝"].map((c, i) => h("span", { style: `--i:${i}` }, c)))
      ),
      h("p", { class: "splash-sub" }, "ICT 學習冒險"),
      h("div", { class: "splash-hero", html: leader ? sprites.character(leader, "happy") : sprites.hero("happy") }),
      h("p", { class: "splash-tap" }, "點擊開始")
    );
    root.document.body.append(overlay);
    overlay.focus();
  }

  root.ITE.splashUi = { show };
})(globalThis);
