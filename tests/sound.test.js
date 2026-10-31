(function () {
  const Snd = ITE.sound;
  const WAVES = ["sine", "triangle", "square", "sawtooth"];

  test("sound: every game event has a short, quiet, synthesised sound", () => {
    for (const name of ["tap", "stageStart", "correct", "wrong", "win", "lose", "levelUp", "reward", "gacha", "gachaSSR", "evolve"]) {
      const notes = Snd.SOUNDS[name];
      assert.ok(notes && notes.length, name);
      for (const n of notes) {
        assert.ok(WAVES.includes(n.type), `${name} wave`);
        assert.ok(n.f >= 50 && n.f <= 4000 && (!n.to || (n.to >= 50 && n.to <= 4000)), `${name} pitch`);
        assert.ok(n.t >= 0 && n.d > 0, `${name} timing`);
        assert.ok(n.v > 0 && n.v <= 0.3, `${name} volume stays low for classrooms`);
      }
      const length = Math.max(...notes.map((n) => n.t + n.d));
      assert.ok(length <= 1.2, `${name} is short (${length}s)`);
    }
  });

  test("sound: playing without audio support or when turned off does nothing and never throws", () => {
    Snd.setEnabled(true);
    Snd.play("correct"); // no AudioContext in the test engine
    Snd.play("no-such-sound");
    Snd.setEnabled(false);
    assert.equal(Snd.isEnabled(), false);
    Snd.play("win");
    Snd.setEnabled(true);
  });
})();
