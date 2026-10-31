// 每日簽到 (approved by the user 2026-10-31). One check-in per Hong Kong day.
// Rewards follow a 7-day cycle counted by total check-ins (missing a day does
// not restart the cycle). profile.checkin = { days, lastDay } where lastDay is
// the HKT day key ("2026-11-02") of the last check-in.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const CYCLE = [
    { coins: 100 },
    { gems: 5 },
    { topicMaterials: 3 },
    { coins: 200 },
    { gems: 5 },
    { materials: { "MAT-RARE": 1 } },
    { gems: 10 },
  ];

  const dayKey = (now) => ITE.guildRaid.hktDayKey(now);

  function state(profile) {
    return profile.checkin || { days: 0, lastDay: null };
  }

  function canCheckIn(profile, now) {
    return state(profile).lastDay !== dayKey(now);
  }

  // Which day of the 7-day cycle the next check-in is (0-6).
  function nextIndex(profile) {
    return state(profile).days % CYCLE.length;
  }

  // The reward as the game grants it: { coins, gems, materials }.
  function rewardFor(index, gameData, rng) {
    const r = CYCLE[index];
    const out = { coins: r.coins || 0, gems: r.gems || 0, materials: { ...(r.materials || {}) } };
    if (r.topicMaterials) {
      const topic = (gameData.materials || []).filter((m) => m.topic !== "ALL");
      if (topic.length) {
        const m = topic[Math.min(topic.length - 1, Math.floor(rng() * topic.length))];
        out.materials[m.id] = (out.materials[m.id] || 0) + r.topicMaterials;
      }
    }
    return out;
  }

  // Returns { profile, reward, index } or { profile, error: "already_checked_in" }.
  // The caller adds the reward (coins, gems, materials) to the profile.
  function checkIn(profile, gameData, now, rng) {
    if (!canCheckIn(profile, now)) return { profile, error: "already_checked_in" };
    const index = nextIndex(profile);
    const days = state(profile).days + 1;
    return { profile: { ...profile, checkin: { days, lastDay: dayKey(now) } }, reward: rewardFor(index, gameData, rng), index };
  }

  ITE.checkin = { CYCLE, state, canCheckIn, nextIndex, rewardFor, checkIn };
})(globalThis);
