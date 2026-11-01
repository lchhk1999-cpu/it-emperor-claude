"""Import the original ICT revision notes (.docx, ChatGPT track) for 知識修練館.

The notes have 47 chapters (A01–E04), each with the same sections: concepts,
original examples, common mistakes, a two-question self-test and its answers.
Teacher/developer appendices (T01–T06) are not student content and are skipped.

The importer keeps chapter IDs, terms, formulas, code and answers exactly as
written (docs/11_REVISION_HALL.md): it only splits the text into blocks
(paragraph / table / code) and the self-test into question–answer pairs.
Progress is never written back into the content.

Outputs:
- src/data/revision_notes.js
- docs/REVISION_NOTES_IMPORT_REPORT.md

Usage:
    python3 tools/import_revision_notes.py data/revision_notes/IT_Emperor_Original_ICT_Revision_Notes.docx
"""

import argparse
import datetime
import hashlib
import json
import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
CHAPTER = re.compile(r"^([A-E])(\d\d) (.+)$")
TOPICS = {"A": "資訊處理", "B": "電腦系統基礎", "C": "互聯網及其應用", "D": "計算思維與編程", "E": "社會影響"}
MONO_FONTS = {"DejaVu Sans Mono", "Consolas", "Courier New", "Menlo"}
# Section headings -> kind. Anything else is an example-type section.
CONCEPT = {"概念與關鍵字", "先解決一個問題", "從問題選函數", "用需求作理由", "共用練習數據"}
KINDS = {"常見錯法": "mistake", "即時自測": "selftest", "核對與解說": "answers"}
# D10 is a bridging exercise (T01); every other chapter is core.
BRIDGE = {"D10"}
NUMBERED = re.compile(r"(?:^|(?<=[\s。．！？」）)]))([1-9])\.\s?(?=\S)")


class ImportError_(Exception):
    pass


def para_text(p):
    out = ""
    for node in p.iter():
        if node.tag == W + "t":
            out += node.text or ""
        elif node.tag == W + "tab":
            out += "\t"
        elif node.tag == W + "br":
            out += "\n"
    return out


def para_style(p):
    ppr = p.find(W + "pPr")
    s = ppr.find(W + "pStyle") if ppr is not None else None
    return s.get(W + "val") if s is not None else ""


def is_code(p):
    fonts = {r.get(W + "ascii") for r in p.iter(W + "rFonts")}
    return bool(fonts & MONO_FONTS)


def read_blocks(path):
    """Body as a flat list of (kind, value): heading1/heading2/p/code/table."""
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    out = []
    for el in root.find(W + "body"):
        if el.tag == W + "p":
            text = para_text(el)
            if not text.strip():
                continue
            style = para_style(el)
            if style == "Heading1":
                out.append(("heading1", text.strip()))
            elif style == "Heading2":
                out.append(("heading2", text.strip()))
            elif is_code(el):
                out.append(("code", text.rstrip()))
            else:
                out.append(("p", text.strip()))
        elif el.tag == W + "tbl":
            rows = []
            for tr in el.iter(W + "tr"):
                rows.append([" ".join(para_text(p).strip() for p in tc.iter(W + "p")).strip() for tc in tr.iter(W + "tc")])
            out.append(("table", rows))
    return out


def split_numbered(text):
    """'1. abc 2. def' -> ['abc', 'def'] (keeps decimals like 79.2)."""
    marks = list(NUMBERED.finditer(text))
    items = []
    expected = 1
    starts = []
    for m in marks:
        if int(m.group(1)) == expected:
            starts.append(m)
            expected += 1
    for i, m in enumerate(starts):
        end = starts[i + 1].start() if i + 1 < len(starts) else len(text)
        items.append(text[m.end():end].strip())
    return items


def build_chapters(blocks):
    chapters = []
    cur = None
    sec = None
    for kind, value in blocks:
        if kind == "heading1":
            m = CHAPTER.match(value)
            if m:
                cur = {"id": m.group(1) + m.group(2), "topic": m.group(1), "title": m.group(3).strip(), "tagline": "", "sections": []}
                chapters.append(cur)
                sec = None
            else:
                cur = None  # 目錄 / T01–T06 appendices: not student content
            continue
        if cur is None:
            continue
        if kind == "heading2":
            sec = {"heading": value, "kind": KINDS.get(value, "concept" if value in CONCEPT else "example"), "blocks": []}
            cur["sections"].append(sec)
            continue
        if sec is None:
            if kind == "p" and not cur["tagline"]:
                cur["tagline"] = value
                continue
            raise ImportError_(f"{cur['id']}: content before the first section: {value!r}")
        if kind == "table":
            sec["blocks"].append({"t": "table", "rows": value})
        elif kind == "code":
            sec["blocks"].append({"t": "code", "text": value})
        else:
            sec["blocks"].append({"t": "p", "text": value})
    return chapters


def finish(ch):
    """Keywords, scope and self-test pairs; returns a list of problems."""
    problems = []
    parts = [p.strip() for p in ch["tagline"].split("｜") if p.strip()]
    if not parts or parts[0] != TOPICS[ch["topic"]]:
        problems.append(f"{ch['id']}: tagline should start with {TOPICS[ch['topic']]}: {ch['tagline']!r}")
    ch["keywords"] = parts[1:]
    ch["topicName"] = TOPICS[ch["topic"]]
    ch["scope"] = "bridge" if ch["id"] in BRIDGE else "core"

    def text_of(kind):
        return " ".join(b.get("text", "") for s in ch["sections"] if s["kind"] == kind for b in s["blocks"] if b["t"] == "p")

    qs = split_numbered(text_of("selftest"))
    ans = split_numbered(text_of("answers"))
    if not qs:
        problems.append(f"{ch['id']}: no self-test questions")
    if len(qs) != len(ans):
        problems.append(f"{ch['id']}: {len(qs)} self-test questions but {len(ans)} answers")
    ch["selfTest"] = [{"q": q, "a": a} for q, a in zip(qs, ans)]
    # The self-test and its answers live in selfTest; keep the reading sections only.
    ch["sections"] = [s for s in ch["sections"] if s["kind"] not in ("selftest", "answers")]
    # A few chapters have no 常見錯法 section (A13, E04): fine, the card is skipped.
    return problems


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("docx")
    ap.add_argument("--out", default=os.path.join("src", "data", "revision_notes.js"))
    ap.add_argument("--report", default=os.path.join("docs", "REVISION_NOTES_IMPORT_REPORT.md"))
    args = ap.parse_args(argv)

    with open(args.docx, "rb") as f:
        digest = hashlib.sha256(f.read()).hexdigest()
    chapters = build_chapters(read_blocks(args.docx))
    problems = []
    for ch in chapters:
        problems += finish(ch)
    ids = [c["id"] for c in chapters]
    if len(ids) != len(set(ids)):
        problems.append("duplicate chapter IDs")
    if problems:
        for p in problems:
            print("✗", p, file=sys.stderr)
        raise SystemExit(1)

    data = {"version": "1.0", "source": os.path.basename(args.docx), "sha256": digest, "chapters": chapters}
    with open(args.out, "w", encoding="utf-8") as f:
        f.write("// Generated by tools/import_revision_notes.py — do not edit by hand.\n")
        f.write("// 知識修練館 content (original ICT revision notes, ChatGPT track).\n")
        f.write("(function (root) {\n  const ITE = (root.ITE = root.ITE || {});\n  ITE.revisionNotes = ")
        f.write(json.dumps(data, ensure_ascii=False, indent=1))
        f.write(";\n})(globalThis);\n")

    by_topic = {}
    for c in chapters:
        by_topic.setdefault(c["topic"], []).append(c["id"])
    lines = [
        "# 知識修練館筆記匯入報告",
        "",
        f"- 來源：`{os.path.basename(args.docx)}`（SHA-256 `{digest[:16]}…`）",
        f"- 匯入日期：{datetime.date.today().isoformat()}",
        f"- 篇章：{len(chapters)}（附錄 T01–T06 屬教師及開發者資料，不匯入學生內容）",
        f"- 自測題：{sum(len(c['selfTest']) for c in chapters)} 題，全部有對應答案",
        "",
        "| 課題 | 篇章 |",
        "|---|---|",
    ]
    for t, ids_ in by_topic.items():
        lines.append(f"| {t} {TOPICS[t]} | {'、'.join(ids_)} |")
    lines += ["", "D10 標示為「銜接練習」。選修 2A／2B／2C 未有內容，只顯示入口說明。"]
    with open(args.report, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"imported {len(chapters)} chapters -> {args.out}")


if __name__ == "__main__":
    main()
