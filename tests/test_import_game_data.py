"""Tests for tools/import_game_data.py (Characters + GameConfig)."""

import json
import os
import re
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
sys.path.insert(0, os.path.dirname(__file__))
import import_game_data as gd  # noqa: E402
from import_question_bank import ImportError_  # noqa: E402
from test_import_question_bank import TOPICS, make_xlsx  # noqa: E402

CH = ["character_id", "character_name", "specialty_topic", "rarity", "base_attack", "base_hp", "topic_bonus_pct",
      "max_evolution", "equipment_slots_initial", "active"]
CONFIG = [["config_key", "value", "unit", "note"], ["team_slots_max", "5", "", ""], ["initial_team_slots", "1", "", ""],
          ["specialist_bonus", "0.2", "", ""], ["pvp_stats_normalized", "1", "", ""], ["gacha_paid_enabled", "0", "", ""]]


def ch(cid, **over):
    base = {"character_id": cid, "character_name": "角色 " + cid, "specialty_topic": "SQL", "rarity": "R",
            "base_attack": "100", "base_hp": "100", "topic_bonus_pct": "20", "max_evolution": "3",
            "equipment_slots_initial": "1", "active": "yes"}
    base.update(over)
    return [base[h] for h in CH]


class GameDataImporterTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = self.tmp.name

    def tearDown(self):
        self.tmp.cleanup()

    def run_import(self, chars, config=CONFIG, extra=None):
        xlsx = os.path.join(self.dir, "data.xlsx")
        make_xlsx(xlsx, {"Characters": [CH] + chars, "GameConfig": config, "Topics": TOPICS, **(extra or {})})
        meta, rejected, paths = gd.run(xlsx, self.dir)
        with open(paths["js"], encoding="utf-8") as f:
            data = json.loads(re.search(r"ITE\.gameData = (\{.*\});\n\}\)", f.read(), re.S).group(1))
        return meta, rejected, data

    def test_valid_characters_and_config(self):
        meta, rejected, data = self.run_import([ch("C1"), ch("C2", specialty_topic="ALL", rarity="SSR", topic_bonus_pct="10")])
        self.assertEqual(rejected, [])
        self.assertEqual([c["id"] for c in data["characters"]], ["C1", "C2"])
        self.assertEqual(data["characters"][1]["bonus"], 0.1)
        self.assertEqual(data["config"]["team_slots_max"], 5)
        self.assertEqual(data["config"]["specialist_bonus"], 0.2)

    def test_invalid_characters_are_rejected_with_reasons(self):
        rows = [ch("B1", rarity="UR"), ch("B2", specialty_topic="MAGIC"), ch("B3", base_attack="lots"),
                ch("B4", topic_bonus_pct="150"), ch("OK"), ch("OK")]
        meta, rejected, data = self.run_import(rows)
        self.assertEqual([c["id"] for c in data["characters"]], ["OK"])
        reasons = [" ".join(r["errors"]) for r in rejected]
        for text, frag in zip(reasons, ["rarity", "MAGIC", "base_attack", "topic_bonus_pct", "duplicate"]):
            self.assertIn(frag, text)

    def test_inactive_characters_are_skipped(self):
        _, rejected, data = self.run_import([ch("C1"), ch("C2", active="no")])
        self.assertEqual([c["id"] for c in data["characters"]], ["C1"])
        self.assertEqual(rejected, [])

    def test_missing_or_bad_config_fails_the_import(self):
        with self.assertRaises(ImportError_):
            self.run_import([ch("C1")], config=CONFIG[:-1])
        bad = [row[:] for row in CONFIG]
        bad[2][1] = "9"  # initial slots larger than max
        with self.assertRaises(ImportError_):
            self.run_import([ch("C1")], config=bad)

    def test_missions_and_titles_with_support_flags(self):
        missions = [["mission_id", "cycle", "name", "condition_type", "target_count", "reward_gems", "reward_coins", "active"],
                     ["M1", "daily", "答 10 題", "answer_questions", "10", "3", "0", "yes"],
                     ["M2", "once", "進化", "evolve_character", "1", "20", "0", "yes"],
                     ["M3", "monthly", "壞", "answer_questions", "1", "1", "0", "yes"],
                     ["M4", "daily", "停用", "answer_questions", "1", "1", "0", "no"]]
        titles = [["title_id", "title_name", "condition_type", "target_count", "course_id", "description", "active"],
                  ["T-SQL", "SQL 達人", "topic_correct", "100", "ICT", "", "yes"],
                  ["T-MAGIC", "魔法", "topic_correct", "10", "ICT", "", "yes"],
                  ["T-RANK", "王者", "season_rank", "100", "ICT", "", "yes"]]
        meta, rejected, data = self.run_import([ch("C1")], extra={"Missions": missions, "Titles": titles})
        self.assertEqual([(m["id"], m["supported"]) for m in data["missions"]], [("M1", True), ("M2", False)])
        self.assertEqual(data["missions"][0]["gems"], 3)
        self.assertEqual([(t["id"], t["topic"], t["supported"]) for t in data["titles"]], [("T-SQL", "SQL", True), ("T-RANK", None, False)])
        reasons = " ".join(" ".join(r["errors"]) for r in rejected)
        self.assertIn("cycle", reasons)
        self.assertIn("MAGIC", reasons)

    def test_missing_missions_and_titles_sheets_are_allowed(self):
        _, _, data = self.run_import([ch("C1")])
        self.assertEqual((data["missions"], data["titles"]), ([], []))

    def test_equipment_effect_text_is_parsed_or_rejected(self):
        eq = [["equipment_id", "equipment_name", "type", "unlock_action", "evolution_1", "evolution_2", "evolution_3", "active"],
              ["EQ-AI", "AI", "hint", "x", "刪去 1 個錯誤選項；冷卻 6 題", "刪去 1 個；冷卻 4 題", "刪去 2 個；冷卻 4 題", "yes"],
              ["EQ-PC", "電腦", "damage", "x", "冷卻 6 題：額外傷害 40", "", "", "yes"],
              ["EQ-GL", "眼鏡", "time", "x", "每題 +3 秒", "", "", "yes"],
              ["EQ-BAD", "壞", "healing", "x", "回復好多 HP", "", "", "yes"],
              ["EQ-NEW", "新", "teleport", "x", "傳送", "", "", "yes"]]
        _, rejected, data = self.run_import([ch("C1")], extra={"Equipment": eq})
        by_id = {e["id"]: e for e in data["equipment"]}
        self.assertEqual([(lv["remove"], lv["cooldown"]) for lv in by_id["EQ-AI"]["levels"]], [(1, 6), (1, 4), (2, 4)])
        self.assertEqual((by_id["EQ-PC"]["levels"][0]["cooldown"], by_id["EQ-PC"]["levels"][0]["bonus"]), (6, 40))
        self.assertEqual(by_id["EQ-GL"]["supported"], False)
        self.assertTrue(by_id["EQ-AI"]["supported"])
        reasons = {r["id"]: " ".join(r["errors"]) for r in rejected}
        self.assertIn("does not match", reasons["EQ-BAD"])
        self.assertIn("unknown equipment type", reasons["EQ-NEW"])

    def test_parse_effect_formats(self):
        self.assertEqual(gd.parse_effect("defense", "受傷害 -15%"), {"reduce_pct": 15})
        self.assertEqual(gd.parse_effect("healing", "回復 22 HP"), {"heal": 22})
        self.assertIsNone(gd.parse_effect("healing", "回復很多"))


if __name__ == "__main__":
    unittest.main()
