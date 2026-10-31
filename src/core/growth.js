// 培養 (P5-04): character levels, three evolutions, equipment evolution.
// User decisions 2026-10-31: evolution materials come from stages; the third
// evolution needs shards (碎片) from duplicate gacha results.
// - Characters: level up with coins; each evolution raises the level cap and
//   needs the family's topic material (specialty ALL → 經驗芯片), 傳說核心 from
//   the second evolution, and shards for the third.
// - Equipment: tier 1 → 2 → 3 (workbook evolution_1..3 effects); tier 3 needs a shard.
// PROTOTYPE numbers (caps, costs, stat growth) until playtested.
// profile.growth = { characters: { id: { level, evo } }, equipment: { id: tier } }.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const GROWTH_RULES = {
    levelCaps: [10, 20, 30, 40], // by evolution stage 0..3
    levelCoins: (level) => 10 * level, // coins to go from `level` to `level + 1`
    statsPerLevel: 0.02,
    statsPerEvo: 0.1,
    maxEvo: 3,
    // Cost of reaching evolution stage 1, 2, 3.
    evolutions: [
      { topic: 3, rare: 0, coins: 200, shards: 0 },
      { topic: 6, rare: 1, coins: 500, shards: 0 },
      { topic: 10, rare: 2, coins: 1000, shards: { R: 3, SR: 2, SSR: 1 } },
    ],
    // Cost of reaching equipment tier 2, 3.
    equipmentTiers: [
      { rare: 1, coins: 300, shards: 0 },
      { rare: 2, coins: 800, shards: 1 },
    ],
    rareMaterial: "MAT-RARE",
    allTopicMaterial: "MAT-EXP",
  };

  const EVO_NAMES = ["初始", "一階進化", "二階進化", "三階進化"];

  function charGrowth(profile, id) {
    const g = profile.growth && profile.growth.characters && profile.growth.characters[id];
    return g ? { level: g.level, evo: g.evo } : { level: 1, evo: 0 };
  }

  function equipmentTier(profile, id) {
    return (profile.growth && profile.growth.equipment && profile.growth.equipment[id]) || 1;
  }

  function withCharGrowth(profile, id, g) {
    const growth = profile.growth || { characters: {}, equipment: {} };
    return { ...profile, growth: { ...growth, characters: { ...growth.characters, [id]: g } } };
  }

  // Material a character's evolutions use: the material of its specialty topic.
  function topicMaterial(character, gameData, rules) {
    const r = rules || GROWTH_RULES;
    if (character.specialty === "ALL") return r.allTopicMaterial;
    const m = (gameData.materials || []).find((x) => x.topic === character.specialty);
    return m ? m.id : r.allTopicMaterial;
  }

  // Character stats after levels and evolutions.
  function stats(character, g, rules) {
    const r = rules || GROWTH_RULES;
    const mult = (1 + r.statsPerLevel * (g.level - 1)) * (1 + r.statsPerEvo * g.evo);
    return { attack: Math.round(character.attack * mult), hp: Math.round(character.hp * mult) };
  }

  // What the next evolution of a character needs: [{ kind, id, need, have }], or null at max.
  function evolutionCost(profile, character, gameData, rules) {
    const r = rules || GROWTH_RULES;
    const g = charGrowth(profile, character.id);
    if (g.evo >= r.maxEvo) return null;
    const step = r.evolutions[g.evo];
    const has = (id) => (profile.materials && profile.materials[id]) || 0;
    const mat = topicMaterial(character, gameData, r);
    const out = [{ kind: "level", id: "level", need: r.levelCaps[g.evo], have: g.level }];
    out.push({ kind: "material", id: mat, need: step.topic, have: has(mat) });
    if (step.rare) out.push({ kind: "material", id: r.rareMaterial, need: step.rare, have: has(r.rareMaterial) });
    if (step.shards) out.push({ kind: "shards", id: character.id, need: step.shards[character.rarity] || 1, have: (profile.shards && profile.shards[character.id]) || 0 });
    out.push({ kind: "coins", id: "coins", need: step.coins, have: profile.coins });
    return out;
  }

  // Takes a checked cost list out of the profile.
  function pay(profile, cost) {
    const materials = { ...(profile.materials || {}) };
    const shards = { ...(profile.shards || {}) };
    let coins = profile.coins;
    for (const c of cost) {
      if (c.kind === "material") materials[c.id] -= c.need;
      if (c.kind === "shards") shards[c.id] -= c.need;
      if (c.kind === "coins") coins -= c.need;
    }
    for (const o of [materials, shards]) for (const k of Object.keys(o)) if (o[k] <= 0) delete o[k];
    return { materials, shards, coins };
  }

  const MISSING = { level: "needs_level", material: "not_enough_materials", shards: "not_enough_shards", coins: "not_enough_coins" };

  // Each returns { profile } or { profile, error }.
  function levelUp(profile, characterId, gameData, rules) {
    const r = rules || GROWTH_RULES;
    if (!profile.owned || !profile.owned.characters.includes(characterId)) return { profile, error: "not_owned" };
    const g = charGrowth(profile, characterId);
    if (g.level >= r.levelCaps[g.evo]) return { profile, error: g.evo >= r.maxEvo ? "max_level" : "needs_evolution" };
    const cost = r.levelCoins(g.level);
    if (profile.coins < cost) return { profile, error: "not_enough_coins" };
    return { profile: withCharGrowth({ ...profile, coins: profile.coins - cost }, characterId, { level: g.level + 1, evo: g.evo }) };
  }

  function evolve(profile, characterId, gameData, rules) {
    const r = rules || GROWTH_RULES;
    if (!profile.owned || !profile.owned.characters.includes(characterId)) return { profile, error: "not_owned" };
    const character = (gameData.characters || []).find((c) => c.id === characterId);
    const cost = character && evolutionCost(profile, character, gameData, r);
    if (!cost) return { profile, error: "max_evolution" };
    const missing = cost.find((c) => c.have < c.need);
    if (missing) return { profile, error: MISSING[missing.kind] };
    const { materials, shards, coins } = pay(profile, cost);
    const g = charGrowth(profile, characterId);
    return { profile: withCharGrowth({ ...profile, materials, shards, coins }, characterId, { level: g.level, evo: g.evo + 1 }) };
  }

  function equipmentCost(profile, equipmentId, rules) {
    const r = rules || GROWTH_RULES;
    const tier = equipmentTier(profile, equipmentId);
    if (tier >= 3) return null;
    const step = r.equipmentTiers[tier - 1];
    const out = [{ kind: "material", id: r.rareMaterial, need: step.rare, have: (profile.materials && profile.materials[r.rareMaterial]) || 0 }];
    if (step.shards) out.push({ kind: "shards", id: equipmentId, need: step.shards, have: (profile.shards && profile.shards[equipmentId]) || 0 });
    out.push({ kind: "coins", id: "coins", need: step.coins, have: profile.coins });
    return out;
  }

  function evolveEquipment(profile, equipmentId, gameData, rules) {
    if (!profile.owned || !profile.owned.equipment.includes(equipmentId)) return { profile, error: "not_owned" };
    const cost = equipmentCost(profile, equipmentId, rules);
    if (!cost) return { profile, error: "max_evolution" };
    const missing = cost.find((c) => c.have < c.need);
    if (missing) return { profile, error: MISSING[missing.kind] };
    const { materials, shards, coins } = pay(profile, cost);
    const growth = profile.growth || { characters: {}, equipment: {} };
    const tier = equipmentTier(profile, equipmentId) + 1;
    return { profile: { ...profile, materials, shards, coins, growth: { ...growth, equipment: { ...growth.equipment, [equipmentId]: tier } } } };
  }

  ITE.growth = { GROWTH_RULES, EVO_NAMES, charGrowth, equipmentTier, topicMaterial, stats, evolutionCost, levelUp, evolve, equipmentCost, evolveEquipment };
})(globalThis);
