// Original Q-version (2.5 heads) sprites per the approved Art Bible
// (docs/06_ART_DIRECTION.md). Still PLACEHOLDER art until final illustrations.
// Each sprite is a function of an expression so battles can react:
//   hero(expr):    "idle" | "happy" | "speechless" | "surprised"
//   bugKing(expr): "idle" | "hurt" | "smug"
//   raidBoss(expr): the bigger weekly guild boss, same expressions as bugKing
(function (root) {
  const ITE = (root.ITE = root.ITE || {});
  const INK = "#3b3330";

  const heroFaces = {
    idle: `
      <circle cx="44" cy="62" r="3.5" fill="${INK}"/><circle cx="76" cy="62" r="3.5" fill="${INK}"/>
      <path d="M54 82 Q60 87 66 82" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    happy: `
      <path d="M38 64 Q44 57 50 64" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M70 64 Q76 57 82 64" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M50 78 Q60 92 70 78Z" fill="#ee8b7a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`,
    speechless: `
      <circle cx="44" cy="63" r="2.2" fill="${INK}"/><circle cx="76" cy="63" r="2.2" fill="${INK}"/>
      <path d="M55 85 Q60 81 65 85" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M104 30 Q112 42 104 47 Q97 42 104 30Z" fill="#8fc3e8" stroke="${INK}" stroke-width="2"/>
      <g stroke="#8fc3e8" stroke-width="3" stroke-linecap="round"><line x1="40" y1="22" x2="40" y2="34"/><line x1="50" y1="20" x2="50" y2="32"/><line x1="60" y1="20" x2="60" y2="32"/></g>`,
    surprised: `
      <circle cx="44" cy="62" r="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="44" cy="62" r="2" fill="${INK}"/>
      <circle cx="76" cy="62" r="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="76" cy="62" r="2" fill="${INK}"/>
      <ellipse cx="60" cy="84" rx="4.5" ry="5.5" fill="${INK}"/>`,
  };

  // Lavender hoodie, round glasses, tiny crown pin, laptop with "</>".
  function hero(expr, color) {
    const face = heroFaces[expr] || heroFaces.idle;
    const glasses = expr === "surprised" ? "" : `
      <circle cx="44" cy="62" r="11" fill="none" stroke="${INK}" stroke-width="3"/>
      <circle cx="76" cy="62" r="11" fill="none" stroke="${INK}" stroke-width="3"/>
      <line x1="55" y1="62" x2="65" y2="62" stroke="${INK}" stroke-width="3"/>`;
    return `
<svg viewBox="0 0 120 170" class="sprite" role="img" aria-label="主角">
  <ellipse cx="60" cy="164" rx="30" ry="5" fill="${INK}" opacity="0.12"/>
  <rect x="38" y="96" width="44" height="46" rx="16" fill="${color || "#c4b0e0"}" stroke="${INK}" stroke-width="3"/>
  <rect x="44" y="138" width="12" height="22" rx="5" fill="#3d4a66" stroke="${INK}" stroke-width="3"/>
  <rect x="64" y="138" width="12" height="22" rx="5" fill="#3d4a66" stroke="${INK}" stroke-width="3"/>
  <rect x="26" y="108" width="40" height="26" rx="4" fill="#e9eef3" stroke="${INK}" stroke-width="3"/>
  <text x="46" y="126" font-size="11" text-anchor="middle" fill="${INK}" font-family="monospace" font-weight="700">&lt;/&gt;</text>
  <circle cx="60" cy="56" r="42" fill="#fde7d8" stroke="${INK}" stroke-width="3"/>
  <path d="M18 54 Q20 12 60 12 Q100 12 102 54 Q92 34 74 38 Q60 26 42 40 Q30 36 18 54Z" fill="${INK}"/>
  <ellipse cx="32" cy="76" rx="6" ry="3.5" fill="#f2b4b0" opacity="0.8"/>
  <ellipse cx="88" cy="76" rx="6" ry="3.5" fill="#f2b4b0" opacity="0.8"/>
  ${glasses}
  ${face}
  <path d="M54 10 L58 0 L63 8 L68 0 L70 12Z" fill="#f4d36b" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
</svg>`;
  }

  const bossFaces = {
    idle: `
      <path d="M50 78 L66 84" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><path d="M100 78 L84 84" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="61" cy="92" r="5" fill="${INK}"/><circle cx="89" cy="92" r="5" fill="${INK}"/>
      <path d="M62 114 Q75 106 88 114" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    hurt: `
      <path d="M55 86 L67 98 M67 86 L55 98" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M83 86 L95 98 M95 86 L83 98" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="75" cy="114" rx="7" ry="6" fill="${INK}"/>
      <path d="M118 52 Q126 64 118 69 Q111 64 118 52Z" fill="#8fc3e8" stroke="${INK}" stroke-width="2"/>`,
    smug: `
      <path d="M52 90 Q61 84 70 90" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M80 90 Q89 84 98 90" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M60 108 Q75 120 90 108" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  };

  function bugBody(expr, fill, spot, label, crownWide) {
    const crown = crownWide
      ? `<path d="M50 46 L54 26 L66 38 L75 22 L84 38 L96 26 L100 46Z" fill="#f4d36b" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`
      : `<path d="M56 46 L62 30 L75 42 L88 30 L94 46Z" fill="#f4d36b" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
    return `
<svg viewBox="0 0 150 150" class="sprite" role="img" aria-label="${label}">
  <ellipse cx="75" cy="142" rx="44" ry="6" fill="${INK}" opacity="0.12"/>
  <g stroke="${INK}" stroke-width="3" stroke-linecap="round"><line x1="24" y1="78" x2="8" y2="70"/><line x1="26" y1="100" x2="10" y2="108"/><line x1="126" y1="78" x2="142" y2="70"/><line x1="124" y1="100" x2="140" y2="108"/><line x1="56" y1="40" x2="48" y2="24"/><line x1="94" y1="40" x2="102" y2="24"/></g>
  <circle cx="48" cy="22" r="5" fill="${fill}" stroke="${INK}" stroke-width="2.5"/><circle cx="102" cy="22" r="5" fill="${fill}" stroke="${INK}" stroke-width="2.5"/>
  <ellipse cx="75" cy="90" rx="52" ry="48" fill="${fill}" stroke="${INK}" stroke-width="3"/>
  <circle cx="44" cy="106" r="6" fill="${spot}"/><circle cx="106" cy="70" r="5" fill="${spot}"/><circle cx="98" cy="118" r="4" fill="${spot}"/>
  ${crown}
  ${bossFaces[expr] || bossFaces.idle}
  <text x="75" y="133" font-size="11" text-anchor="middle" fill="${INK}" font-family="monospace" font-weight="700">404</text>
</svg>`;
  }

  const bugKing = (expr) => bugBody(expr, "#c4b0e0", "#ad97cf", "Bug 王", false);
  const raidBoss = (expr) => bugBody(expr, "#a993cf", "#9580bd", "公會 Boss", true);

  // ITE.sprites.character(id, expr) is added by src/ui/characters.js.
  ITE.sprites = { hero, bugKing, raidBoss, character: (id, expr) => hero(expr) };
})(globalThis);
