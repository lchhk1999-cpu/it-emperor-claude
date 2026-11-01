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
    // Equipment pity (balance 2026-11-01, user 「套用建議數值」): the workbook's 80
    // was never enforced; now SSR equipment within 50 draws, like characters.
    // TODO(ChatGPT): set Pools EQUIP-STD SSR pity_threshold to 50 in the workbook too.
    equipmentSsrPity: 50,
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

  // Items the equipment box can give: usable and not UR (UR is earned in play).
  function equipmentCandidates(gameData) {
    return (gameData.equipment || []).filter((e) => e.supported && e.rarity !== "UR");
  }

  // 裝備稀有度 (2026-11-01): the workbook pool rates by rarity (R/SR/SSR),
  // with the items of each rarity; equal chance within a rarity. Items without
  // a rarity (older workbooks) fall back to one equal-chance group.
  function equipmentRates(gameData) {
    const items = equipmentCandidates(gameData);
    const pool = gameData.pools && gameData.pools.equipment;
    if (!pool || items.some((e) => !e.rarity)) return items.length ? [{ rarity: null, pct: 100, items }] : [];
    return pool.rates.map((r) => ({ ...r, items: items.filter((e) => e.rarity === r.rarity) })).filter((r) => r.items.length);
  }

  // Draws until a guaranteed SSR for a pool type ("character" or "equipment"); 0 = none.
  function pityThreshold(gameData, type) {
    if (type === "equipment") {
      const pool = gameData.pools && gameData.pools.equipment;
      const ssr = pool && pool.rates.find((r) => r.rarity === "SSR");
      if (!ssr || !equipmentRates(gameData).some((r) => r.rarity === "SSR")) return 0;
      return ssr.pity ? Math.min(ssr.pity, GACHA_RULES.equipmentSsrPity) : 0;
    }
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

  // 盲盒六選一 (user request 2026-11-01): each draw shows BOX_COUNT closed boxes,
  // every one rolled independently with the published rates, so picking any box
  // gives exactly those rates. On a pity draw every box is SSR. The player gets
  // only the box they open; the others are then revealed (user choice).
  const BOX_COUNT = 6;

  function rollOne(type, gameData, rng, forced) {
    if (type === "character") {
      const rates = characterRates(gameData);
      const rarity = forced ? "SSR" : rollRarity(rates, rng);
      const c = pickOne(rates.find((r) => r.rarity === rarity).characters, rng);
      return { type, id: c.id, name: c.name, rarity };
    }
    const rates = equipmentRates(gameData);
    const rarity = forced ? "SSR" : rates.length > 1 ? rollRarity(rates, rng) : rates[0].rarity;
    const e = pickOne(rates.find((r) => r.rarity === rarity).items, rng);
    return { type, id: e.id, name: e.name, rarity: e.rarity || null };
  }

  // Returns { boxes, pity } or { error }. Nothing is spent until a box is opened.
  function rollBoxes(profile, type, gameData, rng) {
    if ((profile.gems || 0) < GACHA_RULES.cost) return { error: "not_enough_gems" };
    if (type === "character" && !characterRates(gameData).length) return { error: "pool_empty" };
    if (type === "equipment" && !equipmentCandidates(gameData).length) return { error: "pool_empty" };
    if (type !== "character" && type !== "equipment") return { error: "unknown_pool" };
    const threshold = pityThreshold(gameData, type);
    const count = ((profile.pity && profile.pity[type]) || 0) + 1;
    const forced = threshold > 0 && count >= threshold && (type === "character" ? characterRates(gameData) : equipmentRates(gameData)).some((r) => r.rarity === "SSR");
    const boxes = [];
    for (let i = 0; i < BOX_COUNT; i++) boxes.push(rollOne(type, gameData, rng, forced));
    return { boxes, pity: forced };
  }

  // Opens box `index` of a rollBoxes() result. Returns { profile, result } or { profile, error }.
  function openBox(profile, rolled, index, gameData) {
    if ((profile.gems || 0) < GACHA_RULES.cost) return { profile, error: "not_enough_gems" };
    const box = rolled.boxes[index];
    if (!box) return { profile, error: "unknown_box" };
    const { type } = box;
    const owned = profile.owned;
    const pity = { character: 0, equipment: 0, ...(profile.pity || {}) };
    pity[type] = box.rarity === "SSR" ? 0 : (pity[type] || 0) + 1;
    const duplicate = (type === "character" ? owned.characters : owned.equipment).includes(box.id);
    const result = { ...box, duplicate, shards: duplicate ? GACHA_RULES.duplicateShards : 0, pity: rolled.pity };
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

  // One draw without the box screen: roll the boxes and open the first.
  // Returns { profile, result } or { profile, error }.
  function draw(profile, type, gameData, rng) {
    const rolled = rollBoxes(profile, type, gameData, rng);
    if (rolled.error) return { profile, error: rolled.error };
    return openBox(profile, rolled, 0, gameData);
  }

  // Draws left before the guaranteed SSR of a pool type (default: characters).
  function drawsUntilPity(profile, gameData, type) {
    const t = type || "character";
    const threshold = pityThreshold(gameData, t);
    return threshold ? threshold - ((profile.pity && profile.pity[t]) || 0) : null;
  }

  ITE.gacha = { GACHA_RULES, BOX_COUNT, characterRates, equipmentCandidates, equipmentRates, pityThreshold, rollRarity, rollBoxes, openBox, draw, drawsUntilPity };
})(globalThis);
