// Equipment (P3-09, PROTOTYPE). Definitions and level-1 effects come from the
// workbook (ITE.gameData.equipment); evolution (levels 2-3, extra slots) is not
// built yet, so each team member holds at most one item and uses level 1.
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

  const EQUIP_RULES = { healUsesPerBattle: 1 };

  function itemById(gameData, id) {
    return (gameData.equipment || []).find((e) => e.id === id) || null;
  }

  // { [characterId]: equipmentId } limited to team members, supported items,
  // and each item held by one member.
  function cleanEquipment(map, team, gameData) {
    const out = {};
    const used = new Set();
    for (const cid of team) {
      const eid = map && map[cid];
      const item = eid && itemById(gameData, eid);
      if (item && item.supported && !used.has(eid)) {
        out[cid] = eid;
        used.add(eid);
      }
    }
    return out;
  }

  // Gives the item to a team member (taking it from whoever had it), or clears
  // that member's slot when equipmentId is null.
  function assign(profile, characterId, equipmentId, gameData) {
    if (!profile.team.includes(characterId)) return { profile, error: "not_in_team" };
    const map = { ...(profile.equipment || {}) };
    if (equipmentId === null) {
      delete map[characterId];
    } else {
      const item = itemById(gameData, equipmentId);
      if (!item) return { profile, error: "unknown_equipment" };
      if (!item.supported) return { profile, error: "not_supported" };
      for (const k of Object.keys(map)) if (map[k] === equipmentId) delete map[k];
      map[characterId] = equipmentId;
    }
    return { profile: { ...profile, equipment: cleanEquipment(map, profile.team, gameData) }, error: null };
  }

  // Snapshot for battle state: [{ id, name, type, holder, ...level-1 effect }].
  function battleLoadout(profile, gameData) {
    const map = cleanEquipment(profile.equipment || {}, profile.team, gameData);
    return Object.entries(map).map(([holder, eid]) => {
      const item = itemById(gameData, eid);
      const effect = { ...item.levels[0] };
      delete effect.text;
      return { id: item.id, name: item.name, type: item.type, holder, ...effect };
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
