"""Tests for tools/import_question_bank.py using small workbooks built in memory.

Run from repo root:  python3 -m unittest discover -s tests -p "test_*.py"
"""

import os
import re
import sys
import tempfile
import unittest
import zipfile
from xml.sax.saxutils import escape

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
import import_question_bank as imp  # noqa: E402

HEADER = ["question_id", "course_id", "topic_id", "difficulty", "question_type", "stem_zh", "option_a", "option_b",
          "option_c", "option_d", "correct", "explanation_zh", "wrong_tip_zh", "tags", "source_note", "status",
          "version", "time_sec"]


def row(qid, **over):
    base = {"question_id": qid, "course_id": "ICT", "topic_id": "SQL", "difficulty": "easy", "question_type": "MC4",
            "stem_zh": "題幹 " + qid, "option_a": "甲", "option_b": "乙", "option_c": "丙", "option_d": "丁",
            "correct": "B", "explanation_zh": "解說", "wrong_tip_zh": "提示", "tags": "t", "source_note": "test",
            "status": "approved", "version": "1", "time_sec": "30"}
    base.update(over)
    return [base[h] for h in HEADER]


def col(i):
    s = ""
    i += 1
    while i:
        i, r = divmod(i - 1, 26)
        s = chr(65 + r) + s
    return s


def sheet_xml(rows):
    """rows: list of lists; a cell value may be ("formula", text, cached) or ("shared_formula",)."""
    out = ['<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>']
    for r, values in enumerate(rows, start=1):
        out.append(f'<row r="{r}">')
        for c, v in enumerate(values):
            ref = f"{col(c)}{r}"
            if isinstance(v, tuple) and v[0] == "formula":
                out.append(f'<c r="{ref}" t="e"><f>{escape(v[1])}</f><v>{escape(v[2])}</v></c>')
            elif isinstance(v, tuple) and v[0] == "shared_formula":
                out.append(f'<c r="{ref}"><f t="shared" si="0"/><v>1</v></c>')
            elif isinstance(v, (int, float)):
                out.append(f'<c r="{ref}"><v>{v}</v></c>')
            else:
                out.append(f'<c r="{ref}" t="inlineStr"><is><t>{escape(str(v))}</t></is></c>')
        out.append("</row>")
    out.append("</sheetData></worksheet>")
    return "".join(out)


def make_xlsx(path, sheets):
    names = list(sheets)
    with zipfile.ZipFile(path, "w") as z:
        z.writestr("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>')
        z.writestr("xl/workbook.xml",
                   '<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
                   'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
                   + "".join(f'<sheet name="{n}" sheetId="{i + 1}" r:id="rId{i + 1}"/>' for i, n in enumerate(names))
                   + "</sheets></workbook>")
        z.writestr("xl/_rels/workbook.xml.rels",
                   '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   + "".join(f'<Relationship Id="rId{i + 1}" Type="worksheet" Target="worksheets/sheet{i + 1}.xml"/>' for i in range(len(names)))
                   + "</Relationships>")
        for i, n in enumerate(names):
            z.writestr(f"xl/worksheets/sheet{i + 1}.xml", sheet_xml(sheets[n]))


TOPICS = [["course_id", "course_name", "topic_id", "topic_name", "active"],
          ["ICT", "ICT", "SQL", "SQL 查詢", "yes"],
          ["ICT", "ICT", "EXCEL", "Excel 公式", "yes"],
          ["ICT", "ICT", "OLD", "停用課題", "no"]]


class ImporterTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = self.tmp.name

    def tearDown(self):
        self.tmp.cleanup()

    def run_import(self, question_rows, extra_sheets=None, topics=TOPICS):
        sheets = {"Questions": [HEADER] + question_rows, "Topics": topics}
        sheets.update(extra_sheets or {})
        xlsx = os.path.join(self.dir, "bank.xlsx")
        make_xlsx(xlsx, sheets)
        meta, rejected, paths = imp.run(xlsx, self.dir)
        with open(paths["dev"], encoding="utf-8") as f:
            dev = f.read()
        with open(paths["release"], encoding="utf-8") as f:
            release = f.read()
        with open(paths["report"], encoding="utf-8") as f:
            report = f.read()
        return meta, rejected, dev, release, report

    def test_valid_rows_import_and_release_gets_only_approved(self):
        meta, rejected, dev, release, report = self.run_import([row("Q1"), row("Q2", status="review"), row("Q3", status="draft")])
        self.assertEqual((meta["accepted"], meta["rejected"]), (3, 0))
        for qid in ("Q1", "Q2", "Q3"):
            self.assertIn(f'"{qid}"', dev)
        self.assertIn('"Q1"', release)
        self.assertNotIn('"Q2"', release)
        self.assertNotIn('"Q3"', release)
        self.assertIn("| 成功匯入 | 3 |", report)

    def test_formula_cells_keep_formula_text_not_cached_error(self):
        r = row("F1", option_a=("formula", "$B3*D$1", "#VALUE!"), option_b=("formula", "SUM(A1:A3)", "#VALUE!"))
        meta, rejected, dev, _, report = self.run_import([r])
        self.assertEqual(rejected, [])
        self.assertIn('"option_a": "=$B3*D$1"', dev)
        self.assertIn('"option_b": "=SUM(A1:A3)"', dev)
        self.assertNotIn("#VALUE!", dev)
        self.assertIn("`=$B3*D$1`", report)

    def test_plain_error_text_and_shared_formulas_are_rejected(self):
        meta, rejected, *_ = self.run_import([row("E1", option_c="#VALUE!"), row("E2", option_d=("shared_formula",))])
        self.assertEqual(meta["rejected"], 2)
        self.assertTrue(any("#VALUE!" in e for e in rejected[0]["errors"]))
        self.assertTrue(any("shared Excel formula" in e for e in rejected[1]["errors"]))

    def test_duplicate_ids_are_reported_with_first_row(self):
        meta, rejected, dev, _, report = self.run_import([row("D1"), row("D1", stem_zh="另一題")])
        self.assertEqual(meta["accepted"], 1)
        self.assertEqual(rejected[0]["row"], 3)
        self.assertIn("first seen on row 2", rejected[0]["errors"][0])
        self.assertIn("| 重複 ID | 1 |", report)

    def test_invalid_fields_each_produce_a_reason(self):
        bad = [
            row("B1", topic_id="ALGORITHM"),
            row("B2", topic_id="OLD"),  # inactive topic
            row("B3", correct="E"),
            row("B4", option_d="甲"),
            row("B5", status="ok"),
            row("B6", explanation_zh=""),
            row("B7", question_type="TF"),
            row("B8", difficulty="extreme"),
            row("B9", time_sec="soon"),
            row("", stem_zh="無 ID"),
        ]
        meta, rejected, _, _, report = self.run_import(bad)
        self.assertEqual(meta["accepted"], 0)
        self.assertEqual(len(rejected), len(bad))
        joined = [" ".join(r["errors"]) for r in rejected]
        for text, fragment in zip(joined, ["ALGORITHM", "OLD", "answer", "not all different", "status", "explanation",
                                           "question_type", "difficulty", "time_sec", "question_id is empty"]):
            self.assertIn(fragment, text)
        self.assertIn("`ALGORITHM`：1 題", report)

    def test_topic_sheets_are_not_imported(self):
        meta, _, dev, _, _ = self.run_import([row("Q1")], extra_sheets={"Topic_SQL": [HEADER, row("ONLY-IN-TOPIC-SHEET")]})
        self.assertEqual(meta["total"], 1)
        self.assertNotIn("ONLY-IN-TOPIC-SHEET", dev)

    def test_numbers_and_blank_rows(self):
        r = row("N1", option_a=10, option_b=2.5, option_c="3", option_d="4", time_sec=45)
        meta, rejected, dev, _, _ = self.run_import([r, [""] * len(HEADER)])
        self.assertEqual((meta["accepted"], meta["rejected"]), (1, 0))
        self.assertIn('"option_a": "10"', dev)
        self.assertIn('"option_b": "2.5"', dev)
        self.assertIn('"time_sec": 45', dev)

    def test_missing_required_column_fails_the_whole_import(self):
        xlsx = os.path.join(self.dir, "bad.xlsx")
        make_xlsx(xlsx, {"Questions": [["question_id", "stem_zh"], ["Q1", "x"]], "Topics": TOPICS})
        with self.assertRaises(imp.ImportError_):
            imp.run(xlsx, self.dir)

    def test_report_has_checksum_and_answer_balance_warning(self):
        meta, _, _, _, report = self.run_import([row(f"Q{i}", correct="B") for i in range(5)])
        self.assertRegex(report, r"SHA-256：`[0-9a-f]{64}`")
        self.assertIn("⚠ 答案 A, C, D 少於 15%", report)

    def test_generated_js_cannot_break_out_of_script_tag(self):
        _, _, dev, _, _ = self.run_import([row("X1", stem_zh="</script><script>alert(1)</script>")])
        # build.js escapes "</script" when inlining; the JSON itself must stay a plain string
        self.assertIsNotNone(re.search(r'"stem": "</script><script>alert\(1\)</script>"', dev))


if __name__ == "__main__":
    unittest.main()
