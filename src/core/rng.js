// Seeded RNG so battles and question draws are reproducible in tests.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  function createRng(seed) {
    let a = seed >>> 0;
    // mulberry32
    return function next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(list, rng) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  ITE.rng = { createRng, shuffle };
})(globalThis);
