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

    def run_import(self, chars, config=CONFIG):
        xlsx = os.path.join(self.dir, "data.xlsx")
        make_xlsx(xlsx, {"Characters": [CH] + chars, "GameConfig": config, "Topics": TOPICS})
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


if __name__ == "__main__":
    unittest.main()
