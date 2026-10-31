(function () {
  const M = ITE.music;
  const WAVES = ["sine", "triangle", "square", "sawtooth"];

  test("music: home, story and battle loops are original note data, quiet, and line up", () => {
    assert.deepEqual(Object.keys(M.TRACKS).sort(), ["battle", "home", "story"]);
    for (const [name, t] of Object.entries(M.TRACKS)) {
      assert.ok(t.bpm >= 60 && t.bpm <= 180, `${name} tempo`);
      const len = t.parts[0].notes.length;
      assert.ok(len >= 16, `${name} long enough to loop`);
      for (const p of t.parts) {
        assert.ok(WAVES.includes(p.wave), `${name} wave`);
        assert.equal(p.notes.length, len, `${name}: every part has the same length`);
        assert.ok(p.notes.every((n) => n === 0 || (Number.isInteger(n) && n >= 28 && n <= 100)), `${name} notes`);
        assert.ok(p.v > 0 && p.v <= 0.1, `${name}: music stays quieter than sound effects`);
        assert.ok(p.len > 0 && p.len <= 2, `${name} note length`);
      }
    }
  });

  test("music: asking for tracks without audio support never throws; off means silence", () => {
    M.setEnabled(true);
    M.play("battle");
    assert.equal(M.wanted(), "battle");
    assert.equal(M.current(), null, "no audio in the test engine, so nothing actually plays");
    M.play(null);
    assert.equal(M.wanted(), null);
    M.setEnabled(false);
    M.play("home");
    assert.equal(M.current(), null);
    M.setEnabled(true);
  });
})();
