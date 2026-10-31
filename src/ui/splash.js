// 開場動畫 (user request 2026-11-01): shown once each time the app opens.
// The 「IT帝」 letters pop in, a crown drops onto them, the SSR 機械老虎狗 (the
// most heroic look, user request 2026-11-01) bounces in and code symbols float
// up; 「點擊開始」 then opens the home screen. The tap also unlocks audio on
// iOS, so the home music can start straight away.
// Behind it all, a movie-poster battle of IT帝 against Bug 魔王 with its own
// epic music (user request 2026-11-01). Browsers only allow sound after a tap,
// so tapping the screen starts the music and only 「點擊開始」 enters the game.
// Reduced-motion players get the same screen without movement (CSS).
(function (root) {
  const app = root.ITE.app;
  const { h } = app;
  const sprites = root.ITE.sprites;

  const CROWN = `<svg viewBox="0 0 120 70" aria-hidden="true"><path d="M10 60 L16 18 L40 42 L60 8 L80 42 L104 18 L110 60 Z" fill="#f4d36b" stroke="#3b3330" stroke-width="5" stroke-linejoin="round"/><rect x="10" y="56" width="100" height="10" rx="4" fill="#e8b84a" stroke="#3b3330" stroke-width="5"/><circle cx="60" cy="34" r="6" fill="#f08a9c" stroke="#3b3330" stroke-width="3"/><circle cx="16" cy="16" r="5" fill="#f4d36b" stroke="#3b3330" stroke-width="3"/><circle cx="104" cy="16" r="5" fill="#f4d36b" stroke="#3b3330" stroke-width="3"/><circle cx="60" cy="7" r="5" fill="#f4d36b" stroke="#3b3330" stroke-width="3"/></svg>`;
  const SYMBOLS = ["</>", "{ }", "01", "SQL", "if", "Wi-Fi", "=SUM", "def"];

  const HERO = "CH-ITDOG-MECHA";

  // Movie-poster battle behind the whole opening screen (user 2026-11-01:
  // side-on stare-down, fiercer faces, bigger, more violent): IT帝 on a storm-
  // blue half, Bug 魔王 on an inferno half, their attacks clashing above the
  // hero's head. Drawn in a 375×812 frame that fills any phone.
  function poster() {
    const body = (id, expr) => sprites.character(id, expr).replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    const rays = [];
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      rays.push(`<path d="M187 392 L${(187 + 520 * Math.cos(a)).toFixed(0)} ${(392 + 520 * Math.sin(a)).toFixed(0)}" />`);
    }
    const burst = [];
    for (let i = 0; i < 20; i++) {
      const a = (Math.PI * 2 * i) / 20;
      const r = i % 2 ? 30 : 70;
      burst.push(`${(187 + r * Math.cos(a)).toFixed(1)},${(392 + r * Math.sin(a)).toFixed(1)}`);
    }
    const embers = Array.from({ length: 14 }, (_, i) => `<circle class="sp-ember" style="--i:${i}" cx="${20 + ((i * 53) % 340)}" cy="${560 + ((i * 37) % 220)}" r="${2 + (i % 3)}" />`).join("");
    return `<svg viewBox="0 0 375 812" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sp-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f2f5c"/><stop offset="1" stop-color="#4672b3"/></linearGradient>
        <linearGradient id="sp-red" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d1f3f"/><stop offset="1" stop-color="#d2553f"/></linearGradient>
        <radialGradient id="sp-glow"><stop offset="0" stop-color="#fffbe8"/><stop offset="0.4" stop-color="#f4d36b" stop-opacity="0.8"/><stop offset="1" stop-color="#f4d36b" stop-opacity="0"/></radialGradient>
        <radialGradient id="sp-vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.55"/></radialGradient>
      </defs>
      <g class="sp-shake">
        <polygon points="0,0 230,0 145,812 0,812" fill="url(#sp-blue)"/>
        <polygon points="230,0 375,0 375,812 145,812" fill="url(#sp-red)"/>
        <g class="sp-rays" stroke="#fff" stroke-width="3" opacity="0.18">${rays.join("")}</g>
        <g class="sp-bolts" fill="#f4d36b" stroke="#fff6d8" stroke-width="1.5">
          <path d="M40 60 l-16 46 h14 l-12 40 l34 -54 h-14 l14 -32z"/><path d="M120 150 l-10 30 h9 l-8 26 l22 -35 h-9 l9 -21z"/>
        </g>
        <g class="sp-flames" fill="#f2a541" opacity="0.55"><path d="M300 812 q-20 -80 10 -130 q10 50 30 60 q5 -40 25 -70 q10 80 10 140z"/><path d="M200 812 q0 -50 20 -80 q5 30 20 40 q0 -30 15 -50 q15 50 0 90z"/></g>
        <g class="sp-left"><svg x="-58" y="300" width="290" height="352" viewBox="0 0 140 170">${body("CH-ITEMPEROR", "fightR")}</svg></g>
        <g class="sp-right"><svg x="143" y="300" width="290" height="352" viewBox="0 0 140 170">${body("CH-BUGLORD", "fightL")}</svg></g>
        <g class="sp-beam-left"><path d="M150 330 L176 352 L164 360 L187 392" fill="none" stroke="#fff6d8" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/><path d="M150 330 L176 352 L164 360 L187 392" fill="none" stroke="#f4d36b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>
        <g class="sp-beam-right"><path d="M236 360 Q212 372 187 392" fill="none" stroke="#c4b0e0" stroke-width="18" stroke-linecap="round" opacity="0.6"/><path d="M236 360 Q212 372 187 392" fill="none" stroke="#8a72c0" stroke-width="8" stroke-linecap="round"/></g>
        <circle class="sp-glow" cx="187" cy="392" r="120" fill="url(#sp-glow)"/>
        <polygon class="sp-burst" points="${burst.join(" ")}" fill="#fff" stroke="#f2a541" stroke-width="4" stroke-linejoin="round"/>
        <circle class="sp-ring" cx="187" cy="392" r="40" fill="none" stroke="#fff6d8" stroke-width="5"/>
        <g fill="#f4d36b">${embers}</g>
      </g>
      <rect width="375" height="812" fill="url(#sp-vignette)"/>
      <rect class="sp-flash" width="375" height="812" fill="#fff"/>
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
    // The epic theme starts on the first tap (src/ui/music.js unlocks audio on
    // that tap); tapping the screen again, or the button, enters the game.
    const music = root.ITE.music;
    const wantsMusic = !!(music && music.isEnabled());
    if (wantsMusic) music.play("epic");
    let heard = !wantsMusic;
    const hint = h("p", { class: "splash-music" }, wantsMusic ? "🔊 點擊畫面聆聽戰鬥音樂" : "");
    const tapScreen = () => {
      if (heard) return start();
      heard = true;
      hint.textContent = "🎵 戰鬥音樂播放中";
    };
    const overlay = h(
      "div",
      { class: "splash", role: "dialog", "aria-label": "IT帝 開場", onclick: tapScreen },
      h("div", { class: "splash-poster", "aria-hidden": "true", html: poster() }),
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
        h("div", { class: "splash-hero", html: hero ? sprites.character(hero, "happy") : sprites.hero("happy") })
      ),
      h("button", { class: "splash-tap", onclick: (e) => (e.stopPropagation(), start()) }, "點擊開始"),
      hint
    );
    root.document.body.append(overlay);
    overlay.querySelector(".splash-tap").focus();
  }

  root.ITE.splashUi = { show };
})(globalThis);
