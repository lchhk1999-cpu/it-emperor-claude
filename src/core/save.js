// Offline save. Storage is injected (localStorage in the browser, an in-memory
// map in tests) so the same code can later sit on Capacitor Preferences.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const SAVE_KEY = "it-emperor.save";
  const SAVE_VERSION = 1;

  // Player settings: sound effects and background music on/off, and whether the
  // new-player tutorial was seen.
  function defaultSettings() {
    return { sound: true, music: true, tutorialDone: false };
  }

  function sanitizeSettings(raw) {
    const d = defaultSettings();
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return d;
    const pick = (k) => (typeof raw[k] === "boolean" ? raw[k] : d[k]);
    return { sound: pick("sound"), music: pick("music"), tutorialDone: pick("tutorialDone") };
  }

  function defaultSave() {
    return { version: SAVE_VERSION, stages: {}, activeBattle: null, guild: null, story: { levels: {} }, profile: null, progress: null, settings: defaultSettings() };
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
  // Key-order-independent JSON, so a save is only "repaired" when a value changed.
  const stable = (v) =>
    Array.isArray(v) ? `[${v.map(stable).join(",")}]`
      : v && typeof v === "object" ? `{${Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`
      : JSON.stringify(v);

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
  // 暱稱 (user request 2026-11-01): 1–10 characters, no control characters.
  // Returns the cleaned name, or "" when nothing usable is left.
  const NAME_MAX = 10;
  function cleanName(raw) {
    if (typeof raw !== "string") return "";
    return Array.from(raw.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2066-\u2069]/g, "").replace(/\s+/g, " ").trim()).slice(0, NAME_MAX).join("").trim();
  }

  function sanitizeProfile(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const int = (v, min) => (Number.isInteger(v) && v >= min ? v : min);
    const team = Array.isArray(raw.team) ? raw.team.filter(isText).filter((id, i, a) => a.indexOf(id) === i).slice(0, 10) : [];
    const equipment = {};
    if (raw.equipment && typeof raw.equipment === "object" && !Array.isArray(raw.equipment)) {
      // A single id (before 裝備欄) or a list of up to 3 ids.
      for (const [k, v] of Object.entries(raw.equipment)) {
        if (isText(v)) equipment[k] = v;
        else if (Array.isArray(v)) {
          const ids = v.filter(isText).filter((id, i, a) => a.indexOf(id) === i).slice(0, 3);
          if (ids.length) equipment[k] = ids;
        }
      }
    }
    const out = { level: int(raw.level, 1), exp: int(raw.exp, 0), coins: int(raw.coins, 0), gems: int(raw.gems, 0), team, equipment };
    if (raw.name !== undefined) {
      const name = cleanName(raw.name);
      if (name) out.name = name;
    }
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
    // 碎片 { character_or_equipment_id: count } and 培養 growth (P5-04).
    const counts = (v) => {
      const o = {};
      if (v && typeof v === "object" && !Array.isArray(v)) for (const [k, n] of Object.entries(v)) if (isText(k) && Number.isInteger(n) && n > 0) o[k] = Math.min(n, 9999);
      return o;
    };
    if (raw.shards !== undefined) out.shards = counts(raw.shards);
    // 每日簽到 { days, lastDay }; a damaged entry is dropped (starts again from 0).
    if (raw.checkin !== undefined) {
      const ci = raw.checkin;
      if (ci && Number.isInteger(ci.days) && ci.days >= 0 && (ci.lastDay === null || (isText(ci.lastDay) && /^\d{4}-\d{2}-\d{2}$/.test(ci.lastDay)))) {
        out.checkin = { days: Math.min(ci.days, 99999), lastDay: ci.lastDay };
      }
    }
    // 帝王試煉 { week, cleared: [tier] }; a damaged entry is dropped (no tier cleared).
    if (raw.trials !== undefined) {
      const t = raw.trials;
      if (t && isText(t.week) && /^\d{4}-\d{2}-\d{2}$/.test(t.week) && Array.isArray(t.cleared)) {
        out.trials = { week: t.week, cleared: t.cleared.filter(isText).filter((k, i, a) => a.indexOf(k) === i).slice(0, 8) };
      }
    }
    if (raw.growth !== undefined) {
      const g = raw.growth && typeof raw.growth === "object" ? raw.growth : {};
      const characters = {};
      if (g.characters && typeof g.characters === "object" && !Array.isArray(g.characters)) {
        for (const [k, v] of Object.entries(g.characters)) {
          if (isText(k) && v && Number.isInteger(v.level) && v.level >= 1 && Number.isInteger(v.evo) && v.evo >= 0 && v.evo <= 3) characters[k] = { level: Math.min(v.level, 99), evo: v.evo };
        }
      }
      const equipment = {};
      if (g.equipment && typeof g.equipment === "object" && !Array.isArray(g.equipment)) {
        for (const [k, v] of Object.entries(g.equipment)) if (isText(k) && Number.isInteger(v) && v >= 1 && v <= 3) equipment[k] = v;
      }
      out.growth = { characters, equipment };
    }
    if (raw.pity !== undefined) out.pity = { character: int(raw.pity && raw.pity.character, 0) };
    if (raw.gachaLog !== undefined) {
      out.gachaLog = (Array.isArray(raw.gachaLog) ? raw.gachaLog : [])
        .filter((e) => e && isText(e.id) && (e.type === "character" || e.type === "equipment"))
        .slice(0, 20)
        .map((e) => {
          const entry = { type: e.type, id: e.id, rarity: isText(e.rarity) ? e.rarity : null, duplicate: e.duplicate === true, shards: int(e.shards, 0) };
          if (e.coins !== undefined) entry.coins = int(e.coins, 0); // entries from before shards
          return entry;
        });
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
      streak: int(c.streak),
      bestStreak: int(c.bestStreak),
      ultimateClears: int(c.ultimateClears),
      drillAnswered: int(c.drillAnswered),
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
    // Saves from before settings existed simply get the defaults (not damage).
    const rawSettings = data.settings === undefined ? defaultSettings() : data.settings;
    const settings = sanitizeSettings(rawSettings);
    const repaired =
      activeBattle !== data.activeBattle ||
      guild !== rawGuild ||
      stable(stages) !== stable(data.stages) ||
      stable(story) !== stable(rawStory) ||
      stable(profile) !== stable(rawProfile) ||
      stable(progress) !== stable(rawProgress) ||
      stable(settings) !== stable(rawSettings);
    return { save: { version: SAVE_VERSION, stages, activeBattle, guild, story, profile, progress, settings }, repaired };
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

  // 進度備份碼 (D6): the whole save as one pasteable text, "ITE1.<base64>.<checksum>".
  // No network or account: students copy it on the old phone and paste it on the
  // new one. An in-progress battle is left out. Pure JS (runs under jsc tests).
  const CODE_PREFIX = "ITE1";
  const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  function toBase64(bytes) {
    let out = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const n = (bytes.charCodeAt(i) << 16) | ((bytes.charCodeAt(i + 1) || 0) << 8) | (bytes.charCodeAt(i + 2) || 0);
      out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63];
      out += i + 1 < bytes.length ? B64[(n >> 6) & 63] : "=";
      out += i + 2 < bytes.length ? B64[n & 63] : "=";
    }
    return out;
  }

  function fromBase64(text) {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(text) || text.length % 4) return null;
    let out = "";
    for (let i = 0; i < text.length; i += 4) {
      const c = [0, 1, 2, 3].map((k) => (text[i + k] === "=" ? 0 : B64.indexOf(text[i + k])));
      const n = (c[0] << 18) | (c[1] << 12) | (c[2] << 6) | c[3];
      out += String.fromCharCode((n >> 16) & 255);
      if (text[i + 2] !== "=") out += String.fromCharCode((n >> 8) & 255);
      if (text[i + 3] !== "=") out += String.fromCharCode(n & 255);
    }
    return out;
  }

  // FNV-1a, so a mistyped or cut-off code is caught before it replaces a save.
  function checksum(bytes) {
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) h = Math.imul(h ^ bytes.charCodeAt(i), 0x01000193) >>> 0;
    return h.toString(16).padStart(8, "0");
  }

  function exportCode(save) {
    const bytes = unescape(encodeURIComponent(JSON.stringify({ ...save, activeBattle: null })));
    return `${CODE_PREFIX}.${toBase64(bytes)}.${checksum(bytes)}`;
  }

  // Never throws. ok:false reasons: "empty", "format", "checksum", "invalid".
  function importCode(code) {
    const text = String(code || "").replace(/\s+/g, "");
    if (!text) return { ok: false, reason: "empty" };
    const parts = text.split(".");
    if (parts.length !== 3 || parts[0] !== CODE_PREFIX) return { ok: false, reason: "format" };
    const bytes = fromBase64(parts[1]);
    if (bytes === null) return { ok: false, reason: "format" };
    if (checksum(bytes) !== parts[2].toLowerCase()) return { ok: false, reason: "checksum" };
    try {
      const data = JSON.parse(decodeURIComponent(escape(bytes)));
      if (!isValidSave(data)) return { ok: false, reason: "invalid" };
      return { ok: true, save: { ...normalize(data).save, activeBattle: null } };
    } catch (e) {
      return { ok: false, reason: "invalid" };
    }
  }

  ITE.save = { SAVE_KEY, SAVE_VERSION, defaultSave, isValidBattle, isValidGuildState, createMemoryStorage, load, persist, withActiveBattle, withGuild, withStory, recordStageResult, exportCode, importCode, cleanName, NAME_MAX };
})(globalThis);
