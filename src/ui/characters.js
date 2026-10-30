// Seven character designs approved by the user on 2026-10-30 (design canvas
// "角色造型"). Q-version 2.5 heads, Art Bible palette. Still PLACEHOLDER art
// (drawn in code) until final illustrations are decided.
// ITE.sprites.character(id, expr) with expr: "idle" | "happy" | "speechless" | "surprised".
(function (root) {
  const ITE = (root.ITE = root.ITE || {});
  const INK = "#3b3330";
  const SKIN = "#fde7d8";
  const NAVY = "#3d4a66";

  // Generic face for characters with visible eyes. o: eye x positions, eye y,
  // mouth centre, and where the sweat drop / gloom lines go.
  function face(expr, o) {
    const { lx, rx, ey, mx, my } = o;
    const cheeks = `<ellipse cx="${lx - 12}" cy="${my - 4}" rx="6" ry="3.5" fill="#f2b4b0" opacity="0.8"/><ellipse cx="${rx + 12}" cy="${my - 4}" rx="6" ry="3.5" fill="#f2b4b0" opacity="0.8"/>`;
    const sweat = `<path d="M${o.sx} ${o.sy} q7 11 0 15 q-7 -4 0 -15Z" fill="#8fc3e8" stroke="${INK}" stroke-width="2"/>`;
    const gloom = `<g stroke="#8fc3e8" stroke-width="3" stroke-linecap="round"><line x1="${o.gx}" y1="${o.gy}" x2="${o.gx}" y2="${o.gy + 12}"/><line x1="${o.gx + 9}" y1="${o.gy - 2}" x2="${o.gx + 9}" y2="${o.gy + 10}"/><line x1="${o.gx + 18}" y1="${o.gy - 2}" x2="${o.gx + 18}" y2="${o.gy + 10}"/></g>`;
    switch (expr) {
      case "happy":
        return `${cheeks}<path d="M${lx - 6} ${ey + 2} q6 -7 12 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${rx - 6} ${ey + 2} q6 -7 12 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${mx - 9} ${my - 3} q9 13 18 0Z" fill="#ee8b7a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
      case "speechless":
        return `${cheeks}<circle cx="${lx}" cy="${ey}" r="2.2" fill="${INK}"/><circle cx="${rx}" cy="${ey}" r="2.2" fill="${INK}"/><path d="M${mx - 5} ${my + 2} q5 -4 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>${sweat}${gloom}`;
      case "surprised":
        return `${cheeks}<circle cx="${lx}" cy="${ey}" r="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="${lx}" cy="${ey}" r="2" fill="${INK}"/><circle cx="${rx}" cy="${ey}" r="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="${rx}" cy="${ey}" r="2" fill="${INK}"/><ellipse cx="${mx}" cy="${my + 2}" rx="4.5" ry="5.5" fill="${INK}"/>`;
      default:
        return `${cheeks}<circle cx="${lx}" cy="${ey}" r="4" fill="${INK}"/><circle cx="${rx}" cy="${ey}" r="4" fill="${INK}"/><path d="M${mx - 7} ${my} q7 6 14 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
  }

  const legs = (fill) =>
    `<rect x="52" y="140" width="13" height="20" rx="6" fill="${fill}" stroke="${INK}" stroke-width="3"/><rect x="75" y="140" width="13" height="20" rx="6" fill="${fill}" stroke="${INK}" stroke-width="3"/>`;
  const shadow = (cx) => `<ellipse cx="${cx}" cy="164" rx="32" ry="5" fill="${INK}" opacity="0.12"/>`;
  const humanHead = (cy) => `<circle cx="70" cy="${cy}" r="42" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>`;
  const std = { lx: 54, rx: 86, ey: 62, mx: 70, my: 82, sx: 104, sy: 30, gx: 50, gy: 24 };

  const DESIGNS = {
    "CH-ITDOG": (expr) => `
      ${shadow(66)}
      <path d="M86 128 C 110 128, 104 104, 122 100 C 132 98, 134 108, 128 112" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
      <path d="M86 128 C 110 128, 104 104, 122 100 C 132 98, 134 108, 128 112" fill="none" stroke="#9fd4b4" stroke-width="6" stroke-linecap="round"/>
      <circle cx="127" cy="104" r="1.6" fill="${INK}"/>
      <rect x="42" y="98" width="48" height="44" rx="18" fill="#f4d36b" stroke="${INK}" stroke-width="3"/>
      <rect x="48" y="138" width="13" height="20" rx="6" fill="#f2d3a8" stroke="${INK}" stroke-width="3"/>
      <rect x="71" y="138" width="13" height="20" rx="6" fill="#f2d3a8" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="22" cy="58" rx="12" ry="24" fill="#b98a5a" stroke="${INK}" stroke-width="3" transform="rotate(14 22 58)"/>
      <ellipse cx="110" cy="58" rx="12" ry="24" fill="#b98a5a" stroke="${INK}" stroke-width="3" transform="rotate(-14 110 58)"/>
      <circle cx="66" cy="58" r="42" fill="#f2d3a8" stroke="${INK}" stroke-width="3"/>
      <path d="M30 40 Q66 0 102 40" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <rect x="18" y="38" width="16" height="24" rx="7" fill="#8fc3e8" stroke="${INK}" stroke-width="3"/>
      <rect x="98" y="38" width="16" height="24" rx="7" fill="#8fc3e8" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="66" cy="82" rx="18" ry="13" fill="#fbf0e2" stroke="${INK}" stroke-width="2.5"/>
      <ellipse cx="66" cy="76" rx="6" ry="4.5" fill="${INK}"/>
      ${face(expr, { lx: 50, rx: 82, ey: 60, mx: 66, my: 88, sx: 100, sy: 70, gx: 46, gy: 22 })}`,

    "CH-DB": (expr) => `
      ${shadow(70)}
      <rect x="46" y="98" width="48" height="46" rx="16" fill="#ffffff" stroke="${INK}" stroke-width="3"/>
      <path d="M70 98 L70 144" stroke="${INK}" stroke-width="2"/>
      ${legs(NAVY)}
      ${humanHead(58)}
      <path d="M30 56 Q30 22 70 20 Q110 22 110 56 Q100 40 84 42 Q70 34 56 44 Q40 40 30 56Z" fill="${INK}"/>
      <ellipse cx="74" cy="20" rx="36" ry="12" fill="#8fc3e8" stroke="${INK}" stroke-width="3"/>
      <circle cx="96" cy="12" r="5" fill="#8fc3e8" stroke="${INK}" stroke-width="2.5"/>
      ${face(expr, { ...std, sx: 108, sy: 40, gy: 34 })}
      <g transform="translate(44 104)">
        <path d="M0 8 L0 36 Q26 46 52 36 L52 8" fill="#8fc3e8" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="26" cy="8" rx="26" ry="8" fill="#c9e2f4" stroke="${INK}" stroke-width="3"/>
        <path d="M0 20 Q26 30 52 20" fill="none" stroke="${INK}" stroke-width="2.5"/>
        <circle cx="44" cy="30" r="2.5" fill="#9fd4b4"/>
      </g>`,

    "CH-GOLD": (expr) => `
      ${shadow(70)}
      <rect x="46" y="98" width="48" height="46" rx="14" fill="#e8c27a" stroke="${INK}" stroke-width="3"/>
      <path d="M60 98 L70 112 L80 98" fill="#ffffff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M70 112 L65 126 L70 134 L75 126Z" fill="#ee8b7a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      ${legs(NAVY)}
      ${humanHead(58)}
      <path d="M28 54 Q30 16 72 16 Q112 18 112 50 Q98 26 70 32 Q58 24 44 34 Q34 40 28 54Z" fill="${INK}"/>
      <path d="M70 18 Q84 30 108 40" fill="none" stroke="#fbf6ee" stroke-width="2.5" stroke-linecap="round"/>
      ${face(expr, { ...std, my: 81 })}
      <g transform="translate(96 104)">
        <g stroke="${INK}" stroke-width="2.5" stroke-linecap="round"><line x1="6" y1="-4" x2="6" y2="2"/><line x1="14" y1="-4" x2="14" y2="2"/><line x1="22" y1="-4" x2="22" y2="2"/><line x1="6" y1="28" x2="6" y2="34"/><line x1="14" y1="28" x2="14" y2="34"/><line x1="22" y1="28" x2="22" y2="34"/></g>
        <rect x="0" y="2" width="28" height="26" rx="4" fill="${NAVY}" stroke="${INK}" stroke-width="3"/>
        <rect x="7" y="9" width="14" height="12" rx="2" fill="#e8c27a"/>
      </g>`,

    // Sunglasses hide the eyes, so expressions use the mouth, sweat and lenses.
    "CH-HACK": (expr) => {
      const mouth = {
        happy: `<path d="M60 80 q10 12 20 0Z" fill="#ee8b7a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`,
        speechless: `<path d="M65 86 q5 -4 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M104 38 q7 11 0 15 q-7 -4 0 -15Z" fill="#8fc3e8" stroke="${INK}" stroke-width="2"/>`,
        surprised: `<ellipse cx="70" cy="84" rx="4.5" ry="5.5" fill="${INK}"/>`,
      }[expr] || `<path d="M62 82 Q72 88 80 80" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      const lenses = expr === "surprised" ? "#8fc3e8" : INK;
      return `
      ${shadow(70)}
      <rect x="46" y="98" width="48" height="46" rx="16" fill="#a9adbb" stroke="${INK}" stroke-width="3"/>
      ${legs(NAVY)}
      <path d="M22 66 Q22 10 70 10 Q118 10 118 66 L112 96 L28 96Z" fill="#a9adbb" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="70" cy="62" r="36" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
      <path d="M36 50 Q70 30 104 50" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      <rect x="40" y="56" width="26" height="14" rx="6" fill="${lenses}"/>
      <rect x="74" y="56" width="26" height="14" rx="6" fill="${lenses}"/>
      <line x1="66" y1="61" x2="74" y2="61" stroke="${INK}" stroke-width="3"/>
      <line x1="45" y1="59" x2="52" y2="59" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
      ${mouth}
      <g transform="translate(28 110)">
        <rect x="0" y="0" width="44" height="28" rx="4" fill="#e9eef3" stroke="${INK}" stroke-width="3"/>
        <rect x="16" y="11" width="12" height="10" rx="2" fill="#9fd4b4" stroke="${INK}" stroke-width="2"/>
        <path d="M18 11 V8 a4 4 0 0 1 8 0 V11" fill="none" stroke="${INK}" stroke-width="2"/>
      </g>`;
    },

    "CH-OFFICE": (expr) => `
      ${shadow(70)}
      <rect x="46" y="98" width="48" height="46" rx="16" fill="#ffffff" stroke="${INK}" stroke-width="3"/>
      <path d="M50 102 L58 98 L70 120 L82 98 L90 102 L90 140 L50 140Z" fill="#9fd4b4" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      ${legs(NAVY)}
      <circle cx="70" cy="12" r="12" fill="#6b4a3a" stroke="${INK}" stroke-width="3"/>
      ${humanHead(58)}
      <path d="M28 58 Q26 18 70 18 Q114 18 112 58 Q106 36 86 34 Q70 28 54 34 Q34 36 28 58Z" fill="#6b4a3a"/>
      ${face(expr, { ...std, sx: 108, sy: 36, gy: 26 })}
      <g transform="translate(92 98)">
        <rect x="0" y="0" width="38" height="46" rx="4" fill="#e8c27a" stroke="${INK}" stroke-width="3"/>
        <rect x="11" y="-4" width="16" height="8" rx="2" fill="#a9adbb" stroke="${INK}" stroke-width="2"/>
        <rect x="5" y="8" width="28" height="32" fill="#ffffff" stroke="${INK}" stroke-width="2"/>
        <path d="M5 16 H33 M5 24 H33 M5 32 H33 M14 8 V40 M24 8 V40" stroke="#9fd4b4" stroke-width="2"/>
      </g>`,

    "CH-BROADBAND": (expr) => `
      ${shadow(70)}
      <rect x="46" y="98" width="48" height="46" rx="16" fill="#8fc3e8" stroke="${INK}" stroke-width="3"/>
      <path d="M50 100 L60 100 L60 142 L50 142Z M80 100 L90 100 L90 142 L80 142Z" fill="#f2b4b0" stroke="${INK}" stroke-width="2.5"/>
      ${legs(NAVY)}
      ${humanHead(60)}
      <path d="M26 46 Q28 8 70 8 Q112 8 114 46Z" fill="#f4d36b" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="20" y="42" width="100" height="10" rx="5" fill="#f4d36b" stroke="${INK}" stroke-width="3"/>
      <path d="M70 10 V42" stroke="${INK}" stroke-width="2.5"/>
      ${face(expr, { ...std, ey: 66, my: 84, sx: 108, sy: 56, gx: 48, gy: 56 })}
      <g transform="translate(96 92)">
        <circle cx="16" cy="16" r="16" fill="none" stroke="${INK}" stroke-width="8"/>
        <circle cx="16" cy="16" r="16" fill="none" stroke="#8fc3e8" stroke-width="4"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="${INK}" stroke-width="3"/>
        <path d="M28 28 Q34 46 22 54" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
        <rect x="16" y="52" width="10" height="8" rx="1.5" fill="#ffffff" stroke="${INK}" stroke-width="2"/>
      </g>`,

    // Robot: the eye lights change instead of a human face.
    "CH-AIBOT": (expr) => {
      const eyes = {
        happy: `<path d="M49 54 q7 -8 14 0" stroke="#8fc3e8" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M77 54 q7 -8 14 0" stroke="#8fc3e8" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M60 64 q10 8 20 0" stroke="#8fc3e8" stroke-width="3" fill="none" stroke-linecap="round"/>`,
        speechless: `<rect x="50" y="50" width="12" height="3" rx="1.5" fill="#8fc3e8"/><rect x="78" y="50" width="12" height="3" rx="1.5" fill="#8fc3e8"/><path d="M64 67 h12" stroke="#8fc3e8" stroke-width="3" stroke-linecap="round"/><path d="M112 22 q7 11 0 15 q-7 -4 0 -15Z" fill="#8fc3e8" stroke="${INK}" stroke-width="2"/>`,
        surprised: `<circle cx="56" cy="52" r="9" fill="none" stroke="#8fc3e8" stroke-width="3"/><circle cx="84" cy="52" r="9" fill="none" stroke="#8fc3e8" stroke-width="3"/><circle cx="70" cy="67" r="3.5" fill="#8fc3e8"/>`,
      }[expr] || `<ellipse cx="56" cy="52" rx="7" ry="9" fill="#8fc3e8"/><ellipse cx="84" cy="52" rx="7" ry="9" fill="#8fc3e8"/><circle cx="58" cy="49" r="2.5" fill="#ffffff"/><circle cx="86" cy="49" r="2.5" fill="#ffffff"/><path d="M62 66 Q70 70 78 66" stroke="#8fc3e8" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      return `
      ${shadow(70)}
      <line x1="70" y1="14" x2="70" y2="2" stroke="${INK}" stroke-width="3"/>
      <circle cx="70" cy="4" r="6" fill="#f4d36b" stroke="${INK}" stroke-width="2.5"/>
      <rect x="40" y="100" width="60" height="44" rx="14" fill="#c4b0e0" stroke="${INK}" stroke-width="3"/>
      <rect x="56" y="110" width="28" height="18" rx="4" fill="#ffffff" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="64" cy="119" r="3" fill="#9fd4b4"/><circle cx="76" cy="119" r="3" fill="#ee8b7a"/>
      <rect x="30" y="106" width="10" height="26" rx="5" fill="#e2e5ea" stroke="${INK}" stroke-width="3"/>
      <rect x="100" y="106" width="10" height="26" rx="5" fill="#e2e5ea" stroke="${INK}" stroke-width="3"/>
      <rect x="50" y="140" width="15" height="20" rx="5" fill="#e2e5ea" stroke="${INK}" stroke-width="3"/>
      <rect x="75" y="140" width="15" height="20" rx="5" fill="#e2e5ea" stroke="${INK}" stroke-width="3"/>
      <rect x="26" y="14" width="88" height="82" rx="30" fill="#e2e5ea" stroke="${INK}" stroke-width="3"/>
      <rect x="36" y="32" width="68" height="42" rx="18" fill="${NAVY}" stroke="${INK}" stroke-width="3"/>
      ${eyes}
      <ellipse cx="34" cy="80" rx="5" ry="3" fill="#f2b4b0" opacity="0.8"/><ellipse cx="106" cy="80" rx="5" ry="3" fill="#f2b4b0" opacity="0.8"/>`;
    },
  };

  const NAMES = {
    "CH-ITDOG": "IT狗",
    "CH-DB": "數據庫師",
    "CH-GOLD": "黃金職員",
    "CH-HACK": "黑客",
    "CH-OFFICE": "辦公室職員",
    "CH-BROADBAND": "寬頻職員",
    "CH-AIBOT": "人工智能機械人",
  };

  // Falls back to the plain hero for an unknown id (e.g. a new workbook character).
  function character(id, expr) {
    const draw = DESIGNS[id];
    if (!draw) return ITE.sprites.hero(expr);
    return `<svg viewBox="0 0 140 170" class="sprite" role="img" aria-label="${NAMES[id]}">${draw(expr || "idle")}</svg>`;
  }

  ITE.sprites.character = character;
  ITE.sprites.CHARACTER_IDS = Object.keys(DESIGNS);
})(globalThis);
