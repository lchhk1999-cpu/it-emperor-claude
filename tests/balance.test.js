(function () {
  const Bal = ITE.balance;
  const Dg = ITE.dungeons;
  const data = ITE.gameData;
  const won = { outcome: "won", correct: 8, answered: 10 };
  const stage = (difficulty) => Dg.worldStages().find((s) => s.world === "A" && s.difficulty === difficulty);

  test("balance: current rules give the same DSE rewards as the game", () => {
    const r = Bal.rules();
    assert.deepEqual(Bal.dseRewards(won, stage("hard"), r), ITE.profile.dseRewards(won));
    assert.equal(Bal.applyToGameData(data, null), data);
  });

  test("balance: the proposal pays more coins on harder stages, nothing extra on a loss", () => {
    const r = Bal.rules(Bal.TUNING);
    const coins = Dg.DIFFICULTY_ORDER.map((d) => Bal.dseRewards(won, stage(d), r).coins);
    for (let i = 1; i < coins.length; i++) assert.ok(coins[i] > coins[i - 1], `${coins}`);
    assert.equal(Bal.dseRewards({ outcome: "lost", correct: 2, answered: 10 }, stage("hard"), r).coins, 0);
  });

  test("balance: proposed pity changes only the SSR pity, not the workbook data object", () => {
    const tuned = Bal.applyToGameData(data, Bal.TUNING);
    assert.equal(ITE.gacha.pityThreshold(tuned), Bal.TUNING.pity);
    assert.equal(ITE.gacha.pityThreshold(data), 80);
  });

  test("balance: extra 傳說核心 chance drops on the chosen difficulty only", () => {
    const r = Bal.rules(Bal.TUNING);
    const hard = Bal.withRareChance(stage("hard"), r);
    assert.equal(Dg.materialDrops(hard, won, data, () => 0)["MAT-RARE"], 1);
    assert.equal(Dg.materialDrops(hard, won, data, () => 0.99)["MAT-RARE"], undefined);
    assert.equal(Bal.withRareChance(stage("easy"), r).drops.chance, undefined);
    assert.equal(Dg.materialDrops(Bal.withRareChance(stage("easy"), r), won, data, () => 0)["MAT-RARE"], undefined);
  });
})();
