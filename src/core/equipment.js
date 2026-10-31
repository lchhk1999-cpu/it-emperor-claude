// Equipment (P3-09, PROTOTYPE). Definitions and effects come from the workbook
// (ITE.gameData.equipment); items evolve to tiers 2-3 in 培養.
// 裝備欄 (user request 2026-11-01): each team member has 2 slots, and a 3rd once
// that character reaches the third evolution. Each item is held by one member.
// profile.equipment is { characterId: [equipmentId, ...] }; saves from before
// slots hold a single id string, which is read as a one-item list.
//
// Applies to the DSE 題庫挑戰 only, like teams: story clears need every answer
// and the guild raid is competitive (GameConfig pvp_stats_normalized).
//
// Learning-first rules:
// - AI 模型 (hint) removes WRONG options only; it never reveals the answer.
// - 電腦 (damage) arms a bonus that lands only if the next answer is correct.
// - 眼藥水 (healing) has no cooldown in the workbook; PROTOTYPE: once per battle.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const EQUIP_RULES = { healUsesPerBattle: 1, baseSlots: 2, extraSlotEvo: 3 };

  function itemById(gameData, id) {
    return (gameData.equipment || []).find((e) => e.id === id) || null;
  }

  // Slots a team member has: 2, or 3 after the character's third evolution.
  function slotsFor(profile, characterId) {
    const evo = profile && ITE.growth ? ITE.growth.charGrowth(profile, characterId).evo : 0;
    return EQUIP_RULES.baseSlots + (evo >= EQUIP_RULES.extraSlotEvo ? 1 : 0);
  }

  function itemsOf(value) {
    return Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  }

  // Every equipped item id, in team order.
  function equippedIds(map) {
    return Object.values(map || {}).flatMap(itemsOf);
  }

  // { [characterId]: [equipmentId, ...] } limited to team members, their slot
  // count, supported (and, when `owned` is given, owned) items, and each item
  // held by one member. `profile` (optional) gives evolution for the 3rd slot.
  function cleanEquipment(map, team, gameData, owned, profile) {
    const out = {};
    const used = new Set();
    for (const cid of team) {
      const list = [];
      for (const eid of itemsOf(map && map[cid])) {
        const item = itemById(gameData, eid);
        if (item && item.supported && !used.has(eid) && (!owned || owned.equipment.includes(eid)) && list.length < slotsFor(profile, cid)) {
          list.push(eid);
          used.add(eid);
        }
      }
      if (list.length) out[cid] = list;
    }
    return out;
  }

  // Puts the item on a team member (taking it from whoever had it). With a full
  // member, `slot` (default: the last) is replaced. equipmentId null clears
  // `slot`, or every slot of that member when no slot is given.
  function assign(profile, characterId, equipmentId, gameData, slot) {
    if (!profile.team.includes(characterId)) return { profile, error: "not_in_team" };
    const map = {};
    for (const [k, v] of Object.entries(profile.equipment || {})) map[k] = itemsOf(v).slice();
    const mine = map[characterId] || [];
    if (equipmentId === null) {
      map[characterId] = Number.isInteger(slot) ? mine.filter((_, i) => i !== slot) : [];
    } else {
      const item = itemById(gameData, equipmentId);
      if (!item) return { profile, error: "unknown_equipment" };
      if (!item.supported) return { profile, error: "not_supported" };
      if (profile.owned && !profile.owned.equipment.includes(equipmentId)) return { profile, error: "not_owned" };
      if (mine.includes(equipmentId)) return { profile, error: null };
      for (const k of Object.keys(map)) map[k] = map[k].filter((x) => x !== equipmentId);
      const list = map[characterId] || [];
      const max = slotsFor(profile, characterId);
      if (list.length < max && !(Number.isInteger(slot) && slot < list.length)) list.push(equipmentId);
      else list[Number.isInteger(slot) && slot < list.length ? slot : list.length - 1] = equipmentId;
      map[characterId] = list;
    }
    return { profile: { ...profile, equipment: cleanEquipment(map, profile.team, gameData, profile.owned, profile) }, error: null };
  }

  // Snapshot for battle state: [{ id, name, type, holder, tier, ...effect of the item's tier }].
  function battleLoadout(profile, gameData) {
    const map = cleanEquipment(profile.equipment || {}, profile.team, gameData, profile.owned, profile);
    return Object.entries(map).flatMap(([holder, ids]) => ids.map((eid) => [holder, eid])).map(([holder, eid]) => {
      const item = itemById(gameData, eid);
      const tier = Math.min(item.levels.length, ITE.growth ? ITE.growth.equipmentTier(profile, eid) : 1);
      const effect = { ...item.levels[tier - 1] };
      delete effect.text;
      return { id: item.id, name: item.name, type: item.type, holder, tier, ...effect };
    });
  }

  function answeredCount(state) {
    return state.log.length;
  }

  function skill(state, id) {
    return (state.skills && state.skills[id]) || { readyAt: 0, uses: 0 };
  }

  // What the battle screen shows for an active item.
  function skillStatus(state, item) {
    const s = skill(state, item.id);
    const n = answeredCount(state);
    if (state.phase !== "question") return { usable: false, reason: "wait" };
    if (item.type === "healing") {
      if (s.uses >= EQUIP_RULES.healUsesPerBattle) return { usable: false, reason: "used" };
      if (state.party.hp >= state.party.maxHp) return { usable: false, reason: "full_hp" };
      return { usable: true };
    }
    if (item.type === "hint" || item.type === "damage") {
      if (n < s.readyAt) return { usable: false, reason: "cooldown", wait: s.readyAt - n };
      if (item.type === "hint" && (state.hidden || {})[state.index]) return { usable: false, reason: "used_here" };
      if (item.type === "damage" && state.armedBonus) return { usable: false, reason: "armed" };
      return { usable: true };
    }
    return { usable: false, reason: "passive" };
  }

  // Wrong options to remove: a stable pick per question so a reload cannot
  // be used to reroll which options disappear.
  function pickWrong(q, count) {
    const wrong = ITE.questions.ANSWERS.filter((l) => l !== q.answer);
    let h = 0;
    for (const ch of q.question_id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const rotated = wrong.map((_, i) => wrong[(i + h) % wrong.length]);
    return rotated.slice(0, Math.min(count, wrong.length - 1)).sort(); // always leave one wrong option
  }

  function useSkill(state, itemId) {
    const item = (state.loadout || []).find((x) => x.id === itemId);
    if (!item || !skillStatus(state, item).usable) return state;
    const s = skill(state, itemId);
    const n = answeredCount(state);
    const skills = { ...(state.skills || {}) };
    if (item.type === "hint") {
      const q = ITE.battle.currentQuestion(state);
      skills[itemId] = { ...s, readyAt: n + item.cooldown, uses: s.uses + 1 };
      return { ...state, skills, hidden: { ...(state.hidden || {}), [state.index]: pickWrong(q, item.remove) } };
    }
    if (item.type === "healing") {
      skills[itemId] = { ...s, uses: s.uses + 1 };
      const hp = Math.min(state.party.maxHp, state.party.hp + item.heal);
      return { ...state, skills, party: { ...state.party, hp } };
    }
    if (item.type === "damage") {
      skills[itemId] = { ...s, readyAt: n + item.cooldown, uses: s.uses + 1 };
      return { ...state, skills, armedBonus: item.bonus };
    }
    return state;
  }

  // Passive damage reduction from the best defence item in the loadout.
  function damageTaken(state, raw) {
    const reduce = Math.max(0, ...(state.loadout || []).filter((x) => x.type === "defense").map((x) => x.reduce_pct));
    return Math.round(raw * (1 - reduce / 100));
  }

  function hiddenOptions(state) {
    return (state.hidden || {})[state.index] || [];
  }

  ITE.equipment = {
    EQUIP_RULES,
    itemById,
    slotsFor,
    itemsOf,
    equippedIds,
    cleanEquipment,
    assign,
    battleLoadout,
    skillStatus,
    useSkill,
    damageTaken,
    hiddenOptions,
    pickWrong,
  };
})(globalThis);
