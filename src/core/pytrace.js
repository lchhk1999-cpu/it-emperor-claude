// 知識修練館 Python tracer: runs only the short programs bundled with the
// revision notes (D01–D12), one statement at a time, recording the current
// line, the variables and the output so the screen can highlight each step.
// A deliberately small subset (no imports, functions, files or input()):
// students can change the numbers in a lab, never type arbitrary code.
(function (root) {
  const ITE = (root.ITE = root.ITE || {});
  const STEP_LIMIT = 2000;

  class PyError extends Error {
    constructor(kind, message, line) {
      super(message);
      this.kind = kind;
      this.line = line;
    }
  }

  // ---------- expressions ----------
  const TOKEN = /\s*(?:(\d+\.\d+|\d+)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|([A-Za-z_][A-Za-z0-9_]*)|(\*\*|\/\/|==|!=|<=|>=|[-+*/%<>()[\],:.=]))/y;
  function tokenize(src, line) {
    const out = [];
    let i = 0;
    while (i < src.length) {
      if (/\s/.test(src[i])) {
        i++;
        continue;
      }
      TOKEN.lastIndex = i;
      const m = TOKEN.exec(src);
      if (!m) throw new PyError("SyntaxError", `無法理解：${src.slice(i)}`, line);
      if (m[1]) out.push({ t: "num", v: m[1].includes(".") ? { float: Number(m[1]) } : Number(m[1]) });
      else if (m[2]) out.push({ t: "str", v: m[2].slice(1, -1).replace(/\\(.)/g, "$1") });
      else if (m[3]) out.push({ t: "name", v: m[3] });
      else out.push({ t: "op", v: m[4] });
      i = TOKEN.lastIndex;
    }
    return out;
  }

  function parseExpr(tokens, line) {
    let p = 0;
    const is = (v) => tokens[p] && (tokens[p].t === "op" || tokens[p].t === "name") && tokens[p].v === v;
    const expect = (v) => {
      if (!is(v)) throw new PyError("SyntaxError", `缺少「${v}」`, line);
      p++;
    };
    function atom() {
      const t = tokens[p++];
      if (!t) throw new PyError("SyntaxError", "運算式不完整", line);
      if (t.t === "num") return { k: "val", v: t.v };
      if (t.t === "str") return { k: "val", v: t.v };
      if (t.t === "name") {
        if (t.v === "True" || t.v === "False") return { k: "val", v: t.v === "True" };
        if (t.v === "None") return { k: "val", v: null };
        return { k: "name", n: t.v };
      }
      if (t.v === "(") {
        const e = or();
        expect(")");
        return e;
      }
      if (t.v === "[") {
        const items = [];
        if (!is("]")) {
          do items.push(or());
          while (is(",") && ++p && !is("]"));
        }
        expect("]");
        return { k: "list", items };
      }
      throw new PyError("SyntaxError", `「${t.v}」位置不正確`, line);
    }
    function postfix() {
      let e = atom();
      for (;;) {
        if (is("(")) {
          p++;
          const args = [];
          if (!is(")")) {
            do args.push(or());
            while (is(",") && ++p);
          }
          expect(")");
          e = { k: "call", f: e, args };
        } else if (is("[")) {
          p++;
          let lo = null;
          let hi = null;
          if (!is(":")) lo = or();
          if (is(":")) {
            p++;
            if (!is("]")) hi = or();
            expect("]");
            e = { k: "slice", a: e, lo, hi };
          } else {
            expect("]");
            e = { k: "index", a: e, i: lo };
          }
        } else if (is(".")) {
          p++;
          const name = tokens[p++];
          e = { k: "attr", a: e, n: name.v };
        } else return e;
      }
    }
    function unary() {
      if (is("-")) {
        p++;
        return { k: "neg", a: unary() };
      }
      if (is("+")) {
        p++;
        return unary();
      }
      return postfix();
    }
    const left = (next, ops) => () => {
      let e = next();
      while (tokens[p] && tokens[p].t === "op" && ops.includes(tokens[p].v)) {
        const op = tokens[p++].v;
        e = { k: "bin", op, a: e, b: next() };
      }
      return e;
    };
    const mul = left(unary, ["*", "/", "//", "%"]);
    const add = left(mul, ["+", "-"]);
    function cmp() {
      const e = add();
      if (tokens[p] && tokens[p].t === "op" && ["==", "!=", "<", ">", "<=", ">="].includes(tokens[p].v)) {
        const op = tokens[p++].v;
        return { k: "bin", op, a: e, b: add() };
      }
      if (is("in")) {
        p++;
        return { k: "in", a: e, b: add() };
      }
      return e;
    }
    function not() {
      if (is("not")) {
        p++;
        return { k: "not", a: not() };
      }
      return cmp();
    }
    function and() {
      let e = not();
      while (is("and") && ++p) e = { k: "and", a: e, b: not() };
      return e;
    }
    function or() {
      let e = and();
      while (is("or") && ++p) e = { k: "or", a: e, b: and() };
      return e;
    }
    const tree = or();
    if (p < tokens.length) throw new PyError("SyntaxError", `多了「${tokens[p].v}」`, line);
    return tree;
  }

  // ---------- values ----------
  // Python floats are { float: n } so 4.0 prints as 4.0; ints are plain numbers.
  const isFloat = (v) => v && typeof v === "object" && "float" in v;
  const num = (v) => (isFloat(v) ? v.float : v);
  const isNum = (v) => typeof v === "number" || isFloat(v);
  const mk = (x, float) => (float ? { float: x } : x);
  const typeName = (v) => (v === null ? "NoneType" : typeof v === "boolean" ? "bool" : typeof v === "number" ? "int" : isFloat(v) ? "float" : typeof v === "string" ? "str" : Array.isArray(v) ? "list" : "range");

  function repr(v) {
    if (v === null) return "None";
    if (typeof v === "boolean") return v ? "True" : "False";
    if (typeof v === "number") return String(v);
    if (isFloat(v)) return Number.isInteger(v.float) ? `${v.float}.0` : String(Number(v.float.toPrecision(15)));
    if (typeof v === "string") return `'${v}'`;
    if (Array.isArray(v)) return `[${v.map(repr).join(", ")}]`;
    if (v && v.range) return `range(${v.range.join(", ")})`;
    return String(v);
  }
  const str = (v) => (typeof v === "string" ? v : repr(v));
  const truthy = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === "string" ? v.length > 0 : isNum(v) ? num(v) !== 0 : !!v);
  const iter = (v, line) => {
    if (Array.isArray(v)) return v.slice();
    if (typeof v === "string") return v.split("");
    if (v && v.range) {
      const [a, b, s] = v.range;
      const out = [];
      for (let i = a; s > 0 ? i < b : i > b; i += s) out.push(i);
      return out;
    }
    throw new PyError("TypeError", `${typeName(v)} 不能逐項遍歷`, line);
  };
  function index(seq, i, line) {
    if (typeof i !== "number") throw new PyError("TypeError", "索引必須是整數", line);
    const n = seq.length;
    const j = i < 0 ? n + i : i;
    if (j < 0 || j >= n) throw new PyError("IndexError", `索引 ${i} 超出範圍（有效索引 0 至 ${n - 1}）`, line);
    return j;
  }

  function evalExpr(e, env, line) {
    switch (e.k) {
      case "val":
        return e.v;
      case "name":
        if (!(e.n in env)) throw new PyError("NameError", `變量 ${e.n} 尚未賦值`, line);
        return env[e.n];
      case "list":
        return e.items.map((x) => evalExpr(x, env, line));
      case "neg": {
        const v = evalExpr(e.a, env, line);
        return mk(-num(v), isFloat(v));
      }
      case "not":
        return !truthy(evalExpr(e.a, env, line));
      case "and": {
        const a = evalExpr(e.a, env, line);
        return truthy(a) ? evalExpr(e.b, env, line) : a;
      }
      case "or": {
        const a = evalExpr(e.a, env, line);
        return truthy(a) ? a : evalExpr(e.b, env, line);
      }
      case "in": {
        const a = evalExpr(e.a, env, line);
        const b = evalExpr(e.b, env, line);
        return typeof b === "string" ? b.includes(a) : iter(b, line).some((x) => num(x) === num(a));
      }
      case "index": {
        const a = evalExpr(e.a, env, line);
        const i = evalExpr(e.i, env, line);
        if (!Array.isArray(a) && typeof a !== "string") throw new PyError("TypeError", `${typeName(a)} 不能用索引`, line);
        return a[index(a, i, line)];
      }
      case "slice": {
        const a = evalExpr(e.a, env, line);
        const lo = e.lo ? evalExpr(e.lo, env, line) : 0;
        const hi = e.hi ? evalExpr(e.hi, env, line) : a.length;
        return a.slice(lo, hi);
      }
      case "attr":
        return { method: e.n, of: evalExpr(e.a, env, line), target: e.a };
      case "call":
        return call(e, env, line);
      case "bin":
        return binary(e.op, evalExpr(e.a, env, line), evalExpr(e.b, env, line), line);
      default:
        throw new PyError("SyntaxError", "不支援的寫法", line);
    }
  }

  function binary(op, a, b, line) {
    if (["==", "!=", "<", ">", "<=", ">="].includes(op)) {
      const x = isNum(a) ? num(a) : a;
      const y = isNum(b) ? num(b) : b;
      if (op === "==") return Array.isArray(x) ? repr(a) === repr(b) : x === y;
      if (op === "!=") return Array.isArray(x) ? repr(a) !== repr(b) : x !== y;
      if (typeof x !== typeof y) throw new PyError("TypeError", `不能比較 ${typeName(a)} 與 ${typeName(b)}`, line);
      return { "<": x < y, ">": x > y, "<=": x <= y, ">=": x >= y }[op];
    }
    if (op === "+" && typeof a === "string" && typeof b === "string") return a + b;
    if (op === "+" && Array.isArray(a) && Array.isArray(b)) return a.concat(b);
    if (op === "*" && Array.isArray(a) && typeof b === "number") return Array.from({ length: b * a.length }, (_, i) => a[i % a.length]);
    if (!isNum(a) || !isNum(b)) throw new PyError("TypeError", `${typeName(a)} 與 ${typeName(b)} 不能做「${op}」`, line);
    const x = num(a);
    const y = num(b);
    const float = isFloat(a) || isFloat(b);
    if ((op === "/" || op === "//" || op === "%") && y === 0) throw new PyError("ZeroDivisionError", "不能除以 0", line);
    switch (op) {
      case "+":
        return mk(x + y, float);
      case "-":
        return mk(x - y, float);
      case "*":
        return mk(x * y, float);
      case "/":
        return { float: x / y };
      case "//":
        return mk(Math.floor(x / y), float);
      case "%":
        return mk(x - y * Math.floor(x / y), float);
      default:
        throw new PyError("SyntaxError", `不支援「${op}」`, line);
    }
  }

  function call(e, env, line) {
    if (e.f.k === "attr") {
      const obj = evalExpr(e.f.a, env, line);
      const args = e.args.map((a) => evalExpr(a, env, line));
      if (Array.isArray(obj)) {
        if (e.f.n === "append") return obj.push(args[0]), null;
        if (e.f.n === "insert") return obj.splice(Math.max(0, Math.min(obj.length, args[0])), 0, args[1]), null;
        if (e.f.n === "copy") return obj.slice();
        if (e.f.n === "pop") return obj.splice(args.length ? index(obj, args[0], line) : obj.length - 1, 1)[0];
      }
      if (typeof obj === "string" && e.f.n === "upper") return obj.toUpperCase();
      if (typeof obj === "string" && e.f.n === "lower") return obj.toLowerCase();
      throw new PyError("AttributeError", `${typeName(obj)} 沒有 ${e.f.n}()`, line);
    }
    const name = e.f.n;
    const args = e.args.map((a) => evalExpr(a, env, line));
    switch (name) {
      case "len":
        if (!Array.isArray(args[0]) && typeof args[0] !== "string") throw new PyError("TypeError", `${typeName(args[0])} 沒有長度`, line);
        return args[0].length;
      case "range": {
        const [a, b, s] = args.length === 1 ? [0, args[0], 1] : [args[0], args[1], args[2] === undefined ? 1 : args[2]];
        return { range: [a, b, s] };
      }
      case "abs":
        return mk(Math.abs(num(args[0])), isFloat(args[0]));
      case "int": {
        const v = args[0];
        if (typeof v === "string") {
          if (!/^\s*[-+]?\d+\s*$/.test(v)) throw new PyError("ValueError", `「${v}」不能轉成整數`, line);
          return parseInt(v, 10);
        }
        return Math.trunc(num(v));
      }
      case "float":
        return { float: Number(typeof args[0] === "string" ? args[0] : num(args[0])) };
      case "str":
        return str(args[0]);
      case "max":
      case "min": {
        const list = args.length === 1 ? iter(args[0], line) : args;
        if (!list.length) throw new PyError("ValueError", `${name}() 不能用於空序列`, line);
        return list.reduce((m, v) => ((name === "max" ? num(v) > num(m) : num(v) < num(m)) ? v : m));
      }
      case "sum":
        return iter(args[0], line).reduce((s, v) => binary("+", s, v, line), 0);
      default:
        throw new PyError("NameError", `未支援的函數 ${name}()`, line);
    }
  }

  // ---------- statements ----------
  // Lines -> blocks by indentation. Each node keeps its 1-based line number.
  function parseProgram(code) {
    const lines = code.replace(/\t/g, "    ").split("\n").map((text, i) => ({ text, n: i + 1 }));
    const real = lines.filter((l) => l.text.trim() && !l.text.trim().startsWith("#"));
    let p = 0;
    const indentOf = (l) => l.text.match(/^ */)[0].length;
    function block(indent) {
      const out = [];
      while (p < real.length && indentOf(real[p]) === indent) out.push(statement(indent));
      if (p < real.length && indentOf(real[p]) > indent) throw new PyError("IndentationError", "縮排不一致", real[p].n);
      return out;
    }
    function body(indent, line) {
      if (p >= real.length || indentOf(real[p]) <= indent) throw new PyError("IndentationError", "冒號後需要縮排的區塊", line);
      return block(indentOf(real[p]));
    }
    function statement(indent) {
      const l = real[p++];
      const s = l.text.trim();
      const n = l.n;
      const ex = (src) => parseExpr(tokenize(src, n), n);
      let m;
      if ((m = /^if (.+):$/.exec(s))) {
        const branches = [{ cond: ex(m[1]), body: body(indent, n), line: n }];
        let otherwise = null;
        while (p < real.length && indentOf(real[p]) === indent) {
          const t = real[p].text.trim();
          if ((m = /^elif (.+):$/.exec(t))) {
            const ln = real[p++].n;
            branches.push({ cond: parseExpr(tokenize(m[1], ln), ln), body: body(indent, ln), line: ln });
          } else if (/^else\s*:$/.test(t)) {
            const ln = real[p++].n;
            otherwise = { body: body(indent, ln), line: ln };
            break;
          } else break;
        }
        return { k: "if", line: n, branches, otherwise };
      }
      if ((m = /^for ([A-Za-z_]\w*) in (.+):$/.exec(s))) return { k: "for", line: n, name: m[1], iter: ex(m[2]), body: body(indent, n) };
      if ((m = /^while (.+):$/.exec(s))) return { k: "while", line: n, cond: ex(m[1]), body: body(indent, n) };
      if (s === "break") return { k: "break", line: n };
      if (s === "pass") return { k: "pass", line: n };
      if ((m = /^del (.+)$/.exec(s))) return { k: "del", line: n, target: ex(m[1]) };
      if ((m = /^print\((.*)\)$/.exec(s))) {
        const args = m[1].trim() ? parseExpr(tokenize(`[${m[1]}]`, n), n).items : [];
        return { k: "print", line: n, args };
      }
      if ((m = /^([A-Za-z_]\w*(?:\[.+\])?)\s*(\+=|-=|=)(?!=)\s*(.+)$/.exec(s))) {
        const target = ex(m[1]);
        const value = ex(m[3]);
        const op = m[2] === "=" ? null : m[2][0];
        return { k: "assign", line: n, target, value: op ? { k: "bin", op, a: target, b: value } : value };
      }
      return { k: "expr", line: n, e: ex(s) };
    }
    const program = block(0);
    if (p < real.length) throw new PyError("IndentationError", "第一行不應縮排", real[p].n);
    return program;
  }

  const BREAK = { brk: true };

  // Runs the program and returns { steps, output, error }. Each step is the
  // state after one line ran: { line, vars, output, event }.
  function trace(code) {
    const env = {};
    const output = [];
    const steps = [];
    const snapshot = () => Object.fromEntries(Object.entries(env).map(([k, v]) => [k, repr(v)]));
    const record = (line, event) => {
      steps.push({ line, vars: snapshot(), output: output.slice(), event: event || null });
      if (steps.length > STEP_LIMIT) throw new PyError("StepLimit", `超過 ${STEP_LIMIT} 步，可能是無限循環`, line);
    };
    function assign(target, value, line) {
      if (target.k === "name") env[target.n] = value;
      else if (target.k === "index") {
        const seq = evalExpr(target.a, env, line);
        if (typeof seq === "string") throw new PyError("TypeError", "字串不能原地修改", line);
        seq[index(seq, evalExpr(target.i, env, line), line)] = value;
      } else throw new PyError("SyntaxError", "不能賦值給這個寫法", line);
    }
    function run(stmts) {
      for (const s of stmts) {
        switch (s.k) {
          case "assign":
            assign(s.target, evalExpr(s.value, env, s.line), s.line);
            record(s.line);
            break;
          case "print": {
            const vals = s.args.map((a) => str(evalExpr(a, env, s.line)));
            output.push(vals.join(" "));
            record(s.line, "print");
            break;
          }
          case "expr":
            evalExpr(s.e, env, s.line);
            record(s.line);
            break;
          case "del": {
            const t = s.target;
            if (t.k !== "index") throw new PyError("SyntaxError", "只支援 del 列表[索引]", s.line);
            const seq = evalExpr(t.a, env, s.line);
            seq.splice(index(seq, evalExpr(t.i, env, s.line), s.line), 1);
            record(s.line);
            break;
          }
          case "pass":
            record(s.line);
            break;
          case "break":
            record(s.line, "break");
            return BREAK;
          case "if": {
            let done = false;
            for (const b of s.branches) {
              const ok = truthy(evalExpr(b.cond, env, b.line));
              record(b.line, ok ? "true" : "false");
              if (ok) {
                done = true;
                if (run(b.body) === BREAK) return BREAK;
                break;
              }
            }
            if (!done && s.otherwise) {
              record(s.otherwise.line, "else");
              if (run(s.otherwise.body) === BREAK) return BREAK;
            }
            break;
          }
          case "for": {
            for (const v of iter(evalExpr(s.iter, env, s.line), s.line)) {
              env[s.name] = v;
              record(s.line, "next");
              if (run(s.body) === BREAK) break;
            }
            record(s.line, "end");
            break;
          }
          case "while": {
            for (;;) {
              const ok = truthy(evalExpr(s.cond, env, s.line));
              record(s.line, ok ? "true" : "false");
              if (!ok || run(s.body) === BREAK) break;
            }
            break;
          }
          default:
            break;
        }
      }
      return null;
    }
    try {
      run(parseProgram(code));
      return { steps, output, vars: snapshot(), error: null };
    } catch (e) {
      if (!(e instanceof PyError)) throw e;
      return { steps, output, vars: snapshot(), error: { kind: e.kind, message: e.message, line: e.line } };
    }
  }

  ITE.pytrace = { trace, repr, STEP_LIMIT };
})(globalThis);
