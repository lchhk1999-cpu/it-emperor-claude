// 知識修練館 Excel engine: the notes' own formula tables (A10–A13) and the
// acceptance values from the ChatGPT brief must come out exactly.
(function () {
  const X = ITE.excel;
  // A09 shared data (header row 1, data rows 2–6), A13 threshold tables, A09 G2.
  const sheet = () => {
    const s = X.sheetFromRows(
      [
        ["編號", "分數", "挑戰次數", "組別"],
        ["P101", 72, 3, "松"],
        ["P102", 48, 1, "柏"],
        ["P103", 90, 4, "松"],
        ["P104", 60, 2, "柏"],
        ["P105", 80, 0, "松"],
      ],
      1
    );
    Object.assign(s, { F2: 0, G2: "起步", F3: 60, G3: "熟練", F4: 80, G4: "精通", J2: 0, K2: 60, L2: 80, J3: "起步", K3: "熟練", L3: "精通" });
    return s;
  };
  const show = (f, s) => X.display(X.evaluate(f, s || sheet()));

  test("excel: brief acceptance values (A10, A11, A12, A13)", () => {
    assert.equal(show("=SUM(B2:B6)"), "350");
    assert.equal(show("=AVERAGE(B2:B6)"), "70");
    assert.equal(show('=SUMIF(D2:D6,"松",B2:B6)'), "242");
    const s = sheet();
    s.B5 = 60;
    s.C5 = 2;
    assert.equal(show('=IF(AND(B5>=60,C5>=2),"獲獎","未達標")', s), "獲獎");
    s.B5 = 59;
    assert.equal(show('=IF(AND(B5>=60,C5>=2),"獲獎","未達標")', s), "未達標");
    assert.equal(show("=INT(-8.1)"), "-9");
    assert.equal(show('=MID("ICT-572",5,2)'), "57");
    assert.equal(show("=VLOOKUP(72,F2:G4,2,FALSE)"), "#N/A", "exact match never falls back to approximate");
    assert.equal(show("=VLOOKUP(72,F2:G4,2,TRUE)"), "熟練");
    assert.equal(show("=VLOOKUP(72,F2:G4,2)"), "熟練", "omitted = approximate");
  });

  test("excel: every formula table in the notes (A10–A13) gives the stated result", () => {
    let checked = 0;
    for (const ch of ITE.revisionNotes.chapters.filter((c) => ["A10", "A11", "A12", "A13"].includes(c.id))) {
      for (const s of ch.sections)
        for (const b of s.blocks) {
          if (b.t !== "table" || b.rows[0][0] !== "公式" || b.rows[0][1] !== "結果") continue;
          for (const [formula, result] of b.rows.slice(1)) {
            if (/RAND\(/.test(formula)) continue;
            assert.equal(show(formula), result, `${ch.id} ${formula}`);
            checked++;
          }
        }
    }
    assert.ok(checked >= 24, `checked ${checked} formulas`);
  });

  test("excel: the notes' worked examples in text (A09, A11, A13) and the self-test answers", () => {
    const s = sheet();
    s.G2 = 1.1;
    assert.equal(show("=B2*$G$2", s), "79.2");
    assert.equal(X.shiftFormula("=B2*$G$2", 1, 0), "=B3*$G$2");
    assert.equal(show(X.shiftFormula("=B2*$G$2", 1, 0), s), "52.8");
    assert.equal(X.shiftFormula("=B2*$G$2", 2, 0), "=B4*$G$2");
    // A09 table: one column right, one row down.
    assert.deepEqual(["B2", "$B$2", "$B2", "B$2"].map((r) => X.shiftFormula(r, 1, 1)), ["C3", "$B$2", "$B3", "C$2"]);
    assert.equal(show('=IF(B2>=80,"精通",IF(B2>=60,"熟練","起步"))'), "熟練");
    assert.equal(show('=IF(B4>=80,"精通",IF(B4>=60,"熟練","起步"))'), "精通");
    assert.equal(show('=VLOOKUP("P104",A2:D6,2,FALSE)'), "60");
    assert.equal(show("=HLOOKUP(85,J2:L3,2,TRUE)"), "精通");
    assert.equal(show('=XLOOKUP("P104",A2:A6,B2:B6,"找不到")'), "60");
    assert.equal(show("=VLOOKUP(59,F2:G4,2,TRUE)"), "起步");
    assert.equal(show('=COUNTIF(C2:C6,">0")'), "4");
    assert.equal(show('=SUMIF(D2:D6,"柏",B2:B6)'), "108");
    assert.equal(show('=MID("S6-ICT",4,3)'), "ICT");
    assert.equal(show("=RANK(B6,$B$2:$B$6,0)"), "2");
  });

  test("excel: errors and text behave like Excel", () => {
    assert.equal(show("=1/0"), "#DIV/0!");
    assert.equal(show("=FOO(1)"), "#NAME?");
    assert.equal(show("=SUM(B2:B6"), "#SYNTAX");
    assert.equal(show('="組別："&D2'), "組別：松");
    assert.equal(show('=COUNTIF(B2:B6,">=60")'), "4");
    assert.equal(show("=0.1+0.2"), "0.3");
    assert.equal(show("=ROUND(-2.5,0)"), "-3");
  });
})();
