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

  // Sample progress so the newer features show something on day one
  // (2026-11-02 「更新老師demo版」): answer counts that put titles on different
  // tiers (銅 to 白金), a worn tiered title, and 知識修練館 cards finished, due
  // for review and mid-lab. Only for a new demo save (or 設定 → 重設示範資料).
  const DEMO_LIFETIME = {
    answered: 760,
    correct: 620,
    byTopic: { EXCEL: 230, SQL: 120, DATABASE: 40, PY_BASIC: 160, PY_ADV: 40, SECURITY: 70, NET_CONCEPT: 30, HARDWARE: 40, OS: 20, IO: 20, SOCIAL: 35, DATA_REP: 25 },
    sqlJoinCorrect: 110,
    bestStreak: 22,
    ultimateClears: 6,
    drillAnswered: 240,
  };

  function seedProgress(now) {
    const p = ITE.missions.defaultProgress(now);
    return { ...p, lifetime: { ...p.lifetime, ...DEMO_LIFETIME }, titles: { equipped: "T-EXCEL" } };
  }

  // 知識修練館: A11 read two days ago (so the reading cards are due today), the
  // A11 lab right once and then wrong (due again), D11 started; resumes at A11-05.
  function seedRevision(profile, now) {
    const R = ITE.revision;
    if (!R || !R.cardById("A11-01")) return profile;
    const DAY = 24 * 60 * 60 * 1000;
    let p = profile;
    for (const id of ["A11-01", "A11-02", "A11-03", "D11-01", "C07-01"]) p = R.finishReading(p, id, now - 2 * DAY).profile;
    p = R.answer(p, "A11-04", { correct: true, graded: false }, now - 2 * DAY).profile;
    p = R.answer(p, "A11-05", { correct: true, graded: true }, now - 3 * DAY).profile;
    p = R.answer(p, "A11-05", { correct: false, graded: true }, now - DAY).profile;
    p = R.open(p, "A11-05", now - DAY);
    return p;
  }

  // The whole starting point of a new demo save: { profile, progress }.
  function seedSave(gameData, now) {
    const profile = seedRevision(seedProfile(gameData), now);
    return { profile: { ...profile, checkin: { days: 35, lastDay: null } }, progress: seedProgress(now) };
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

  ITE.demo = { DEMO_RULES, enabled, seedProfile, seedProgress, seedSave, prefixedStorage };
})(globalThis);
