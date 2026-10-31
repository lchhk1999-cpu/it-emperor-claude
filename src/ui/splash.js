// 開場動畫 (user request 2026-11-01): shown once each time the app opens.
// The 「IT帝」 letters pop in, a crown drops onto them, the SSR 機械老虎狗 (the
// most heroic look, user request 2026-11-01) bounces in and code symbols float
// up; 「點擊開始」 then opens the home screen. The tap also unlocks audio on
// iOS, so the home music can start straight away.
// Behind the hero, a faint battle of IT帝 against Bug 魔王 fades in and out
// (user request 2026-11-01): their attacks meet in a flashing clash.
// Reduced-motion players get the same screen without movement (CSS).
(function (root) {
  const app = root.ITE.app;
  const { h } = app;
  const sprites = root.ITE.sprites;

  const CROWN = `<svg viewBox="0 0 120 70" aria-hidden="true"><path d="M10 60 L16 18 L40 42 L60 8 L80 42 L104 18 L110 60 Z" fill="#f4d36b" stroke="#3b3330" stroke-width="5" stroke-linejoin="round"/><rect x="10" y="56" width="100" height="10" rx="4" fill="#e8b84a" stroke="#3b3330" stroke-width="5"/><circle cx="60" cy="34" r="6" fill="#f08a9c" stroke="#3b3330" stroke-width="3"/><circle cx="16" cy="16" r="5" fill="#f4d36b" stroke="#3b3330" stroke-width="3"/><circle cx="104" cy="16" r="5" fill="#f4d36b" stroke="#3b3330" stroke-width="3"/><circle cx="60" cy="7" r="5" fill="#f4d36b" stroke="#3b3330" stroke-width="3"/></svg>`;
  const SYMBOLS = ["</>", "{ }", "01", "SQL", "if", "Wi-Fi", "=SUM", "def"];

  const HERO = "CH-ITDOG-MECHA";

  // The two URs clash: a lightning bolt from IT帝 meets Bug 魔王's purple 404
  // beam in a burst. Sprites are the game's own UR art.
  function battle() {
    const sprite = (id, x, cls) =>
      `<g class="${cls}"><svg x="${x}" y="22" width="150" height="182" viewBox="0 0 140 170">${sprites
        .character(id, "idle")
        .replace(/^<svg[^>]*>/, "")
        .replace(/<\/svg>\s*$/, "")}</svg></g>`;
    const burst = [];
    for (let i = 0; i < 16; i++) {
      const a = (Math.PI * 2 * i) / 16;
      const r = i % 2 ? 26 : 62; // big enough to show around the hero in front
      burst.push(`${(180 + r * Math.cos(a)).toFixed(1)},${(98 + r * Math.sin(a)).toFixed(1)}`);
    }
    return `<svg viewBox="0 0 360 210" aria-hidden="true">
      ${sprite("CH-ITEMPEROR", -6, "sb-left")}
      ${sprite("CH-BUGLORD", 216, "sb-right")}
      <g class="sb-attack-left"><path d="M128 70 L150 84 L142 88 L172 98" fill="none" stroke="#3b3330" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M128 70 L150 84 L142 88 L172 98" fill="none" stroke="#f4d36b" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>
      <g class="sb-attack-right"><path d="M232 104 Q210 92 188 100" fill="none" stroke="#3b3330" stroke-width="12" stroke-linecap="round"/><path d="M232 104 Q210 92 188 100" fill="none" stroke="#a993cf" stroke-width="7" stroke-linecap="round"/><text x="214" y="90" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="11" font-weight="900" fill="#6e589a">404</text></g>
      <g class="sb-clash"><polygon points="${burst.join(" ")}" fill="#fff6d8" stroke="#f2a541" stroke-width="3" stroke-linejoin="round"/><circle cx="180" cy="98" r="9" fill="#fff"/></g>
      <g class="sb-sparks" stroke="#f4d36b" stroke-width="3" stroke-linecap="round"><path d="M180 30 v-16 M226 54 l12 -12 M134 54 l-12 -12 M226 142 l12 12 M134 142 l-12 12 M242 98 h16 M118 98 h-16"/></g>
    </svg>`;
  }
  let shown = false;

  function show(next) {
    if (shown) return next();
    shown = true;
    const hero = root.ITE.gameData.characters.some((c) => c.id === HERO) ? HERO : app.getSave().profile.team[0];
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
      h(
        "div",
        { class: "splash-stage" },
        h("div", { class: "splash-battle", "aria-hidden": "true", html: battle() }),
        h("div", { class: "splash-hero", html: hero ? sprites.character(hero, "happy") : sprites.hero("happy") })
      ),
      h("p", { class: "splash-tap" }, "點擊開始")
    );
    root.document.body.append(overlay);
    overlay.focus();
  }

  root.ITE.splashUi = { show };
})(globalThis);
