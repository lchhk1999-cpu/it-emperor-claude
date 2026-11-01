// 知識修練館 Python tracer: every Python example in the notes gives the output
// the notes state, and the brief's D05 / D06 / D09 / D11 checks hold.
(function () {
  const P = ITE.pytrace;
  const codeOf = (id, n) => ITE.revisionNotes.chapters.find((c) => c.id === id).sections.flatMap((s) => s.blocks).filter((b) => b.t === "code")[n || 0].text;
  const out = (code) => {
    const r = P.trace(code);
    assert.equal(r.error, null, JSON.stringify(r.error));
    return r.output.join("\n");
  };

  test("pytrace: every Python example in the notes prints what the notes say", () => {
    const expected = { D03: ["4 3 103.5"], D05: ["Silver"], D06: ["20", "2"], D07: ["16\n572\n7"], D08: ["-21 2 -2 -5.25"], D09: ["1", "True"], D10: ["[12, 18, 39]"], D11: ["2 11"] };
    for (const [id, outs] of Object.entries(expected)) outs.forEach((o, i) => assert.equal(out(codeOf(id, i)), o, id));
  });

  test("pytrace: brief checks — D05 85 is Gold, D06 range(2,9,2), D09 first match and -1", () => {
    assert.equal(out(codeOf("D05").replace("score = 76", "score = 85")), "Gold");
    assert.equal(out(codeOf("D05").replace("score = 76", "score = 84")), "Silver");
    assert.equal(out(codeOf("D05").replace("score = 76", "score = 85").replace("score >= 85", "score > 85")), "Silver", "the self-test's boundary bug");
    const loop = P.trace(codeOf("D06"));
    assert.deepEqual(loop.steps.filter((s) => s.event === "next").map((s) => s.vars.value), ["2", "4", "6", "8"]);
    assert.equal(loop.vars.total, "20");
    assert.equal(out(codeOf("D06").replace("range(2, 9, 2)", "range(8, 1, -2)")), "20");
    assert.equal(out(codeOf("D09")), "1");
    assert.equal(out(codeOf("D09").replace("target = 18", "target = 42")), "2");
    assert.equal(out(codeOf("D09").replace("target = 18", "target = 99")), "-1");
    assert.equal(out(codeOf("D11").replace("x > 3", "x >= 7")), "1 7");
  });

  test("pytrace: steps record the line, the variables and the output so far", () => {
    const r = P.trace(codeOf("D11"));
    assert.deepEqual(r.steps[0], { line: 1, vars: { count: "0" }, output: [], event: null });
    const afterLoops = r.steps.filter((s) => s.line === 3 && s.event === "next").map((s) => s.vars.x);
    assert.deepEqual(afterLoops, ["4", "7", "2"]);
    assert.deepEqual(r.steps[r.steps.length - 1].output, ["2 11"]);
  });

  test("pytrace: errors stop the trace with a clear message; loops are capped", () => {
    assert.equal(P.trace("items = [1, 2]\nprint(items[2])").error.kind, "IndexError");
    assert.equal(P.trace("print(total)").error.kind, "NameError");
    assert.equal(P.trace("x = 1\nwhile x > 0:\n    x = x + 1").error.kind, "StepLimit");
    assert.equal(P.trace('s = "ab"\ns[0] = "c"').error.kind, "TypeError");
    assert.equal(P.trace("SELECT ID FROM Member").error.kind, "SyntaxError");
    assert.equal(P.repr({ float: 4 }), "4.0");
    assert.equal(out("print(7 / 2, 7 // 2, -7 // 2, 7 % 3)"), "3.5 3 -4 1");
  });
})();
