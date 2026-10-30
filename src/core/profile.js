// Player progression and team (P3-01/P3-02, PROTOTYPE balance).
// Character stats and specialty bonus come from the workbook (ITE.gameData);
// the numbers in PROFILE_RULES are placeholders until the user approves them.
//
// Team effects apply to the DSE 題庫挑戰 only: story mode clears only when every
// question is answered (bonus damage would skip learning) and the guild raid is
// competitive, so GameConfig.pvp_stats_normalized keeps teams out of it.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const PROFILE_RULES = {
    // Team slot n opens at teamSlotLevels[n-1] (workbook: "按等級逐步解鎖", no levels given).
    teamSlotLevels: [1, 3, 5, 8, 12],
    expToNext: (level) => 50 * level,
    dse: { winCoins: 30, winExp: 25, expPerCorrect: 5 }, // workbook Stages: easy story 30 coins / 25 exp
    story: { firstClearCoins: 30, firstClearExp: 25, replayExp: 5 },
  };

  function defaultProfile(gameData) {
    return { level: 1, exp: 0, coins: 0, gems: 0, team: [gameData.characters[0].id], equipment: {} };
  }

  function teamSlots(level, config, rules) {
    const r = rules || PROFILE_RULES;
    const unlocked = r.teamSlotLevels.filter((lv) => level >= lv).length;
    return Math.max(config.initial_team_slots, Math.min(config.team_slots_max, unlocked));
  }

  function characterById(gameData, id) {
    return gameData.characters.find((c) => c.id === id) || null;
  }

  // Keeps only known, unique characters within the slots the level allows.
  function cleanTeam(team, level, gameData) {
    const slots = teamSlots(level, gameData.config);
    const ids = [];
    for (const id of team || []) if (characterById(gameData, id) && !ids.includes(id)) ids.push(id);
    const out = ids.slice(0, slots);
    return out.length ? out : [gameData.characters[0].id];
  }

  // Adds the character if there is a free slot, removes it if already in the team.
  // The team never becomes empty. With a single slot, picking another character
  // swaps it in (otherwise a new player could never change character).
  function toggleMember(profile, id, gameData) {
    if (!characterById(gameData, id)) return { profile, error: "unknown_character" };
    if (profile.team.includes(id)) {
      if (profile.team.length === 1) return { profile, error: "team_needs_one" };
      return { profile: { ...profile, team: profile.team.filter((x) => x !== id) }, error: null };
    }
    const slots = teamSlots(profile.level, gameData.config);
    if (slots === 1) return { profile: { ...profile, team: [id] }, error: null };
    if (profile.team.length >= slots) return { profile, error: "team_full" };
    return { profile: { ...profile, team: profile.team.concat([id]) }, error: null };
  }

  // Adds exp/coins/gems (free in-game currency only), applying as many level-ups as the exp allows.
  function addReward(profile, reward, gameData, rules) {
    const r = rules || PROFILE_RULES;
    let { level, exp } = profile;
    const coins = profile.coins + (reward.coins || 0);
    const gems = (profile.gems || 0) + (reward.gems || 0);
    exp += reward.exp || 0;
    const startLevel = level;
    while (exp >= r.expToNext(level)) {
      exp -= r.expToNext(level);
      level += 1;
    }
    const slotsBefore = teamSlots(startLevel, gameData.config, r);
    const slotsAfter = teamSlots(level, gameData.config, r);
    return {
      profile: { ...profile, level, exp, coins, gems },
      levelsGained: level - startLevel,
      slotsUnlocked: slotsAfter - slotsBefore,
    };
  }

  // Snapshot stored in battle state (plain JSON, survives save/resume).
  function teamSnapshot(profile, gameData) {
    return profile.team.map((id) => characterById(gameData, id)).filter(Boolean).map((c) => ({ ...c }));
  }

  // Team attack/HP are the members' averages, so a bigger team does not hit
  // harder by itself; it covers more specialty topics instead.
  function teamStats(team) {
    const n = team.length || 1;
    return {
      attack: Math.round(team.reduce((s, c) => s + c.attack, 0) / n),
      hp: Math.round(team.reduce((s, c) => s + c.hp, 0) / n),
    };
  }

  // Best specialty bonus in the team for this question's topic.
  function specialtyBonus(team, topicId) {
    let best = null;
    for (const c of team) {
      const match = c.specialty === topicId || c.specialty === "ALL";
      if (match && (!best || c.bonus > best.bonus)) best = c;
    }
    return best ? { characterId: best.id, name: best.name, bonus: best.bonus } : null;
  }

  function dseRewards(summary, rules) {
    const r = (rules || PROFILE_RULES).dse;
    const won = summary.outcome === "won";
    return { exp: summary.correct * r.expPerCorrect + (won ? r.winExp : 0), coins: won ? r.winCoins : 0 };
  }

  function storyRewards(firstClear, rules) {
    const r = (rules || PROFILE_RULES).story;
    return firstClear ? { exp: r.firstClearExp, coins: r.firstClearCoins } : { exp: r.replayExp, coins: 0 };
  }

  ITE.profile = {
    PROFILE_RULES,
    defaultProfile,
    teamSlots,
    characterById,
    cleanTeam,
    toggleMember,
    addReward,
    teamSnapshot,
    teamStats,
    specialtyBonus,
    dseRewards,
    storyRewards,
  };
})(globalThis);
