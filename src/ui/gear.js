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
