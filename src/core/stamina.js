// 體力 (P5-03). Workbook GameConfig: starter_stamina (max at Lv 1) and
// level_up_stamina (max +N per level); note "僅限制資源活動，不限制學習".
// User decision 2026-10-31: story mode and the guild never cost stamina.
// - DSE world stages and the daily limited stage cost stamina. Without enough,
//   the player can still play as practice: experience only, no materials or coins.
// - Mixed practice is free and drops nothing.
// - 1 point back every 5 minutes up to the max; levelling up refills to the max.
// PROTOTYPE: regen speed and costs are placeholders until playtested.
// profile.stamina = { value, updatedAt } (updatedAt: when value was last exact).
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const STAMINA_RULES = { regenMs: 5 * 60 * 1000, defaultStarter: 40, defaultPerLevel: 2 };

  function maxStamina(level, config, rules) {
    const r = rules || STAMINA_RULES;
    const starter = config && Number.isInteger(config.starter_stamina) ? config.starter_stamina : r.defaultStarter;
    const perLevel = config && Number.isInteger(config.level_up_stamina) ? config.level_up_stamina : r.defaultPerLevel;
    return starter + Math.max(0, level - 1) * perLevel;
  }

  // Stamina right now. A save without stamina starts full; a clock that went
  // backwards (updatedAt in the future) regenerates nothing.
  function current(profile, config, now, rules) {
    const r = rules || STAMINA_RULES;
    const max = maxStamina(profile.level, config, r);
    const s = profile.stamina;
    if (!s) return { value: max, max, updatedAt: now };
    if (s.value >= max) return { value: s.value, max, updatedAt: now };
    const gained = Math.max(0, Math.floor((now - s.updatedAt) / r.regenMs));
    if (s.value + gained >= max) return { value: max, max, updatedAt: now };
    // Keep the partial progress towards the next point.
    return { value: s.value + gained, max, updatedAt: Math.min(now, s.updatedAt + gained * r.regenMs) };
  }

  // Milliseconds until the next point (0 when full).
  function nextPointIn(profile, config, now, rules) {
    const r = rules || STAMINA_RULES;
    const c = current(profile, config, now, r);
    return c.value >= c.max ? 0 : Math.max(0, c.updatedAt + r.regenMs - now);
  }

  // Returns { profile } or { profile, error: "not_enough_stamina" }.
  function spend(profile, cost, config, now, rules) {
    const c = current(profile, config, now, rules);
    if (cost <= 0) return { profile };
    if (c.value < cost) return { profile, error: "not_enough_stamina" };
    // Spending from full starts the regen timer now.
    const updatedAt = c.value >= c.max ? now : c.updatedAt;
    return { profile: { ...profile, stamina: { value: c.value - cost, updatedAt } } };
  }

  function refill(profile, config, now, rules) {
    return { ...profile, stamina: { value: maxStamina(profile.level, config, rules), updatedAt: now } };
  }

  // Stamina a DSE stage costs: world stages cost their question count; the
  // limited stage uses its workbook stamina_cost (question count when 0);
  // mixed practice is free.
  function stageCost(stage) {
    if (!stage || !stage.kind) return 0;
    if (stage.kind === "limited") return stage.staminaCost > 0 ? stage.staminaCost : stage.questionCount;
    return stage.questionCount;
  }

  ITE.stamina = { STAMINA_RULES, maxStamina, current, nextPointIn, spend, refill, stageCost };
})(globalThis);
