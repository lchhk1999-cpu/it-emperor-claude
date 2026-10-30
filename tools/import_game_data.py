"""Import RPG game data (characters, config, missions, titles, equipment) from
the ChatGPT-curated workbook.

Reads the `Characters`, `GameConfig`, `Missions`, `Titles` and `Equipment` sheets of
IT_Emperor_DseMcQs.xlsx (`Topics` is used to check topics). Numbers in these
sheets are the workbook's demo values; the game labels them PROTOTYPE.
Missions/titles whose condition the game cannot track yet are imported with
"supported": false and shown as 「即將開放」.

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
import re
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
        # Optional family columns (角色品種, approved 2026-10-30): both or neither.
        family, family_name = d.get("family_id", ""), d.get("family_name", "")
        if bool(family) != bool(family_name):
            errors.append("family_id and family_name must both be filled or both be empty")
        if cid in seen:
            errors.append(f"duplicate character_id (first seen on row {seen[cid]})")
        elif cid:
            seen[cid] = row
        if errors:
            rejected.append({"row": row, "id": cid, "errors": errors})
            continue
        character = {
            "id": cid,
            "name": d["character_name"],
            "specialty": d["specialty_topic"],
            "rarity": d["rarity"],
            "attack": nums["base_attack"],
            "hp": nums["base_hp"],
            "bonus": nums["topic_bonus_pct"] / 100,
        }
        if family:
            character.update(family=family, familyName=family_name)
        accepted.append(character)
    return accepted, rejected


# Conditions the game can count today (src/core/missions.js).
MISSION_CONDITIONS = {"answer_questions", "answer_correct", "clear_stage"}
TITLE_CONDITIONS = {"total_correct", "topic_correct", "sql_join_correct"}
CYCLES = ("daily", "weekly", "once")


def import_missions(sheets):
    out, rejected, seen = [], [], set()
    if "Missions" not in sheets:  # optional: the game then simply shows no missions
        return out, rejected
    cols = ["mission_id", "cycle", "name", "condition_type", "target_count", "reward_gems", "reward_coins", "active"]
    for row, d in _rows(sheets, "Missions", cols):
        if d["active"].lower() == "no":
            continue
        errors = [f"{k} is empty" for k in ("mission_id", "cycle", "name", "condition_type", "target_count") if not d[k]]
        if d["cycle"] and d["cycle"] not in CYCLES:
            errors.append(f"cycle must be daily/weekly/once, got '{d['cycle']}'")
        nums = {}
        for k, lo in (("target_count", 1), ("reward_gems", 0), ("reward_coins", 0)):
            try:
                nums[k] = _num(d[k] or "0", int)
                if nums[k] < lo:
                    errors.append(f"{k} must be at least {lo}")
            except ValueError:
                errors.append(f"{k} must be a number, got '{d[k]}'")
        if d["mission_id"] in seen:
            errors.append("duplicate mission_id")
        seen.add(d["mission_id"])
        if errors:
            rejected.append({"row": row, "id": d["mission_id"], "errors": errors})
            continue
        out.append({"id": d["mission_id"], "cycle": d["cycle"], "name": d["name"], "condition": d["condition_type"],
                    "target": nums["target_count"], "gems": nums["reward_gems"], "coins": nums["reward_coins"],
                    "supported": d["condition_type"] in MISSION_CONDITIONS})
    return out, rejected


def import_titles(sheets, topics):
    out, rejected, seen = [], [], set()
    if "Titles" not in sheets:  # optional
        return out, rejected
    cols = ["title_id", "title_name", "condition_type", "target_count", "description", "active"]
    for row, d in _rows(sheets, "Titles", cols):
        if d["active"].lower() == "no":
            continue
        errors = [f"{k} is empty" for k in ("title_id", "title_name", "condition_type", "target_count") if not d[k]]
        try:
            target = _num(d["target_count"], int)
            if target < 1:
                errors.append("target_count must be at least 1")
        except ValueError:
            errors.append(f"target_count must be a number, got '{d['target_count']}'")
        topic = None
        if d["condition_type"] == "topic_correct":
            # The sheet has no topic column; the id suffix names it (T-EXCEL -> EXCEL).
            suffix = d["title_id"].split("-", 1)[-1]
            if suffix in topics:
                topic = suffix
            else:
                errors.append(f"topic_correct needs a topic: '{suffix}' (from title_id) is not in the Topics sheet")
        if d["title_id"] in seen:
            errors.append("duplicate title_id")
        seen.add(d["title_id"])
        if errors:
            rejected.append({"row": row, "id": d["title_id"], "errors": errors})
            continue
        out.append({"id": d["title_id"], "name": d["title_name"], "condition": d["condition_type"], "target": target,
                    "topic": topic, "description": d["description"], "supported": d["condition_type"] in TITLE_CONDITIONS})
    return out, rejected


# Equipment effects are written as text in the sheet; each type has a pattern.
# Types whose effect the game cannot apply yet are imported with supported: false.
EQUIPMENT_PATTERNS = {
    "hint": (r"刪去\s*(\d+)\s*個(?:錯誤選項)?\s*[；;]\s*冷卻\s*(\d+)\s*題", ("remove", "cooldown")),
    "healing": (r"回復\s*(\d+)\s*HP", ("heal",)),
    "damage": (r"冷卻\s*(\d+)\s*題\s*[：:]\s*額外傷害\s*(\d+)", ("cooldown", "bonus")),
    "defense": (r"受傷害\s*-\s*(\d+)\s*%", ("reduce_pct",)),
    "time": (r"每題\s*\+\s*(\d+)\s*秒", ("seconds",)),
}
EQUIPMENT_SUPPORTED = {"hint", "healing", "damage", "defense"}  # "time": DSE battles have no timer yet


def parse_effect(kind, text):
    if kind not in EQUIPMENT_PATTERNS:
        return None
    pattern, names = EQUIPMENT_PATTERNS[kind]
    m = re.search(pattern, text or "")
    if not m:
        return None
    return {name: int(value) for name, value in zip(names, m.groups())}


def import_equipment(sheets):
    out, rejected, seen = [], [], set()
    if "Equipment" not in sheets:  # optional
        return out, rejected
    cols = ["equipment_id", "equipment_name", "type", "evolution_1", "evolution_2", "evolution_3", "active"]
    for row, d in _rows(sheets, "Equipment", cols):
        if d["active"].lower() == "no":
            continue
        errors = [f"{k} is empty" for k in ("equipment_id", "equipment_name", "type", "evolution_1") if not d[k]]
        levels = []
        if d["type"] and d["type"] not in EQUIPMENT_PATTERNS:
            errors.append(f"unknown equipment type '{d['type']}'")
        else:
            for i in (1, 2, 3):
                text = d[f"evolution_{i}"]
                if not text:
                    continue
                effect = parse_effect(d["type"], text)
                if effect is None:
                    errors.append(f"evolution_{i} '{text}' does not match the {d['type']} effect format")
                else:
                    levels.append(dict(effect, text=text))
        if d["equipment_id"] in seen:
            errors.append("duplicate equipment_id")
        seen.add(d["equipment_id"])
        if errors:
            rejected.append({"row": row, "id": d["equipment_id"], "errors": errors})
            continue
        out.append({"id": d["equipment_id"], "name": d["equipment_name"], "type": d["type"], "levels": levels,
                    "supported": d["type"] in EQUIPMENT_SUPPORTED})
    return out, rejected


def import_pools(sheets):
    """Pools sheet: one row per pool and rarity. Each pool's percentages must sum to 100."""
    out, rejected = {}, []
    if "Pools" not in sheets:  # optional
        return out, rejected
    cols = ["pool_id", "pool_type", "rarity", "probability_pct", "pity_threshold", "active"]
    rows = {}
    for row, d in _rows(sheets, "Pools", cols):
        if d["active"].lower() == "no":
            continue
        errors = []
        if d["pool_type"] not in ("character", "equipment"):
            errors.append(f"pool_type must be character/equipment, got '{d['pool_type']}'")
        if d["rarity"] not in RARITIES:
            errors.append(f"rarity must be R/SR/SSR, got '{d['rarity']}'")
        try:
            pct = float(d["probability_pct"])
            pity = _num(d["pity_threshold"] or "0", int)
            if not 0 < pct <= 100 or pity < 0:
                errors.append("probability_pct must be 0-100 and pity_threshold >= 0")
        except ValueError:
            errors.append("probability_pct / pity_threshold must be numbers")
        if errors:
            rejected.append({"row": row, "id": d["pool_id"], "errors": errors})
            continue
        rows.setdefault((d["pool_id"], d["pool_type"]), []).append({"rarity": d["rarity"], "pct": pct, "pity": pity})
    for (pool_id, pool_type), rates in rows.items():
        total = round(sum(r["pct"] for r in rates), 6)
        rarities = [r["rarity"] for r in rates]
        if total != 100 or len(set(rarities)) != len(rarities):
            rejected.append({"row": "-", "id": pool_id, "errors": [f"rates must cover each rarity once and sum to 100 (got {total})"]})
            continue
        out[pool_type] = {"id": pool_id, "rates": sorted(rates, key=lambda r: RARITIES.index(r["rarity"]))}
    return out, rejected


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
    missions, rejected_missions = import_missions(sheets)
    titles, rejected_titles = import_titles(sheets, topics)
    equipment, rejected_equipment = import_equipment(sheets)
    pools, rejected_pools = import_pools(sheets)
    rejected = rejected + rejected_missions + rejected_titles + rejected_equipment + rejected_pools
    if config_problems:
        raise ImportError_("; ".join(config_problems))
    if not characters:
        raise ImportError_("no valid characters")
    meta = {
        "source_file": os.path.basename(xlsx),
        "source_sha256": sha256_of(xlsx),
        "imported_at": (now or datetime.datetime.now(datetime.timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "characters": len(characters),
        "missions": len(missions),
        "titles": len(titles),
        "equipment": len(equipment),
        "rejected": len(rejected),
    }
    payload = {"meta": meta, "config": config, "characters": characters, "missions": missions, "titles": titles,
               "equipment": equipment, "pools": pools}
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
             f"- 匯入時間：{meta['imported_at']}", "- 工作表：`Characters`、`GameConfig`、`Missions`、`Titles`（Topics 用作檢查課題）", "",
             "## 角色", "", "| ID | 名稱 | 專長 | 稀有度 | 攻擊 | HP | 專長加成 |", "|---|---|---|---|---|---|---|"]
    for c in characters:
        lines.append(f"| {c['id']} | {c['name']} | {c['specialty']} | {c['rarity']} | {c['attack']} | {c['hp']} | {round(c['bonus'] * 100)}% |")
    lines += ["", "## 遊戲設定", "", "| 鍵 | 值 |", "|---|---|"] + [f"| {k} | {v} |" for k, v in config.items()]
    cycle_name = {"daily": "每日", "weekly": "每週", "once": "成就"}
    lines += ["", "## 任務", "", "| ID | 週期 | 名稱 | 條件 | 目標 | 寶石 | 金幣 | 遊戲支援 |", "|---|---|---|---|---|---|---|---|"]
    lines += [f"| {m['id']} | {cycle_name[m['cycle']]} | {m['name']} | {m['condition']} | {m['target']} | {m['gems']} | {m['coins']} | {'✅' if m['supported'] else '❌ 即將開放'} |" for m in missions]
    lines += ["", "## 稱號", "", "| ID | 名稱 | 條件 | 目標 | 課題 | 遊戲支援 |", "|---|---|---|---|---|---|"]
    lines += [f"| {t['id']} | {t['name']} | {t['condition']} | {t['target']} | {t['topic'] or '—'} | {'✅' if t['supported'] else '❌ 即將開放'} |" for t in titles]
    if any(t["condition"] == "topic_correct" for t in titles):
        lines += ["", "註：`Titles` 表沒有課題欄，`topic_correct` 稱號的課題取自 title_id 後綴（例如 T-EXCEL → EXCEL）。建議在 Excel 加入明確的 topic_id 欄。"]
    lines += ["", "## 裝備（第 1 階效果；進化未開放）", "", "| ID | 名稱 | 類型 | 第 1 階 | 解讀數值 | 遊戲支援 |", "|---|---|---|---|---|---|"]
    for e in equipment:
        lv = e["levels"][0]
        values = "、".join(f"{k}={v}" for k, v in lv.items() if k != "text")
        lines.append(f"| {e['id']} | {e['name']} | {e['type']} | {lv['text']} | {values} | {'✅' if e['supported'] else '❌ 即將開放'} |")
    lines += ["", "## 抽蛋池（只用免費寶石）", "", "| 池 | 類型 | 稀有度 | 機率 | 保底 |", "|---|---|---|---|---|"]
    for kind, pool in pools.items():
        for r in pool["rates"]:
            lines.append(f"| {pool['id']} | {kind} | {r['rarity']} | {r['pct']}% | {r['pity'] or '—'} |")
    if "equipment" in pools and equipment:
        lines += ["", "註：`Equipment` 表沒有稀有度欄，裝備池的稀有度機率暫時無法套用；遊戲內每件可用裝備機率相同，並清楚註明。建議在 Excel 加入 rarity 欄。"]
    lines += ["", "## 拒絕的資料", ""]
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
    print(f"characters {meta['characters']}, missions {meta['missions']}, titles {meta['titles']}, "
          f"equipment {meta['equipment']}, rejected {meta['rejected']}")
    for k, v in paths.items():
        print(f"wrote {k}: {v}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
