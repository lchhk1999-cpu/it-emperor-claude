// 老師示範版 (user request 2026-11-01): a build for teachers to try every part of
// the game at once. Same approved questions as the release; the player starts
// rich (high level, coins, gems, every character and item, materials, shards)
// and every story level is open. Only active when the build sets ITE.DEMO.
// Its save lives under separate storage keys, so it never mixes with a real one.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const DEMO_RULES = {
    name: "老師示範",
    level: 30,
    coins: 99999,
    gems: 9999,
    materials: 99,
    characterShards: 10,
    equipmentShards: 5,
    keyPrefix: "demo.",
  };

  const enabled = () => ITE.DEMO === true;

  // A rich starting profile built from the workbook data.
  function seedProfile(gameData) {
    const R = DEMO_RULES;
    const chars = gameData.characters.map((c) => c.id);
    const equip = (gameData.equipment || []).filter((e) => e.supported).map((e) => e.id);
    const rank = { UR: 0, SSR: 1, SR: 2, R: 3 };
    const team = gameData.characters.slice().sort((a, b) => rank[a.rarity] - rank[b.rarity]).slice(0, 5).map((c) => c.id);
    const shards = {};
    for (const id of chars) shards[id] = R.characterShards;
    for (const id of equip) shards[id] = R.equipmentShards;
    const materials = {};
    for (const m of gameData.materials || []) materials[m.id] = R.materials;
    return {
      ...ITE.profile.defaultProfile(gameData),
      name: R.name,
      level: R.level,
      coins: R.coins,
      gems: R.gems,
      team,
      owned: { characters: chars, equipment: equip },
      equipment: team[0] && equip.length ? { [team[0]]: equip.slice(0, 2) } : {},
      materials,
      shards,
    };
  }

  // Storage wrapper that keeps the demo save apart from a real one on the same device.
  function prefixedStorage(storage) {
    const p = DEMO_RULES.keyPrefix;
    return {
      getItem: (k) => storage.getItem(p + k),
      setItem: (k, v) => storage.setItem(p + k, v),
      removeItem: (k) => storage.removeItem(p + k),
    };
  }

  ITE.demo = { DEMO_RULES, enabled, seedProfile, prefixedStorage };
})(globalThis);
