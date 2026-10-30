// Original PLACEHOLDER chibi sprites (inline SVG). Not final art — the art
// bible and mockups await user-provided style references (docs/06_ART_DIRECTION.md).
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  // ~2-head-tall student hero with a laptop.
  const hero = `
<svg viewBox="0 0 120 140" class="sprite" role="img" aria-label="主角（佔位圖）">
  <ellipse cx="60" cy="134" rx="30" ry="5" fill="var(--shadow)"/>
  <rect x="38" y="84" width="44" height="40" rx="14" fill="#8fb8de"/>
  <rect x="44" y="118" width="12" height="14" rx="5" fill="#5b6b82"/>
  <rect x="64" y="118" width="12" height="14" rx="5" fill="#5b6b82"/>
  <circle cx="60" cy="52" r="38" fill="#ffe3cf" stroke="#4a3f3a" stroke-width="2.5"/>
  <path d="M22 50 Q24 12 60 12 Q98 12 98 50 Q88 30 70 34 Q56 22 40 36 Q30 34 22 50Z" fill="#4a3f3a"/>
  <ellipse cx="46" cy="58" rx="5" ry="7" fill="#4a3f3a"/>
  <ellipse cx="74" cy="58" rx="5" ry="7" fill="#4a3f3a"/>
  <circle cx="47.5" cy="55" r="1.8" fill="#fff"/><circle cx="75.5" cy="55" r="1.8" fill="#fff"/>
  <ellipse cx="36" cy="70" rx="6" ry="3.5" fill="#f7b2b7" opacity=".8"/>
  <ellipse cx="84" cy="70" rx="6" ry="3.5" fill="#f7b2b7" opacity=".8"/>
  <path d="M54 72 Q60 78 66 72" stroke="#4a3f3a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <rect x="30" y="94" width="34" height="22" rx="3" fill="#c9d6df" stroke="#4a3f3a" stroke-width="2"/>
  <text x="47" y="109" font-size="9" text-anchor="middle" fill="#4a3f3a" font-family="monospace">&lt;/&gt;</text>
</svg>`;

  // "Bug King": a round virus blob with a tiny crown.
  const bugKing = `
<svg viewBox="0 0 140 140" class="sprite" role="img" aria-label="Bug 王（佔位圖）">
  <ellipse cx="70" cy="132" rx="40" ry="6" fill="var(--shadow)"/>
  <g stroke="#4a3f3a" stroke-width="2.5" stroke-linecap="round">
    <line x1="22" y1="70" x2="8" y2="62"/><line x1="24" y1="92" x2="10" y2="100"/>
    <line x1="118" y1="70" x2="132" y2="62"/><line x1="116" y1="92" x2="130" y2="100"/>
    <line x1="52" y1="34" x2="44" y2="20"/><line x1="88" y1="34" x2="96" y2="20"/>
  </g>
  <circle cx="44" cy="19" r="4" fill="#b8a3d6"/><circle cx="96" cy="19" r="4" fill="#b8a3d6"/>
  <ellipse cx="70" cy="82" rx="50" ry="46" fill="#b8a3d6" stroke="#4a3f3a" stroke-width="2.5"/>
  <circle cx="48" cy="96" r="6" fill="#9d86c2"/><circle cx="96" cy="66" r="5" fill="#9d86c2"/><circle cx="88" cy="108" r="4" fill="#9d86c2"/>
  <path d="M52 40 L58 26 L70 36 L82 26 L88 40 Z" fill="#f4d58d" stroke="#4a3f3a" stroke-width="2"/>
  <path d="M46 72 L60 78" stroke="#4a3f3a" stroke-width="3" stroke-linecap="round"/>
  <path d="M94 72 L80 78" stroke="#4a3f3a" stroke-width="3" stroke-linecap="round"/>
  <circle cx="56" cy="84" r="5" fill="#4a3f3a"/><circle cx="84" cy="84" r="5" fill="#4a3f3a"/>
  <path d="M58 104 Q70 96 82 104" stroke="#4a3f3a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <text x="70" y="124" font-size="10" text-anchor="middle" fill="#4a3f3a" font-family="monospace">404</text>
</svg>`;

  ITE.sprites = { hero, bugKing };
})(globalThis);
