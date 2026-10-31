(function () {
  const M = ITE.music;
  const WAVES = ["sine", "triangle", "square", "sawtooth"];

  test("music: home, story, battle and opening epic loops are original note data, lively, and line up", () => {
    assert.deepEqual(Object.keys(M.TRACKS).sort(), ["battle", "epic", "home", "story"]);
    const okNote = (n) => Number.isInteger(n) && n >= 28 && n <= 100;
    for (const [name, t] of Object.entries(M.TRACKS)) {
      assert.ok(t.bpm >= 110 && t.bpm <= 180, `${name} tempo is lively (user: too sleepy before)`);
      const len = t.parts[0].notes.length;
      assert.equal(len, 64, `${name} loops every 8 bars`);
      assert.ok(t.parts.some((p) => p.drum), `${name} has drums`);
      for (const p of t.parts) {
        assert.equal(p.notes.length, len, `${name}: every part has the same length`);
        if (p.drum) {
          assert.ok(["kick", "snare", "hat"].includes(p.drum), `${name} drum`);
          assert.ok(p.notes.every((n) => n === 0 || n === 1), `${name} drum pattern`);
          assert.ok(p.v > 0 && p.v <= 0.2, `${name} drum volume`);
          continue;
        }
        assert.ok(WAVES.includes(p.wave), `${name} wave`);
        assert.ok(p.notes.every((n) => n === 0 || okNote(n) || (Array.isArray(n) && n.length === 2 && n.every(okNote))), `${name} notes`);
        assert.ok(p.v > 0 && p.v <= 0.1, `${name}: music stays quieter than sound effects`);
        assert.ok(p.len > 0 && p.len <= 1, `${name}: short, bouncy notes`);
      }
    }
    // At least one comic slide in every track.
    for (const t of Object.values(M.TRACKS)) assert.ok(t.parts.some((p) => !p.drum && p.notes.some(Array.isArray)));
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
