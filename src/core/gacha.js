// 抽蛋 (P4-03). Design approved by the user on 2026-10-30:
// - Free gems only (earned from learning missions); no paid gems, no purchase
//   screen (GameConfig gacha_paid_enabled = 0).
// - 10 gems per single draw; no multi-draw.
// - Character pool rates and SSR pity come from the workbook Pools sheet.
// - The Equipment sheet has no rarity column yet, so every usable item has the
//   same chance; the screen says so.
// - Duplicates turn into 1 shard (碎片) of that character or item (user
//   decision 2026-10-31, replacing coins); shards pay for the third evolution.
// - Characters come from draws only; new players start with IT狗 + AI 模型.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const GACHA_RULES = {
    cost: 10,
    duplicateShards: 1,
    // SSR pity lowered from the workbook's 80 to 50 (balance approved 2026-10-31).
    // TODO(ChatGPT): set Pools CHAR-STD SSR pity_threshold to 50 in the workbook too.
    ssrPity: 50,
    logSize: 20,
  };

  function characterPool(gameData) {
    return (gameData.pools && gameData.pools.character) || null;
  }

  // Rates shown to players: rarity rates, and who can appear at each rarity.
  function characterRates(gameData) {
    const pool = characterPool(gameData);
    if (!pool) return [];
    return pool.rates
      .map((r) => ({ ...r, characters: gameData.characters.filter((c) => c.rarity === r.rarity) }))
      .filter((r) => r.characters.length);
  }

  function equipmentCandidates(gameData) {
    return (gameData.equipment || []).filter((e) => e.supported);
  }

  function pityThreshold(gameData) {
    const ssr = (characterPool(gameData) || { rates: [] }).rates.find((r) => r.rarity === "SSR");
    if (!ssr) return 0;
    return ssr.pity ? Math.min(ssr.pity, GACHA_RULES.ssrPity) : 0;
  }

  // Picks a rarity by the pool rates (only rarities that have characters).
  function rollRarity(rates, rng) {
    const total = rates.reduce((s, r) => s + r.pct, 0);
    let x = rng() * total;
    for (const r of rates) {
      if (x < r.pct) return r.rarity;
      x -= r.pct;
    }
    return rates[rates.length - 1].rarity;
  }

  function pickOne(list, rng) {
    return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
  }

  function appendLog(profile, entry) {
    return [entry].concat(profile.gachaLog || []).slice(0, GACHA_RULES.logSize);
  }

  // Returns { profile, result } or { profile, error }.
  function draw(profile, type, gameData, rng) {
    if ((profile.gems || 0) < GACHA_RULES.cost) return { profile, error: "not_enough_gems" };
    const owned = profile.owned;
    let result;
    let pity = { ...(profile.pity || { character: 0 }) };
    if (type === "character") {
      const rates = characterRates(gameData);
      if (!rates.length) return { profile, error: "pool_empty" };
      const threshold = pityThreshold(gameData);
      const count = (pity.character || 0) + 1;
      const forced = threshold > 0 && count >= threshold && rates.some((r) => r.rarity === "SSR");
      const rarity = forced ? "SSR" : rollRarity(rates, rng);
      const c = pickOne(rates.find((r) => r.rarity === rarity).characters, rng);
      const duplicate = owned.characters.includes(c.id);
      pity.character = rarity === "SSR" ? 0 : count;
      result = { type, id: c.id, name: c.name, rarity, duplicate, shards: duplicate ? GACHA_RULES.duplicateShards : 0, pity: forced };
    } else if (type === "equipment") {
      const list = equipmentCandidates(gameData);
      if (!list.length) return { profile, error: "pool_empty" };
      const e = pickOne(list, rng);
      const duplicate = owned.equipment.includes(e.id);
      result = { type, id: e.id, name: e.name, rarity: null, duplicate, shards: duplicate ? GACHA_RULES.duplicateShards : 0, pity: false };
    } else {
      return { profile, error: "unknown_pool" };
    }
    const nextOwned = result.duplicate
      ? owned
      : {
          characters: type === "character" ? owned.characters.concat([result.id]) : owned.characters,
          equipment: type === "equipment" ? owned.equipment.concat([result.id]) : owned.equipment,
        };
    return {
      profile: {
        ...profile,
        gems: profile.gems - GACHA_RULES.cost,
        owned: nextOwned,
        shards: result.shards ? { ...(profile.shards || {}), [result.id]: ((profile.shards || {})[result.id] || 0) + result.shards } : profile.shards || {},
        pity,
        gachaLog: appendLog(profile, { type, id: result.id, rarity: result.rarity, duplicate: result.duplicate, shards: result.shards }),
      },
      result,
    };
  }

  // Draws left before the guaranteed SSR character.
  function drawsUntilPity(profile, gameData) {
    const threshold = pityThreshold(gameData);
    return threshold ? threshold - ((profile.pity && profile.pity.character) || 0) : null;
  }

  ITE.gacha = { GACHA_RULES, characterRates, equipmentCandidates, pityThreshold, rollRarity, draw, drawsUntilPity };
})(globalThis);
