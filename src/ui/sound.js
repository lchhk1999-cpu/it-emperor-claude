// 音效 (user request 2026-10-31). Every sound is synthesised here with the Web
// Audio API from a few notes: original, no audio files, nothing downloaded.
// Volumes stay low for classroom use; players can turn sound off in 設定.
// Browsers (iOS Safari especially) only allow audio after a tap, so the audio
// context is created on the first sound, which always follows a tap.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  // Each note: t = start (s), d = length (s), f = pitch (Hz), to = slide-to pitch,
  // type = oscillator wave, v = volume (0-1).
  const SOUNDS = {
    tap: [{ t: 0, d: 0.05, f: 660, type: "triangle", v: 0.18 }],
    // 入關: a short rising fanfare when a battle or story level starts.
    stageStart: [
      { t: 0, d: 0.1, f: 392, type: "square", v: 0.1 },
      { t: 0.1, d: 0.1, f: 523, type: "square", v: 0.1 },
      { t: 0.2, d: 0.1, f: 659, type: "square", v: 0.1 },
      { t: 0.3, d: 0.35, f: 784, type: "triangle", v: 0.26 },
      { t: 0.3, d: 0.35, f: 392, type: "triangle", v: 0.16 },
    ],
    correct: [
      { t: 0, d: 0.09, f: 784, type: "triangle", v: 0.28 },
      { t: 0.08, d: 0.18, f: 1175, type: "triangle", v: 0.28 },
    ],
    wrong: [{ t: 0, d: 0.26, f: 220, to: 150, type: "square", v: 0.12 }],
    win: [
      { t: 0, d: 0.14, f: 523, type: "triangle", v: 0.26 },
      { t: 0.11, d: 0.14, f: 659, type: "triangle", v: 0.26 },
      { t: 0.22, d: 0.14, f: 784, type: "triangle", v: 0.26 },
      { t: 0.33, d: 0.42, f: 1047, type: "triangle", v: 0.28 },
    ],
    lose: [
      { t: 0, d: 0.2, f: 392, type: "sine", v: 0.25 },
      { t: 0.18, d: 0.2, f: 330, type: "sine", v: 0.25 },
      { t: 0.36, d: 0.4, f: 262, to: 247, type: "sine", v: 0.25 },
    ],
    levelUp: [
      { t: 0, d: 0.1, f: 523, type: "square", v: 0.1 },
      { t: 0.08, d: 0.1, f: 784, type: "square", v: 0.1 },
      { t: 0.16, d: 0.3, f: 1047, type: "triangle", v: 0.26 },
      { t: 0.16, d: 0.3, f: 1319, type: "sine", v: 0.14 },
    ],
    reward: [
      { t: 0, d: 0.07, f: 988, type: "triangle", v: 0.24 },
      { t: 0.07, d: 0.2, f: 1319, type: "triangle", v: 0.24 },
    ],
    gacha: [
      { t: 0, d: 0.08, f: 1047, type: "sine", v: 0.2 },
      { t: 0.06, d: 0.08, f: 1319, type: "sine", v: 0.2 },
      { t: 0.12, d: 0.08, f: 1568, type: "sine", v: 0.2 },
      { t: 0.18, d: 0.3, f: 2093, type: "sine", v: 0.2 },
    ],
    gachaSSR: [
      { t: 0, d: 0.08, f: 1047, type: "sine", v: 0.2 },
      { t: 0.06, d: 0.08, f: 1319, type: "sine", v: 0.2 },
      { t: 0.12, d: 0.08, f: 1568, type: "sine", v: 0.2 },
      { t: 0.2, d: 0.6, f: 523, type: "triangle", v: 0.22 },
      { t: 0.2, d: 0.6, f: 659, type: "triangle", v: 0.18 },
      { t: 0.2, d: 0.6, f: 784, type: "triangle", v: 0.18 },
      { t: 0.2, d: 0.7, f: 2093, type: "sine", v: 0.12 },
    ],
    // 盲盒: a boing when a box is tapped (pitch rises box by box), a rattle-and-pop when opened.
    boxTap: [{ t: 0, d: 0.16, f: 330, to: 660, type: "triangle", v: 0.2 }],
    boxOpen: [
      { t: 0, d: 0.05, f: 180, type: "square", v: 0.1 },
      { t: 0.08, d: 0.05, f: 200, type: "square", v: 0.1 },
      { t: 0.16, d: 0.05, f: 180, type: "square", v: 0.1 },
      { t: 0.24, d: 0.05, f: 220, type: "square", v: 0.1 },
      { t: 0.34, d: 0.25, f: 400, to: 1600, type: "sine", v: 0.22 },
      { t: 0.56, d: 0.3, f: 1568, type: "triangle", v: 0.2 },
    ],
    evolve: [
      { t: 0, d: 0.45, f: 330, to: 990, type: "sine", v: 0.22 },
      { t: 0.42, d: 0.35, f: 1319, type: "triangle", v: 0.24 },
    ],
  };

  let enabled = true;
  let ctx = null;

  function audio() {
    if (ctx) return ctx;
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch (e) {
      return null;
    }
    return ctx;
  }

  // pitch: optional multiplier (e.g. 1.25 plays everything a third higher).
  function play(name, pitch) {
    const notes = SOUNDS[name];
    const k = pitch > 0 ? pitch : 1;
    if (!enabled || !notes) return;
    const ac = audio();
    if (!ac) return;
    if (ac.state === "suspended" && ac.resume) ac.resume();
    const now = ac.currentTime + 0.01;
    for (const n of notes) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = n.type;
      osc.frequency.setValueAtTime(n.f * k, now + n.t);
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to * k, now + n.t + n.d);
      // Short fade in and out so notes do not click.
      gain.gain.setValueAtTime(0.0001, now + n.t);
      gain.gain.exponentialRampToValueAtTime(n.v, now + n.t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
      osc.connect(gain).connect(ac.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    }
  }

  ITE.sound = {
    SOUNDS,
    play,
    context: audio, // shared with background music (src/ui/music.js)
    setEnabled: (on) => (enabled = !!on),
    isEnabled: () => enabled,
  };
})(globalThis);
