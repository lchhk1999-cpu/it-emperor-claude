"""Import the ChatGPT-curated question bank (.xlsx) into the game.

Contract: docs/04_QUESTION_BANK_CONTRACT.md
- Only the `Questions` sheet is imported; Topic_* review sheets are ignored.
- Valid topics come from the `Topics` sheet (active = yes).
- Cells that Excel turned into formulas keep their formula text (with "=")
  instead of the cached value (often #VALUE!).
- Invalid rows are rejected and listed in the report, never silently dropped.

Outputs:
- src/data/question_bank.js          every accepted question (dev builds)
- src/data/question_bank.release.js  approved questions only (release builds)
- docs/QUESTION_BANK_IMPORT_REPORT.md

Standard library only (no openpyxl), so it runs anywhere Python 3.8+ exists.

Usage:
    python3 tools/import_question_bank.py data/question_bank/IT_Emperor_DseMcQs.xlsx
"""

import argparse
import collections
import datetime
import hashlib
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"

QUESTIONS_SHEET = "Questions"
TOPICS_SHEET = "Topics"

# Game field -> accepted workbook column names (first match wins).
COLUMN_MAP = {
    "question_id": ["question_id"],
    "topic_id": ["topic_id"],
    "difficulty": ["difficulty"],
    "question_type": ["question_type"],
    "stem": ["stem_zh", "stem", "question_zh"],
    "option_a": ["option_a"],
    "option_b": ["option_b"],
    "option_c": ["option_c"],
    "option_d": ["option_d"],
    "answer": ["correct", "answer", "correct_answer"],
    "explanation": ["explanation_zh", "explanation"],
    "wrong_tip": ["wrong_tip_zh", "wrong_answer_hint"],
    "tags": ["tags"],
    "source_note": ["source_note"],
    "review_status": ["status", "review_status"],
    "version": ["version"],
    "time_sec": ["time_sec"],
}
REQUIRED = ["question_id", "topic_id", "stem", "option_a", "option_b", "option_c", "option_d", "answer", "explanation", "review_status"]
OPTIONS = ["option_a", "option_b", "option_c", "option_d"]
ANSWERS = {"A", "B", "C", "D"}
STATUSES = {"draft", "review", "approved", "rejected"}
DIFFICULTIES = {"easy", "medium", "hard"}
EXCEL_ERRORS = {"#VALUE!", "#REF!", "#NAME?", "#DIV/0!", "#N/A", "#NUM!", "#NULL!", "#SPILL!", "#CALC!"}


class ImportError_(Exception):
    """Workbook-level problem (missing sheet / column); nothing is imported."""


# ---------------------------------------------------------------- xlsx reading

def _col_index(ref):
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group(0):
        n = n * 26 + ord(ch) - 64
    return n - 1


def _text_of(el):
    return "".join(t.text or "" for t in el.iter("{%s}t" % NS_MAIN))


def _number_text(raw):
    try:
        f = float(raw)
    except ValueError:
        return raw
    return str(int(f)) if f.is_integer() and abs(f) < 1e15 else "%.15g" % f


class Cell:
    __slots__ = ("ref", "value", "formula", "shared_formula_without_text")

    def __init__(self, ref, value, formula=None, shared_formula_without_text=False):
        self.ref = ref
        self.value = value
        self.formula = formula
        self.shared_formula_without_text = shared_formula_without_text


def read_workbook(path):
    """Returns {sheet_name: [[Cell|None, ...], ...]}."""
    with zipfile.ZipFile(path) as z:
        shared = []
        if "xl/sharedStrings.xml" in z.namelist():
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            shared = [_text_of(si) for si in root.findall("{%s}si" % NS_MAIN)]
        rels = {
            r.get("Id"): r.get("Target")
            for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels")).iter("{%s}Relationship" % NS_PKG_REL)
        }
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        sheets = {}
        for s in wb.find("{%s}sheets" % NS_MAIN):
            target = rels[s.get("{%s}id" % NS_REL)].lstrip("/")
            if not target.startswith("xl/"):
                target = "xl/" + target
            sheets[s.get("name")] = _read_sheet(ET.fromstring(z.read(target)), shared)
        return sheets


def _read_sheet(root, shared):
    rows = []
    for row in root.iter("{%s}row" % NS_MAIN):
        cells = {}
        for c in row.findall("{%s}c" % NS_MAIN):
            ref = c.get("r")
            t = c.get("t")
            v = c.find("{%s}v" % NS_MAIN)
            f = c.find("{%s}f" % NS_MAIN)
            if t == "s" and v is not None:
                value = shared[int(v.text)]
            elif t == "inlineStr":
                value = _text_of(c)
            elif t == "b" and v is not None:
                value = "TRUE" if v.text == "1" else "FALSE"
            elif v is not None and v.text is not None:
                value = v.text if t in ("str", "e") else _number_text(v.text)
            else:
                value = ""
            formula = None
            shared_no_text = False
            if f is not None:
                if f.text:
                    formula = "=" + f.text
                else:
                    shared_no_text = True
            cells[_col_index(ref)] = Cell(ref, value, formula, shared_no_text)
        if cells:
            rows.append([cells.get(i) for i in range(max(cells) + 1)])
    return rows


# ---------------------------------------------------------------- import

def _cell_text(cell):
    """Literal text of a cell: formula text wins over its cached result."""
    if cell is None:
        return ""
    if cell.formula is not None:
        return cell.formula
    return str(cell.value)


def _header_map(header_cells):
    names = [(_cell_text(c) or "").strip() for c in header_cells]
    index = {}
    for field, aliases in COLUMN_MAP.items():
        for alias in aliases:
            if alias in names:
                index[field] = names.index(alias)
                break
    missing = [f for f in REQUIRED if f not in index]
    if missing:
        raise ImportError_("Questions sheet is missing required columns: " + ", ".join(missing))
    return index


def load_topics(sheets):
    if TOPICS_SHEET not in sheets:
        raise ImportError_("workbook has no 'Topics' sheet")
    rows = sheets[TOPICS_SHEET]
    header = [_cell_text(c).strip() for c in rows[0]]
    for col in ("topic_id", "topic_name"):
        if col not in header:
            raise ImportError_("Topics sheet is missing column: " + col)
    i_id, i_name = header.index("topic_id"), header.index("topic_name")
    i_active = header.index("active") if "active" in header else None
    topics = {}
    for row in rows[1:]:
        get = lambda i: _cell_text(row[i]).strip() if i is not None and i < len(row) else ""
        tid = get(i_id)
        if tid and (i_active is None or get(i_active).lower() in ("yes", "y", "true", "1")):
            topics[tid] = get(i_name) or tid
    return topics


def import_questions(sheets, topics):
    if QUESTIONS_SHEET not in sheets:
        raise ImportError_("workbook has no 'Questions' sheet")
    rows = sheets[QUESTIONS_SHEET]
    if not rows:
        raise ImportError_("Questions sheet is empty")
    index = _header_map(rows[0])
    accepted, rejected, formula_cells = [], [], []
    first_row_of = {}
    duplicates = 0

    for excel_row, row in enumerate(rows[1:], start=2):
        def cell(field):
            i = index.get(field)
            return row[i] if i is not None and i < len(row) else None

        if all(c is None or _cell_text(c).strip() == "" for c in row):
            continue  # fully blank row

        q, errors = {}, []
        for field in COLUMN_MAP:
            if field not in index:
                continue
            c = cell(field)
            if c is not None and c.shared_formula_without_text:
                errors.append(f"{field} ({c.ref}) is a shared Excel formula with no text; re-enter it as plain text")
            text = _cell_text(c)
            if c is not None and c.formula is not None:
                formula_cells.append((excel_row, c.ref, field, c.formula, str(c.value)))
            elif text.strip() in EXCEL_ERRORS:
                errors.append(f"{field} ({c.ref}) shows Excel error {text.strip()}")
            q[field] = text.strip()

        qid = q.get("question_id", "")
        for field in REQUIRED:
            if not q.get(field):
                errors.append(f"{field} is empty")
        if q.get("topic_id") and q["topic_id"] not in topics:
            errors.append(f"topic_id '{q['topic_id']}' is not in the Topics sheet")
        if q.get("answer") and q["answer"] not in ANSWERS:
            errors.append(f"answer must be A/B/C/D, got '{q['answer']}'")
        if q.get("review_status") and q["review_status"] not in STATUSES:
            errors.append(f"status must be one of {sorted(STATUSES)}, got '{q['review_status']}'")
        if q.get("question_type") and q["question_type"] != "MC4":
            errors.append(f"question_type must be MC4, got '{q['question_type']}'")
        if q.get("difficulty") and q["difficulty"] not in DIFFICULTIES:
            errors.append(f"difficulty must be easy/medium/hard, got '{q['difficulty']}'")
        opts = [q.get(o, "") for o in OPTIONS]
        if all(opts) and len(set(opts)) != 4:
            errors.append("the four options are not all different")
        if q.get("time_sec"):
            try:
                q["time_sec"] = int(float(q["time_sec"]))
            except ValueError:
                errors.append(f"time_sec must be a number, got '{q['time_sec']}'")
        if qid:
            if qid in first_row_of:
                duplicates += 1
                errors.append(f"duplicate question_id (first seen on row {first_row_of[qid]})")
            else:
                first_row_of[qid] = excel_row

        if errors:
            rejected.append({"row": excel_row, "question_id": qid, "errors": errors})
        else:
            accepted.append({k: v for k, v in q.items() if v not in ("", None)})

    return accepted, rejected, duplicates, formula_cells


def sha256_of(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


# ---------------------------------------------------------------- outputs

def bank_js(meta, topics, questions, label):
    payload = {"meta": meta, "topics": topics, "questions": questions}
    body = json.dumps(payload, ensure_ascii=False, indent=1, sort_keys=False)
    return (
        "// GENERATED by tools/import_question_bank.py — do not edit by hand.\n"
        f"// {label}\n"
        "// Source of truth: the ChatGPT-curated Excel (docs/04_QUESTION_BANK_CONTRACT.md).\n"
        "(function (root) {\n"
        "  const ITE = (root.ITE = root.ITE || {});\n"
        f"  ITE.questionBank = {body};\n"
        "})(globalThis);\n"
    )


def report_md(meta, topics, accepted, rejected, duplicates, formula_cells):
    lines = []
    add = lines.append
    add("# 題庫匯入報告（自動產生）")
    add("")
    add(f"- 來源檔案：`{meta['source_file']}`")
    add(f"- SHA-256：`{meta['source_sha256']}`")
    add(f"- 匯入時間：{meta['imported_at']}")
    add(f"- 匯入工作表：`{QUESTIONS_SHEET}`（Topic_* 分頁只供人手檢閱，不匯入）")
    add("")
    add("## 摘要")
    add("")
    add("| 項目 | 數量 |")
    add("|---|---|")
    add(f"| 題目總數 | {meta['total']} |")
    add(f"| 成功匯入 | {meta['accepted']} |")
    add(f"| 拒絕 | {meta['rejected']} |")
    add(f"| 重複 ID | {duplicates} |")
    add(f"| Topic（有題目／Topics 表） | {len({q['topic_id'] for q in accepted})} / {len(topics)} |")
    for status, n in sorted(meta["by_status"].items()):
        add(f"| 狀態 {status} | {n} |")
    add(f"| **正式版可用（approved）** | **{meta['by_status'].get('approved', 0)}** |")
    add("")
    add("## 答案分佈（已匯入題目）")
    add("")
    dist = collections.Counter(q["answer"] for q in accepted)
    total = sum(dist.values()) or 1
    add("| 答案 | 數量 | 比例 |")
    add("|---|---|---|")
    for letter in "ABCD":
        add(f"| {letter} | {dist.get(letter, 0)} | {round(100 * dist.get(letter, 0) / total)}% |")
    low = [l for l in "ABCD" if dist.get(l, 0) / total < 0.15]
    if low:
        add("")
        add(f"⚠ 答案 {', '.join(low)} 少於 15%，學生可能憑「很少選 {low[0]}」猜中答案。建議題庫平衡答案位置，或遊戲顯示時打亂選項次序（待決定）。")
    add("")
    add("## 公式儲存格（已保留公式文字，未使用 Excel 計算結果）")
    add("")
    if formula_cells:
        add("| 列 | 儲存格 | 欄位 | 保留文字 | Excel 顯示 |")
        add("|---|---|---|---|---|")
        for row, ref, field, formula, cached in formula_cells:
            add(f"| {row} | {ref} | {field} | `{formula}` | `{cached}` |")
        add("")
        add("建議在 Excel 中把這些儲存格改為文字（在公式前加 `'`），避免日後顯示 `#VALUE!`。")
    else:
        add("沒有。")
    add("")
    add("## 拒絕的題目（需要在 Excel 修正）")
    add("")
    if rejected:
        add("| 列 | question_id | 原因 |")
        add("|---|---|---|")
        for r in rejected:
            add(f"| {r['row']} | {r['question_id'] or '（空）'} | {'；'.join(r['errors'])} |")
        unknown = collections.Counter()
        for r in rejected:
            for e in r["errors"]:
                m = re.match(r"topic_id '(.+)' is not in the Topics sheet", e)
                if m:
                    unknown[m.group(1)] += 1
        if unknown:
            add("")
            add("### 不在 Topics 表的 topic_id")
            add("")
            for tid, n in unknown.most_common():
                add(f"- `{tid}`：{n} 題")
            add("")
            add("請在 Topics 表新增這些 Topic，或把題目改用現有的 topic_id。匯入器不會自行猜測對應。")
    else:
        add("沒有。")
    add("")
    return "\n".join(lines)


def run(xlsx, out_dir=".", now=None):
    sheets = read_workbook(xlsx)
    topics = load_topics(sheets)
    accepted, rejected, duplicates, formula_cells = import_questions(sheets, topics)
    by_status = collections.Counter(q["review_status"] for q in accepted)
    meta = {
        "source_file": os.path.basename(xlsx),
        "source_sha256": sha256_of(xlsx),
        "imported_at": (now or datetime.datetime.now(datetime.timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total": len(accepted) + len(rejected),
        "accepted": len(accepted),
        "rejected": len(rejected),
        "by_status": dict(by_status),
    }
    approved = [q for q in accepted if q["review_status"] == "approved"]
    release_meta = dict(meta, accepted=len(approved), note="release build: approved questions only")
    paths = {
        "dev": os.path.join(out_dir, "src", "data", "question_bank.js"),
        "release": os.path.join(out_dir, "src", "data", "question_bank.release.js"),
        "report": os.path.join(out_dir, "docs", "QUESTION_BANK_IMPORT_REPORT.md"),
    }
    for p in paths.values():
        os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(paths["dev"], "w", encoding="utf-8") as f:
        f.write(bank_js(meta, topics, accepted, "DEV build: all accepted questions incl. review/draft (labelled in UI)."))
    with open(paths["release"], "w", encoding="utf-8") as f:
        f.write(bank_js(release_meta, topics, approved, "RELEASE build: approved questions ONLY."))
    with open(paths["report"], "w", encoding="utf-8") as f:
        f.write(report_md(meta, topics, accepted, rejected, duplicates, formula_cells))
    return meta, rejected, paths


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("xlsx")
    p.add_argument("--out-dir", default=".")
    args = p.parse_args(argv)
    try:
        meta, rejected, paths = run(args.xlsx, args.out_dir)
    except ImportError_ as e:
        print(f"IMPORT FAILED: {e}", file=sys.stderr)
        return 2
    print(f"total {meta['total']}, accepted {meta['accepted']}, rejected {meta['rejected']}, by status {meta['by_status']}")
    for k, v in paths.items():
        print(f"wrote {k}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
