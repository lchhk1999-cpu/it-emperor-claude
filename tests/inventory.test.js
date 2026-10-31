(function () {
  const I = ITE.inventory;
  const P = ITE.profile;
  const S = ITE.save;
  const data = ITE.gameData;
  const fresh = () => P.defaultProfile(data);

  test("inventory: workbook materials imported (9 items, evolution materials per topic)", () => {
    assert.equal(data.materials.length, 9);
    assert.equal(I.materialById(data, "MAT-SQL").name, "資料碎片");
    assert.equal(I.materialById(data, "MAT-RARE").rarity, "legendary");
    assert.equal(I.materialById(data, "NOPE"), null);
  });

  test("inventory: new player has an empty backpack; every material is listed with 0", () => {
    const list = I.materialList(fresh(), data);
    assert.equal(list.length, 9);
    assert.ok(list.every((m) => m.count === 0));
  });

  test("inventory: adding materials stacks, ignores unknown ids or bad counts, stops at 9999", () => {
    let p = I.addMaterials(fresh(), { "MAT-SQL": 2 }, data);
    p = I.addMaterials(p, { "MAT-SQL": 3, "MAT-PY": 1, NOPE: 5, "MAT-HW": -1, "MAT-NET": 1.5 }, data);
    assert.deepEqual(p.materials, { "MAT-SQL": 5, "MAT-PY": 1 });
    p = I.addMaterials(p, { "MAT-SQL": 20000 }, data);
    assert.equal(I.count(p, "MAT-SQL"), 9999);
    assert.equal(I.count(p, "MAT-EXCEL"), 0);
  });

  test("inventory: materials survive save/load; bad entries are dropped; old saves still load", () => {
    const store = S.createMemoryStorage();
    const p = I.addMaterials(fresh(), { "MAT-SQL": 4 }, data);
    S.persist(store, { ...S.defaultSave(), profile: p });
    assert.deepEqual(S.load(store).save.profile.materials, { "MAT-SQL": 4 });
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null, profile: { level: 1, exp: 0, coins: 0, gems: 0, team: [], materials: { "MAT-SQL": 2, "MAT-PY": -3, "MAT-HW": "9", "MAT-NET": 1.5 } } }));
    const loaded = S.load(store);
    assert.deepEqual(loaded.save.profile.materials, { "MAT-SQL": 2 });
    assert.equal(loaded.status, "repaired");
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null, profile: { level: 1, exp: 0, coins: 0, gems: 0, team: [] } }));
    assert.equal(S.load(store).save.profile.materials, undefined);
    assert.equal(I.count(S.load(store).save.profile, "MAT-SQL"), 0);
  });
})();
