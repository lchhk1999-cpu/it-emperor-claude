// 數值平衡 (P6-01). One place for the reward numbers the balance simulator
// (tools/balance_sim.js) compares: the current rules, and TUNING, a proposed
// set the user decides on. Nothing here changes the game until it is wired in.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  // Current game behaviour.
  const CURRENT = {
    gachaCost: 10,
    levelUpGems: 0, // gems for each player level gained
    winCoins: null, // null = flat ITE.profile PROFILE_RULES.dse.winCoins; or coins by stage difficulty
    pity: null, // null = workbook Pools pity_threshold
    starterGems: 0, // gems a new player starts with
    rareChance: {}, // extra chance of 1 傳說核心 per win, by difficulty
  };

  // PROPOSAL (2026-10-31), see docs/BALANCE_REPORT.md.
  const TUNING = {
    levelUpGems: 5,
    winCoins: { easy: 20, medium: 35, hard: 50, ultimate: 70 },
    pity: 50,
    starterGems: 30,
    rareChance: { medium: 0.08, hard: 0.25 },
  };

  // A stage with this rule set's extra 傳說核心 chance added to its drops.
  function withRareChance(stage, r) {
    const p = r && r.rareChance && r.rareChance[stage.difficulty];
    if (!p || !stage.drops) return stage;
    return { ...stage, drops: { ...stage.drops, chance: { ...(stage.drops.chance || {}), "MAT-RARE": p } } };
  }

  function rules(overrides) {
    return { ...CURRENT, ...(overrides || {}) };
  }

  // Rewards for a finished DSE battle on a given stage.
  function dseRewards(summary, stage, r) {
    const base = ITE.profile.dseRewards(summary);
    if (!r || !r.winCoins || summary.outcome !== "won") return base;
    const coins = r.winCoins[(stage && stage.difficulty) || "easy"];
    return { ...base, coins: coins === undefined ? base.coins : coins };
  }

  // Game data with the SSR pity changed (the workbook Pools sheet holds the real value).
  function applyToGameData(gameData, overrides) {
    if (!overrides || !overrides.pity || !gameData.pools || !gameData.pools.character) return gameData;
    const character = { ...gameData.pools.character, rates: gameData.pools.character.rates.map((x) => (x.rarity === "SSR" ? { ...x, pity: overrides.pity } : x)) };
    return { ...gameData, pools: { ...gameData.pools, character } };
  }

  ITE.balance = { CURRENT, TUNING, rules, dseRewards, applyToGameData, withRareChance };
})(globalThis);
