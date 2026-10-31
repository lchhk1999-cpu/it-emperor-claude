// Balance simulator: plays a school year (36 weeks) as three kinds of student
// with the real game rules (battle, stamina, rewards, gacha, growth) and
// reports when each milestone is reached (median of nine runs). Fake questions;
// accuracy is a dice roll. Students play today's limited stage first.
//
// Run from the repo root:
//   ./scripts/jsc.sh tools/balance_sim.js            -> current rules
//   ./scripts/jsc.sh tools/balance_sim.js -- tuned   -> current rules + BALANCE_TUNING
// Output is Markdown (pasted into docs/BALANCE_REPORT.md).
const args = typeof scriptArgs !== "undefined" ? scriptArgs : typeof arguments !== "undefined" ? arguments : [];
const variant = args[0] || "current";

["src/core/rng.js", "src/core/questions.js", "src/core/battle.js", "src/core/save.js", "src/core/guildRaid.js",
  "src/core/profile.js", "src/core/missions.js", "src/core/equipment.js", "src/core/gacha.js", "src/core/inventory.js",
  "src/core/dungeons.js", "src/core/stamina.js", "src/core/growth.js", "src/core/balance.js", "src/data/game_data.js"].forEach((f) => load(f));

const P = ITE.profile, B = ITE.battle, G = ITE.gacha, Gr = ITE.growth, St = ITE.stamina, Dg = ITE.dungeons, I = ITE.inventory;
const Bal = ITE.balance;
const tuned = variant === "tuned";
const rules = Bal.rules(tuned ? Bal.TUNING : null);
const data = tuned ? Bal.applyToGameData(ITE.gameData, Bal.TUNING) : ITE.gameData;

const MIN = 60 * 1000, DAY = 24 * 60 * MIN;
const START = Date.UTC(2026, 8, 7, 0, 0); // a Monday, 08:00 HKT
const WEEKS = 36;

// Kinds of student: days played per week, sessions per day (HKT hour), battles per
// session, accuracy, and which difficulties they pick as they get stronger.
const PLAYERS = [
  { id: "casual", name: "輕度（每週 5 日、每日 1 次、2 場、答對 65%）", days: 5, sessions: [19], battles: 2, accuracy: 0.65, pick: ["easy", "medium"] },
  { id: "regular", name: "一般（每週 6 日、每日 2 次、各 2 場、答對 75%）", days: 6, sessions: [17, 21], battles: 2, accuracy: 0.75, pick: ["medium", "hard"] },
  { id: "keen", name: "投入（每日 3 次、各 3 場、答對 85%）", days: 7, sessions: [7, 17, 21], battles: 3, accuracy: 0.85, pick: ["medium", "hard", "ultimate"] },
];

function fakeQuestions(world) {
  const out = [];
  for (const topic of world.topics) {
    for (const difficulty of ["easy", "medium", "hard"]) {
      for (let i = 0; i < 12; i++) {
        out.push({ question_id: `${topic}-${difficulty}-${i}`, topic_id: topic, difficulty, stem: "Q", option_a: "a", option_b: "b", option_c: "c", option_d: "d", answer: "A", explanation: "e", review_status: "approved" });
      }
    }
  }
  return out;
}
const POOLS = Object.fromEntries(Dg.WORLDS.map((w) => [w.id, fakeQuestions(w)]));

function playBattle(profile, stage, accuracy, rng) {
  const team = P.teamSnapshot(profile, data);
  const pool = Dg.stagePool(stage, stage.topicIds ? POOLS[stage.world] : [].concat(...Object.values(POOLS)), rng);
  let s = B.createBattle(stage, pool, rng, team, []);
  while (!s.outcome) {
    const q = B.currentQuestion(s);
    s = B.answer(s, rng() < accuracy ? q.answer : q.answer === "A" ? "B" : "A");
    s = B.next(s);
  }
  return B.summary(s);
}

function simulate(player, seed) {
  const rng = ITE.rng.createRng(seed);
  let p = { ...P.defaultProfile(data), stamina: undefined, gems: rules.starterGems };
  const firsts = {};
  const mark = (key, day) => (firsts[key] === undefined ? (firsts[key] = day) : null);
  let wins = 0, losses = 0, practice = 0, coinsEarned = 0, gemsEarned = 0;
  const leader = () => p.team[0];

  for (let day = 0; day < WEEKS * 7; day++) {
    const weekday = day % 7; // 0 = Monday
    if (weekday >= player.days) continue;
    let answered = 0, cleared = 0, correctToday = 0;
    for (const hour of player.sessions) {
      const now = START + day * DAY + (hour - 8) * 60 * MIN;
      for (let b = 0; b < player.battles; b++) {
        const t = now + b * 4 * MIN;
        // First battle of the day: today's limited stage (if its world has questions);
        // then the hardest difficulty the player is comfortable with, by player level.
        const limited = Dg.limitedStage(data, t);
        const tierIndex = Math.min(player.pick.length - 1, Math.floor(p.level / 10));
        const world = Dg.WORLDS[(day + b) % Dg.WORLDS.length];
        const stage = b === 0 && hour === player.sessions[0] && limited
          ? { ...limited, world: limited.world || world.id, topicIds: limited.world ? limited.topicIds : null }
          : Bal.withRareChance(Dg.worldStages().find((s) => s.world === world.id && s.difficulty === player.pick[tierIndex]), rules);
        const cost = St.stageCost(stage);
        const paid = St.spend(p, cost, data.config, t);
        const isPractice = !!paid.error;
        if (!isPractice) p = paid.profile;
        const sum = playBattle(p, stage, player.accuracy, rng);
        answered += sum.answered;
        correctToday += sum.correct;
        const base = Bal.dseRewards(sum, stage, rules);
        const reward = isPractice ? { exp: base.exp, coins: 0 } : { ...base, materials: Dg.materialDrops(stage, sum, data, rng) };
        if (sum.outcome === "won") {
          wins++;
          cleared++;
        } else losses++;
        if (isPractice) practice++;
        const r = P.addReward(p, reward, data);
        p = reward.materials ? I.addMaterials(r.profile, reward.materials, data) : r.profile;
        if (r.levelsGained) p = St.refill(p, data.config, t);
        p = { ...p, gems: (p.gems || 0) + (r.levelsGained ? rules.levelUpGems * r.levelsGained : 0) };
        gemsEarned += r.levelsGained ? rules.levelUpGems * r.levelsGained : 0;
        coinsEarned += reward.coins || 0;
      }
    }
    // Daily missions (workbook): 10 answers -> 3 gems; clear a stage -> 2 gems + 50 coins.
    if (answered >= 10) (p.gems += 3), (gemsEarned += 3);
    if (cleared >= 1) (p.gems += 2), (p.coins += 50), (gemsEarned += 2), (coinsEarned += 50);
    // Weekly mission: 50 correct -> 10 gems + 100 coins (counted on the last play day).
    if (weekday === player.days - 1) (p.gems += 10), (p.coins += 100), (gemsEarned += 10), (coinsEarned += 100);
    // Spend: gacha first (characters), then level and evolve the team.
    while (p.gems >= rules.gachaCost) {
      const d = G.draw(p, "character", data, rng);
      if (d.error) break;
      p = d.profile;
      if (d.result.rarity === "SR") mark("firstSR", day);
      if (d.result.rarity === "SSR") mark("firstSSR", day);
    }
    // Fill the team with owned characters (highest rarity first).
    const slots = P.teamSlots(p.level, data.config);
    const owned = p.owned.characters.map((id) => data.characters.find((c) => c.id === id)).sort((a, b) => "R SR SSR".indexOf(b.rarity) - "R SR SSR".indexOf(a.rarity));
    p = { ...p, team: [leader()].concat(owned.map((c) => c.id).filter((id) => id !== leader())).slice(0, slots) };
    if (p.team.length >= 5) mark("teamOf5", day);
    for (const id of p.team) {
      for (;;) {
        const e = Gr.evolve(p, id, data);
        if (!e.error) {
          p = e.profile;
          if (id === leader()) mark(`evo${Gr.charGrowth(p, id).evo}`, day);
          continue;
        }
        const l = Gr.levelUp(p, id, data);
        if (l.error) break;
        p = l.profile;
      }
    }
    if (p.level >= 5) mark("level5", day);
    if (p.level >= 12) mark("level12", day);
  }
  return { p, firsts, wins, losses, practice, coinsEarned, gemsEarned };
}

function weeks(day) {
  return day === undefined ? "未達到" : `第 ${Math.floor(day / 7) + 1} 週`;
}

const lines = [`### ${tuned ? "建議調整後" : "現時數值"}`, "", "| 指標 | " + PLAYERS.map((p) => p.name).join(" | ") + " |", "|---|" + PLAYERS.map(() => "---").join("|") + "|"];
// Nine runs per student; every number below is the median of the nine.
const median = (xs) => {
  const v = xs.slice().sort((a, b) => (a === undefined ? 1 : b === undefined ? -1 : a - b));
  return v[Math.floor(v.length / 2)];
};
const results = PLAYERS.map((pl) => {
  const runs = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => simulate(pl, n * 7919));
  const keys = ["level5", "level12", "teamOf5", "firstSR", "firstSSR", "evo1", "evo2", "evo3"];
  return {
    firsts: Object.fromEntries(keys.map((k) => [k, median(runs.map((r) => r.firsts[k]))])),
    level: median(runs.map((r) => r.p.level)),
    owned: median(runs.map((r) => r.p.owned.characters.length)),
    leader: median(runs.map((r) => Gr.charGrowth(r.p, r.p.team[0]).level)),
    rare: median(runs.map((r) => (r.p.materials && r.p.materials["MAT-RARE"]) || 0)),
    gemsEarned: median(runs.map((r) => r.gemsEarned)),
    coinsEarned: median(runs.map((r) => r.coinsEarned)),
    wins: median(runs.map((r) => r.wins)),
    losses: median(runs.map((r) => r.losses)),
    practice: median(runs.map((r) => r.practice)),
  };
});
const row = (label, fn) => lines.push(`| ${label} | ${results.map(fn).join(" | ")} |`);
row("玩家 Lv 5（3 個隊伍位）", (r) => weeks(r.firsts.level5));
row("玩家 Lv 12（5 個隊伍位）", (r) => weeks(r.firsts.level12));
row("擁有 5 個角色、隊伍滿員", (r) => weeks(r.firsts.teamOf5));
row("第一個 SR", (r) => weeks(r.firsts.firstSR));
row("第一個 SSR", (r) => weeks(r.firsts.firstSSR));
row("隊長一階進化", (r) => weeks(r.firsts.evo1));
row("隊長二階進化", (r) => weeks(r.firsts.evo2));
row("隊長三階進化", (r) => weeks(r.firsts.evo3));
row("36 週後玩家等級", (r) => `Lv ${r.level}`);
row("36 週後隊長等級", (r) => `Lv ${r.leader}`);
row("36 週後擁有角色", (r) => `${r.owned} / ${data.characters.length}`);
row("手上未用傳說核心", (r) => `${r.rare}`);
row("每週平均寶石", (r) => `${Math.round(r.gemsEarned / WEEKS)}`);
row("每週平均金幣", (r) => `${Math.round(r.coinsEarned / WEEKS)}`);
row("勝出／落敗", (r) => `${r.wins} / ${r.losses}`);
row("體力不足改練習的場數", (r) => `${r.practice}`);
print(lines.join("\n") + "\n");
