// 背包 (P5-01). Materials come from the workbook Materials sheet and are kept
// in profile.materials as { material_id: count }.
// PROTOTYPE drop rule until topic/difficulty stages exist (P5-02): winning a
// DSE challenge gives one topic material, picked at random.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const INVENTORY_RULES = { maxStack: 9999, dseWinDrops: 1 };
  const RARITY_NAMES = { common: "普通", rare: "稀有", legendary: "傳說" };

  function materialById(gameData, id) {
    return (gameData.materials || []).find((m) => m.id === id) || null;
  }

  // Adds { id: count } to the profile. Unknown ids are ignored; counts stop at maxStack.
  function addMaterials(profile, drops, gameData, rules) {
    const r = rules || INVENTORY_RULES;
    const materials = { ...(profile.materials || {}) };
    for (const [id, n] of Object.entries(drops || {})) {
      if (!materialById(gameData, id) || !Number.isInteger(n) || n <= 0) continue;
      materials[id] = Math.min(r.maxStack, (materials[id] || 0) + n);
    }
    return { ...profile, materials };
  }

  function count(profile, id) {
    return (profile.materials && profile.materials[id]) || 0;
  }

  // Every workbook material with the player's count, in workbook order.
  function materialList(profile, gameData) {
    return (gameData.materials || []).map((m) => ({ ...m, count: count(profile, m.id) }));
  }

  function dseMaterialDrops(summary, gameData, rng, rules) {
    const r = rules || INVENTORY_RULES;
    if (summary.outcome !== "won") return {};
    const topicMaterials = (gameData.materials || []).filter((m) => m.topic !== "ALL");
    if (!topicMaterials.length) return {};
    const drops = {};
    for (let i = 0; i < r.dseWinDrops; i++) {
      const m = topicMaterials[Math.min(topicMaterials.length - 1, Math.floor(rng() * topicMaterials.length))];
      drops[m.id] = (drops[m.id] || 0) + 1;
    }
    return drops;
  }

  ITE.inventory = { INVENTORY_RULES, RARITY_NAMES, materialById, addMaterials, count, materialList, dseMaterialDrops };
})(globalThis);
