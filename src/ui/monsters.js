// Original monsters, one family per DSE world (user feedback 2026-10-31:
// "怪物外表單一"). Same Q-version ink style as the Art Bible. PLACEHOLDER art.
//   ITE.sprites.monster(id, expr, opts)
//     id:   "slime" | "crab" | "fish" | "snake" | "parrot" | "bug"
//     expr: "idle" | "hurt" | "smug"
//     opts: { tier: "easy" | "medium" | "hard" | "ultimate", crown: bool }
// Harder tiers get deeper colours; ultimate (and story mini-bosses) a crown,
// ultimate also a glowing aura.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});
  const INK = "#3b3330";

  // Shared cartoon face: eyes at (x1, y) and (x2, y), mouth at my.
  function face(expr, x1, x2, y, my) {
    const mx = (x1 + x2) / 2;
    if (expr === "hurt") {
      return `
      <path d="M${x1 - 6} ${y - 6} L${x1 + 6} ${y + 6} M${x1 + 6} ${y - 6} L${x1 - 6} ${y + 6}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M${x2 - 6} ${y - 6} L${x2 + 6} ${y + 6} M${x2 + 6} ${y - 6} L${x2 - 6} ${y + 6}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <ellipse cx="${mx}" cy="${my}" rx="7" ry="6" fill="${INK}"/>
      <path d="M${x2 + 20} ${y - 22} Q${x2 + 28} ${y - 10} ${x2 + 20} ${y - 5} Q${x2 + 13} ${y - 10} ${x2 + 20} ${y - 22}Z" fill="#8fc3e8" stroke="${INK}" stroke-width="2"/>`;
    }
    if (expr === "smug") {
      return `
      <path d="M${x1 - 8} ${y + 2} Q${x1} ${y - 5} ${x1 + 8} ${y + 2}" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M${x2 - 8} ${y + 2} Q${x2} ${y - 5} ${x2 + 8} ${y + 2}" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path d="M${mx - 14} ${my - 4} Q${mx} ${my + 10} ${mx + 14} ${my - 4}Z" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    }
    return `
      <path d="M${x1 - 10} ${y - 12} L${x1 + 5} ${y - 6}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M${x2 + 10} ${y - 12} L${x2 - 5} ${y - 6}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="${x1}" cy="${y + 2}" r="5" fill="${INK}"/><circle cx="${x2}" cy="${y + 2}" r="5" fill="${INK}"/>
      <path d="M${mx - 12} ${my + 4} Q${mx} ${my - 4} ${mx + 12} ${my + 4}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  }

  function crown(x, y) {
    return `<path d="M${x - 19} ${y} L${x - 15} ${y - 18} L${x - 5} ${y - 8} L${x} ${y - 22} L${x + 5} ${y - 8} L${x + 15} ${y - 18} L${x + 19} ${y}Z" fill="#f4d36b" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="${x}" cy="${y - 6}" r="3" fill="#ee8b7a" stroke="${INK}" stroke-width="1.5"/>`;
  }

  // Colours by tier: [body, shade].
  const PALETTES = {
    slime: { easy: ["#bfe8c9", "#9fd4b4"], medium: ["#9fd4b4", "#7cbf98"], hard: ["#6fb28a", "#4f9470"], ultimate: ["#4f9470", "#3a7a5a"] },
    crab: { easy: ["#f6c9b8", "#ee8b7a"], medium: ["#ee8b7a", "#d9705e"], hard: ["#d2553f", "#b2412f"], ultimate: ["#b2412f", "#8f2f21"] },
    fish: { easy: ["#cfe3f6", "#8fc3e8"], medium: ["#8fc3e8", "#6aa0d8"], hard: ["#5f8fd0", "#4672b3"], ultimate: ["#4672b3", "#335a93"] },
    snake: { easy: ["#e3d6f2", "#c4b0e0"], medium: ["#c4b0e0", "#a993cf"], hard: ["#9580bd", "#7a64a6"], ultimate: ["#6e589a", "#56437d"] },
    parrot: { easy: ["#fbe3a6", "#f4d36b"], medium: ["#f4d36b", "#e3b93f"], hard: ["#e8a33d", "#c9832a"], ultimate: ["#c9832a", "#a6661d"] },
    bug: { easy: ["#c4b0e0", "#ad97cf"], medium: ["#c4b0e0", "#ad97cf"], hard: ["#a993cf", "#9580bd"], ultimate: ["#9580bd", "#7a64a6"] },
  };

  const NAMES = { slime: "表格史萊姆", crab: "過熱 CPU 蟹", fish: "釣魚魚", snake: "無限迴圈蛇", parrot: "假新聞鸚鵡", bug: "Bug 王" };

  // Each body returns SVG parts in a 150x150 box; [x1, x2, y, mouthY] is where the face goes.
  const BODIES = {
    // A 資訊處理: a spreadsheet jelly with grid cells and a #REF! error.
    slime: ([body, shade], uid) => ({
      art: `
      <defs><clipPath id="slime-clip-${uid}"><path d="M20 130 Q16 66 75 40 Q134 66 130 130Z"/></clipPath></defs>
      <path d="M20 130 Q16 66 75 40 Q134 66 130 130Z" fill="${body}" stroke="${INK}" stroke-width="3.5"/>
      <g clip-path="url(#slime-clip-${uid})" stroke="${shade}" stroke-width="2.5"><line x1="20" y1="104" x2="130" y2="104"/><line x1="20" y1="122" x2="130" y2="122"/><line x1="50" y1="40" x2="50" y2="130"/><line x1="100" y1="40" x2="100" y2="130"/></g>
      <path d="M128 112 Q140 118 134 132" fill="${body}" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="54" cy="62" rx="8" ry="5" fill="#fff" opacity="0.7"/>
      <text x="75" y="118" font-size="12" text-anchor="middle" fill="${INK}" font-family="monospace" font-weight="900">#REF!</text>`,
      face: [58, 92, 80, 96],
      crownAt: [75, 44],
    }),
    // B 電腦系統基礎: an overheating CPU chip on pin legs, with steam and claws.
    crab: ([body, shade]) => ({
      art: `
      <g stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"><path d="M52 40 Q46 30 52 22 Q58 14 52 6"/><path d="M75 36 Q69 26 75 18 Q81 10 75 2"/><path d="M98 40 Q92 30 98 22 Q104 14 98 6"/></g>
      <g fill="#9aa7b4" stroke="${INK}" stroke-width="2.5"><rect x="44" y="118" width="8" height="18" rx="2"/><rect x="62" y="118" width="8" height="18" rx="2"/><rect x="80" y="118" width="8" height="18" rx="2"/><rect x="98" y="118" width="8" height="18" rx="2"/></g>
      <path d="M36 74 L16 60 M114 74 L134 60" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M6 48 Q14 36 24 46 L16 54 L26 62 Q12 70 6 58Z" fill="${shade}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M144 48 Q136 36 126 46 L134 54 L124 62 Q138 70 144 58Z" fill="${shade}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="34" y="48" width="82" height="74" rx="12" fill="${body}" stroke="${INK}" stroke-width="3.5"/>
      <rect x="44" y="58" width="62" height="54" rx="6" fill="none" stroke="${shade}" stroke-width="2.5"/>
      <text x="75" y="108" font-size="12" text-anchor="middle" fill="${INK}" font-family="monospace" font-weight="900">CPU 99°C</text>`,
      face: [61, 89, 76, 92],
      crownAt: [75, 50],
    }),
    // C 互聯網及其應用: an angler-style phishing fish with an "@" email lure.
    fish: ([body, shade]) => ({
      art: `
      <path d="M58 58 Q40 22 20 30" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="18" cy="30" r="12" fill="#fff" stroke="${INK}" stroke-width="3"/>
      <text x="18" y="35" font-size="15" text-anchor="middle" fill="${INK}" font-weight="900">@</text>
      <path d="M112 92 L144 66 L138 92 L144 118Z" fill="${shade}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M62 56 Q78 36 96 58" fill="${shade}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="70" cy="92" rx="52" ry="38" fill="${body}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M96 76 Q104 92 96 108" fill="none" stroke="${shade}" stroke-width="3" stroke-linecap="round"/>
      <path d="M86 84 Q92 92 86 100" fill="none" stroke="${shade}" stroke-width="3" stroke-linecap="round"/>`,
      face: [40, 66, 82, 106],
      crownAt: [70, 58],
    }),
    // D 計算思維及程式編寫: a snake stuck in an infinite loop.
    snake: ([body, shade]) => {
      const path = "M24 120 C10 96 40 84 58 104 C76 124 96 128 112 108 C126 90 108 70 92 80";
      return {
        art: `
      <path d="${path}" fill="none" stroke="${INK}" stroke-width="27" stroke-linecap="round"/>
      <path d="${path}" fill="none" stroke="${body}" stroke-width="21" stroke-linecap="round"/>
      <path d="${path}" fill="none" stroke="${shade}" stroke-width="4" stroke-dasharray="3 11" stroke-linecap="round"/>
      <circle cx="84" cy="62" r="30" fill="${body}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M58 76 Q50 84 44 80 M50 82 Q48 90 42 90" stroke="#ee8b7a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <text x="40" y="146" font-size="11" fill="${INK}" font-family="monospace" font-weight="900">while(1)</text>`,
        face: [72, 98, 58, 74],
        crownAt: [84, 34],
      };
    },
    // E 資訊科技的社會影響: a fake-news parrot in a newspaper hat.
    parrot: ([body, shade]) => ({
      art: `
      <path d="M58 132 L54 142 M66 132 L66 142 M86 132 L86 142 M94 132 L98 142" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <path d="M104 96 Q140 104 132 136 Q116 124 100 122Z" fill="${shade}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="75" cy="96" rx="42" ry="40" fill="${body}" stroke="${INK}" stroke-width="3.5"/>
      <path d="M44 98 Q36 118 60 126" fill="${shade}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M68 90 Q75 86 82 90 Q84 104 75 110 Q72 100 68 90Z" fill="#ee8b7a" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M40 66 L75 28 L110 66Z" fill="#f7f4ee" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <text x="75" y="60" font-size="12" text-anchor="middle" fill="#d2553f" font-weight="900">FAKE</text>
      <path d="M118 30 h22 a6 6 0 0 1 6 6 v12 a6 6 0 0 1 -6 6 h-12 l-6 6 v-6 h-4 a6 6 0 0 1 -6 -6 v-12 a6 6 0 0 1 6 -6Z" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
      <text x="129" y="47" font-size="12" text-anchor="middle" fill="${INK}" font-weight="900">!!</text>`,
      face: [60, 90, 80, 116],
      crownAt: [75, 30],
    }),
  };

  let uid = 0; // unique clip-path ids when several monsters share a page

  function monster(id, expr, opts) {
    const o = opts || {};
    const tier = PALETTES[id] && PALETTES[id][o.tier] ? o.tier : "easy";
    if (id === "bug" || !BODIES[id]) return o.crown || tier === "ultimate" ? ITE.sprites.raidBoss(expr) : ITE.sprites.bugKing(expr);
    const b = BODIES[id](PALETTES[id][tier], ++uid);
    const [x1, x2, y, my] = b.face;
    const aura = tier === "ultimate" ? `<circle cx="75" cy="88" r="70" fill="none" stroke="#f4d36b" stroke-width="4" stroke-dasharray="6 10" opacity="0.8" class="aura"/>` : "";
    const angry = tier === "hard" || tier === "ultimate" ? `<path d="M${x1 - 14} ${y - 22} l6 6 M${x2 + 14} ${y - 22} l-6 6" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` : "";
    const wearsCrown = o.crown || tier === "ultimate";
    return `
<svg viewBox="0 0 150 150" class="sprite monster monster-${id}" role="img" aria-label="${NAMES[id]}">
  <ellipse cx="75" cy="142" rx="46" ry="6" fill="${INK}" opacity="0.12"/>
  ${aura}
  ${b.art}
  ${face(expr || "idle", x1, x2, y, my)}
  ${angry}
  ${wearsCrown ? crown(b.crownAt[0], b.crownAt[1]) : ""}
</svg>`;
  }

  ITE.sprites.monster = monster;
  ITE.sprites.MONSTER_IDS = Object.keys(BODIES);
  ITE.sprites.MONSTER_NAMES = NAMES;
})(globalThis);
