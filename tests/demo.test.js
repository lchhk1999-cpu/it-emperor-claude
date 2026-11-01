(function () {
  const D = ITE.demo;
  const data = ITE.gameData;

  test("demo: the 老師示範版 profile starts rich with everything owned", () => {
    const p = D.seedProfile(data);
    assert.equal(p.level, 30);
    assert.ok(p.coins >= 99999 && p.gems >= 9999);
    assert.equal(p.owned.characters.length, data.characters.length, "every character, URs included");
    assert.ok(p.owned.characters.includes("CH-ITEMPEROR") && p.owned.characters.includes("CH-BUGLORD"));
    assert.ok(data.equipment.filter((e) => e.supported).every((e) => p.owned.equipment.includes(e.id)));
    assert.equal(p.team.length, 5);
    assert.equal(data.characters.find((c) => c.id === p.team[0]).rarity, "UR", "leads with a UR");
    assert.ok(data.materials.every((m) => p.materials[m.id] === 99));
    assert.equal(p.name, "老師示範");
    // survives the normal save checks unchanged
    const store = ITE.save.createMemoryStorage();
    ITE.save.persist(store, { ...ITE.save.defaultSave(), profile: p });
    const r = ITE.save.load(store);
    assert.equal(r.status, "ok");
    assert.deepEqual(r.save.profile.owned, p.owned);
  });

  test("demo: its save uses separate keys and the flag is off unless the build sets it", () => {
    const base = ITE.save.createMemoryStorage();
    const demo = D.prefixedStorage(base);
    demo.setItem(ITE.save.SAVE_KEY, "x");
    assert.equal(base.getItem(ITE.save.SAVE_KEY), null, "real save untouched");
    assert.equal(base.getItem("demo." + ITE.save.SAVE_KEY), "x");
    demo.removeItem(ITE.save.SAVE_KEY);
    assert.equal(demo.getItem(ITE.save.SAVE_KEY), null);
    assert.equal(D.enabled(), false);
  });
})();
(function () {
  const D = ITE.demo;
  const data = ITE.gameData;
  const now = Date.UTC(2026, 10, 2, 4);
  test("demo: a new demo save shows titles on several tiers and 知識修練館 progress with reviews due", () => {
    const s = D.seedSave(data, now);
    const M = ITE.missions;
    const title = (id) => data.titles.find((t) => t.id === id);
    const tiers = ["T-NEW", "T-EXCEL", "T-CORRECT500", "T-STREAK20", "T-DRILL"].map((id) => M.titleStatus(s.progress, title(id), { profile: s.profile }).tierName);
    assert.deepEqual(tiers, ["白金", "銀", "銅", "銅", "銀"]);
    assert.equal(M.equippedTitle(s.progress, data.titles, { profile: s.profile }).id, "T-EXCEL");
    const R = ITE.revision;
    assert.equal(R.lastCard(s.profile).id, "A11-05");
    const due = R.dueCards(s.profile, now).map((c) => c.id);
    assert.ok(due.includes("A11-05") && due.includes("A11-01"), due.join());
    // The seeded save passes the normal save checks unchanged.
    const store = ITE.save.createMemoryStorage();
    ITE.save.persist(store, { ...ITE.save.defaultSave(), profile: s.profile, progress: s.progress });
    assert.equal(ITE.save.load(store).status, "ok");
  });
})();
