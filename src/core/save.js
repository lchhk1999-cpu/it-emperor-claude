// Offline save. Storage is injected (localStorage in the browser, an in-memory
// map in tests) so the same code can later sit on Capacitor Preferences.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const SAVE_KEY = "it-emperor.save";
  const SAVE_VERSION = 1;

  function defaultSave() {
    return { version: SAVE_VERSION, stages: {}, activeBattle: null, guild: null, story: { levels: {} }, profile: null, progress: null };
  }

  function isValidSave(data) {
    return (
      data &&
      typeof data === "object" &&
      data.version === SAVE_VERSION &&
      data.stages &&
      typeof data.stages === "object" &&
      !Array.isArray(data.stages)
    );
  }

  const isNum = (v) => typeof v === "number" && Number.isFinite(v);

  // A saved in-progress battle must be fully resumable, otherwise it is dropped.
  function isValidBattle(b) {
    return (
      !!b &&
      typeof b === "object" &&
      ["question", "feedback"].includes(b.phase) &&
      Array.isArray(b.deck) &&
      b.deck.length > 0 &&
      Number.isInteger(b.index) &&
      b.index >= 0 &&
      b.index < b.deck.length &&
      !!b.boss && isNum(b.boss.hp) && isNum(b.boss.maxHp) && b.boss.maxHp > 0 && isNum(b.boss.attack) &&
      !!b.party && isNum(b.party.hp) && isNum(b.party.maxHp) && b.party.maxHp > 0 &&
      Array.isArray(b.log) &&
      (b.phase === "question" || (!!b.lastResult && typeof b.lastResult === "object"))
    );
  }

  function sanitizeStageRecord(r) {
    return {
      cleared: !!(r && r.cleared === true),
      bestAccuracy: r && isNum(r.bestAccuracy) ? Math.min(100, Math.max(0, r.bestAccuracy)) : 0,
      plays: r && Number.isInteger(r.plays) && r.plays >= 0 ? r.plays : 0,
    };
  }

  const isText = (v) => typeof v === "string" && v.trim() !== "";

  // { nickname, guild: { id, name, founder, members }, myAttacks: [attack records] }
  function isValidGuildState(g) {
    return (
      !!g &&
      typeof g === "object" &&
      isText(g.nickname) &&
      !!g.guild && isText(g.guild.id) && isText(g.guild.name) &&
      Array.isArray(g.guild.members) && g.guild.members.every(isText) && g.guild.members.includes(g.nickname) &&
      Array.isArray(g.myAttacks) &&
      g.myAttacks.every((a) => a && a.nickname === g.nickname && isText(a.dayKey) && isText(a.weekKey) && isNum(a.damage) && a.damage >= 0)
    );
  }

  // Story progress per level: { cleared, stars 0..3, plays }.
  function sanitizeStoryLevel(r) {
    return {
      cleared: !!(r && r.cleared === true),
      stars: r && Number.isInteger(r.stars) ? Math.min(3, Math.max(0, r.stars)) : 0,
      plays: r && Number.isInteger(r.plays) && r.plays >= 0 ? r.plays : 0,
    };
  }

  function sanitizeStory(raw) {
    const levels = {};
    const src = raw && typeof raw === "object" && raw.levels && typeof raw.levels === "object" && !Array.isArray(raw.levels) ? raw.levels : {};
    for (const [id, rec] of Object.entries(src)) levels[id] = sanitizeStoryLevel(rec);
    return { levels };
  }

  // Player profile { level >= 1, exp >= 0, coins >= 0, team: unique ids }. Numbers
  // are clamped; a non-object is dropped (the game then starts a fresh profile).
  // Unknown character ids are filtered later by ITE.profile.cleanTeam.
  function sanitizeProfile(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const int = (v, min) => (Number.isInteger(v) && v >= min ? v : min);
    const team = Array.isArray(raw.team) ? raw.team.filter(isText).filter((id, i, a) => a.indexOf(id) === i).slice(0, 10) : [];
    const equipment = {};
    if (raw.equipment && typeof raw.equipment === "object" && !Array.isArray(raw.equipment)) {
      for (const [k, v] of Object.entries(raw.equipment)) if (isText(v)) equipment[k] = v;
    }
    const out = { level: int(raw.level, 1), exp: int(raw.exp, 0), coins: int(raw.coins, 0), gems: int(raw.gems, 0), team, equipment };
    // 抽蛋 fields (missing in older saves; ITE.profile.ensureOwned fills them in).
    const ids = (v) => (Array.isArray(v) ? v.filter(isText).filter((id, i, a) => a.indexOf(id) === i) : []);
    if (raw.owned !== undefined) {
      const o = raw.owned && typeof raw.owned === "object" ? raw.owned : {};
      out.owned = { characters: ids(o.characters), equipment: ids(o.equipment) };
    }
    // 背包 materials { id: count }; bad entries are dropped.
    if (raw.materials !== undefined) {
      out.materials = {};
      if (raw.materials && typeof raw.materials === "object" && !Array.isArray(raw.materials)) {
        for (const [k, v] of Object.entries(raw.materials)) if (isText(k) && Number.isInteger(v) && v > 0) out.materials[k] = Math.min(v, 9999);
      }
    }
    // 體力 { value, updatedAt }; a damaged entry is dropped (the game then starts full).
    if (raw.stamina !== undefined) {
      const st = raw.stamina;
      if (st && Number.isInteger(st.value) && st.value >= 0 && isNum(st.updatedAt) && st.updatedAt >= 0) {
        out.stamina = { value: Math.min(st.value, 999), updatedAt: st.updatedAt };
      }
    }
    if (raw.pity !== undefined) out.pity = { character: int(raw.pity && raw.pity.character, 0) };
    if (raw.gachaLog !== undefined) {
      out.gachaLog = (Array.isArray(raw.gachaLog) ? raw.gachaLog : [])
        .filter((e) => e && isText(e.id) && (e.type === "character" || e.type === "equipment"))
        .slice(0, 20)
        .map((e) => ({ type: e.type, id: e.id, rarity: isText(e.rarity) ? e.rarity : null, duplicate: e.duplicate === true, coins: int(e.coins, 0) }));
    }
    return out;
  }

  // Mission/title progress (src/core/missions.js). Counts are clamped to
  // non-negative integers; a non-object is dropped and started again.
  function sanitizeCounters(raw, fallbackKey) {
    const c = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const int = (v) => (Number.isInteger(v) && v >= 0 ? v : 0);
    const byTopic = {};
    if (c.byTopic && typeof c.byTopic === "object" && !Array.isArray(c.byTopic)) {
      for (const [k, v] of Object.entries(c.byTopic)) if (int(v)) byTopic[k] = int(v);
    }
    return {
      key: isText(c.key) ? c.key : fallbackKey,
      answered: int(c.answered),
      correct: int(c.correct),
      stageClears: int(c.stageClears),
      byTopic,
      sqlJoinCorrect: int(c.sqlJoinCorrect),
    };
  }

  function sanitizeProgress(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const claimed = {};
    if (raw.claimed && typeof raw.claimed === "object" && !Array.isArray(raw.claimed)) {
      for (const [k, v] of Object.entries(raw.claimed)) if (isText(v)) claimed[k] = v;
    }
    const equipped = raw.titles && isText(raw.titles.equipped) ? raw.titles.equipped : null;
    return {
      daily: sanitizeCounters(raw.daily, ""),
      weekly: sanitizeCounters(raw.weekly, ""),
      lifetime: sanitizeCounters(raw.lifetime, "all"),
      claimed,
      titles: { equipped },
    };
  }

  // Repairs the parts of an otherwise valid save that can be repaired.
  // Saves from before the guild / story / profile features lack those fields; that is not damage.
  function normalize(data) {
    const stages = {};
    for (const [id, rec] of Object.entries(data.stages)) stages[id] = sanitizeStageRecord(rec);
    const activeBattle = isValidBattle(data.activeBattle) ? data.activeBattle : null;
    const rawGuild = data.guild === undefined ? null : data.guild;
    const guild = isValidGuildState(rawGuild) ? rawGuild : null;
    const rawStory = data.story === undefined ? { levels: {} } : data.story;
    const story = sanitizeStory(rawStory);
    const rawProfile = data.profile === undefined ? null : data.profile;
    const profile = sanitizeProfile(rawProfile);
    const rawProgress = data.progress === undefined ? null : data.progress;
    const progress = sanitizeProgress(rawProgress);
    const repaired =
      activeBattle !== data.activeBattle ||
      guild !== rawGuild ||
      JSON.stringify(stages) !== JSON.stringify(data.stages) ||
      JSON.stringify(story) !== JSON.stringify(rawStory) ||
      JSON.stringify(profile) !== JSON.stringify(rawProfile) ||
      JSON.stringify(progress) !== JSON.stringify(rawProgress);
    return { save: { version: SAVE_VERSION, stages, activeBattle, guild, story, profile, progress }, repaired };
  }

  function withStory(save, story) {
    return { ...save, story };
  }

  function withGuild(save, guildState) {
    return { ...save, guild: guildState };
  }

  function createMemoryStorage() {
    const map = new Map();
    return {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: (k) => map.delete(k),
      keys: () => [...map.keys()],
    };
  }

  // Never throws: a missing, corrupt or wrong-version save falls back to a fresh
  // save, and the corrupt raw value is kept under a backup key for inspection.
  function load(storage) {
    let raw = null;
    try {
      raw = storage.getItem(SAVE_KEY);
      if (raw === null) return { save: defaultSave(), status: "new" };
      const data = JSON.parse(raw);
      if (isValidSave(data)) {
        const { save, repaired } = normalize(data);
        return { save, status: repaired ? "repaired" : "ok" };
      }
    } catch (e) {
      // fall through to recovery
    }
    if (raw !== null) {
      try {
        storage.setItem(SAVE_KEY + ".corrupt-backup." + Date.now(), raw);
      } catch (e) {
        // storage unavailable; nothing more to do
      }
    }
    return { save: defaultSave(), status: "recovered" };
  }

  function persist(storage, save) {
    try {
      storage.setItem(SAVE_KEY, JSON.stringify(save));
      return true;
    } catch (e) {
      return false;
    }
  }

  function withActiveBattle(save, battleState) {
    return { ...save, activeBattle: battleState };
  }

  function recordStageResult(save, stageId, summary) {
    const prev = sanitizeStageRecord(save.stages[stageId]);
    const stages = {
      ...save.stages,
      [stageId]: {
        cleared: prev.cleared || summary.outcome === "won",
        bestAccuracy: Math.max(prev.bestAccuracy, summary.accuracy),
        plays: prev.plays + 1,
      },
    };
    return { ...save, stages, activeBattle: null };
  }

  ITE.save = { SAVE_KEY, SAVE_VERSION, defaultSave, isValidBattle, isValidGuildState, createMemoryStorage, load, persist, withActiveBattle, withGuild, withStory, recordStageResult };
})(globalThis);
