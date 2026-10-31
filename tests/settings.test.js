(function () {
  const S = ITE.save;

  test("settings: new saves have sound on and the tutorial not yet seen", () => {
    assert.deepEqual(S.defaultSave().settings, { sound: true, tutorialDone: false });
  });

  test("settings: older saves get the defaults without counting as damage", () => {
    const store = S.createMemoryStorage();
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null }));
    const loaded = S.load(store);
    assert.equal(loaded.status, "ok");
    assert.deepEqual(loaded.save.settings, { sound: true, tutorialDone: false });
  });

  test("settings: choices survive save/load; bad values fall back to the defaults", () => {
    const store = S.createMemoryStorage();
    S.persist(store, { ...S.defaultSave(), settings: { sound: false, tutorialDone: true } });
    assert.deepEqual(S.load(store).save.settings, { sound: false, tutorialDone: true });
    store.setItem(S.SAVE_KEY, JSON.stringify({ version: 1, stages: {}, activeBattle: null, settings: { sound: "off", tutorialDone: 1 } }));
    const bad = S.load(store);
    assert.deepEqual(bad.save.settings, { sound: true, tutorialDone: false });
    assert.equal(bad.status, "repaired");
  });
})();
