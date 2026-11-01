// 知識修練館 labs: the pilot interactive flows for A11 (Excel IF/AND), D11
// (trace table and test data) and C07 (authentication). Every answer is worked
// out here from the notes' own data with the Excel engine or the Python
// tracer, so a changed number is really recalculated (brief: 「新增變式必須
// 重新驗算」). Facts and wording come from the notes; only the numbers of new
// examples are generated.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});
  const X = () => ITE.excel;
  const PT = () => ITE.pytrace;

  const pick = (list, rng) => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
  const shuffle = (list, rng) => (ITE.rng ? ITE.rng.shuffle(list, rng) : list.slice());
  const uniq = (list) => list.filter((v, i) => list.indexOf(v) === i);

  // ---------- A11: IF with AND ----------
  // A09 shared data: header row 1, students in rows 2–6.
  const SCORES = [
    ["P101", 72, 3, "松"],
    ["P102", 48, 1, "柏"],
    ["P103", 90, 4, "松"],
    ["P104", 60, 2, "柏"],
    ["P105", 80, 0, "松"],
  ];
  const A11_TEST_ROW = 7;
  const a11Formula = (row, cmp) => `=IF(AND(B${row}${cmp || ">="}60,C${row}>=2),"獲獎","未達標")`;

  function a11Sheet(extra) {
    const sheet = X().sheetFromRows([["編號", "分數", "挑戰次數", "組別"], ...SCORES], 1);
    if (extra) Object.assign(sheet, { A7: "測試", B7: extra.score, C7: extra.attempts });
    return sheet;
  }

  // Each part of =IF(AND(B?>=60,C?>=2),...) with its value, for the reveal.
  function a11Breakdown(score, attempts, cmp) {
    const c = cmp || ">=";
    const sheet = a11Sheet({ score, attempts });
    const r = A11_TEST_ROW;
    const ev = (f) => X().display(X().evaluate(f, sheet));
    return {
      formula: a11Formula(r, c),
      parts: [
        { label: `B${r}${c}60`, text: `${score} ${c} 60`, value: ev(`=B${r}${c}60`) },
        { label: `C${r}>=2`, text: `${attempts} >= 2`, value: ev(`=C${r}>=2`) },
        { label: `AND(…)`, text: "兩個條件都要成立", value: ev(`=AND(B${r}${c}60,C${r}>=2)`) },
      ],
      result: ev(a11Formula(r, c)),
    };
  }

  function a11Explain(score, attempts, cmp) {
    const b = a11Breakdown(score, attempts, cmp);
    const [s, t] = b.parts;
    return `${s.text} 是 ${s.value}；${t.text} 是 ${t.value}。AND 要兩個都是 TRUE，所以結果是「${b.result}」。`;
  }

  function a11Tasks(rng) {
    const row = SCORES.find((r) => r[0] === "P104");
    // New example near the boundaries, where mistakes show.
    const score = pick([58, 59, 60, 61, 75, 45], rng);
    const attempts = pick([0, 1, 2, 3], rng);
    return [
      {
        id: "predict",
        type: "choice",
        title: "先預測",
        prompt: `P104 分數 ${row[1]}、挑戰次數 ${row[2]}。公式 ${a11Formula(5)} 會得到甚麼？`,
        options: ["獲獎", "未達標"],
        answer: a11Breakdown(row[1], row[2]).result,
        explain: a11Explain(row[1], row[2]) + "「至少」包含等於，所以用 >=。",
        sheet: true,
      },
      { id: "explore", type: "excel-explore", title: "改數值試試", prompt: "調校測試列（第 7 列）的分數和挑戰次數，公式會即時重新計算。試找出剛好獲獎的最低組合。" },
      {
        id: "bug",
        type: "choice",
        title: "找錯",
        prompt: `有人把公式寫成 ${a11Formula(5, ">")}。P104（60 分、2 次）會得到甚麼？`,
        options: ["獲獎", "未達標"],
        answer: a11Breakdown(row[1], row[2], ">").result,
        explain: a11Explain(row[1], row[2], ">") + "規則是「分數至少 60」，60 分應該獲獎；把 >= 寫成 > 是邊界錯誤。",
      },
      {
        id: "new",
        type: "choice",
        title: "新例子",
        graded: true,
        prompt: `新同學分數 ${score}、挑戰次數 ${attempts}。用正確公式 ${a11Formula(A11_TEST_ROW)}，結果是甚麼？`,
        options: ["獲獎", "未達標"],
        answer: a11Breakdown(score, attempts).result,
        explain: a11Explain(score, attempts),
      },
    ];
  }

  // ---------- D11: trace table and test data ----------
  const d11Program = (items, op, limit) => `count = 0\ntotal = 0\nfor x in [${items.join(", ")}]:\n    if x ${op} ${limit}:\n        count = count + 1\n        total = total + x\nprint(count, total)`;

  // The trace-table rows the notes show: after initialisation and after each loop.
  function d11Table(code) {
    const r = PT().trace(code);
    const rows = [];
    const init = r.steps.find((s) => s.line === 2);
    rows.push({ when: "初始化後", x: init.vars.x || "尚未賦值", count: init.vars.count, total: init.vars.total });
    const names = ["第一次", "第二次", "第三次", "第四次", "第五次", "第六次"];
    let inLoop = false;
    r.steps.forEach((s, i) => {
      if (s.line !== 3 || (s.event !== "next" && s.event !== "end")) return;
      if (inLoop) {
        const v = r.steps[i - 1].vars;
        const k = rows.length - 1;
        rows.push({ when: `${names[k] || `第 ${k + 1} 次`}循環後`, x: v.x, count: v.count, total: v.total });
      }
      inLoop = s.event === "next";
    });
    return { rows, output: r.output.join("\n"), trace: r };
  }

  // Answer options for "what is printed?": the right output plus outputs of the
  // usual mistakes (other comparison, counting every item, adding every item).
  function d11Options(items, op, limit, rng) {
    const out = (code) => PT().trace(code).output.join("\n");
    const right = out(d11Program(items, op, limit));
    const wrong = [
      out(d11Program(items, op === ">" ? ">=" : ">", limit)),
      `${items.length} ${items.reduce((a, b) => a + b, 0)}`,
      `${PT().trace(d11Program(items, op, limit)).vars.count} ${items.reduce((a, b) => a + b, 0)}`,
      `${items.length} ${PT().trace(d11Program(items, op, limit)).vars.total}`,
    ];
    const opts = uniq([right, ...wrong.filter((w) => w !== right)]).slice(0, 4);
    return { options: shuffle(opts, rng), answer: right };
  }

  // Test data for "integer input must be 10 to 20" (notes D11 測試設計).
  const D11_TEST_VALUES = [
    { value: "15", kind: "正常" },
    { value: "10", kind: "有效邊界" },
    { value: "20", kind: "有效邊界" },
    { value: "9", kind: "邊界外／無效" },
    { value: "21", kind: "邊界外／無效" },
    { value: "12.5", kind: "邊界外／無效" },
    { value: "（空白）", kind: "邊界外／無效" },
  ];
  const D11_TEST_WHY = {
    正常: "在範圍內而且不是邊界。",
    有效邊界: "剛好是規則的最小或最大值，仍然有效。",
    "邊界外／無效": "不符合「10 至 20 的整數」：在範圍外、不是整數或沒有輸入。",
  };

  function d11Tasks(rng) {
    const base = d11Options([4, 7, 2], ">", 3, rng);
    const self = d11Options([4, 7, 2], ">=", 7, rng);
    const items = [0, 1, 2].map(() => 1 + Math.floor(rng() * 9));
    const limit = pick([3, 4, 5, 6], rng);
    const op = pick([">", ">="], rng);
    const fresh = d11Options(items, op, limit, rng);
    const test = pick(D11_TEST_VALUES, rng);
    return [
      { id: "predict", type: "choice", title: "先預測", code: d11Program([4, 7, 2], ">", 3), prompt: "未執行前先預測：這段程式最後輸出甚麼？", ...base, explain: "x = 2 時不符合條件，count 和 total 都不改變。下一步逐行追蹤核對。" },
      { id: "trace", type: "trace", title: "逐步追蹤", code: d11Program([4, 7, 2], ">", 3), prompt: "按「下一步」逐行執行，留意高亮的一行和變量表，再對照追蹤表。" },
      { id: "variant", type: "choice", title: "改條件", code: d11Program([4, 7, 2], ">=", 7), prompt: "條件改成 x >= 7，最後輸出是甚麼？", ...self, explain: "只有 7 符合 x >= 7，所以 count 是 1、total 是 7。" },
      { id: "new", type: "choice", title: "新例子", graded: true, code: d11Program(items, op, limit), prompt: "新數據：先在腦中追蹤，最後輸出是甚麼？", ...fresh, explain: `符合 x ${op} ${limit} 的是 ${items.filter((x) => (op === ">" ? x > limit : x >= limit)).join("、") || "（沒有）"}；count 數個數，total 加數值。` },
      {
        id: "testdata",
        type: "choice",
        title: "測試數據",
        graded: true,
        prompt: `規則：輸入須為 10 至 20 的整數。測試值 ${test.value} 屬哪一類？`,
        options: ["正常", "有效邊界", "邊界外／無效"],
        answer: test.kind,
        explain: D11_TEST_WHY[test.kind] + "要同時測試邊界兩側，才能發現把 < 與 <= 寫反的問題。",
      },
    ];
  }

  // ---------- C07: authentication ----------
  // The notes' three factor categories and their examples.
  const FACTOR_KINDS = ["知道的資料", "擁有的物件", "自身特徵"];
  const FACTORS = [
    { name: "密碼", kind: "知道的資料" },
    { name: "PIN", kind: "知道的資料" },
    { name: "實體安全權標", kind: "擁有的物件" },
    { name: "指紋", kind: "自身特徵" },
  ];
  // 認證 = who you are; 授權 = what you may do (notes C07).
  const C07_ACCESS = [
    { text: "系統確認登入者是不是陳老師本人", kind: "認證", why: "身份認證確認「你是誰」。" },
    { text: "老師成功登入後，仍無權修改其他科的成績", kind: "授權", why: "授權決定「你可以做甚麼」；身份正確不代表可讀取所有資料。" },
    { text: "學校平台只讓學生看自己的成績", kind: "授權", why: "最小權限原則：只給予完成工作所需的權限。" },
    { text: "老師按職務只可讀取所需班別資料", kind: "授權", why: "最小權限原則：只給予完成工作所需的權限。" },
  ];
  // The notes' 防護措施 table: measure -> the problem it targets.
  const C07_MEASURES = [
    { measure: "長而獨特的密碼、密碼管理工具", target: "降低猜測及跨網站重用風險" },
    { measure: "MFA", target: "單一因素外洩後增加防線" },
    { measure: "防火牆", target: "按規則允許或阻擋網絡流量" },
    { measure: "更新與防毒", target: "修補漏洞、偵測及隔離惡意軟件" },
    { measure: "權限控制及備份", target: "限制損害範圍及支援復原" },
  ];

  // MFA needs two or more different categories (notes C07, T03).
  const isMfa = (a, b) => a.kind !== b.kind;

  function c07Tasks(rng) {
    const factor = pick(FACTORS, rng);
    const pairs = [];
    for (let i = 0; i < FACTORS.length; i++) for (let j = i + 1; j < FACTORS.length; j++) pairs.push([FACTORS[i], FACTORS[j]]);
    const pair = pick(pairs, rng);
    const access = pick(C07_ACCESS, rng);
    const measure = pick(C07_MEASURES, rng);
    return [
      {
        id: "factor",
        type: "choice",
        title: "分類因素",
        graded: true,
        prompt: `「${factor.name}」屬於哪一類認證因素？`,
        options: FACTOR_KINDS,
        answer: factor.kind,
        explain: "三類因素是知道的資料（密碼）、擁有的物件（安全權標等）、自身特徵（指紋等）。",
      },
      {
        id: "mfa",
        type: "choice",
        title: "是不是 MFA？",
        graded: true,
        prompt: `登入時要「${pair[0].name}」加「${pair[1].name}」，算不算多因素認證 MFA？`,
        options: ["是 MFA", "不是 MFA"],
        answer: isMfa(pair[0], pair[1]) ? "是 MFA" : "不是 MFA",
        explain: `${pair[0].name}屬「${pair[0].kind}」，${pair[1].name}屬「${pair[1].kind}」。` + (isMfa(pair[0], pair[1]) ? "兩種不同類別，是 MFA（使用兩種因素即 2FA）。" : "兩者同屬一類，仍可能只是同一類「你知道的資料」，不算 MFA。"),
      },
      { id: "access", type: "choice", title: "認證還是授權？", graded: true, prompt: `「${access.text}」屬於認證還是授權？`, options: ["認證", "授權"], answer: access.kind, explain: access.why },
      {
        id: "measure",
        type: "choice",
        title: "選防護措施",
        graded: true,
        prompt: `要「${measure.target}」，最直接針對的防護措施是甚麼？`,
        options: shuffle(C07_MEASURES.map((m) => m.measure), rng),
        answer: measure.measure,
        explain: `${measure.measure}：${measure.target}。每項措施都有限制，例如防火牆不能保證消除所有惡意內容。`,
      },
    ];
  }

  const LABS = {
    A11: [{ id: "A11-lab", title: "獲獎條件實驗室", tasks: a11Tasks }],
    D11: [{ id: "D11-lab", title: "追蹤表挑戰", tasks: d11Tasks }],
    C07: [{ id: "C07-lab", title: "身份認證情境", tasks: c07Tasks }],
  };

  ITE.revisionLabs = {
    forChapter: (id) => LABS[id] || [],
    tasks: (labId, rng) => {
      const lab = Object.values(LABS).flat().find((l) => l.id === labId);
      return lab ? lab.tasks(rng) : [];
    },
    a11Sheet,
    a11Breakdown,
    a11Formula,
    A11_TEST_ROW,
    d11Program,
    d11Table,
    FACTORS,
    isMfa,
  };
})(globalThis);
