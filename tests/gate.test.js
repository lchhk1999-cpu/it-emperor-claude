(function () {
  const G = ITE.gate;
  test("gate: SHA-256 matches the standard test vectors", () => {
    assert.equal(G.sha256Hex(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    assert.equal(G.sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    assert.equal(G.sha256Hex("a".repeat(100)).length, 64);
  });
  test("gate: codes ignore case, spaces and symbols; only the right code passes", () => {
    const expected = G.hashOf("ab12cd");
    assert.ok(G.check(expected, " AB 12-cd "));
    assert.ok(!G.check(expected, "ab12ce"));
    assert.ok(!G.check(expected, ""));
    assert.equal(G.normalize("a b-1!"), "AB1");
  });
  test("gate: no code in the build means no gate; a changed code asks again", () => {
    assert.ok(!G.needsCode(undefined, null));
    assert.ok(G.needsCode(G.hashOf("one"), null));
    assert.ok(!G.needsCode(G.hashOf("one"), G.hashOf("one")));
    assert.ok(G.needsCode(G.hashOf("two"), G.hashOf("one")));
  });
})();
