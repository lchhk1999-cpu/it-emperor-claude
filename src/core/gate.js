// 驗證碼 (user request 2026-11-01): the trial site asks for the teacher's code
// once per device before the game opens, so a forwarded link alone is not
// enough. The page holds only a salted SHA-256 of the code (from the build,
// window.ITE_ACCESS); without it there is no gate. A deterrent, not security:
// the code can be changed any time, and devices then ask again.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});
  const SALT = "it-emperor-access-v1";
  const STORE_KEY = "it-emperor.access";

  // Letters and digits only, case-insensitive (scripts/build-web.sh does the same).
  const normalize = (code) => String(code || "").replace(/[^0-9a-z]/gi, "").toUpperCase();

  // SHA-256 of an ASCII string as hex (no crypto.subtle: works on any page).
  function sha256Hex(text) {
    const K = [];
    const H = [];
    const frac = (x) => ((x - Math.floor(x)) * 0x100000000) >>> 0;
    for (let n = 2, found = 0; found < 64; n++) {
      let prime = true;
      for (let d = 2; d * d <= n; d++) if (n % d === 0) prime = false;
      if (!prime) continue;
      if (found < 8) H.push(frac(Math.pow(n, 1 / 2)));
      K.push(frac(Math.pow(n, 1 / 3)));
      found++;
    }
    const bytes = Array.from(text, (c) => c.charCodeAt(0) & 0xff);
    const bitLen = bytes.length * 8;
    bytes.push(0x80);
    while (bytes.length % 64 !== 56) bytes.push(0);
    for (let i = 7; i >= 0; i--) bytes.push(i >= 4 ? 0 : (bitLen >>> (i * 8)) & 0xff);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let off = 0; off < bytes.length; off += 64) {
      const w = [];
      for (let i = 0; i < 16; i++) w[i] = (bytes[off + 4 * i] << 24) | (bytes[off + 4 * i + 1] << 16) | (bytes[off + 4 * i + 2] << 8) | bytes[off + 4 * i + 3];
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        [h, g, f, e, d, c, b, a] = [g, f, e, (d + t1) | 0, c, b, a, (t1 + t2) | 0];
      }
      [a, b, c, d, e, f, g, h].forEach((v, i) => (H[i] = (H[i] + v) | 0));
    }
    return H.map((v) => (v >>> 0).toString(16).padStart(8, "0")).join("");
  }

  const hashOf = (code) => sha256Hex(`${SALT}:${normalize(code)}`);

  // expected: the build's hash (falsy = no gate); stored: what this device saved.
  const needsCode = (expected, stored) => !!expected && stored !== expected;

  const check = (expected, code) => !!normalize(code) && hashOf(code) === expected;

  ITE.gate = { SALT, STORE_KEY, normalize, sha256Hex, hashOf, needsCode, check };
})(globalThis);
