// Character art: seven families (approved designs, 2026-10-30), each drawn
// from parameters so a family can have several 品種 (variants) of different
// rarity. The seven original ids keep their approved look. Still PLACEHOLDER
// art (drawn in code) until final illustrations are decided.
// ITE.sprites.character(id, expr) with expr: "idle" | "happy" | "speechless" | "surprised".
(function (root) {
  const ITE = (root.ITE = root.ITE || {});
  const INK = "#3b3330";
  const SKIN = "#fde7d8";
  const NAVY = "#3d4a66";
  const GOLD = "#f4d36b";

  // Generic face for characters with visible eyes. o: eye x positions, eye y,
  // mouth centre, and where the sweat drop / gloom lines go.
  function face(expr, o) {
    const { lx, rx, ey, mx, my } = o;
    const eye = o.eye || INK;
    const cheeks = `<ellipse cx="${lx - 12}" cy="${my - 4}" rx="6" ry="3.5" fill="#f2b4b0" opacity="0.8"/><ellipse cx="${rx + 12}" cy="${my - 4}" rx="6" ry="3.5" fill="#f2b4b0" opacity="0.8"/>`;
    const sweat = `<path d="M${o.sx} ${o.sy} q7 11 0 15 q-7 -4 0 -15Z" fill="#8fc3e8" stroke="${INK}" stroke-width="2"/>`;
    const gloom = `<g stroke="#8fc3e8" stroke-width="3" stroke-linecap="round"><line x1="${o.gx}" y1="${o.gy}" x2="${o.gx}" y2="${o.gy + 12}"/><line x1="${o.gx + 9}" y1="${o.gy - 2}" x2="${o.gx + 9}" y2="${o.gy + 10}"/><line x1="${o.gx + 18}" y1="${o.gy - 2}" x2="${o.gx + 18}" y2="${o.gy + 10}"/></g>`;
    switch (expr) {
      case "happy":
        return `${cheeks}<path d="M${lx - 6} ${ey + 2} q6 -7 12 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${rx - 6} ${ey + 2} q6 -7 12 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${mx - 9} ${my - 3} q9 13 18 0Z" fill="#ee8b7a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;
      case "speechless":
        return `${cheeks}<circle cx="${lx}" cy="${ey}" r="2.2" fill="${eye}"/><circle cx="${rx}" cy="${ey}" r="2.2" fill="${eye}"/><path d="M${mx - 5} ${my + 2} q5 -4 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>${sweat}${gloom}`;
      case "surprised":
        return `${cheeks}<circle cx="${lx}" cy="${ey}" r="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="${lx}" cy="${ey}" r="2" fill="${eye}"/><circle cx="${rx}" cy="${ey}" r="6" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="${rx}" cy="${ey}" r="2" fill="${eye}"/><ellipse cx="${mx}" cy="${my + 2}" rx="4.5" ry="5.5" fill="${INK}"/>`;
      default:
        return `${cheeks}<circle cx="${lx}" cy="${ey}" r="4" fill="${eye}"/><circle cx="${rx}" cy="${ey}" r="4" fill="${eye}"/><path d="M${mx - 7} ${my} q7 6 14 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
  }

  const legs = (fill) =>
    `<rect x="52" y="140" width="13" height="20" rx="6" fill="${fill}" stroke="${INK}" stroke-width="3"/><rect x="75" y="140" width="13" height="20" rx="6" fill="${fill}" stroke="${INK}" stroke-width="3"/>`;
  const shadow = (cx) => `<ellipse cx="${cx}" cy="164" rx="32" ry="5" fill="${INK}" opacity="0.12"/>`;
  const humanHead = (cy) => `<circle cx="70" cy="${cy}" r="42" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>`;
  const std = { lx: 54, rx: 86, ey: 62, mx: 70, my: 82, sx: 104, sy: 30, gx: 50, gy: 24 };
  const glasses = (lx, rx, ey) =>
    `<circle cx="${lx}" cy="${ey}" r="10" fill="none" stroke="${INK}" stroke-width="2.5"/><circle cx="${rx}" cy="${ey}" r="10" fill="none" stroke="${INK}" stroke-width="2.5"/><line x1="${lx + 10}" y1="${ey}" x2="${rx - 10}" y2="${ey}" stroke="${INK}" stroke-width="2.5"/>`;
  const sparkle = (x, y) =>
    `<path d="M${x} ${y - 7} L${x + 2} ${y - 2} L${x + 7} ${y} L${x + 2} ${y + 2} L${x} ${y + 7} L${x - 2} ${y + 2} L${x - 7} ${y} L${x - 2} ${y - 2}Z" fill="${GOLD}" stroke="${INK}" stroke-width="1.5"/>`;
  const crown = (x, y) =>
    `<path d="M${x - 12} ${y + 6} L${x - 9} ${y - 6} L${x - 3} ${y + 1} L${x} ${y - 9} L${x + 3} ${y + 1} L${x + 9} ${y - 6} L${x + 12} ${y + 6}Z" fill="${GOLD}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`;

  // ---------- families ----------
  const FAMILIES = {
    // IT狗: fur, ear shape, markings, accessories.
    dog: (expr, v) => {
      const ears =
        v.ears === "rose"
          ? `<path d="M34 28 Q20 8 14 30 Q22 34 30 38Z" fill="${v.ear}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M98 28 Q112 8 118 30 Q110 34 102 38Z" fill="${v.ear}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`
          : v.ears === "point"
          ? `<path d="M30 46 L22 6 L54 28Z" fill="${v.ear}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M102 46 L110 6 L78 28Z" fill="${v.ear}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`
          : `<ellipse cx="22" cy="58" rx="12" ry="24" fill="${v.ear}" stroke="${INK}" stroke-width="3" transform="rotate(14 22 58)"/><ellipse cx="110" cy="58" rx="12" ry="24" fill="${v.ear}" stroke="${INK}" stroke-width="3" transform="rotate(-14 110 58)"/>`;
      const mask = v.mask ? `<path d="M40 78 Q42 56 58 52 L66 66 L74 52 Q90 56 92 78 Q66 104 40 78Z" fill="#ffffff"/>` : "";
      // 機械老虎狗 = a mecha bulldog (user, 2026-10-31: "老虎狗是類似八哥的嗰款"):
      // wide flat face, forehead wrinkles, big white jowls with an underbite.
      const head = v.bulldog
        ? `<ellipse cx="66" cy="60" rx="47" ry="40" fill="${v.fur}" stroke="${INK}" stroke-width="3"/>`
        : `<circle cx="66" cy="58" r="42" fill="${v.fur}" stroke="${INK}" stroke-width="3"/>`;
      const wrinkles = v.bulldog
        ? `<g stroke="${INK}" stroke-width="2.5" stroke-linecap="round" fill="none"><path d="M54 36 Q66 31 78 36"/><path d="M58 43 Q66 39 74 43"/></g>`
        : "";
      const muzzle = v.bulldog
        ? `<path d="M30 74 Q24 114 54 110 Q66 104 78 110 Q108 114 102 74 Q84 90 66 84 Q48 90 30 74Z" fill="${v.jowl}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
           <path d="M56 100 L58 90 L61 100 M71 100 L74 90 L76 100" fill="#ffffff" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
           <ellipse cx="66" cy="76" rx="10" ry="6" fill="${INK}"/><ellipse cx="63" cy="74" rx="3" ry="1.6" fill="#ffffff" opacity="0.7"/>`
        : `<ellipse cx="66" cy="82" rx="18" ry="13" fill="#fbf0e2" stroke="${INK}" stroke-width="2.5"/>
      <ellipse cx="66" cy="76" rx="6" ry="4.5" fill="${INK}"/>`;
      // Mecha bulldog body (user, 2026-10-31: clothes hid the bulldog and it did not
      // look mechanical enough): bare stocky body with a white chest,
      // a chest core set into the fur, a flank plate, one robot leg and jet thrusters.
      const METAL = "#c9ced8";
      const bodyArt = v.bulldog
        ? `<g stroke="${INK}" stroke-width="2.5">
             <rect x="24" y="104" width="12" height="22" rx="4" fill="${METAL}"/><rect x="96" y="104" width="12" height="22" rx="4" fill="${METAL}"/>
             <path d="M26 126 L30 140 L34 126Z M98 126 L102 140 L106 126Z" fill="#8fc3e8" class="thrust"/>
           </g>
           <ellipse cx="66" cy="122" rx="32" ry="24" fill="${v.fur}" stroke="${INK}" stroke-width="3"/>
           <path d="M54 112 Q66 110 78 112 Q80 130 66 140 Q52 130 54 112Z" fill="#fbf0e2"/>
           <rect x="36" y="112" width="14" height="18" rx="3" fill="${METAL}" stroke="${INK}" stroke-width="2"/>
           <g fill="${INK}"><circle cx="40" cy="116" r="1.5"/><circle cx="46" cy="116" r="1.5"/><circle cx="40" cy="126" r="1.5"/><circle cx="46" cy="126" r="1.5"/></g>
           <circle cx="66" cy="120" r="8" fill="#8fc3e8" stroke="${INK}" stroke-width="2.5"/><circle cx="66" cy="120" r="3.5" fill="#ffffff"/>
           <path d="M66 112 V108 M66 128 V132 M58 120 H54 M74 120 H78" stroke="#8fc3e8" stroke-width="2" stroke-linecap="round"/>
           <rect x="46" y="138" width="15" height="20" rx="6" fill="${v.fur}" stroke="${INK}" stroke-width="3"/>
           <rect x="71" y="138" width="15" height="20" rx="4" fill="${METAL}" stroke="${INK}" stroke-width="3"/>
           <circle cx="78.5" cy="144" r="3" fill="${INK}"/><line x1="71" y1="151" x2="86" y2="151" stroke="${INK}" stroke-width="2"/>`
        : `<rect x="42" y="98" width="48" height="44" rx="18" fill="${v.hoodie}" stroke="${INK}" stroke-width="3"/>
      <rect x="48" y="138" width="13" height="20" rx="6" fill="${v.fur}" stroke="${INK}" stroke-width="3"/>
      <rect x="71" y="138" width="13" height="20" rx="6" fill="${v.fur}" stroke="${INK}" stroke-width="3"/>`;
      // Cyber eye over the right eye (drawn over the face). No collar: under the
      // jowls it read as a metal mouth guard (user, 2026-10-31).
      const cyberEye = v.bulldog
        ? `<path d="M70 48 Q84 42 100 50 L100 70 Q86 74 72 70Z" fill="${METAL}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
           <circle cx="84" cy="60" r="8" fill="#d2553f" stroke="${INK}" stroke-width="2.5" class="cyber-eye"/><circle cx="82" cy="58" r="2.5" fill="#ffffff"/>
           <g fill="${INK}"><circle cx="74" cy="52" r="1.3"/><circle cx="96" cy="53" r="1.3"/><circle cx="96" cy="67" r="1.3"/></g>`
        : "";
      const mecha = v.mecha
        ? `<circle cx="34" cy="40" r="3" fill="${INK}"/><circle cx="98" cy="40" r="3" fill="${INK}"/><line x1="66" y1="16" x2="66" y2="4" stroke="${INK}" stroke-width="3"/><circle cx="66" cy="4" r="5" fill="#8fc3e8" stroke="${INK}" stroke-width="2.5"/><circle cx="66" cy="118" r="6" fill="#8fc3e8" stroke="${INK}" stroke-width="2.5"/>`
        : "";
      return `
      ${shadow(66)}
      ${v.bulldog
        ? `<path d="M88 126 Q100 124 98 114" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M88 126 Q100 124 98 114" fill="none" stroke="${v.tail}" stroke-width="6" stroke-linecap="round"/>`
        : `<path d="M86 128 C 110 128, 104 104, 122 100 C 132 98, 134 108, 128 112" fill="none" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>
      <path d="M86 128 C 110 128, 104 104, 122 100 C 132 98, 134 108, 128 112" fill="none" stroke="${v.tail}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="127" cy="104" r="1.6" fill="${INK}"/>`}
      ${bodyArt}
      ${ears}
      ${head}
      ${mask}
      ${wrinkles}
      <path d="M30 40 Q66 0 102 40" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <rect x="18" y="38" width="16" height="24" rx="7" fill="${v.phones}" stroke="${INK}" stroke-width="3"/>
      <rect x="98" y="38" width="16" height="24" rx="7" fill="${v.phones}" stroke="${INK}" stroke-width="3"/>
      ${muzzle}
      ${face(expr, { lx: 50, rx: 82, ey: 60, mx: 66, my: 88, sx: 100, sy: 70, gx: 46, gy: 22, eye: v.eye })}
      ${v.glasses ? glasses(50, 82, 60) : ""}
      ${cyberEye}
      ${mecha}`;
    },

    // 數據庫師: coat, beret, database cylinder.
    db: (expr, v) => `
      ${shadow(70)}
      <rect x="46" y="98" width="48" height="46" rx="16" fill="${v.coat}" stroke="${INK}" stroke-width="3"/>
      <path d="M70 98 L70 144" stroke="${INK}" stroke-width="2"/>
      ${legs(NAVY)}
      ${humanHead(58)}
      <path d="M30 56 Q30 22 70 20 Q110 22 110 56 Q100 40 84 42 Q70 34 56 44 Q40 40 30 56Z" fill="${v.hair}"/>
      <ellipse cx="74" cy="20" rx="36" ry="12" fill="${v.beret}" stroke="${INK}" stroke-width="3"/>
      <circle cx="96" cy="12" r="5" fill="${v.beret}" stroke="${INK}" stroke-width="2.5"/>
      ${v.star ? sparkle(52, 16) : ""}
      ${face(expr, { ...std, sx: 108, sy: 40, gy: 34 })}
      ${v.glasses ? glasses(54, 86, 62) : ""}
      <g transform="translate(44 104)">
        <path d="M0 8 L0 36 Q26 46 52 36 L52 8" fill="${v.db}" stroke="${INK}" stroke-width="3"/>
        <ellipse cx="26" cy="8" rx="26" ry="8" fill="${v.dbTop}" stroke="${INK}" stroke-width="3"/>
        <path d="M0 20 Q26 30 52 20" fill="none" stroke="${INK}" stroke-width="2.5"/>
        <circle cx="44" cy="30" r="2.5" fill="#9fd4b4"/>
      </g>`,

    // 黃金職員: suit colour, tie, CPU chip; sparkles for the top rarity.
    suit: (expr, v) => `
      ${shadow(70)}
      <rect x="46" y="98" width="48" height="46" rx="14" fill="${v.suit}" stroke="${INK}" stroke-width="3"/>
      <path d="M60 98 L70 112 L80 98" fill="#ffffff" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M70 112 L65 126 L70 134 L75 126Z" fill="${v.tie}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      ${legs(NAVY)}
      ${humanHead(58)}
      <path d="M28 54 Q30 16 72 16 Q112 18 112 50 Q98 26 70 32 Q58 24 44 34 Q34 40 28 54Z" fill="${INK}"/>
      <path d="M70 18 Q84 30 108 40" fill="none" stroke="#fbf6ee" stroke-width="2.5" stroke-linecap="round"/>
      ${face(expr, { ...std, my: 81 })}
      <g transform="translate(96 104)">
        <g stroke="${INK}" stroke-width="2.5" stroke-linecap="round"><line x1="6" y1="-4" x2="6" y2="2"/><line x1="14" y1="-4" x2="14" y2="2"/><line x1="22" y1="-4" x2="22" y2="2"/><line x1="6" y1="28" x2="6" y2="34"/><line x1="14" y1="28" x2="14" y2="34"/><line x1="22" y1="28" x2="22" y2="34"/></g>
        <rect x="0" y="2" width="28" height="26" rx="4" fill="${NAVY}" stroke="${INK}" stroke-width="3"/>
        <rect x="7" y="9" width="14" height="12" rx="2" fill="${v.suit}"/>
      </g>
      ${v.sparkle ? sparkle(30, 104) + sparkle(112, 20) : ""}`,

    // 黑客: hood colour, lenses, laptop badge, optional white hat.
    hacker: (expr, v) => {
      const mouth = {
        happy: `<path d="M60 80 q10 12 20 0Z" fill="#ee8b7a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`,
        speechless: `<path d="M65 86 q5 -4 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M104 38 q7 11 0 15 q-7 -4 0 -15Z" fill="#8fc3e8" stroke="${INK}" stroke-width="2"/>`,
        surprised: `<ellipse cx="70" cy="84" rx="4.5" ry="5.5" fill="${INK}"/>`,
      }[expr] || `<path d="M62 82 Q72 88 80 80" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      const lenses = expr === "surprised" ? "#8fc3e8" : v.lens;
      const badge =
        v.badge === "shield"
          ? `<path d="M22 8 L32 12 L32 19 Q32 25 22 28 Q12 25 12 19 L12 12Z" fill="#ee8b7a" stroke="${INK}" stroke-width="2"/>`
          : `<rect x="16" y="11" width="12" height="10" rx="2" fill="#9fd4b4" stroke="${INK}" stroke-width="2"/><path d="M18 11 V8 a4 4 0 0 1 8 0 V11" fill="none" stroke="${INK}" stroke-width="2"/>`;
      const hat = v.hat
        ? `<ellipse cx="70" cy="18" rx="40" ry="8" fill="#ffffff" stroke="${INK}" stroke-width="3"/><path d="M44 18 Q46 -4 70 -4 Q94 -4 96 18Z" fill="#ffffff" stroke="${INK}" stroke-width="3"/><rect x="46" y="10" width="48" height="5" fill="${GOLD}"/>`
        : "";
      return `
      ${shadow(70)}
      <rect x="46" y="98" width="48" height="46" rx="16" fill="${v.hood}" stroke="${INK}" stroke-width="3"/>
      ${legs(NAVY)}
      <path d="M22 66 Q22 10 70 10 Q118 10 118 66 L112 96 L28 96Z" fill="${v.hood}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      ${v.trim ? `<path d="M28 96 Q22 40 70 14 Q118 40 112 96" fill="none" stroke="${GOLD}" stroke-width="3"/>` : ""}
      <circle cx="70" cy="62" r="36" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
      <path d="M36 50 Q70 30 104 50" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      <rect x="40" y="56" width="26" height="14" rx="6" fill="${lenses}"/>
      <rect x="74" y="56" width="26" height="14" rx="6" fill="${lenses}"/>
      <line x1="66" y1="61" x2="74" y2="61" stroke="${INK}" stroke-width="3"/>
      <line x1="45" y1="59" x2="52" y2="59" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
      ${mouth}
      ${hat}
      <g transform="translate(28 110)">
        <rect x="0" y="0" width="44" height="28" rx="4" fill="#e9eef3" stroke="${INK}" stroke-width="3"/>
        ${badge}
      </g>`;
    },

    // 辦公室職員: hair style/colour, vest, spreadsheet board, tiara.
    office: (expr, v) => {
      const hairTop =
        v.hairStyle === "bob"
          ? `<path d="M26 74 Q20 16 70 16 Q120 16 114 74 Q110 40 88 36 Q70 30 52 36 Q30 40 26 74Z" fill="${v.hair}"/>`
          : `<path d="M28 58 Q26 18 70 18 Q114 18 112 58 Q106 36 86 34 Q70 28 54 34 Q34 36 28 58Z" fill="${v.hair}"/>`;
      return `
      ${shadow(70)}
      <rect x="46" y="98" width="48" height="46" rx="16" fill="#ffffff" stroke="${INK}" stroke-width="3"/>
      <path d="M50 102 L58 98 L70 120 L82 98 L90 102 L90 140 L50 140Z" fill="${v.vest}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      ${legs(NAVY)}
      ${v.hairStyle === "bob" ? "" : `<circle cx="70" cy="12" r="12" fill="${v.hair}" stroke="${INK}" stroke-width="3"/>`}
      ${humanHead(58)}
      ${hairTop}
      ${v.tiara ? crown(70, 14) : ""}
      ${face(expr, { ...std, sx: 108, sy: 36, gy: 26 })}
      ${v.glasses ? glasses(54, 86, 62) : ""}
      <g transform="translate(92 98)">
        <rect x="0" y="0" width="38" height="46" rx="4" fill="${v.board}" stroke="${INK}" stroke-width="3"/>
        <rect x="11" y="-4" width="16" height="8" rx="2" fill="#a9adbb" stroke="${INK}" stroke-width="2"/>
        <rect x="5" y="8" width="28" height="32" fill="#ffffff" stroke="${INK}" stroke-width="2"/>
        <path d="M5 16 H33 M5 24 H33 M5 32 H33 M14 8 V40 M24 8 V40" stroke="${v.grid}" stroke-width="2"/>
      </g>`;
    },

    // 寬頻職員: helmet, vest, cable colour, helmet badge.
    net: (expr, v) => {
      const badge = {
        antenna: `<line x1="92" y1="20" x2="104" y2="2" stroke="${INK}" stroke-width="3"/><circle cx="104" cy="2" r="4" fill="#ee8b7a" stroke="${INK}" stroke-width="2"/>`,
        fiveG: `<text x="70" y="36" font-size="15" font-weight="900" text-anchor="middle" fill="${INK}" font-family="sans-serif">5G</text>`,
        mic: `<path d="M28 60 Q22 84 46 86" fill="none" stroke="${INK}" stroke-width="3"/><circle cx="48" cy="86" r="4" fill="${INK}"/>`,
      }[v.badge] || "";
      return `
      ${shadow(70)}
      <rect x="46" y="98" width="48" height="46" rx="16" fill="${v.shirt}" stroke="${INK}" stroke-width="3"/>
      <path d="M50 100 L60 100 L60 142 L50 142Z M80 100 L90 100 L90 142 L80 142Z" fill="${v.vest}" stroke="${INK}" stroke-width="2.5"/>
      ${legs(NAVY)}
      ${humanHead(60)}
      <path d="M26 46 Q28 8 70 8 Q112 8 114 46Z" fill="${v.helmet}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="20" y="42" width="100" height="10" rx="5" fill="${v.helmet}" stroke="${INK}" stroke-width="3"/>
      ${v.badge === "fiveG" ? "" : `<path d="M70 10 V42" stroke="${INK}" stroke-width="2.5"/>`}
      ${badge}
      ${face(expr, { ...std, ey: 66, my: 84, sx: 108, sy: 56, gx: 48, gy: 56 })}
      <g transform="translate(96 92)">
        <circle cx="16" cy="16" r="16" fill="none" stroke="${INK}" stroke-width="8"/>
        <circle cx="16" cy="16" r="16" fill="none" stroke="${v.cable}" stroke-width="4"/>
        <circle cx="16" cy="16" r="8" fill="none" stroke="${INK}" stroke-width="3"/>
        <path d="M28 28 Q34 46 22 54" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
        <rect x="16" y="52" width="10" height="8" rx="1.5" fill="#ffffff" stroke="${INK}" stroke-width="2"/>
      </g>`;
    },

    // IT帝 (UR, 帝王試煉; redesigned 2026-11-01 after "不夠威猛"): a Zeus-like
    // storm king of IT — wavy white hair and beard, a laurel crown of circuit
    // traces with a CPU-chip gem, a toga with a gold sash, and a raised
    // lightning bolt carrying circuit nodes.
    emperor: (expr, v) => `
      ${shadow(70)}
      <path d="M30 100 Q14 132 14 162 L126 162 Q126 132 110 100Z" fill="${v.cape}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="50" y="140" width="15" height="20" rx="5" fill="${SKIN}" stroke="${INK}" stroke-width="3"/><rect x="75" y="140" width="15" height="20" rx="5" fill="${SKIN}" stroke="${INK}" stroke-width="3"/>
      <path d="M50 154 h15 M75 154 h15" stroke="${GOLD}" stroke-width="3"/>
      <path d="M36 104 Q70 92 104 104 L100 146 Q70 152 40 146Z" fill="${SKIN}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M58 120 q4 4 0 8 M82 120 q-4 4 0 8" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity="0.5"/>
      <path d="M36 104 L104 146 L96 150 L40 112Z M40 112 Q44 140 40 146 L70 152 Q88 150 98 148Z" fill="${v.toga}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M38 108 L100 147" stroke="${GOLD}" stroke-width="4"/>
      <circle cx="56" cy="118" r="4" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>
      <path d="M28 108 Q20 124 26 134" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M28 108 Q20 124 26 134" fill="none" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/>
      <path d="M108 106 Q122 96 120 76" fill="none" stroke="${INK}" stroke-width="12" stroke-linecap="round"/><path d="M108 106 Q122 96 120 76" fill="none" stroke="${SKIN}" stroke-width="7" stroke-linecap="round"/>
      <path d="M118 70 h8" stroke="${GOLD}" stroke-width="4" stroke-linecap="round"/>
      <g class="ur-bolt">
        <path d="M126 2 L106 40 L120 40 L104 78 L134 32 L120 32 L136 2Z" fill="${v.bolt}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M122 14 h6 M114 36 h-6 M126 36 h5" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
        <circle cx="128" cy="14" r="2.3" fill="#fff" stroke="${INK}" stroke-width="1.4"/><circle cx="108" cy="36" r="2.3" fill="#fff" stroke="${INK}" stroke-width="1.4"/><circle cx="131" cy="36" r="2.3" fill="#fff" stroke="${INK}" stroke-width="1.4"/>
      </g>
      <circle cx="120" cy="80" r="7" fill="${SKIN}" stroke="${INK}" stroke-width="2.5"/>
      ${humanHead(58)}
      <path d="M26 64 Q18 46 28 34 Q26 18 44 16 Q52 4 70 10 Q88 4 96 16 Q114 18 112 34 Q122 46 114 64 Q108 50 98 44 Q84 34 70 38 Q56 34 42 44 Q32 50 26 64Z" fill="${v.hair}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M30 70 Q28 96 46 108 Q56 120 70 120 Q84 120 94 108 Q112 96 110 70 Q104 84 92 86 Q84 80 70 82 Q56 80 48 86 Q36 84 30 70Z" fill="${v.hair}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M46 96 q6 8 0 14 M70 104 q4 6 0 12 M94 96 q-6 8 0 14" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" opacity="0.35"/>
      <path d="M52 80 Q61 74 70 80 Q79 74 88 80 Q80 86 70 83 Q60 86 52 80Z" fill="${v.hair}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      ${face(expr, { lx: 54, rx: 86, ey: 62, mx: 70, my: 90, sx: 110, sy: 40, gx: 50, gy: 30, eye: v.eye })}
      <g>
        <path d="M30 40 Q70 20 110 40" fill="none" stroke="${GOLD}" stroke-width="6" stroke-linecap="round"/>
        <path d="M30 40 Q70 20 110 40" fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="3 5" stroke-linecap="round"/>
        <g fill="${v.laurel}" stroke="${INK}" stroke-width="2">
          <path d="M36 37 q-10 -8 -6 -16 q8 4 6 16Z"/><path d="M46 31 q-8 -10 -2 -16 q8 6 2 16Z"/><path d="M58 27 q-4 -12 2 -16 q6 8 -2 16Z"/>
          <path d="M104 37 q10 -8 6 -16 q-8 4 -6 16Z"/><path d="M94 31 q8 -10 2 -16 q-8 6 -2 16Z"/><path d="M82 27 q4 -12 -2 -16 q-6 8 2 16Z"/>
        </g>
        <rect x="62" y="16" width="16" height="16" rx="3" fill="#8fc7f0" stroke="${INK}" stroke-width="2.5"/>
        <rect x="66" y="20" width="8" height="8" rx="1.5" fill="${GOLD}" stroke="${INK}" stroke-width="1.5"/>
        <path d="M66 16 v-3 M74 16 v-3 M66 32 v3 M74 32 v3 M62 20 h-3 M62 28 h-3 M78 20 h3 M78 28 h3" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>
      </g>`,

    // Bug 魔王 (UR, 魔王限時; redesigned 2026-11-01 after "不夠震懾"): a Typhon-
    // like monster of bugs — horned head with glowing red eyes, bat wings veined
    // with circuits, a serpent coil instead of legs, two cable serpents with
    // USB-plug heads rising from the shoulders, and a glowing 404 chest plate.
    demon: (expr, v) => `
      <g fill="${v.wing}" stroke="${INK}" stroke-width="3" stroke-linejoin="round">
        <path d="M44 100 Q10 70 2 34 Q18 44 24 40 Q22 56 34 58 Q30 72 46 82Z"/>
        <path d="M96 100 Q130 70 138 34 Q122 44 116 40 Q118 56 106 58 Q110 72 94 82Z"/>
      </g>
      <path d="M8 40 L30 74 M22 46 L36 64 M132 40 L110 74 M118 46 L104 64" stroke="${v.glow}" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
      <circle cx="30" cy="74" r="2.5" fill="${v.glow}"/><circle cx="110" cy="74" r="2.5" fill="${v.glow}"/>
      <ellipse cx="70" cy="165" rx="40" ry="4" fill="${INK}" opacity="0.15"/>
      <path d="M50 124 Q20 136 32 150 Q52 160 84 154 Q116 146 104 132 Q96 124 84 128" fill="none" stroke="${INK}" stroke-width="20" stroke-linecap="round"/>
      <path d="M50 124 Q20 136 32 150 Q52 160 84 154 Q116 146 104 132 Q96 124 84 128" fill="none" stroke="${v.body}" stroke-width="14" stroke-linecap="round"/>
      <path d="M36 144 l4 -4 M46 151 l4 -4 M60 154 l4 -4 M76 152 l4 -4 M92 147 l4 -4" stroke="${v.belly}" stroke-width="3" stroke-linecap="round"/>
      <path d="M84 128 Q90 116 100 118" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M42 104 Q70 94 98 104 L94 140 Q70 148 46 140Z" fill="${v.body}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M54 112 h32 l-4 20 h-24Z" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <text x="70" y="127" text-anchor="middle" font-family="ui-monospace, Menlo, monospace" font-size="12" font-weight="900" fill="${v.eyeGlow}">404</text>
      ${[["M44 104 Q26 84 30 58", 22, 52, -1], ["M96 104 Q114 84 110 58", 118, 52, 1]].map(([d, hx, hy, dir]) => `
        <path d="${d}" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${v.cable}" stroke-width="5" stroke-linecap="round"/>
        <g transform="translate(${hx} ${hy}) rotate(${dir * 18})">
          <rect x="-9" y="-14" width="18" height="16" rx="4" fill="${v.cable}" stroke="${INK}" stroke-width="2.5"/>
          <rect x="-6" y="-22" width="12" height="9" rx="1.5" fill="#c9ced8" stroke="${INK}" stroke-width="2"/>
          <rect x="-3" y="-20" width="2.5" height="3" fill="${INK}"/><rect x="0.5" y="-20" width="2.5" height="3" fill="${INK}"/>
          <circle cx="-4" cy="-6" r="2.2" fill="${v.eyeGlow}"/><circle cx="4" cy="-6" r="2.2" fill="${v.eyeGlow}"/>
          <path d="M-5 2 l2 4 l2 -4 M1 2 l2 4 l2 -4" fill="#fff" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
        </g>`).join("")}
      <path d="M40 34 Q22 20 28 5 Q34 18 50 23Z" fill="${v.horn}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M100 34 Q118 20 112 5 Q106 18 90 23Z" fill="${v.horn}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="70" cy="60" r="40" fill="${v.body}" stroke="${INK}" stroke-width="3"/>
      <path d="M40 46 Q70 30 100 46 Q92 40 70 40 Q48 40 40 46Z" fill="${INK}" opacity="0.35"/>
      <ellipse cx="70" cy="76" rx="24" ry="14" fill="${v.belly}" opacity="0.45"/>
      ${face(expr, { lx: 54, rx: 86, ey: 60, mx: 70, my: 80, sx: 106, sy: 38, gx: 50, gy: 28, eye: v.eyeGlow })}
      ${expr === "idle" || expr === "happy" ? `<circle cx="54" cy="60" r="7" fill="${v.eyeGlow}" opacity="0.3"/><circle cx="86" cy="60" r="7" fill="${v.eyeGlow}" opacity="0.3"/><path d="M60 84 l3 7 l3 -7 M74 84 l3 7 l3 -7" fill="#fff" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` : ""}
      <g fill="${v.glow}" opacity="0.85"><rect x="8" y="96" width="5" height="5"/><rect x="14" y="104" width="3" height="3"/><rect x="124" y="92" width="5" height="5"/><rect x="120" y="100" width="3" height="3"/><rect x="6" y="122" width="4" height="4"/><rect x="128" y="118" width="4" height="4"/></g>`,

    // 人工智能機械人: body/head colours, eye colour, extras.
    robot: (expr, v) => {
      const c = v.eye;
      const eyes = {
        happy: `<path d="M49 54 q7 -8 14 0" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M77 54 q7 -8 14 0" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M60 64 q10 8 20 0" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
        speechless: `<rect x="50" y="50" width="12" height="3" rx="1.5" fill="${c}"/><rect x="78" y="50" width="12" height="3" rx="1.5" fill="${c}"/><path d="M64 67 h12" stroke="${c}" stroke-width="3" stroke-linecap="round"/><path d="M112 22 q7 11 0 15 q-7 -4 0 -15Z" fill="#8fc3e8" stroke="${INK}" stroke-width="2"/>`,
        surprised: `<circle cx="56" cy="52" r="9" fill="none" stroke="${c}" stroke-width="3"/><circle cx="84" cy="52" r="9" fill="none" stroke="${c}" stroke-width="3"/><circle cx="70" cy="67" r="3.5" fill="${c}"/>`,
      }[expr] || `<ellipse cx="56" cy="52" rx="7" ry="9" fill="${c}"/><ellipse cx="84" cy="52" rx="7" ry="9" fill="${c}"/><circle cx="58" cy="49" r="2.5" fill="#ffffff"/><circle cx="86" cy="49" r="2.5" fill="#ffffff"/><path d="M62 66 Q70 70 78 66" stroke="${c}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      const extra = {
        bubble: `<path d="M112 92 h22 a6 6 0 0 1 6 6 v12 a6 6 0 0 1 -6 6 h-12 l-8 6 v-6 a6 6 0 0 1 -6 -6 v-12 a6 6 0 0 1 4 -6Z" fill="#ffffff" stroke="${INK}" stroke-width="2.5"/><circle cx="116" cy="104" r="2" fill="${INK}"/><circle cx="123" cy="104" r="2" fill="${INK}"/><circle cx="130" cy="104" r="2" fill="${INK}"/>`,
        rings: `<ellipse cx="70" cy="122" rx="44" ry="8" fill="none" stroke="#8fc3e8" stroke-width="3"/><ellipse cx="70" cy="122" rx="44" ry="8" fill="none" stroke="${GOLD}" stroke-width="2" transform="rotate(20 70 122)"/>`,
      }[v.extra] || "";
      return `
      ${shadow(70)}
      <line x1="70" y1="14" x2="70" y2="2" stroke="${INK}" stroke-width="3"/>
      <circle cx="70" cy="4" r="6" fill="${v.antenna}" stroke="${INK}" stroke-width="2.5"/>
      <rect x="40" y="100" width="60" height="44" rx="14" fill="${v.body}" stroke="${INK}" stroke-width="3"/>
      <rect x="56" y="110" width="28" height="18" rx="4" fill="#ffffff" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="64" cy="119" r="3" fill="#9fd4b4"/><circle cx="76" cy="119" r="3" fill="#ee8b7a"/>
      <rect x="30" y="106" width="10" height="26" rx="5" fill="${v.head}" stroke="${INK}" stroke-width="3"/>
      <rect x="100" y="106" width="10" height="26" rx="5" fill="${v.head}" stroke="${INK}" stroke-width="3"/>
      <rect x="50" y="140" width="15" height="20" rx="5" fill="${v.head}" stroke="${INK}" stroke-width="3"/>
      <rect x="75" y="140" width="15" height="20" rx="5" fill="${v.head}" stroke="${INK}" stroke-width="3"/>
      ${extra}
      <rect x="26" y="14" width="88" height="82" rx="30" fill="${v.head}" stroke="${INK}" stroke-width="3"/>
      <rect x="36" y="32" width="68" height="42" rx="18" fill="${v.screen}" stroke="${INK}" stroke-width="3"/>
      ${eyes}
      <ellipse cx="34" cy="80" rx="5" ry="3" fill="#f2b4b0" opacity="0.8"/><ellipse cx="106" cy="80" rx="5" ry="3" fill="#f2b4b0" opacity="0.8"/>`;
    },
  };

  // ---------- SSR look (user request 2026-10-31: SSR 要有威猛的形象) ----------
  // An energy burst behind, an optional cape, and determined eyebrows.
  // Brow positions per family: [left eye x, right eye x, brow y].
  const BROWS = { dog: [50, 82, 47], db: [54, 86, 50], suit: [54, 86, 50], office: [54, 86, 50], net: [54, 86, 54], hacker: [53, 87, 50], robot: [56, 84, 40], emperor: [54, 86, 52], demon: [54, 86, 50] };

  function burst(color) {
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24;
      const r = i % 2 ? 50 : 70;
      pts.push(`${(70 + r * Math.cos(a)).toFixed(1)},${(88 + r * Math.sin(a)).toFixed(1)}`);
    }
    return `<g class="ssr-aura"><polygon points="${pts.join(" ")}" fill="${color}" opacity="0.38"/><circle cx="70" cy="88" r="46" fill="${color}" opacity="0.25"/></g>`;
  }

  // UR: a rainbow burst (one colour per ray) behind the character.
  function rainbowBurst() {
    const colors = ["#f4a3b8", "#f6b38a", "#f4d36b", "#a7d8a0", "#8fc7f0", "#c4b0e0"];
    let rays = "";
    for (let i = 0; i < 12; i++) {
      const a1 = (Math.PI * 2 * i) / 12;
      const a2 = (Math.PI * 2 * (i + 0.5)) / 12;
      const p = (a, r) => `${(70 + r * Math.cos(a)).toFixed(1)},${(88 + r * Math.sin(a)).toFixed(1)}`;
      rays += `<polygon points="70,88 ${p(a1, 74)} ${p(a2, 74)}" fill="${colors[i % colors.length]}" opacity="0.45"/>`;
    }
    return `<g class="ssr-aura ur-aura">${rays}<circle cx="70" cy="88" r="44" fill="#fff6d8" opacity="0.5"/></g>`;
  }

  // UR auras (2026-11-01): a storm (dark clouds, lightning, binary digits)
  // behind IT帝 and an inferno (red-orange spikes, embers) behind Bug 魔王.
  function stormAura() {
    const bolt = (x, y, s) => `<path d="M${x} ${y} l${-6 * s} ${14 * s} h${5 * s} l${-6 * s} ${14 * s} l${12 * s} ${-18 * s} h${-5 * s} l${5 * s} ${-10 * s}Z" fill="#f4d36b" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>`;
    return `<g class="ssr-aura ur-aura">
      <circle cx="70" cy="84" r="66" fill="#8fc7f0" opacity="0.28"/>
      <g fill="#5b6488" opacity="0.75"><ellipse cx="34" cy="30" rx="30" ry="16"/><ellipse cx="60" cy="18" rx="28" ry="15"/><ellipse cx="96" cy="22" rx="30" ry="16"/><ellipse cx="18" cy="56" rx="18" ry="12"/></g>
      ${bolt(14, 70, 1)}${bolt(28, 120, 0.8)}${bolt(132, 112, 0.9)}
      <g font-family="ui-monospace, Menlo, monospace" font-size="8" font-weight="900" fill="#c9e2f4"><text x="30" y="34">1010</text><text x="78" y="26">0110</text></g>
    </g>`;
  }

  function infernoAura() {
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const a = (Math.PI * 2 * i) / 28;
      const r = i % 2 ? 46 : 72;
      pts.push(`${(70 + r * Math.cos(a)).toFixed(1)},${(84 + r * Math.sin(a)).toFixed(1)}`);
    }
    return `<g class="ssr-aura ur-aura"><polygon points="${pts.join(" ")}" fill="#d2553f" opacity="0.4"/><circle cx="70" cy="84" r="48" fill="#f2a541" opacity="0.3"/>
      <g fill="#f4d36b"><circle cx="20" cy="140" r="2.5"/><circle cx="124" cy="146" r="2"/><circle cx="12" cy="88" r="2"/><circle cx="130" cy="80" r="2.5"/></g></g>`;
  }

  function heroic(family, expr, v) {
    if (!v.heroic) return { back: "", front: "" };
    const h = v.heroic;
    const cape = h.cape
      ? `<path d="M44 100 Q28 130 22 162 L118 162 Q112 130 96 100 Q70 112 44 100Z" fill="${h.cape}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M44 100 L36 92 L56 98 M96 100 L104 92 L84 98" fill="${h.cape}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`
      : "";
    const [lx, rx, y] = BROWS[family];
    const browColor = family === "robot" ? v.eye : INK;
    const brows = expr === "idle" || expr === "happy"
      ? `<g stroke="${browColor}" stroke-width="4" stroke-linecap="round"><line x1="${lx - 10}" y1="${y - 4}" x2="${lx + 6}" y2="${y + 2}"/><line x1="${rx + 10}" y1="${y - 4}" x2="${rx - 6}" y2="${y + 2}"/></g>`
      : "";
    const aura = h.aura === "rainbow" ? rainbowBurst() : h.aura === "storm" ? stormAura() : h.aura === "inferno" ? infernoAura() : burst(h.aura);
    return { back: aura + cape, front: brows };
  }

  // ---------- variants (品種) ----------
  // The first entry of each family is the original approved design.
  const VARIANTS = {
    // IT狗
    "CH-ITDOG": ["dog", { fur: "#f2d3a8", ear: "#b98a5a", hoodie: "#f4d36b", phones: "#8fc3e8", tail: "#9fd4b4" }],
    "CH-ITDOG-CORGI": ["dog", { fur: "#e8a86a", ear: "#c47a3e", ears: "point", hoodie: "#9fd4b4", phones: "#f2b4b0", tail: "#9fd4b4" }],
    "CH-ITDOG-HUSKY": ["dog", { fur: "#a9adbb", ear: "#7d8394", ears: "point", mask: true, eye: "#4a8cc4", hoodie: "#8fc3e8", phones: "#ffffff", tail: "#9fd4b4" }],
    "CH-ITDOG-GOLDEN": ["dog", { fur: "#e8c27a", ear: "#c99a45", glasses: true, hoodie: "#ee8b7a", phones: "#f4d36b", tail: "#9fd4b4" }],
    // SSR 機械老虎狗: a mecha bulldog (redesigned 2026-10-31; was a silver robot dog).
    "CH-ITDOG-MECHA": ["dog", { fur: "#e3b27a", ear: "#a8743f", ears: "rose", bulldog: true, jowl: "#fbf0e2", mecha: true, eye: "#d2553f", phones: "#c9ced8", tail: "#e3b27a", heroic: { aura: "#f2a541" } }],
    // 數據庫師
    "CH-DB-JR": ["db", { coat: "#ffffff", hair: INK, beret: "#9fd4b4", db: "#c9e2f4", dbTop: "#e6eff8" }],
    "CH-DB": ["db", { coat: "#ffffff", hair: INK, beret: "#8fc3e8", db: "#8fc3e8", dbTop: "#c9e2f4" }],
    "CH-DB-INDEX": ["db", { coat: "#e6eff8", hair: "#6b4a3a", beret: "#ee8b7a", db: "#8fc3e8", dbTop: "#c9e2f4", glasses: true }],
    "CH-DB-CHIEF": ["db", { coat: "#c4b0e0", hair: INK, beret: GOLD, db: GOLD, dbTop: "#fff1c9", star: true, heroic: { aura: GOLD, cape: "#6e589a" } }],
    // 黃金職員
    "CH-GOLD-BRONZE": ["suit", { suit: "#c98e5a", tie: "#8fc3e8" }],
    "CH-GOLD-SILVER": ["suit", { suit: "#c9ced8", tie: "#ee8b7a" }],
    "CH-GOLD": ["suit", { suit: "#e8c27a", tie: "#ee8b7a" }],
    "CH-GOLD-DIAMOND": ["suit", { suit: "#a8e0f0", tie: "#c4b0e0", sparkle: true, heroic: { aura: "#8fc3e8", cape: "#4672b3" } }],
    // 黑客
    "CH-HACK-ROOKIE": ["hacker", { hood: "#e2e5ea", lens: "#3d4a66", badge: "lock" }],
    "CH-HACK": ["hacker", { hood: "#a9adbb", lens: INK, badge: "lock" }],
    "CH-HACK-FIREWALL": ["hacker", { hood: "#ee8b7a", lens: INK, badge: "shield" }],
    "CH-HACK-LEGEND": ["hacker", { hood: "#ffffff", lens: INK, badge: "shield", hat: true, trim: true, heroic: { aura: "#8fc3e8", cape: GOLD } }],
    // 辦公室職員
    "CH-OFFICE-INTERN": ["office", { hair: INK, hairStyle: "bob", vest: GOLD, board: "#e8c27a", grid: "#9fd4b4" }],
    "CH-OFFICE": ["office", { hair: "#6b4a3a", vest: "#9fd4b4", board: "#e8c27a", grid: "#9fd4b4" }],
    "CH-OFFICE-LEAD": ["office", { hair: "#6b4a3a", vest: "#8fc3e8", board: "#e8c27a", grid: "#8fc3e8", glasses: true }],
    "CH-OFFICE-PIVOT": ["office", { hair: INK, vest: "#c4b0e0", board: "#c9ced8", grid: "#c4b0e0" }],
    "CH-OFFICE-QUEEN": ["office", { hair: "#6b4a3a", vest: "#ee8b7a", board: GOLD, grid: "#ee8b7a", tiara: true, heroic: { aura: GOLD, cape: "#d2553f" } }],
    // 寬頻職員
    "CH-BROADBAND": ["net", { helmet: GOLD, vest: "#f2b4b0", shirt: "#8fc3e8", cable: "#8fc3e8" }],
    "CH-BROADBAND-FIBRE": ["net", { helmet: "#ffffff", vest: "#9fd4b4", shirt: "#e6eff8", cable: "#9fe8e0" }],
    "CH-BROADBAND-ROUTER": ["net", { helmet: "#8fc3e8", vest: GOLD, shirt: "#ffffff", cable: "#ee8b7a", badge: "antenna" }],
    "CH-BROADBAND-5G": ["net", { helmet: "#c4b0e0", vest: "#f2b4b0", shirt: "#e6eff8", cable: "#c4b0e0", badge: "fiveG" }],
    "CH-BROADBAND-CHIEF": ["net", { helmet: GOLD, vest: "#ee8b7a", shirt: NAVY, cable: GOLD, badge: "mic", heroic: { aura: "#f4d36b", cape: NAVY } }],
    // 帝王系列 (UR, only from 帝王試煉 shards)
    "CH-ITEMPEROR": ["emperor", { toga: "#fbf7ee", cape: "#2f4a8a", hair: "#f4f4f6", laurel: "#e8b84a", bolt: "#f4d36b", eye: "#2f6fb8", heroic: { aura: "storm" } }],
    // 魔王系列 (UR, only from 魔王限時 shards)
    "CH-BUGLORD": ["demon", { body: "#5b4688", belly: "#a993cf", wing: "#3d2f5e", horn: "#e8e0d0", cable: "#3d4a66", glow: "#9fe8e0", eyeGlow: "#ff5a4a", heroic: { aura: "inferno" } }],
    // 人工智能機械人
    "CH-AIBOT-STUDY": ["robot", { head: "#ffffff", body: "#9fd4b4", screen: NAVY, eye: "#9fd4b4", antenna: GOLD }],
    "CH-AIBOT-CHAT": ["robot", { head: "#e6eff8", body: "#8fc3e8", screen: NAVY, eye: "#8fc3e8", antenna: "#ee8b7a", extra: "bubble" }],
    "CH-AIBOT": ["robot", { head: "#e2e5ea", body: "#c4b0e0", screen: NAVY, eye: "#8fc3e8", antenna: GOLD, heroic: { aura: "#c4b0e0" } }],
    "CH-AIBOT-QUANTUM": ["robot", { head: "#3d4a66", body: "#3d4a66", screen: "#1f2638", eye: GOLD, antenna: "#8fc3e8", extra: "rings", heroic: { aura: GOLD } }],
  };

  // Accessible names; the game uses the workbook name when it has one.
  const NAMES = {
    "CH-ITDOG": "IT狗", "CH-ITDOG-CORGI": "柯基 IT狗", "CH-ITDOG-HUSKY": "哈士奇 IT狗", "CH-ITDOG-GOLDEN": "黃金獵犬 IT狗", "CH-ITDOG-MECHA": "機械老虎狗",
    "CH-DB-JR": "見習數據庫師", "CH-DB": "數據庫師", "CH-DB-INDEX": "索引大師", "CH-DB-CHIEF": "首席數據庫師",
    "CH-GOLD-BRONZE": "青銅職員", "CH-GOLD-SILVER": "白銀職員", "CH-GOLD": "黃金職員", "CH-GOLD-DIAMOND": "鑽石職員",
    "CH-HACK-ROOKIE": "見習白帽", "CH-HACK": "黑客", "CH-HACK-FIREWALL": "防火牆騎士", "CH-HACK-LEGEND": "白帽傳說",
    "CH-OFFICE-INTERN": "實習生", "CH-OFFICE": "辦公室職員", "CH-OFFICE-LEAD": "試算表主任", "CH-OFFICE-PIVOT": "樞紐分析師", "CH-OFFICE-QUEEN": "公式女王",
    "CH-BROADBAND": "寬頻職員", "CH-BROADBAND-FIBRE": "光纖技師", "CH-BROADBAND-ROUTER": "路由器隊長", "CH-BROADBAND-5G": "5G 工程師", "CH-BROADBAND-CHIEF": "網絡總指揮",
    "CH-ITEMPEROR": "IT帝", "CH-BUGLORD": "Bug 魔王",
    "CH-AIBOT-STUDY": "學習機械人", "CH-AIBOT-CHAT": "對話機械人", "CH-AIBOT": "人工智能機械人", "CH-AIBOT-QUANTUM": "量子機械人",
  };

  // Falls back to the plain hero for an unknown id (e.g. a new workbook character).
  function character(id, expr) {
    const entry = VARIANTS[id];
    if (!entry) return ITE.sprites.hero(expr);
    const [family, params] = entry;
    const e = expr || "idle";
    const fx = heroic(family, e, params);
    // Label with the workbook name when there is one, so renames in Excel show up here too.
    const wb = ITE.gameData && (ITE.gameData.characters || []).find((c) => c.id === id);
    return `<svg viewBox="0 0 140 170" class="sprite" role="img" aria-label="${(wb && wb.name) || NAMES[id]}">${fx.back}${FAMILIES[family](e, params)}${fx.front}</svg>`;
  }

  ITE.sprites.character = character;
  ITE.sprites.CHARACTER_IDS = Object.keys(VARIANTS);
  ITE.sprites.CHARACTER_FAMILIES = Object.fromEntries(Object.entries(VARIANTS).map(([id, [family]]) => [id, family]));
})(globalThis);
