"""Import the offline story-mode question bank (.xlsx) into the game.

Rules (from the workbook's own 使用說明 / 審核說明 sheets and docs/04):
- Only `Story_Questions` is imported; World_A..World_E are review copies.
- Level and world metadata come from the `Levels` and `Worlds` sheets.
- Kept separate from the DSE `Questions` import (different schema and purpose).
- Teacher review: optional CSV of decisions (data/question_bank/teacher_reviews.csv,
  exported from the dev-only 教師審核 screen). A question is `approved` only if the
  Excel status or a teacher decision approves it and nobody rejected it.
- Release builds get approved questions only.

Outputs:
- src/data/story_bank.js          all accepted questions (dev builds, labelled)
- src/data/story_bank.release.js  approved questions only
- docs/STORY_BANK_IMPORT_REPORT.md

Usage:
    python3 tools/import_story_bank.py data/question_bank/IT_Emperor_Offline_Story_Mode_QuestionBank_129.xlsx
"""

import argparse
import collections
import csv
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from import_question_bank import EXCEL_ERRORS, ImportError_, _cell_text, read_workbook, sha256_of  # noqa: E402

QUESTIONS_SHEET = "Story_Questions"
REQUIRED_COLUMNS = ["question_id", "level_id", "sequence", "question_zh", "option_a", "option_b", "option_c",
                    "option_d", "correct_answer", "explanation_zh", "review_status"]
OPTIONAL_COLUMNS = ["world_id", "question_type", "difficulty", "wrong_answer_hint", "points", "boss_eligible"]
OPTIONS = ["option_a", "option_b", "option_c", "option_d"]
STATUSES = {"draft", "review", "approved", "rejected"}
DEFAULT_REVIEWS = os.path.join("data", "question_bank", "teacher_reviews.csv")


def _table(sheets, name, required):
    if name not in sheets:
        raise ImportError_(f"workbook has no '{name}' sheet")
    rows = sheets[name]
    header = [_cell_text(c).strip() for c in rows[0]]
    missing = [c for c in required if c not in header]
    if missing:
        raise ImportError_(f"{name} sheet is missing columns: {', '.join(missing)}")
    out = []
    for excel_row, row in enumerate(rows[1:], start=2):
        cells = {h: (row[i] if i < len(row) else None) for i, h in enumerate(header) if h}
        if all(c is None or _cell_text(c).strip() == "" for c in cells.values()):
            continue
        out.append((excel_row, cells))
    return out


def load_reviews(path):
    """CSV columns: question_id, decision (approved|rejected), reviewer, reviewed_at, note."""
    if not path or not os.path.exists(path):
        return {}, []
    reviews, problems = {}, []
    with open(path, encoding="utf-8-sig", newline="") as f:
        for n, row in enumerate(csv.DictReader(f), start=2):
            qid = (row.get("question_id") or "").strip()
            decision = (row.get("decision") or "").strip().lower()
            reviewer = (row.get("reviewer") or "").strip()
            if not qid or decision not in ("approved", "rejected") or not reviewer:
                problems.append(f"teacher_reviews.csv line {n}: needs question_id, decision approved/rejected and reviewer")
                continue
            reviews[qid] = {"decision": decision, "reviewer": reviewer,
                            "reviewed_at": (row.get("reviewed_at") or "").strip(), "note": (row.get("note") or "").strip()}
    return reviews, problems


def final_status(excel_status, review):
    """Most restrictive wins: any rejection -> rejected; else approved by Excel or teacher."""
    if excel_status == "rejected" or (review and review["decision"] == "rejected"):
        return "rejected"
    if excel_status == "approved" or (review and review["decision"] == "approved"):
        return "approved"
    return excel_status


def import_story(sheets, reviews):
    worlds = {}
    for _, c in _table(sheets, "Worlds", ["world_id", "world_name"]):
        wid = _cell_text(c["world_id"]).strip()
        if wid:
            worlds[wid] = {"id": wid, "name": _cell_text(c["world_name"]).strip()}

    levels, level_order = {}, []
    for _, c in _table(sheets, "Levels", ["level_id", "world_id", "level_name"]):
        get = lambda k: _cell_text(c.get(k)).strip()
        lid = get("level_id")
        if not lid or lid in levels:
            continue
        levels[lid] = {"id": lid, "world_id": get("world_id"), "name": get("level_name"),
                       "knowledge_scope": get("knowledge_scope"), "learning_goal": get("learning_goal"),
                       "story_scene": get("story_scene")}
        level_order.append(lid)

    accepted, rejected, first_row_of = [], [], {}
    for excel_row, c in _table(sheets, QUESTIONS_SHEET, REQUIRED_COLUMNS):
        get = lambda k: _cell_text(c.get(k)).strip()
        errors = []
        for k in REQUIRED_COLUMNS + OPTIONAL_COLUMNS:
            cell = c.get(k)
            if cell is not None and cell.formula is None and _cell_text(cell).strip() in EXCEL_ERRORS:
                errors.append(f"{k} shows Excel error {_cell_text(cell).strip()}")
        qid = get("question_id")
        for k in REQUIRED_COLUMNS:
            if not get(k):
                errors.append(f"{k} is empty")
        lid = get("level_id")
        if lid and lid not in levels:
            errors.append(f"level_id '{lid}' is not in the Levels sheet")
        answer = get("correct_answer")
        if answer and answer not in ("A", "B", "C", "D"):
            errors.append(f"correct_answer must be A/B/C/D, got '{answer}'")
        status = get("review_status")
        if status and status not in STATUSES:
            errors.append(f"review_status must be one of {sorted(STATUSES)}, got '{status}'")
        if get("question_type") and get("question_type") != "MC4":
            errors.append(f"question_type must be MC4, got '{get('question_type')}'")
        opts = [get(o) for o in OPTIONS]
        if all(opts) and len(set(opts)) != 4:
            errors.append("the four options are not all different")
        try:
            sequence = int(float(get("sequence")))
        except ValueError:
            sequence = None
            errors.append(f"sequence must be a number, got '{get('sequence')}'")
        try:
            points = int(float(get("points") or "50"))
        except ValueError:
            points = None
            errors.append(f"points must be a number, got '{get('points')}'")
        boss = get("boss_eligible").lower()
        if boss and boss not in ("yes", "no"):
            errors.append(f"boss_eligible must be yes/no, got '{boss}'")
        if qid:
            if qid in first_row_of:
                errors.append(f"duplicate question_id (first seen on row {first_row_of[qid]})")
            else:
                first_row_of[qid] = excel_row
        if errors:
            rejected.append({"row": excel_row, "question_id": qid, "errors": errors})
            continue
        review = reviews.get(qid)
        q = {
            "question_id": qid,
            "level_id": lid,
            "topic_id": "story_" + levels[lid]["world_id"],
            "sequence": sequence,
            "difficulty": get("difficulty"),
            "stem": get("question_zh"),
            "option_a": opts[0], "option_b": opts[1], "option_c": opts[2], "option_d": opts[3],
            "answer": answer,
            "explanation": get("explanation_zh"),
            "wrong_tip": get("wrong_answer_hint"),
            "points": points,
            "boss": boss == "yes",
            "excel_status": status,
            "review_status": final_status(status, review),
        }
        if review:
            q["teacher_review"] = review
        accepted.append(q)

    return worlds, levels, level_order, accepted, rejected


def bank_js(payload, label):
    body = json.dumps(payload, ensure_ascii=False, indent=1)
    return (
        "// GENERATED by tools/import_story_bank.py — do not edit by hand.\n"
        f"// {label}\n"
        "(function (root) {\n"
        "  const ITE = (root.ITE = root.ITE || {});\n"
        f"  ITE.storyBank = {body};\n"
        "})(globalThis);\n"
    )


def report_md(meta, levels, level_order, accepted, rejected, review_problems, reviews):
    add = []
    add.append("# 故事模式題庫匯入報告（自動產生）\n")
    add.append(f"- 來源檔案：`{meta['source_file']}`")
    add.append(f"- SHA-256：`{meta['source_sha256']}`")
    add.append(f"- 匯入時間：{meta['imported_at']}")
    add.append(f"- 匯入工作表：`{QUESTIONS_SHEET}`（World_A–E 只供檢閱，不匯入）；關卡資料來自 `Levels`")
    add.append(f"- 教師審核紀錄：{meta['teacher_reviews']} 條（`{DEFAULT_REVIEWS}`）\n")
    add.append("## 摘要\n")
    add.append("| 項目 | 數量 |\n|---|---|")
    add.append(f"| 題目總數 | {meta['total']} |\n| 成功匯入 | {meta['accepted']} |\n| 拒絕 | {meta['rejected']} |")
    add.append(f"| 關卡 | {len(level_order)} |")
    for s, n in sorted(meta["by_status"].items()):
        add.append(f"| 最終狀態 {s} | {n} |")
    add.append(f"| **正式版可用（approved）** | **{meta['by_status'].get('approved', 0)}** |\n")

    per_level = collections.defaultdict(list)
    for q in accepted:
        per_level[q["level_id"]].append(q)
    problems = []
    for lid in level_order:
        qs = per_level.get(lid, [])
        if not qs:
            problems.append(f"`{lid}` 沒有題目")
        elif not any(q["boss"] for q in qs):
            problems.append(f"`{lid}` 沒有小 Boss 題（boss_eligible = yes）")
    add.append("## 關卡檢查\n")
    add.extend([f"- {p}" for p in problems] or ["每個關卡都有題目及小 Boss 題。"])
    add.append("")

    dist = collections.Counter(q["answer"] for q in accepted)
    total = sum(dist.values()) or 1
    add.append("## 答案分佈\n")
    add.append("| 答案 | 數量 | 比例 |\n|---|---|---|")
    for letter in "ABCD":
        add.append(f"| {letter} | {dist.get(letter, 0)} | {round(100 * dist.get(letter, 0) / total)}% |")
    low = [l for l in "ABCD" if dist.get(l, 0) / total < 0.15]
    if low:
        add.append(f"\n⚠ 答案 {', '.join(low)} 少於 15%，學生可能憑位置猜中答案。建議平衡答案位置，或遊戲顯示時打亂選項（待決定）。")
    add.append("")

    add.append("## 教師審核\n")
    if reviews:
        add.append("| question_id | 決定 | 審核人 | 日期 | 備註 |\n|---|---|---|---|---|")
        for qid, r in sorted(reviews.items()):
            add.append(f"| {qid} | {r['decision']} | {r['reviewer']} | {r['reviewed_at']} | {r['note']} |")
    else:
        add.append("尚未有教師審核紀錄。所有題目維持 Excel 狀態；`review` 題不會進入正式版。")
    for p in review_problems:
        add.append(f"- ⚠ {p}")
    add.append("")

    add.append("## 拒絕的題目\n")
    if rejected:
        add.append("| 列 | question_id | 原因 |\n|---|---|---|")
        for r in rejected:
            add.append(f"| {r['row']} | {r['question_id'] or '（空）'} | {'；'.join(r['errors'])} |")
    else:
        add.append("沒有。")
    add.append("")
    return "\n".join(add)


def run(xlsx, out_dir=".", reviews_path=None, now=None):
    sheets = read_workbook(xlsx)
    reviews, review_problems = load_reviews(reviews_path)
    worlds, levels, level_order, accepted, rejected = import_story(sheets, reviews)
    by_status = collections.Counter(q["review_status"] for q in accepted)
    meta = {
        "source_file": os.path.basename(xlsx),
        "source_sha256": sha256_of(xlsx),
        "imported_at": (now or datetime.datetime.now(datetime.timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total": len(accepted) + len(rejected),
        "accepted": len(accepted),
        "rejected": len(rejected),
        "by_status": dict(by_status),
        "teacher_reviews": len(reviews),
    }
    ordered_levels = [levels[lid] for lid in level_order]
    dev = {"meta": meta, "worlds": worlds, "levels": ordered_levels, "questions": accepted}
    approved = [q for q in accepted if q["review_status"] == "approved"]
    release = {"meta": dict(meta, note="release build: approved questions only"), "worlds": worlds,
               "levels": ordered_levels, "questions": approved}
    paths = {
        "dev": os.path.join(out_dir, "src", "data", "story_bank.js"),
        "release": os.path.join(out_dir, "src", "data", "story_bank.release.js"),
        "report": os.path.join(out_dir, "docs", "STORY_BANK_IMPORT_REPORT.md"),
    }
    for p in paths.values():
        os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(paths["dev"], "w", encoding="utf-8") as f:
        f.write(bank_js(dev, "DEV build: all accepted story questions incl. review (labelled in UI)."))
    with open(paths["release"], "w", encoding="utf-8") as f:
        f.write(bank_js(release, "RELEASE build: approved story questions ONLY."))
    with open(paths["report"], "w", encoding="utf-8") as f:
        f.write(report_md(meta, levels, level_order, accepted, rejected, review_problems, reviews))
    return meta, rejected, review_problems, paths


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("xlsx")
    p.add_argument("--out-dir", default=".")
    p.add_argument("--reviews", default=DEFAULT_REVIEWS, help="teacher review CSV (optional)")
    args = p.parse_args(argv)
    try:
        meta, rejected, review_problems, paths = run(args.xlsx, args.out_dir, args.reviews)
    except ImportError_ as e:
        print(f"IMPORT FAILED: {e}", file=sys.stderr)
        return 2
    print(f"total {meta['total']}, accepted {meta['accepted']}, rejected {meta['rejected']}, "
          f"by status {meta['by_status']}, teacher reviews {meta['teacher_reviews']}")
    for msg in review_problems:
        print("warning:", msg)
    for k, v in paths.items():
        print(f"wrote {k}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
