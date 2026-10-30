"""Tests for tools/import_story_bank.py (story mode + teacher review gating)."""

import json
import os
import re
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
sys.path.insert(0, os.path.dirname(__file__))
import import_story_bank as story  # noqa: E402
from test_import_question_bank import make_xlsx  # noqa: E402

QH = ["question_id", "mode", "world_id", "world_name", "level_id", "level_name", "sequence", "question_type", "difficulty",
      "question_zh", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation_zh",
      "wrong_answer_hint", "points", "boss_eligible", "review_status"]
LEVELS = [["level_id", "world_id", "level_name", "knowledge_scope", "learning_goal", "story_scene"],
          ["A-01", "A", "資訊系統初探", "範圍", "目標", "公告欄"],
          ["A-02", "A", "資料守門員", "範圍", "目標", "登記站"]]
WORLDS = [["world_id", "world_name"], ["A", "數據王國"]]


def q(qid, level="A-01", seq=1, boss="no", status="review", **over):
    base = {"question_id": qid, "mode": "offline_story", "world_id": "A", "world_name": "數據王國", "level_id": level,
            "level_name": "x", "sequence": str(seq), "question_type": "MC4", "difficulty": "easy",
            "question_zh": "題目 " + qid, "option_a": "甲", "option_b": "乙", "option_c": "丙", "option_d": "丁",
            "correct_answer": "B", "explanation_zh": "解說", "wrong_answer_hint": "提示",
            "points": "100" if boss == "yes" else "50", "boss_eligible": boss, "review_status": status}
    base.update(over)
    return [base[h] for h in QH]


def bank_of(js):
    return json.loads(re.search(r"ITE\.storyBank = (\{.*\});\n\}\)", js, re.S).group(1))


class StoryImporterTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = self.tmp.name

    def tearDown(self):
        self.tmp.cleanup()

    def run_import(self, rows, reviews_csv=None, extra=None):
        sheets = {"Story_Questions": [QH] + rows, "Levels": LEVELS, "Worlds": WORLDS}
        sheets.update(extra or {})
        xlsx = os.path.join(self.dir, "story.xlsx")
        make_xlsx(xlsx, sheets)
        reviews = None
        if reviews_csv is not None:
            reviews = os.path.join(self.dir, "reviews.csv")
            with open(reviews, "w", encoding="utf-8") as f:
                f.write(reviews_csv)
        meta, rejected, problems, paths = story.run(xlsx, self.dir, reviews)
        def read(k):
            with open(paths[k], encoding="utf-8") as f:
                return f.read()
        return meta, rejected, problems, bank_of(read("dev")), bank_of(read("release")), read("report")

    def test_levels_worlds_and_boss_flag_are_imported(self):
        meta, rejected, _, dev, _, _ = self.run_import([q("S1"), q("S2", seq=3, boss="yes")])
        self.assertEqual(rejected, [])
        self.assertEqual([l["id"] for l in dev["levels"]], ["A-01", "A-02"])
        self.assertEqual(dev["worlds"]["A"]["name"], "數據王國")
        boss = [x for x in dev["questions"] if x["boss"]]
        self.assertEqual([(x["question_id"], x["points"]) for x in boss], [("S2", 100)])
        self.assertEqual(dev["questions"][0]["stem"], "題目 S1")

    def test_world_review_sheets_are_not_imported(self):
        meta, *_ = self.run_import([q("S1")], extra={"World_A": [QH, q("ONLY-IN-WORLD-SHEET")]})
        self.assertEqual(meta["total"], 1)

    def test_invalid_rows_are_rejected_with_reasons(self):
        rows = [q("B1", level="Z-99"), q("B2", correct_answer="D2"), q("B3", option_d="甲"), q("B4", sequence="x"),
                q("B5", boss_eligible="maybe"), q("B6", explanation_zh=""), q("B1")]
        meta, rejected, *_ = self.run_import(rows)
        self.assertEqual(meta["accepted"], 0)
        reasons = [" ".join(r["errors"]) for r in rejected]
        for text, frag in zip(reasons, ["Z-99", "correct_answer", "not all different", "sequence", "boss_eligible",
                                        "explanation_zh", "duplicate"]):
            self.assertIn(frag, text)

    def test_review_questions_never_reach_release(self):
        _, _, _, dev, release, report = self.run_import([q("S1"), q("S2", status="approved")])
        self.assertEqual(len(dev["questions"]), 2)
        self.assertEqual([x["question_id"] for x in release["questions"]], ["S2"])
        self.assertIn("尚未有教師審核紀錄", report)

    def test_teacher_approval_promotes_review_question(self):
        csv_text = "question_id,decision,reviewer,reviewed_at,note\nS1,approved,LCH,2026-10-30,答案正確\n"
        meta, _, problems, dev, release, report = self.run_import([q("S1"), q("S2")], csv_text)
        self.assertEqual(problems, [])
        self.assertEqual([x["question_id"] for x in release["questions"]], ["S1"])
        s1 = next(x for x in dev["questions"] if x["question_id"] == "S1")
        self.assertEqual((s1["excel_status"], s1["review_status"]), ("review", "approved"))
        self.assertEqual(s1["teacher_review"]["reviewer"], "LCH")
        self.assertIn("| S1 | approved | LCH |", report)

    def test_any_rejection_wins_over_approval(self):
        csv_text = "question_id,decision,reviewer\nS1,rejected,LCH\n"
        _, _, _, dev, release, _ = self.run_import([q("S1", status="approved")], csv_text)
        self.assertEqual(release["questions"], [])
        self.assertEqual(dev["questions"][0]["review_status"], "rejected")

    def test_incomplete_review_lines_are_reported_not_applied(self):
        csv_text = "question_id,decision,reviewer\nS1,approved,\nS2,maybe,LCH\n"
        _, _, problems, _, release, report = self.run_import([q("S1"), q("S2")], csv_text)
        self.assertEqual(len(problems), 2)
        self.assertEqual(release["questions"], [])
        self.assertIn("teacher_reviews.csv line 2", report)

    def test_report_flags_missing_boss_and_unbalanced_answers(self):
        _, _, _, _, _, report = self.run_import([q("S1"), q("S2", level="A-02", seq=3, boss="yes")])
        self.assertIn("`A-01` 沒有小 Boss 題", report)
        self.assertIn("⚠ 答案 A, C, D 少於 15%", report)


if __name__ == "__main__":
    unittest.main()
