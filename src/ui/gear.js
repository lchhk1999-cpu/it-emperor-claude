// 裝備造型 (user request 2026-11-01): one original icon per item, in the same
// thick-ink pastel style as the characters, and a "dressed" view that shows a
// character with the items it wears (badges around the sprite). Items of a
// higher tier (培養) get a gold rim.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});
  const INK = "#3b3330";

  const ICONS = {
    // AI 模型: a smiling chip with an "AI" face and circuit legs.
    "EQ-AI": `<rect x="20" y="20" width="40" height="40" rx="9" fill="#c4b0e0" stroke="${INK}" stroke-width="4"/>
      <path d="M28 20v-8M40 20v-8M52 20v-8M28 60v8M40 60v8M52 60v8M20 30h-8M20 50h-8M60 30h8M60 50h8" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <text x="40" y="47" text-anchor="middle" font-family="system-ui, sans-serif" font-size="17" font-weight="900" fill="${INK}">AI</text>`,
    // 眼藥水: a blue dropper bottle with a falling drop.
    "EQ-EYEDROP": `<path d="M30 30h20v32a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" fill="#8fc7f0" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="33" y="14" width="14" height="16" rx="4" fill="#f4a3b8" stroke="${INK}" stroke-width="4"/>
      <rect x="35" y="42" width="10" height="14" rx="3" fill="#fff" stroke="${INK}" stroke-width="2.5"/>
      <path d="M62 30c-4 6-6 9-6 12a6 6 0 0 0 12 0c0-3-2-6-6-12z" fill="#8fc7f0" stroke="${INK}" stroke-width="3"/>`,
    // 電腦: an open laptop with a code bracket on screen.
    "EQ-COMPUTER": `<rect x="18" y="18" width="44" height="32" rx="5" fill="#a7d8a0" stroke="${INK}" stroke-width="4"/>
      <path d="M33 28l-6 6 6 6M47 28l6 6-6 6" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M10 56h60l-6 8H16z" fill="#f4d36b" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
    // 防毒軟件: a shield with a tick.
    "EQ-ANTIVIRUS": `<path d="M40 10l24 9v18c0 16-10 26-24 33C26 63 16 53 16 37V19z" fill="#f6b38a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M29 39l8 8 15-17" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
    // 眼鏡: round glasses.
    "EQ-GLASSES": `<circle cx="25" cy="44" r="13" fill="#e8f4fb" stroke="${INK}" stroke-width="4"/>
      <circle cx="55" cy="44" r="13" fill="#e8f4fb" stroke="${INK}" stroke-width="4"/>
      <path d="M38 42q2-4 4 0M12 40l-4-8M68 40l4-8" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
      <path d="M19 38l6-4M49 38l6-4" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
    // ---- 2026-11-01: R and SSR versions of each type ----
    // 搜尋小幫手 (R hint): a magnifying glass with a spark.
    "EQ-SEARCH": `<circle cx="34" cy="34" r="18" fill="#e8f4fb" stroke="${INK}" stroke-width="4"/>
      <path d="M47 47 L64 64" stroke="${INK}" stroke-width="8" stroke-linecap="round"/><path d="M47 47 L64 64" stroke="#c98e5a" stroke-width="4" stroke-linecap="round"/>
      <path d="M28 26 q4 -4 10 -2" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
      <path d="M62 14 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z" fill="#f4d36b" stroke="${INK}" stroke-width="1.5"/>`,
    // 量子 AI 核心 (SSR hint): a glowing core with orbiting rings.
    "EQ-QAI": `<circle cx="40" cy="40" r="14" fill="#c4b0e0" stroke="${INK}" stroke-width="4"/>
      <ellipse cx="40" cy="40" rx="30" ry="11" fill="none" stroke="#8fc7f0" stroke-width="3.5"/>
      <ellipse cx="40" cy="40" rx="30" ry="11" fill="none" stroke="#f4d36b" stroke-width="3.5" transform="rotate(60 40 40)"/>
      <ellipse cx="40" cy="40" rx="30" ry="11" fill="none" stroke="#f4a3b8" stroke-width="3.5" transform="rotate(-60 40 40)"/>
      <text x="40" y="45" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="${INK}">AI</text>`,
    // 能量飲品 (R heal): a drink can with a lightning label.
    "EQ-DRINK": `<rect x="26" y="16" width="28" height="50" rx="6" fill="#a7d8a0" stroke="${INK}" stroke-width="4"/>
      <path d="M26 24 h28 M26 58 h28" stroke="${INK}" stroke-width="3"/>
      <path d="M42 30 l-8 12 h7 l-5 11 l11 -14 h-7 l5 -9z" fill="#f4d36b" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
      <path d="M44 16 v-6 h8" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    // 急救工具箱 (SSR heal): a first-aid case with a cross.
    "EQ-MEDKIT": `<rect x="12" y="26" width="56" height="40" rx="8" fill="#fff" stroke="${INK}" stroke-width="4"/>
      <path d="M30 26 v-8 h20 v8" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M34 36 h12 v8 h8 v10 h-8 v8 h-12 v-8 h-8 v-10 h8z" fill="#f08a9c" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" transform="translate(0 -3) scale(1 0.9)"/>`,
    // 機械鍵盤 (R damage): a keyboard with keys.
    "EQ-KEYBOARD": `<rect x="8" y="26" width="64" height="32" rx="6" fill="#d8dde6" stroke="${INK}" stroke-width="4"/>
      <g fill="#fff" stroke="${INK}" stroke-width="2"><rect x="15" y="32" width="9" height="8" rx="2"/><rect x="27" y="32" width="9" height="8" rx="2"/><rect x="39" y="32" width="9" height="8" rx="2"/><rect x="51" y="32" width="12" height="8" rx="2"/><rect x="15" y="44" width="12" height="8" rx="2"/><rect x="30" y="44" width="22" height="8" rx="2"/><rect x="55" y="44" width="9" height="8" rx="2"/></g>
      <rect x="39" y="32" width="9" height="8" rx="2" fill="#f4a3b8" stroke="${INK}" stroke-width="2"/>`,
    // 伺服器機櫃 (SSR damage): a server rack with lights.
    "EQ-SERVER": `<rect x="20" y="8" width="40" height="64" rx="6" fill="#3d4a66" stroke="${INK}" stroke-width="4"/>
      <g fill="#5b6488" stroke="${INK}" stroke-width="2"><rect x="25" y="14" width="30" height="12" rx="2"/><rect x="25" y="30" width="30" height="12" rx="2"/><rect x="25" y="46" width="30" height="12" rx="2"/></g>
      <g><circle cx="30" cy="20" r="2.5" fill="#9fe8e0"/><circle cx="36" cy="20" r="2.5" fill="#f4d36b"/><circle cx="30" cy="36" r="2.5" fill="#9fe8e0"/><circle cx="30" cy="52" r="2.5" fill="#f08a9c"/><circle cx="36" cy="52" r="2.5" fill="#9fe8e0"/></g>
      <path d="M44 20 h8 M44 36 h8 M44 52 h8" stroke="#c9ced8" stroke-width="2.5" stroke-linecap="round"/>`,
    // 螢幕保護貼 (R defence): a phone with a shine sheet.
    "EQ-GUARD": `<rect x="24" y="10" width="32" height="60" rx="7" fill="#3d4a66" stroke="${INK}" stroke-width="4"/>
      <rect x="29" y="17" width="22" height="44" rx="3" fill="#c9e2f4"/>
      <path d="M31 40 L47 20 M33 54 L49 34" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`,
    // 防火牆 (SSR defence): a brick wall with a flame.
    "EQ-FIREWALL": `<rect x="10" y="34" width="60" height="34" rx="3" fill="#d2553f" stroke="${INK}" stroke-width="4"/>
      <path d="M10 45 h60 M10 56 h60 M26 34 v11 M46 34 v11 M18 45 v11 M38 45 v11 M58 45 v11 M26 56 v12 M46 56 v12" stroke="${INK}" stroke-width="2.5"/>
      <path d="M40 8 C30 20 50 22 40 32 C56 28 54 14 46 10 C48 16 44 18 40 8Z" fill="#f2a541" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`,
    // 計時器 (R time): a stopwatch.
    "EQ-TIMER": `<circle cx="40" cy="44" r="24" fill="#fff6d8" stroke="${INK}" stroke-width="4"/>
      <rect x="35" y="10" width="10" height="8" rx="2" fill="${INK}"/>
      <path d="M40 44 V30 M40 44 L50 50" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M58 22 l5 -5" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
    // 時光沙漏 (SSR time): an hourglass with gold sand.
    "EQ-HOURGLASS": `<path d="M22 10 h36 M22 70 h36" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <path d="M26 12 C26 32 40 34 40 40 C40 46 26 48 26 68 H54 C54 48 40 46 40 40 C40 34 54 32 54 12Z" fill="#e8f4fb" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M31 22 H49 C47 30 42 34 40 37 C38 34 33 30 31 22Z M30 66 C32 56 38 54 40 52 C42 54 48 56 50 66Z" fill="#f4d36b"/>`,
    // 雷神鍵盤 (UR, 答題衝刺): a golden keyboard struck by lightning.
    "EQ-THUNDERKEY": `<circle cx="40" cy="40" r="36" fill="#fff6d8" opacity="0.8"/>
      <rect x="8" y="38" width="64" height="28" rx="6" fill="#f4d36b" stroke="${INK}" stroke-width="4"/>
      <g fill="#fff6d8" stroke="${INK}" stroke-width="2"><rect x="14" y="44" width="9" height="7" rx="2"/><rect x="26" y="44" width="9" height="7" rx="2"/><rect x="38" y="44" width="9" height="7" rx="2"/><rect x="50" y="44" width="15" height="7" rx="2"/><rect x="20" y="55" width="40" height="6" rx="2"/></g>
      <path d="M46 4 L30 26 H40 L32 42 L54 18 H43 L50 4Z" fill="#8fc7f0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M14 20 l4 6 M66 20 l-4 6 M10 32 h6 M64 32 h6" stroke="#f2a541" stroke-width="3" stroke-linecap="round"/>`,
  };

  // A generic box for items added to the workbook later without their own art.
  const FALLBACK = `<rect x="14" y="24" width="52" height="40" rx="9" fill="#c4b0e0" stroke="${INK}" stroke-width="4"/>
    <path d="M30 24v-8h20v8" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <rect x="34" y="38" width="12" height="12" rx="3" fill="#f4d36b" stroke="${INK}" stroke-width="3"/>`;

  function icon(id, tier) {
    const rim = tier > 1 ? `<circle cx="40" cy="40" r="37" fill="none" stroke="#e8b84a" stroke-width="5"/>` : "";
    return `<svg viewBox="0 0 80 80" aria-hidden="true">${rim}${ICONS[id] || FALLBACK}</svg>`;
  }

  // Character sprite with its items as badges (slot 1 bottom-left, slot 2
  // bottom-right, slot 3 top-right). `items`: [{ id, tier }].
  function dressed(spriteSvg, items) {
    const badges = (items || [])
      .map((it, i) => `<span class="gear-badge gear-slot-${i}">${icon(it.id, it.tier)}</span>`)
      .join("");
    return `<span class="geared">${spriteSvg}${badges}</span>`;
  }

  ITE.gear = { ICONS, icon, dressed };
})(globalThis);
