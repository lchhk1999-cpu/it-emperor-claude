// 知識修練館 Excel engine: a small, exact subset of Excel formulas so the
// revision labs really recalculate when a student changes a value (no
// animation-only answers). Only the functions the notes teach (A09–A13).
// Errors are values like Excel's: { error: "#N/A" }.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});

  const err = (code) => ({ error: code });
  const isErr = (v) => v && typeof v === "object" && "error" in v && !Array.isArray(v);

  // ---------- cell addresses ----------
  const colNum = (letters) => letters.split("").reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
  const colName = (n) => {
    let s = "";
    for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    return s;
  };
  const REF = /^(\$?)([A-Z]{1,3})(\$?)(\d+)$/;
  function parseRef(text) {
    const m = REF.exec(text.toUpperCase());
    return m ? { absCol: !!m[1], col: colNum(m[2]), absRow: !!m[3], row: Number(m[4]) } : null;
  }
  const refText = (r) => `${r.absCol ? "$" : ""}${colName(r.col)}${r.absRow ? "$" : ""}${r.row}`;
  const key = (col, row) => colName(col) + row;

  // ---------- tokens ----------
  const TOKEN = /\s*(?:("(?:[^"]|"")*")|(\$?[A-Za-z]{1,3}\$?\d+(?::\$?[A-Za-z]{1,3}\$?\d+)?)|(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([A-Za-z_][A-Za-z0-9_.]*)|(<>|<=|>=|[-+*/^&=<>(),:%]))/y;
  function tokenize(src) {
    const out = [];
    TOKEN.lastIndex = 0;
    let i = 0;
    while (i < src.length) {
      if (/\s/.test(src[i])) {
        i++;
        continue;
      }
      TOKEN.lastIndex = i;
      const m = TOKEN.exec(src);
      if (!m) throw new SyntaxError(`無法理解公式：${src.slice(i)}`);
      if (m[1] !== undefined) out.push({ t: "str", v: m[1].slice(1, -1).replace(/""/g, '"') });
      else if (m[2] !== undefined) out.push({ t: "ref", v: m[2].toUpperCase() });
      else if (m[3] !== undefined) out.push({ t: "num", v: Number(m[3]) });
      else if (m[4] !== undefined) out.push({ t: "name", v: m[4].toUpperCase() });
      else out.push({ t: "op", v: m[5] });
      i = TOKEN.lastIndex;
    }
    return out;
  }

  // ---------- parser (precedence: comparison < & < +- < */ < ^ < unary) ----------
  function parse(formula) {
    const src = String(formula).replace(/^=/, "");
    const tk = tokenize(src);
    let p = 0;
    const peek = () => tk[p];
    const isOp = (v) => tk[p] && tk[p].t === "op" && tk[p].v === v;
    const expect = (v) => {
      if (!isOp(v)) throw new SyntaxError(`公式缺少「${v}」`);
      p++;
    };
    const binary = (next, ops) => () => {
      let left = next();
      while (tk[p] && tk[p].t === "op" && ops.includes(tk[p].v)) {
        const op = tk[p++].v;
        left = { k: "bin", op, a: left, b: next() };
      }
      return left;
    };
    function primary() {
      const t = tk[p++];
      if (!t) throw new SyntaxError("公式不完整");
      if (t.t === "num") return { k: "val", v: t.v };
      if (t.t === "str") return { k: "val", v: t.v };
      if (t.t === "ref") {
        if (t.v.includes(":")) {
          const [a, b] = t.v.split(":");
          return { k: "range", a: parseRef(a), b: parseRef(b) };
        }
        return { k: "ref", r: parseRef(t.v) };
      }
      if (t.t === "name") {
        if (t.v === "TRUE" || t.v === "FALSE") {
          if (isOp("(")) {
            p += 2;
            return { k: "val", v: t.v === "TRUE" };
          }
          return { k: "val", v: t.v === "TRUE" };
        }
        expect("(");
        const args = [];
        if (!isOp(")")) {
          do args.push(compare());
          while (isOp(",") && ++p);
        }
        expect(")");
        return { k: "call", fn: t.v, args };
      }
      if (t.t === "op" && t.v === "(") {
        const e = compare();
        expect(")");
        return e;
      }
      if (t.t === "op" && (t.v === "-" || t.v === "+")) return { k: "neg", sign: t.v, a: power() };
      throw new SyntaxError(`公式中「${t.v}」位置不正確`);
    }
    function percent() {
      let e = primary();
      while (isOp("%") && ++p) e = { k: "bin", op: "/", a: e, b: { k: "val", v: 100 } };
      return e;
    }
    const power = binary(percent, ["^"]);
    const mul = binary(power, ["*", "/"]);
    const add = binary(mul, ["+", "-"]);
    const concat = binary(add, ["&"]);
    const compare = binary(concat, ["=", "<>", "<", ">", "<=", ">="]);
    const tree = compare();
    if (p < tk.length) throw new SyntaxError(`公式多了「${tk[p].v}」`);
    return tree;
  }

  // ---------- values ----------
  const toNum = (v) => {
    if (isErr(v)) return v;
    if (typeof v === "number") return v;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (v === null || v === undefined || v === "") return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : err("#VALUE!");
  };
  const toText = (v) => (typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : v === null || v === undefined ? "" : typeof v === "number" ? numText(v) : String(v));
  const toBool = (v) => (typeof v === "boolean" ? v : typeof v === "number" ? v !== 0 : isErr(v) ? v : String(v).toUpperCase() === "TRUE" ? true : String(v).toUpperCase() === "FALSE" ? false : err("#VALUE!"));
  // Up to 10 decimals, no float noise (0.1 + 0.2 shows 0.3).
  function numText(n) {
    if (!Number.isFinite(n)) return "#NUM!";
    return String(Number(n.toPrecision(12)));
  }

  function compareValues(a, b) {
    // Excel orders numbers < text < booleans; text compares case-insensitively.
    const rank = (v) => (typeof v === "number" ? 0 : typeof v === "string" ? 1 : 2);
    if (rank(a) !== rank(b)) return rank(a) - rank(b);
    if (typeof a === "string") return a.toUpperCase() < b.toUpperCase() ? -1 : a.toUpperCase() > b.toUpperCase() ? 1 : 0;
    return a < b ? -1 : a > b ? 1 : 0;
  }

  // ---------- criteria (COUNTIF / SUMIF) ----------
  function matcher(criteria) {
    if (typeof criteria === "number" || typeof criteria === "boolean") return (v) => v === criteria;
    const m = /^(<=|>=|<>|<|>|=)?(.*)$/.exec(String(criteria));
    const op = m[1] || "=";
    const raw = m[2];
    const num = raw !== "" && Number.isFinite(Number(raw)) ? Number(raw) : null;
    return (v) => {
      if (v === null || v === undefined || v === "") return op === "<>" ? raw !== "" : raw === "" && op === "=";
      if (num !== null && typeof v === "number") {
        const c = v - num;
        return { "=": c === 0, "<>": c !== 0, "<": c < 0, ">": c > 0, "<=": c <= 0, ">=": c >= 0 }[op];
      }
      if (num !== null || typeof v !== "string") return op === "<>";
      const c = compareValues(v, raw);
      return { "=": c === 0, "<>": c !== 0, "<": c < 0, ">": c > 0, "<=": c <= 0, ">=": c >= 0 }[op];
    };
  }

  // ---------- evaluation ----------
  function rangeCells(sheet, a, b) {
    const rows = [];
    for (let r = Math.min(a.row, b.row); r <= Math.max(a.row, b.row); r++) {
      const row = [];
      for (let c = Math.min(a.col, b.col); c <= Math.max(a.col, b.col); c++) row.push(cellValue(sheet, key(c, r)));
      rows.push(row);
    }
    return rows;
  }

  function cellValue(sheet, k) {
    const v = sheet[k];
    if (typeof v === "string" && v.startsWith("=")) return evaluate(v, sheet);
    return v === undefined ? null : v;
  }

  const flat = (x) => (Array.isArray(x) ? x.flat(2) : [x]);
  const numbersIn = (args) => args.flatMap((a) => (a.range ? flat(a.value).filter((v) => typeof v === "number") : [toNum(a.value)]));

  function roundHalfAway(x, digits) {
    const f = Math.pow(10, digits);
    const y = Math.abs(x) * f;
    return (Math.sign(x) * Math.round(Number(y.toPrecision(15)))) / f;
  }

  function lookup(value, table, index, approx, vertical) {
    const lines = vertical ? table : table[0].map((_, c) => table.map((row) => row[c]));
    if (!(index >= 1 && index <= (vertical ? table[0].length : table.length))) return err("#REF!");
    let found = -1;
    for (let i = 0; i < lines.length; i++) {
      const c = compareValues(lines[i][0], value);
      if (approx ? c <= 0 : c === 0) {
        found = i;
        if (!approx) break;
      } else if (approx && c > 0) break;
    }
    return found < 0 ? err("#N/A") : lines[found][index - 1];
  }

  function textFormat(value, fmt) {
    const n = toNum(value);
    if (isErr(n)) return n;
    const pct = fmt.endsWith("%");
    const body = pct ? fmt.slice(0, -1) : fmt;
    const decimals = body.includes(".") ? body.split(".")[1].length : 0;
    const x = pct ? n * 100 : n;
    return roundHalfAway(x, decimals).toFixed(decimals) + (pct ? "%" : "");
  }

  const FUNCTIONS = {
    SUM: (a) => numbersIn(a).reduce((s, v) => (isErr(s) ? s : isErr(v) ? v : s + v), 0),
    AVERAGE: (a) => {
      const ns = numbersIn(a);
      return ns.length ? ns.reduce((s, v) => s + v, 0) / ns.length : err("#DIV/0!");
    },
    MAX: (a) => (numbersIn(a).length ? Math.max(...numbersIn(a)) : 0),
    MIN: (a) => (numbersIn(a).length ? Math.min(...numbersIn(a)) : 0),
    COUNT: (a) => a.flatMap((x) => flat(x.value)).filter((v) => typeof v === "number").length,
    COUNTA: (a) => a.flatMap((x) => flat(x.value)).filter((v) => v !== null && v !== undefined && v !== "").length,
    COUNTIF: ([r, c]) => flat(r.value).filter(matcher(c.value)).length,
    SUMIF: ([r, c, s]) => {
      const test = matcher(c.value);
      const cond = flat(r.value);
      const sum = flat((s || r).value);
      return cond.reduce((t, v, i) => (test(v) && typeof sum[i] === "number" ? t + sum[i] : t), 0);
    },
    IF: ([c, yes, no]) => {
      const b = toBool(c.value);
      if (isErr(b)) return b;
      return b ? yes.value : no ? no.value : false;
    },
    AND: (a) => {
      const bs = a.flatMap((x) => flat(x.value)).map(toBool);
      return bs.find(isErr) || bs.every(Boolean);
    },
    OR: (a) => {
      const bs = a.flatMap((x) => flat(x.value)).map(toBool);
      return bs.find(isErr) || bs.some(Boolean);
    },
    NOT: ([x]) => {
      const b = toBool(x.value);
      return isErr(b) ? b : !b;
    },
    LEFT: ([t, n]) => toText(t.value).slice(0, n ? toNum(n.value) : 1),
    RIGHT: ([t, n]) => {
      const s = toText(t.value);
      const k = n ? toNum(n.value) : 1;
      return k ? s.slice(-k) : "";
    },
    // MID counts from 1 (A12).
    MID: ([t, start, n]) => {
      const s0 = toNum(start.value);
      if (s0 < 1) return err("#VALUE!");
      return toText(t.value).substr(s0 - 1, toNum(n.value));
    },
    LEN: ([t]) => toText(t.value).length,
    // INT rounds towards negative infinity: INT(-8.1) = -9 (A12).
    INT: ([x]) => {
      const n = toNum(x.value);
      return isErr(n) ? n : Math.floor(n);
    },
    ROUND: ([x, d]) => {
      const n = toNum(x.value);
      return isErr(n) ? n : roundHalfAway(n, d ? toNum(d.value) : 0);
    },
    SQRT: ([x]) => {
      const n = toNum(x.value);
      return isErr(n) ? n : n < 0 ? err("#NUM!") : Math.sqrt(n);
    },
    // RANK(value, range, order): order 0 = descending; ties share a rank.
    RANK: ([x, r, o]) => {
      const v = toNum(x.value);
      const list = flat(r.value).filter((n) => typeof n === "number");
      if (!list.includes(v)) return err("#N/A");
      const asc = o && toNum(o.value) !== 0;
      return 1 + list.filter((n) => (asc ? n < v : n > v)).length;
    },
    TEXT: ([x, f]) => textFormat(x.value, toText(f.value)),
    // No silent switch of match mode (A13): FALSE = exact only, TRUE/omitted = approximate.
    VLOOKUP: ([v, t, i, m]) => lookup(v.value, t.value, toNum(i.value), m ? toBool(m.value) === true : true, true),
    HLOOKUP: ([v, t, i, m]) => lookup(v.value, t.value, toNum(i.value), m ? toBool(m.value) === true : true, false),
    XLOOKUP: ([v, look, ret, missing]) => {
      const keys = flat(look.value);
      const vals = flat(ret.value);
      const i = keys.findIndex((k) => compareValues(k, v.value) === 0);
      return i >= 0 ? vals[i] : missing ? missing.value : err("#N/A");
    },
  };

  function ev(node, sheet) {
    switch (node.k) {
      case "val":
        return node.v;
      case "ref":
        return cellValue(sheet, key(node.r.col, node.r.row));
      case "range":
        return rangeCells(sheet, node.a, node.b);
      case "neg": {
        const n = toNum(ev(node.a, sheet));
        return isErr(n) ? n : node.sign === "-" ? -n : n;
      }
      case "bin": {
        const a = ev(node.a, sheet);
        const b = ev(node.b, sheet);
        if (isErr(a)) return a;
        if (isErr(b)) return b;
        if (node.op === "&") return toText(a) + toText(b);
        if (["=", "<>", "<", ">", "<=", ">="].includes(node.op)) {
          const c = compareValues(a === null ? 0 : a, b === null ? 0 : b);
          return { "=": c === 0, "<>": c !== 0, "<": c < 0, ">": c > 0, "<=": c <= 0, ">=": c >= 0 }[node.op];
        }
        const x = toNum(a);
        const y = toNum(b);
        if (isErr(x)) return x;
        if (isErr(y)) return y;
        if (node.op === "/" && y === 0) return err("#DIV/0!");
        return { "+": x + y, "-": x - y, "*": x * y, "/": x / y, "^": Math.pow(x, y) }[node.op];
      }
      case "call": {
        const fn = FUNCTIONS[node.fn];
        if (!fn) return err("#NAME?");
        const args = node.args.map((a) => ({ value: ev(a, sheet), range: a.k === "range" }));
        const bad = ["IF", "IFERROR"].includes(node.fn) ? null : args.find((a) => !a.range && isErr(a.value));
        if (bad && !["COUNTIF", "SUMIF"].includes(node.fn)) return bad.value;
        return fn(args);
      }
      default:
        return err("#VALUE!");
    }
  }

  // sheet: { A1: value | "=formula" }. Returns a value (number/string/boolean/{error}).
  function evaluate(formula, sheet) {
    try {
      return ev(parse(formula), sheet || {});
    } catch (e) {
      return err(e instanceof SyntaxError ? "#SYNTAX" : "#VALUE!");
    }
  }

  // What a cell shows: 70, "通過", TRUE, #N/A.
  function display(v) {
    if (isErr(v)) return v.error;
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    if (typeof v === "number") return numText(v);
    return v === null || v === undefined ? "" : String(v);
  }

  // Copy a formula by (rows, cols): relative parts move, $ parts stay (A09).
  function shiftFormula(formula, dRows, dCols) {
    return String(formula).replace(/("(?:[^"]|"")*")|(\$?[A-Z]{1,3}\$?\d+)/g, (m, str, ref) => {
      if (str) return str;
      const r = parseRef(ref);
      return refText({ ...r, col: r.absCol ? r.col : r.col + dCols, row: r.absRow ? r.row : r.row + dRows });
    });
  }

  // A sheet from rows of [A, B, C, ...] values starting at row `firstRow`.
  function sheetFromRows(rows, firstRow) {
    const sheet = {};
    rows.forEach((row, i) => row.forEach((v, c) => (sheet[key(c + 1, (firstRow || 1) + i)] = v)));
    return sheet;
  }

  ITE.excel = { evaluate, display, shiftFormula, sheetFromRows, parse, isError: isErr, colName, colNum };
})(globalThis);
