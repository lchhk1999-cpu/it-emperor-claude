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

    def test_optional_family_columns(self):
        header = CH + ["family_id", "family_name"]
        rows = [ch("C1") + ["FAM-A", "A 系列"], ch("C2") + ["", ""], ch("C3") + ["FAM-A", ""]]
        xlsx = os.path.join(self.dir, "fam.xlsx")
        make_xlsx(xlsx, {"Characters": [header] + rows, "GameConfig": CONFIG, "Topics": TOPICS})
        _, rejected, paths = gd.run(xlsx, self.dir)
        with open(paths["js"], encoding="utf-8") as f:
            data = json.loads(re.search(r"ITE\.gameData = (\{.*\});\n\}\)", f.read(), re.S).group(1))
        by_id = {c["id"]: c for c in data["characters"]}
        self.assertEqual((by_id["C1"]["family"], by_id["C1"]["familyName"]), ("FAM-A", "A 系列"))
        self.assertNotIn("family", by_id["C2"])
        self.assertEqual([r["id"] for r in rejected], ["C3"])
        self.assertIn("family_id and family_name", rejected[0]["errors"][0])

    def test_materials_sheet_is_optional_and_validated(self):
        _, _, data = self.run_import([ch("C1")])
        self.assertEqual(data["materials"], [])
        mats = [["material_id", "material_name", "topic_id", "rarity", "description", "active"],
                ["M1", "資料碎片", "SQL", "common", "SQL 進化", "yes"],
                ["M2", "傳說核心", "ALL", "legendary", "", "yes"],
                ["M3", "壞稀有度", "SQL", "epic", "", "yes"],
                ["M4", "壞課題", "MAGIC", "common", "", "yes"],
                ["M5", "停用", "SQL", "common", "", "no"],
                ["M1", "重複", "SQL", "common", "", "yes"]]
        _, rejected, data = self.run_import([ch("C1")], extra={"Materials": mats})
        self.assertEqual([m["id"] for m in data["materials"]], ["M1", "M2"])
        self.assertEqual(data["materials"][0], {"id": "M1", "name": "資料碎片", "topic": "SQL", "rarity": "common", "description": "SQL 進化"})
        self.assertEqual([r["id"] for r in rejected], ["M3", "M4", "M1"])

    def test_weekly_events_point_at_valid_stages(self):
        mats = [["material_id", "material_name", "topic_id", "rarity", "description", "active"],
                ["M1", "資料碎片", "SQL", "common", "", "yes"]]
        stages = [["stage_id", "world", "title", "topic_id", "mode", "difficulty", "question_count", "material_id", "active"],
                  ["S1", "SQL 地下城", "記錄", "SQL", "story", "medium", "6", "M1", "yes"],
                  ["S2", "", "壞難度", "SQL", "story", "insane", "6", "M1", "yes"],
                  ["S3", "", "壞素材", "ALL", "event", "easy", "6", "NOPE", "yes"],
                  ["S4", "", "沒有活動", "SQL", "story", "easy", "5", "M1", "yes"]]
        events = [["event_id", "weekday_iso", "event_name", "stage_id", "active"],
                  ["E1", "3", "SQL 素材日", "S1", "yes"], ["E2", "3", "同一天", "S1", "yes"],
                  ["E3", "8", "壞星期", "S1", "yes"], ["E4", "1", "壞關卡", "S2", "yes"]]
        _, rejected, data = self.run_import([ch("C1")], extra={"Materials": mats, "Stages": stages, "Events": events})
        self.assertEqual(data["events"], [{"id": "E1", "weekday": 3, "name": "SQL 素材日", "stage": "S1"}])
        self.assertEqual(data["eventStages"], [{"id": "S1", "title": "記錄", "world": "SQL 地下城", "topic": "SQL",
                                                 "difficulty": "medium", "questionCount": 6, "material": "M1", "stamina": 0}])
        self.assertEqual(sorted(r["id"] for r in rejected), ["E2", "E3", "E4", "S2", "S3"])

    def test_new_title_conditions_are_supported(self):
        titles = [["title_id", "title_name", "condition_type", "target_count", "course_id", "description", "active"],
                  ["T-WORLD-B", "硬件工匠", "world_correct", "30", "ICT", "", "yes"],
                  ["T-WORLD-Z", "壞世界", "world_correct", "30", "ICT", "", "yes"],
                  ["T-STREAK10", "穩打穩紮", "best_streak", "10", "ICT", "", "yes"],
                  ["T-CHECKIN7", "每日報到", "checkin_days", "7", "ICT", "", "yes"]]
        _, rejected, data = self.run_import([ch("C1")], extra={"Titles": titles})
        by_id = {t["id"]: t for t in data["titles"]}
        self.assertEqual((by_id["T-WORLD-B"]["topic"], by_id["T-WORLD-B"]["supported"]), ("B", True))
        self.assertTrue(by_id["T-STREAK10"]["supported"] and by_id["T-CHECKIN7"]["supported"])
        self.assertEqual([r["id"] for r in rejected], ["T-WORLD-Z"])

    def test_inactive_characters_are_skipped(self):
        _, rejected, data = self.run_import([ch("C1"), ch("C2", active="no")])
        self.assertEqual([c["id"] for c in data["characters"]], ["C1"])
        self.assertEqual(rejected, [])

    def test_optional_stamina_config_defaults_and_validation(self):
        _, _, data = self.run_import([ch("C1")])
        self.assertEqual((data["config"]["starter_stamina"], data["config"]["level_up_stamina"]), (40, 2))
        _, _, data = self.run_import([ch("C1")], config=CONFIG + [["starter_stamina", "60", "", ""], ["level_up_stamina", "3", "", ""]])
        self.assertEqual((data["config"]["starter_stamina"], data["config"]["level_up_stamina"]), (60, 3))
        with self.assertRaises(ImportError_):
            self.run_import([ch("C1")], config=CONFIG + [["starter_stamina", "0", "", ""]])

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

    def test_pools_rates_must_sum_to_100(self):
        head = ["pool_id", "pool_type", "rarity", "probability_pct", "pity_threshold", "note", "active"]
        good = [head, ["CHAR", "character", "R", "77", "0", "", "yes"], ["CHAR", "character", "SR", "20", "0", "", "yes"],
                ["CHAR", "character", "SSR", "3", "80", "", "yes"]]
        _, rejected, data = self.run_import([ch("C1")], extra={"Pools": good})
        self.assertEqual(rejected, [])
        self.assertEqual([(r["rarity"], r["pct"], r["pity"]) for r in data["pools"]["character"]["rates"]],
                         [("R", 77.0, 0), ("SR", 20.0, 0), ("SSR", 3.0, 80)])
        bad = [head, ["EQ", "equipment", "R", "70", "0", "", "yes"], ["EQ", "equipment", "SSR", "3", "0", "", "yes"],
               ["X", "pet", "R", "100", "0", "", "yes"]]
        _, rejected, data = self.run_import([ch("C1")], extra={"Pools": bad})
        self.assertEqual(data["pools"], {})
        reasons = " ".join(" ".join(r["errors"]) for r in rejected)
        self.assertIn("sum to 100", reasons)
        self.assertIn("pool_type", reasons)


if __name__ == "__main__":
    unittest.main()
