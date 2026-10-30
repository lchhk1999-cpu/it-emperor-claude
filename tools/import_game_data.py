"""Import RPG game data (characters, config) from the ChatGPT-curated workbook.

Reads the `Characters` and `GameConfig` sheets of IT_Emperor_DseMcQs.xlsx
(`Topics` is used to check specialty topics). Numbers in these sheets are the
workbook's demo values; the game labels them PROTOTYPE.

Outputs:
- src/data/game_data.js
- docs/GAME_DATA_IMPORT_REPORT.md

Usage:
    python3 tools/import_game_data.py data/question_bank/IT_Emperor_DseMcQs.xlsx
"""

import argparse
import datetime
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from import_question_bank import ImportError_, _cell_text, load_topics, read_workbook, sha256_of  # noqa: E402

RARITIES = ("R", "SR", "SSR")
CHAR_REQUIRED = ["character_id", "character_name", "specialty_topic", "rarity", "base_attack", "base_hp",
                 "topic_bonus_pct", "active"]
# GameConfig keys the game reads, with type and allowed range.
CONFIG_SPEC = {
    "team_slots_max": (int, 1, 10),
    "initial_team_slots": (int, 1, 10),
    "specialist_bonus": (float, 0, 1),
    "pvp_stats_normalized": (int, 0, 1),
    "gacha_paid_enabled": (int, 0, 1),
}


def _rows(sheets, name, required):
    if name not in sheets:
        raise ImportError_(f"workbook has no '{name}' sheet")
    rows = sheets[name]
    header = [_cell_text(c).strip() for c in rows[0]]
    missing = [c for c in required if c not in header]
    if missing:
        raise ImportError_(f"{name} sheet is missing columns: {', '.join(missing)}")
    out = []
    for excel_row, row in enumerate(rows[1:], start=2):
        d = {h: (_cell_text(row[i]).strip() if i < len(row) else "") for i, h in enumerate(header) if h}
        if any(d.values()):
            out.append((excel_row, d))
    return out


def _num(value, kind):
    return kind(float(value)) if kind is int else kind(value)


def import_characters(sheets, topics):
    accepted, rejected, seen = [], [], {}
    for row, d in _rows(sheets, "Characters", CHAR_REQUIRED):
        errors = []
        cid = d["character_id"]
        if d["active"].lower() not in ("yes", "no"):
            errors.append(f"active must be yes/no, got '{d['active']}'")
        if d["active"].lower() == "no":
            continue
        for k in CHAR_REQUIRED:
            if not d.get(k):
                errors.append(f"{k} is empty")
        if d["rarity"] and d["rarity"] not in RARITIES:
            errors.append(f"rarity must be R/SR/SSR, got '{d['rarity']}'")
        if d["specialty_topic"] and d["specialty_topic"] != "ALL" and d["specialty_topic"] not in topics:
            errors.append(f"specialty_topic '{d['specialty_topic']}' is not in the Topics sheet")
        nums = {}
        for k, lo, hi in (("base_attack", 1, 1000), ("base_hp", 1, 1000), ("topic_bonus_pct", 0, 100)):
            try:
                nums[k] = _num(d[k], int)
                if not lo <= nums[k] <= hi:
                    errors.append(f"{k} must be {lo}-{hi}, got {nums[k]}")
            except ValueError:
                errors.append(f"{k} must be a number, got '{d[k]}'")
        if cid in seen:
            errors.append(f"duplicate character_id (first seen on row {seen[cid]})")
        elif cid:
            seen[cid] = row
        if errors:
            rejected.append({"row": row, "id": cid, "errors": errors})
            continue
        accepted.append({
            "id": cid,
            "name": d["character_name"],
            "specialty": d["specialty_topic"],
            "rarity": d["rarity"],
            "attack": nums["base_attack"],
            "hp": nums["base_hp"],
            "bonus": nums["topic_bonus_pct"] / 100,
        })
    return accepted, rejected


def import_config(sheets):
    config, problems = {}, []
    raw = {d["config_key"]: d.get("value", "") for _, d in _rows(sheets, "GameConfig", ["config_key", "value"])}
    for key, (kind, lo, hi) in CONFIG_SPEC.items():
        if key not in raw:
            problems.append(f"GameConfig is missing '{key}'")
            continue
        try:
            value = _num(raw[key], kind)
        except ValueError:
            problems.append(f"GameConfig '{key}' must be a number, got '{raw[key]}'")
            continue
        if not lo <= value <= hi:
            problems.append(f"GameConfig '{key}' must be {lo}-{hi}, got {value}")
            continue
        config[key] = value
    if not problems and config["initial_team_slots"] > config["team_slots_max"]:
        problems.append("initial_team_slots is larger than team_slots_max")
    return config, problems


def run(xlsx, out_dir=".", now=None):
    sheets = read_workbook(xlsx)
    topics = load_topics(sheets)
    characters, rejected = import_characters(sheets, topics)
    config, config_problems = import_config(sheets)
    if config_problems:
        raise ImportError_("; ".join(config_problems))
    if not characters:
        raise ImportError_("no valid characters")
    meta = {
        "source_file": os.path.basename(xlsx),
        "source_sha256": sha256_of(xlsx),
        "imported_at": (now or datetime.datetime.now(datetime.timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "characters": len(characters),
        "rejected": len(rejected),
    }
    payload = {"meta": meta, "config": config, "characters": characters}
    js_path = os.path.join(out_dir, "src", "data", "game_data.js")
    report_path = os.path.join(out_dir, "docs", "GAME_DATA_IMPORT_REPORT.md")
    for p in (js_path, report_path):
        os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("// GENERATED by tools/import_game_data.py — do not edit by hand.\n"
                "// Values are the workbook's demo numbers (PROTOTYPE balance).\n"
                "(function (root) {\n  const ITE = (root.ITE = root.ITE || {});\n"
                f"  ITE.gameData = {json.dumps(payload, ensure_ascii=False, indent=1)};\n}})(globalThis);\n")
    lines = ["# 遊戲資料匯入報告（自動產生）", "",
             f"- 來源檔案：`{meta['source_file']}`", f"- SHA-256：`{meta['source_sha256']}`",
             f"- 匯入時間：{meta['imported_at']}", "- 工作表：`Characters`、`GameConfig`（Topics 用作檢查專長課題）", "",
             "## 角色", "", "| ID | 名稱 | 專長 | 稀有度 | 攻擊 | HP | 專長加成 |", "|---|---|---|---|---|---|---|"]
    for c in characters:
        lines.append(f"| {c['id']} | {c['name']} | {c['specialty']} | {c['rarity']} | {c['attack']} | {c['hp']} | {round(c['bonus'] * 100)}% |")
    lines += ["", "## 遊戲設定", "", "| 鍵 | 值 |", "|---|---|"] + [f"| {k} | {v} |" for k, v in config.items()]
    lines += ["", "## 拒絕的角色", ""]
    if rejected:
        lines += ["| 列 | ID | 原因 |", "|---|---|---|"] + [f"| {r['row']} | {r['id']} | {'；'.join(r['errors'])} |" for r in rejected]
    else:
        lines.append("沒有。")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    return meta, rejected, {"js": js_path, "report": report_path}


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
    print(f"characters {meta['characters']}, rejected {meta['rejected']}")
    for k, v in paths.items():
        print(f"wrote {k}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
