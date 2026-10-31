// 背景音樂 (user request 2026-10-31). Short original loops, written here as
// note numbers and synthesised with the Web Audio API: no audio files.
// One track per kind of screen; result screens are silent so the win / lose
// jingle stands out. Quieter than the sound effects, and can be turned off in 設定.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  // Notes are MIDI numbers (60 = middle C), 0 = rest. One entry per step;
  // stepsPerBeat 2 = eighth notes. Every part of a track has the same length.
  const TRACKS = {
    // 主頁: relaxed, C major pentatonic.
    home: {
      bpm: 96,
      stepsPerBeat: 2,
      parts: [
        { wave: "triangle", v: 0.05, len: 0.9, notes: [76, 79, 81, 79, 76, 74, 72, 0, 74, 76, 79, 76, 74, 0, 72, 0, 76, 79, 81, 84, 81, 79, 76, 0, 74, 76, 74, 72, 0, 0, 0, 0] },
        { wave: "sine", v: 0.07, len: 1.6, notes: [48, 0, 0, 0, 43, 0, 0, 0, 41, 0, 0, 0, 48, 0, 0, 0, 45, 0, 0, 0, 40, 0, 0, 0, 43, 0, 0, 0, 48, 0, 0, 0] },
      ],
    },
    // 故事模式: gentle, A minor pentatonic, slower.
    story: {
      bpm: 84,
      stepsPerBeat: 2,
      parts: [
        { wave: "sine", v: 0.05, len: 1.4, notes: [69, 0, 72, 0, 76, 0, 74, 72, 69, 0, 0, 0, 67, 0, 69, 0, 72, 0, 74, 0, 76, 0, 79, 76, 74, 0, 0, 0, 72, 0, 0, 0] },
        { wave: "triangle", v: 0.06, len: 1.8, notes: [45, 0, 0, 0, 52, 0, 0, 0, 41, 0, 0, 0, 48, 0, 0, 0, 43, 0, 0, 0, 50, 0, 0, 0, 45, 0, 0, 0, 40, 0, 0, 0] },
      ],
    },
    // 戰鬥 (DSE, 公會): upbeat, D minor, driving bass and a soft off-beat tick.
    battle: {
      bpm: 138,
      stepsPerBeat: 2,
      parts: [
        { wave: "square", v: 0.025, len: 0.8, notes: [74, 0, 77, 74, 81, 0, 79, 77, 76, 0, 77, 76, 74, 0, 72, 0, 74, 0, 77, 79, 81, 0, 84, 81, 79, 77, 76, 0, 74, 0, 0, 0] },
        { wave: "triangle", v: 0.08, len: 0.45, notes: [38, 38, 50, 38, 38, 38, 50, 38, 34, 34, 46, 34, 36, 36, 48, 36, 38, 38, 50, 38, 38, 38, 50, 38, 34, 34, 46, 34, 33, 33, 45, 33] },
        { wave: "sine", v: 0.02, len: 0.2, notes: [0, 98, 0, 98, 0, 98, 0, 98, 0, 98, 0, 98, 0, 98, 0, 98, 0, 98, 0, 98, 0, 98, 0, 98, 0, 98, 0, 98, 0, 98, 0, 98] },
      ],
    },
  };

  const LOOKAHEAD_S = 0.15;
  const TICK_MS = 40;

  let enabled = true;
  let wanted = null; // track the current screen asks for
  let playing = null; // { name, master, step, nextTime, timer }

  const freq = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  function context() {
    return ITE.sound && ITE.sound.context ? ITE.sound.context() : null;
  }

  function scheduleStep(ac, track, master, step, time) {
    const stepS = 60 / track.bpm / track.stepsPerBeat;
    for (const part of track.parts) {
      const midi = part.notes[step % part.notes.length];
      if (!midi) continue;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const d = stepS * part.len;
      osc.type = part.wave;
      osc.frequency.setValueAtTime(freq(midi), time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(part.v, time + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + d);
      osc.connect(gain).connect(master);
      osc.start(time);
      osc.stop(time + d + 0.02);
    }
  }

  function stopNow() {
    if (!playing) return;
    const p = playing;
    playing = null;
    clearInterval(p.timer);
    const ac = context();
    if (ac) {
      p.master.gain.setTargetAtTime(0.0001, ac.currentTime, 0.15); // fade out
      setTimeout(() => p.master.disconnect(), 800);
    }
  }

  function start(name) {
    const ac = context();
    const track = TRACKS[name];
    if (!ac || !track) return;
    if (ac.state === "suspended") return; // waits for the first tap (see unlock)
    const master = ac.createGain();
    master.gain.setValueAtTime(0.0001, ac.currentTime);
    master.gain.setTargetAtTime(1, ac.currentTime, 0.3); // fade in
    master.connect(ac.destination);
    const p = { name, master, step: 0, nextTime: ac.currentTime + 0.1, timer: null };
    const stepS = 60 / track.bpm / track.stepsPerBeat;
    p.timer = setInterval(() => {
      while (p.nextTime < ac.currentTime + LOOKAHEAD_S) {
        scheduleStep(ac, track, master, p.step, p.nextTime);
        p.step += 1;
        p.nextTime += stepS;
      }
    }, TICK_MS);
    playing = p;
  }

  // Ask for a track ("home", "story", "battle") or null for silence.
  function play(name) {
    wanted = name || null;
    if (!enabled || !wanted) return stopNow();
    if (playing && playing.name === wanted) return;
    stopNow();
    start(wanted);
  }

  // Browsers start audio only after a tap: resume then and start the wanted track.
  function unlock() {
    const ac = context();
    if (!ac) return;
    const go = () => {
      if (enabled && wanted && (!playing || playing.name !== wanted)) {
        stopNow();
        start(wanted);
      }
    };
    if (ac.state === "suspended" && ac.resume) {
      const r = ac.resume();
      if (r && r.then) r.then(go, () => {});
      else go();
    } else go();
  }

  function setEnabled(on) {
    enabled = !!on;
    if (!enabled) stopNow();
    else play(wanted);
  }

  if (root.document) {
    root.document.addEventListener("pointerdown", unlock);
    root.document.addEventListener("keydown", unlock);
    // Pause in the background (phone locked, other tab), carry on when back.
    root.document.addEventListener("visibilitychange", () => {
      const ac = context();
      if (!ac) return;
      if (root.document.hidden) ac.suspend && ac.suspend();
      else unlock();
    });
  }

  ITE.music = {
    TRACKS,
    play,
    setEnabled,
    isEnabled: () => enabled,
    current: () => (playing ? playing.name : null),
    wanted: () => wanted,
  };
})(globalThis);
