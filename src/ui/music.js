// 背景音樂 (user request 2026-10-31). Short original loops (8 bars), written here as
// note numbers and synthesised with the Web Audio API: no audio files.
// One track per kind of screen; result screens are silent so the win / lose
// jingle stands out. Quieter than the sound effects, and can be turned off in 設定.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  // Notes are MIDI numbers (60 = middle C), 0 = rest, [from, to] = a comic
  // slide ("boing"). One entry per step; stepsPerBeat 2 = eighth notes, so
  // 8 steps = one bar. Drum parts use 1 = hit, 0 = silence.
  // Every part of a track has the same length (8 bars).
  // User feedback 2026-10-31: the first versions were too sleepy — these are
  // faster, bouncy (staccato, oom-pah bass), with drums and comic slides.
  const rep = (pattern, times) => [].concat(...Array(times).fill(pattern));
  const oomPah = (root, fifth) => [root, 0, 0, 0, fifth, 0, 0, 0];
  const stabs = (note) => [0, 0, note, 0, 0, 0, note, 0];
  const pump = (r) => rep([r, r + 12], 4);

  const TRACKS = {
    // 主頁: bouncy C major "march of the nerds" — oom-pah bass, chord stabs, boings.
    home: {
      bpm: 132,
      stepsPerBeat: 2,
      parts: [
        { wave: "square", v: 0.035, len: 0.45, notes: [
          67, 0, 72, 0, 76, 0, 79, 77,
          76, 0, 74, 0, 72, 0, [67, 72], 0,
          69, 0, 72, 0, 77, 0, 81, 79,
          77, 76, 74, 0, [79, 67], 0, 0, 0,
          72, 74, 76, 72, 79, 0, 76, 0,
          77, 79, 81, 77, 84, 0, 81, 0,
          83, 0, 84, 0, 79, 0, 76, 0,
          74, 0, [71, 74], 0, 72, 0, 0, 0] },
        { wave: "triangle", v: 0.09, len: 0.4, notes: [].concat(oomPah(48, 43), oomPah(43, 50), oomPah(41, 48), oomPah(43, 50), oomPah(48, 43), oomPah(41, 48), oomPah(43, 50), oomPah(48, 43)) },
        { wave: "square", v: 0.018, len: 0.25, notes: [].concat(stabs(64), stabs(62), stabs(65), stabs(62), stabs(64), stabs(65), stabs(62), stabs(64)) },
        { wave: "square", v: 0.018, len: 0.25, notes: [].concat(stabs(67), stabs(67), stabs(69), stabs(67), stabs(67), stabs(69), stabs(71), stabs(67)) },
        { drum: "kick", v: 0.18, notes: rep([1, 0, 0, 0, 1, 0, 0, 0], 8) },
        { drum: "snare", v: 0.07, notes: rep([0, 0, 1, 0, 0, 0, 1, 0], 8) },
        { drum: "hat", v: 0.025, notes: rep([0, 1, 0, 1, 0, 1, 0, 1], 8) },
      ],
    },
    // 故事模式: lighter but awake — marimba-like arpeggios and a shaker.
    story: {
      bpm: 112,
      stepsPerBeat: 2,
      parts: [
        { wave: "triangle", v: 0.055, len: 0.35, notes: [
          69, 72, 76, 72, 79, 76, 72, 76,
          67, 71, 74, 71, 79, 74, 71, 74,
          65, 69, 72, 69, 77, 72, 69, 72,
          64, 67, 71, 67, [76, 79], 0, 0, 0,
          69, 72, 76, 81, 79, 76, 72, 69,
          67, 71, 74, 79, 77, 74, 71, 67,
          65, 69, 72, 77, 76, 72, 69, 65,
          64, 0, 68, 0, 71, 0, [69, 76], 0] },
        { wave: "sine", v: 0.08, len: 0.8, notes: [].concat(oomPah(45, 52), oomPah(43, 50), oomPah(41, 48), oomPah(40, 47), oomPah(45, 52), oomPah(43, 50), oomPah(41, 48), oomPah(40, 44)) },
        { drum: "kick", v: 0.12, notes: rep([1, 0, 0, 0, 0, 0, 0, 0], 8) },
        { drum: "hat", v: 0.022, notes: rep([0, 1, 1, 1, 0, 1, 1, 1], 8) },
      ],
    },
    // 戰鬥 (DSE, 公會): fast D minor chase — pumping octave bass, four-on-the-floor,
    // a rising "whistle" and a falling "boing".
    battle: {
      bpm: 168,
      stepsPerBeat: 2,
      parts: [
        { wave: "square", v: 0.032, len: 0.5, notes: [
          74, 74, 0, 77, 0, 74, 81, 0,
          79, 77, 76, 77, [74, 86], 0, 0, 0,
          74, 74, 0, 77, 0, 74, 82, 0,
          81, 79, 77, 76, 77, 0, 74, 0,
          86, 0, 84, 0, 82, 0, 81, 0,
          82, 81, 79, 77, 79, 0, [81, 69], 0,
          74, 77, 81, 86, 84, 81, 77, 74,
          73, 0, 76, 0, [73, 74], 0, 0, 0] },
        { wave: "triangle", v: 0.09, len: 0.4, notes: [].concat(pump(38), pump(38), pump(34), pump(36), pump(38), pump(34), pump(36), pump(33)) },
        { drum: "kick", v: 0.2, notes: rep([1, 0, 1, 0, 1, 0, 1, 0], 8) },
        { drum: "snare", v: 0.08, notes: rep([0, 0, 1, 0, 0, 0, 1, 1], 8) },
        { drum: "hat", v: 0.025, notes: rep([1, 1, 1, 1, 1, 1, 1, 1], 8) },
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

  // White noise for snare and hi-hat, made once per audio context.
  let noise = null;
  function noiseBuffer(ac) {
    if (noise && noise.ac === ac) return noise.buffer;
    const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.3), ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise = { ac, buffer };
    return buffer;
  }

  function drum(ac, master, kind, v, time) {
    const gain = ac.createGain();
    gain.connect(master);
    if (kind === "kick") {
      // A sine that drops fast in pitch.
      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
      gain.gain.setValueAtTime(v, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
      osc.connect(gain);
      osc.start(time);
      osc.stop(time + 0.18);
      return;
    }
    // Snare and hi-hat: filtered noise bursts.
    const src = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    src.buffer = noiseBuffer(ac);
    filter.type = "highpass";
    filter.frequency.value = kind === "hat" ? 7000 : 1200;
    const d = kind === "hat" ? 0.04 : 0.12;
    gain.gain.setValueAtTime(v, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + d);
    src.connect(filter).connect(gain);
    src.start(time);
    src.stop(time + d + 0.02);
  }

  function scheduleStep(ac, track, master, step, time) {
    const stepS = 60 / track.bpm / track.stepsPerBeat;
    for (const part of track.parts) {
      const note = part.notes[step % part.notes.length];
      if (!note) continue;
      if (part.drum) {
        drum(ac, master, part.drum, part.v, time);
        continue;
      }
      const [from, to] = Array.isArray(note) ? note : [note, null];
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      // Slides hold a little longer so the "boing" can be heard.
      const d = stepS * part.len * (to ? 2 : 1);
      osc.type = part.wave;
      osc.frequency.setValueAtTime(freq(from), time);
      if (to) osc.frequency.exponentialRampToValueAtTime(freq(to), time + d * 0.8);
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
