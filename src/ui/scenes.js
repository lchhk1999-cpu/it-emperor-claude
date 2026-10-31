// Battle backgrounds and who you fight, per DSE world (user feedback
// 2026-10-31: "背景畫面都太單一"). Original SVG scenes with a few slowly
// moving parts (clouds, blinking lights, floating symbols). PLACEHOLDER art.
//   ITE.scenes.background(theme) -> SVG string
//   ITE.scenes.forWorld(worldId) -> { theme, monster, name }
(function (root) {
  const ITE = (root.ITE = root.ITE || {});
  const INK = "#3b3330";

  const cloud = (x, y, s, cls) =>
    `<g class="${cls || "drift"}" transform="translate(${x} ${y}) scale(${s})"><path d="M0 20 Q0 6 14 8 Q18 -4 32 2 Q44 -4 48 10 Q60 10 58 22Z" fill="#fff" stroke="${INK}" stroke-width="2" opacity="0.95"/></g>`;

  const SCENES = {
    // A 資訊處理: Excel kingdom — green hills, a castle of cells, spreadsheet ground.
    A: `
      <rect width="400" height="240" fill="#e6f5ec"/>
      ${cloud(30, 24, 1)}${cloud(250, 14, 0.8, "drift slow")}
      <g class="float" font-family="monospace" font-size="12" font-weight="900" fill="#4f9470"><text x="150" y="40">=SUM( )</text><text x="320" y="70">A1</text></g>
      <path d="M0 150 Q80 110 170 140 Q260 105 400 135 V240 H0Z" fill="#bfe8c9" stroke="${INK}" stroke-width="2"/>
      <g fill="#fff" stroke="${INK}" stroke-width="2"><rect x="290" y="92" width="60" height="50"/><rect x="282" y="78" width="18" height="20"/><rect x="340" y="78" width="18" height="20"/><rect x="310" y="72" width="20" height="26"/></g>
      <g stroke="#9fd4b4" stroke-width="1.5"><line x1="290" y1="108" x2="350" y2="108"/><line x1="290" y1="124" x2="350" y2="124"/><line x1="310" y1="92" x2="310" y2="142"/><line x1="330" y1="92" x2="330" y2="142"/></g>
      <rect x="0" y="170" width="400" height="70" fill="#9fd4b4"/>
      <g stroke="#7cbf98" stroke-width="2"><line x1="0" y1="190" x2="400" y2="190"/><line x1="0" y1="214" x2="400" y2="214"/><line x1="40" y1="170" x2="0" y2="240"/><line x1="140" y1="170" x2="120" y2="240"/><line x1="260" y1="170" x2="280" y2="240"/><line x1="360" y1="170" x2="400" y2="240"/></g>
      <line x1="0" y1="170" x2="400" y2="170" stroke="${INK}" stroke-width="2"/>`,
    // B 電腦系統基礎: circuit city — chip buildings with pins, a circuit-board floor.
    B: `
      <rect width="400" height="240" fill="#e3ecf4"/>
      ${cloud(60, 30, 0.8, "drift slow")}
      <g stroke="${INK}" stroke-width="2"><rect x="30" y="80" width="70" height="90" rx="6" fill="#c9d6e2"/><rect x="120" y="100" width="56" height="70" rx="6" fill="#dfe6ee"/><rect x="290" y="60" width="80" height="110" rx="6" fill="#c9d6e2"/></g>
      <g fill="#9aa7b4" stroke="${INK}" stroke-width="1.5"><rect x="24" y="96" width="6" height="8"/><rect x="24" y="116" width="6" height="8"/><rect x="24" y="136" width="6" height="8"/><rect x="100" y="96" width="6" height="8"/><rect x="100" y="116" width="6" height="8"/><rect x="284" y="80" width="6" height="8"/><rect x="284" y="104" width="6" height="8"/><rect x="370" y="80" width="6" height="8"/><rect x="370" y="104" width="6" height="8"/></g>
      <g class="blink"><circle cx="50" cy="100" r="4" fill="#9fd4b4"/><circle cx="330" cy="84" r="4" fill="#ee8b7a"/><circle cx="148" cy="118" r="4" fill="#f4d36b"/></g>
      <g font-family="monospace" font-size="11" font-weight="900" fill="${INK}"><text x="44" y="150">RAM</text><text x="312" y="150">CPU</text></g>
      <rect x="0" y="170" width="400" height="70" fill="#4f8a7a"/>
      <g stroke="#9fd4b4" stroke-width="2.5" fill="none" stroke-linecap="round"><path d="M0 196 H90 L110 216 H220"/><path d="M400 188 H300 L280 208 H240"/><path d="M150 170 V186 H190"/></g>
      <g fill="#f4d36b" stroke="${INK}" stroke-width="1.5"><circle cx="220" cy="216" r="4"/><circle cx="240" cy="208" r="4"/><circle cx="190" cy="186" r="4"/></g>
      <line x1="0" y1="170" x2="400" y2="170" stroke="${INK}" stroke-width="2"/>`,
    // C 互聯網及其應用: network sky — router towers, Wi-Fi waves, linked nodes.
    C: `
      <rect width="400" height="240" fill="#dcecf8"/>
      ${cloud(20, 18, 0.9)}${cloud(280, 36, 1, "drift slow")}
      <g stroke="${INK}" stroke-width="2" stroke-dasharray="4 6" fill="none"><path d="M60 110 L160 70 L260 100 L350 60"/></g>
      <g fill="#fff" stroke="${INK}" stroke-width="2"><circle cx="60" cy="110" r="8"/><circle cx="160" cy="70" r="8"/><circle cx="260" cy="100" r="8"/><circle cx="350" cy="60" r="8"/></g>
      <g stroke="${INK}" stroke-width="2.5"><line x1="330" y1="170" x2="330" y2="110"/><line x1="70" y1="170" x2="70" y2="128"/></g>
      <rect x="312" y="104" width="36" height="16" rx="4" fill="#8fc3e8" stroke="${INK}" stroke-width="2"/>
      <g class="pulse" fill="none" stroke="#6aa0d8" stroke-width="3" stroke-linecap="round"><path d="M318 96 Q330 86 342 96"/><path d="M312 88 Q330 72 348 88"/></g>
      <rect x="0" y="170" width="400" height="70" fill="#b7d6ee"/>
      <g stroke="#8fc3e8" stroke-width="2"><line x1="0" y1="196" x2="400" y2="196"/><line x1="0" y1="220" x2="400" y2="220"/></g>
      <line x1="0" y1="170" x2="400" y2="170" stroke="${INK}" stroke-width="2"/>`,
    // D 計算思維及程式編寫: dusk at the code tower, floating brackets and stars.
    D: `
      <rect width="400" height="240" fill="#ece4f7"/>
      <g class="twinkle" fill="#f4d36b"><circle cx="40" cy="30" r="3"/><circle cx="120" cy="18" r="2.5"/><circle cx="220" cy="40" r="3"/><circle cx="370" cy="24" r="2.5"/></g>
      <g class="float" font-family="monospace" font-weight="900" fill="#7a64a6"><text x="60" y="80" font-size="22">{ }</text><text x="200" y="66" font-size="18">&lt;/&gt;</text><text x="130" y="120" font-size="16">( )</text><text x="250" y="130" font-size="14">if</text></g>
      <path d="M300 170 V70 L320 44 L340 70 V170Z" fill="#c4b0e0" stroke="${INK}" stroke-width="2"/>
      <g fill="#f4d36b" stroke="${INK}" stroke-width="1.5"><rect x="312" y="84" width="16" height="14" rx="3"/><rect x="312" y="112" width="16" height="14" rx="3"/><rect x="312" y="140" width="16" height="14" rx="3"/></g>
      <rect x="0" y="170" width="400" height="70" fill="#a993cf"/>
      <g fill="#c4b0e0" font-family="monospace" font-size="12" font-weight="900"><text x="20" y="200">01101</text><text x="160" y="224">for i in range</text><text x="300" y="206">10010</text></g>
      <line x1="0" y1="170" x2="400" y2="170" stroke="${INK}" stroke-width="2"/>`,
    // E 資訊科技的社會影響: future city — skyline, neon windows, a hologram globe, a drone.
    E: `
      <rect width="400" height="240" fill="#fbe7dc"/>
      ${cloud(140, 20, 0.7, "drift slow")}
      <g stroke="${INK}" stroke-width="2" fill="#f6c9b8"><rect x="10" y="90" width="50" height="80"/><rect x="70" y="60" width="40" height="110"/><rect x="250" y="70" width="46" height="100"/><rect x="306" y="96" width="60" height="74"/></g>
      <g class="blink" fill="#8fc3e8"><rect x="20" y="104" width="10" height="8"/><rect x="80" y="76" width="10" height="8"/><rect x="262" y="88" width="10" height="8"/><rect x="320" y="110" width="10" height="8"/></g>
      <g fill="#f4d36b"><rect x="38" y="124" width="10" height="8"/><rect x="92" y="104" width="10" height="8"/><rect x="278" y="120" width="10" height="8"/><rect x="342" y="132" width="10" height="8"/></g>
      <g class="float"><circle cx="180" cy="70" r="24" fill="#cfe3f6" stroke="#6aa0d8" stroke-width="2.5" opacity="0.85"/><path d="M156 70 H204 M180 46 V94 M162 56 Q180 66 198 56 M162 84 Q180 74 198 84" stroke="#6aa0d8" stroke-width="2" fill="none"/></g>
      <g class="drift"><rect x="40" y="30" width="26" height="8" rx="3" fill="#fff" stroke="${INK}" stroke-width="2"/><line x1="36" y1="28" x2="70" y2="28" stroke="${INK}" stroke-width="2"/></g>
      <rect x="0" y="170" width="400" height="70" fill="#f6e3d6"/>
      <g stroke="#ee8b7a" stroke-width="2"><line x1="0" y1="196" x2="400" y2="196"/><line x1="0" y1="220" x2="400" y2="220"/></g>
      <line x1="0" y1="170" x2="400" y2="170" stroke="${INK}" stroke-width="2"/>`,
    // Mixed practice and today's mixed limited stage: the IT lab with floating 0/1.
    lab: `
      <rect width="400" height="240" fill="#e6eff8"/>
      ${cloud(40, 26, 0.9)}${cloud(260, 16, 0.8, "drift slow")}
      <g class="float" font-family="monospace" font-size="16" font-weight="900" fill="#a993cf"><text x="120" y="70">0</text><text x="180" y="50">1</text><text x="300" y="90">0</text><text x="60" y="110">1</text></g>
      <rect x="0" y="170" width="400" height="70" fill="#f6e3d6"/>
      <line x1="0" y1="170" x2="400" y2="170" stroke="${INK}" stroke-width="2"/>`,
    // 校際公會: a school castle with pennants.
    guild: `
      <rect width="400" height="240" fill="#efe6fa"/>
      ${cloud(30, 20, 0.9, "drift slow")}
      <path d="M240 170 V90 H270 V76 H290 V90 H320 V76 H340 V90 H370 V170Z" fill="#fff" stroke="${INK}" stroke-width="2"/>
      <path d="M298 128 Q305 116 312 128 V170 H298Z" fill="#c4b0e0" stroke="${INK}" stroke-width="2"/>
      <g class="wave"><path d="M280 76 V50 L300 58 L280 66" fill="#ee8b7a" stroke="${INK}" stroke-width="2"/><path d="M330 76 V54 L350 62 L330 70" fill="#f4d36b" stroke="${INK}" stroke-width="2"/></g>
      <rect x="0" y="170" width="400" height="70" fill="#c4b0e0"/>
      <line x1="0" y1="170" x2="400" y2="170" stroke="${INK}" stroke-width="2"/>`,
  };

  const WORLD_MONSTERS = { A: "slime", B: "crab", C: "fish", D: "snake", E: "parrot" };

  function background(theme) {
    const art = SCENES[theme] || SCENES.lab;
    return `<svg class="arena-bg" viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${art}</svg>`;
  }

  function forWorld(world) {
    const monster = WORLD_MONSTERS[world] || "bug";
    return { theme: SCENES[world] ? world : "lab", monster, name: ITE.sprites.MONSTER_NAMES[monster] };
  }

  // 主頁 scene behind the leader (user feedback 2026-10-31: home too plain): the
  // IT school courtyard, with the sky following the time of day in Hong Kong.
  const SKIES = {
    morning: { top: "#cfe8fb", bottom: "#fdf3e1", light: "sun", lightColor: "#f4d36b", hill: "#bfe8c9" },
    day: { top: "#9fd0f2", bottom: "#e6f4fc", light: "sun", lightColor: "#f4d36b", hill: "#9fd4b4" },
    evening: { top: "#f6b49a", bottom: "#fde3c4", light: "sun", lightColor: "#ee8b7a", hill: "#c9b48f" },
    night: { top: "#2f3a63", bottom: "#5b5f8f", light: "moon", lightColor: "#fdf3c4", hill: "#4b5e7a" },
  };

  function timeOfDay(now) {
    const hour = new Date(now + 8 * 3600 * 1000).getUTCHours(); // HKT
    if (hour >= 6 && hour < 11) return "morning";
    if (hour >= 11 && hour < 17) return "day";
    if (hour >= 17 && hour < 19) return "evening";
    return "night";
  }

  function homeScene(now) {
    const key = timeOfDay(now);
    const sky = SKIES[key];
    const night = key === "night";
    // Layout: the speech bubble covers the top left and the side buttons the right,
    // so the sun / moon and the school sit on the left, beside the leader.
    const light = sky.light === "sun"
      ? `<g class="float"><circle cx="52" cy="108" r="15" fill="${sky.lightColor}" stroke="${INK}" stroke-width="2"/><g stroke="${sky.lightColor}" stroke-width="3" stroke-linecap="round"><line x1="52" y1="84" x2="52" y2="78"/><line x1="28" y1="108" x2="22" y2="108"/><line x1="76" y1="108" x2="82" y2="108"/><line x1="35" y1="91" x2="31" y2="87"/><line x1="69" y1="91" x2="73" y2="87"/></g></g>`
      : `<g class="float"><path d="M58 92 A16 16 0 1 0 68 122 A13 13 0 1 1 58 92Z" fill="${sky.lightColor}" stroke="${INK}" stroke-width="2"/></g>`;
    const stars = night
      ? `<g class="twinkle" fill="#fdf3c4"><circle cx="120" cy="30" r="2"/><circle cx="200" cy="18" r="2.5"/><circle cx="260" cy="44" r="2"/><circle cx="330" cy="22" r="2.5"/><circle cx="160" cy="60" r="1.6"/></g>`
      : `${cloud(150, 26, 0.8)}${cloud(270, 46, 0.65, "drift slow")}`;
    const win = night ? "#f4d36b" : "#cfe3f6";
    return `<svg class="home-scene-bg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="home-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky.top}"/><stop offset="1" stop-color="${sky.bottom}"/></linearGradient></defs>
      <rect width="400" height="300" fill="url(#home-sky)"/>
      ${stars}${light}
      <g class="float" font-family="monospace" font-weight="900" fill="${night ? "#c4b0e0" : "#a993cf"}" opacity="0.8"><text x="104" y="150" font-size="14">{ }</text><text x="290" y="236" font-size="14">&lt;/&gt;</text></g>
      <path d="M0 210 Q100 170 200 196 Q300 168 400 200 V300 H0Z" fill="${sky.hill}" stroke="${INK}" stroke-width="2"/>
      <g stroke="${INK}" stroke-width="2">
        <rect x="8" y="150" width="86" height="62" fill="#fff7ea"/>
        <path d="M2 152 L51 128 L100 152Z" fill="#ee8b7a" stroke-linejoin="round"/>
        <line x1="51" y1="128" x2="51" y2="140"/>
      </g>
      <g fill="${win}" stroke="${INK}" stroke-width="1.5"><rect x="16" y="164" width="16" height="14" rx="2"/><rect x="70" y="164" width="16" height="14" rx="2"/><rect x="16" y="188" width="16" height="14" rx="2"/><rect x="70" y="188" width="16" height="14" rx="2"/></g>
      <rect x="42" y="180" width="18" height="32" fill="#c4b0e0" stroke="${INK}" stroke-width="1.5"/>
      <text x="51" y="174" font-family="monospace" font-size="8" font-weight="900" text-anchor="middle" fill="${INK}">IT 學院</text>
      <g stroke="${INK}" stroke-width="2"><rect x="316" y="186" width="7" height="26" fill="#c9a27a"/><circle cx="319" cy="180" r="16" fill="${night ? "#5f8a72" : "#bfe8c9"}"/></g>
      <path d="M0 252 H400 V300 H0Z" fill="${night ? "#6b6f98" : "#f6e3d6"}"/>
      <line x1="0" y1="252" x2="400" y2="252" stroke="${INK}" stroke-width="2"/>
    </svg>`;
  }

  ITE.scenes = { THEMES: Object.keys(SCENES), WORLD_MONSTERS, background, forWorld, timeOfDay, homeScene };
})(globalThis);
