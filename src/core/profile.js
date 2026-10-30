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

  // New players start with IT狗 + AI 模型 (user decision 2026-10-30); more
  // characters and equipment come from 抽蛋 only.
  const STARTER = { character: "CH-ITDOG", equipment: "EQ-AI" };

  function starterIds(gameData) {
    const c = characterById(gameData, STARTER.character) || gameData.characters[0];
    const e = (gameData.equipment || []).find((x) => x.id === STARTER.equipment);
    return { character: c.id, equipment: e ? e.id : null };
  }

  function defaultProfile(gameData) {
    const s = starterIds(gameData);
    return {
      level: 1,
      exp: 0,
      coins: 0,
      gems: 0,
      team: [s.character],
      equipment: {},
      owned: { characters: [s.character], equipment: s.equipment ? [s.equipment] : [] },
      pity: { character: 0 },
      gachaLog: [],
    };
  }

  // Saves from before 抽蛋 have no `owned`: keep whatever the player already
  // uses (team members and equipped items) plus the starter, so nothing is lost.
  function ensureOwned(profile, gameData) {
    const s = starterIds(gameData);
    const known = (ids, list) => ids.filter((id, i) => ids.indexOf(id) === i && list.some((x) => x.id === id));
    const base = profile.owned || {
      characters: [s.character].concat(profile.team || []),
      equipment: (s.equipment ? [s.equipment] : []).concat(Object.values(profile.equipment || {})),
    };
    return {
      ...profile,
      owned: {
        characters: known([s.character].concat(base.characters || []), gameData.characters),
        equipment: known((s.equipment ? [s.equipment] : []).concat(base.equipment || []), gameData.equipment || []),
      },
      pity: { character: (profile.pity && profile.pity.character) || 0 },
      gachaLog: profile.gachaLog || [],
    };
  }

  function owns(profile, id) {
    return !profile.owned || profile.owned.characters.includes(id);
  }

  function teamSlots(level, config, rules) {
    const r = rules || PROFILE_RULES;
    const unlocked = r.teamSlotLevels.filter((lv) => level >= lv).length;
    return Math.max(config.initial_team_slots, Math.min(config.team_slots_max, unlocked));
  }

  function characterById(gameData, id) {
    return gameData.characters.find((c) => c.id === id) || null;
  }

  // Keeps only known (and, when `owned` is given, owned), unique characters
  // within the slots the level allows.
  function cleanTeam(team, level, gameData, owned) {
    const slots = teamSlots(level, gameData.config);
    const ids = [];
    for (const id of team || []) {
      if (characterById(gameData, id) && !ids.includes(id) && (!owned || owned.characters.includes(id))) ids.push(id);
    }
    const out = ids.slice(0, slots);
    return out.length ? out : [starterIds(gameData).character];
  }

  // Adds the character if there is a free slot, removes it if already in the team.
  // The team never becomes empty. With a single slot, picking another character
  // swaps it in (otherwise a new player could never change character).
  function toggleMember(profile, id, gameData) {
    if (!characterById(gameData, id)) return { profile, error: "unknown_character" };
    if (!owns(profile, id)) return { profile, error: "not_owned" };
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

  // Groups characters by family (角色品種), keeping workbook order. A character
  // without family columns forms its own group.
  function familyGroups(characters) {
    const groups = [];
    const byKey = {};
    for (const c of characters) {
      const key = c.family || c.id;
      if (!byKey[key]) groups.push((byKey[key] = { id: key, name: c.familyName || c.name, characters: [] }));
      byKey[key].characters.push(c);
    }
    return groups;
  }

  ITE.profile = {
    PROFILE_RULES,
    familyGroups,
    STARTER,
    defaultProfile,
    ensureOwned,
    owns,
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
