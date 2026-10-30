// 教師審核 (teacher review) — DEVELOPMENT BUILDS ONLY; scripts/build.js leaves
// this file out of release bundles. A teacher reads each story question with
// its answer and explanation, approves or returns it with a note, then exports
// teacher_reviews.csv for tools/import_story_bank.py. Decisions stay on this
// device until exported; the Excel remains the source of question text.
(function (root) {
  const St = root.ITE.story;
  const Q = root.ITE.questions;
  const app = root.ITE.app;
  const { h } = app;
  const bank = root.ITE.storyBank;
  const KEY = "it-emperor.teacher-reviews";

  let levelId = null;

  function loadStore() {
    try {
      const data = JSON.parse(app.storage.getItem(KEY) || "null");
      if (data && typeof data === "object" && data.decisions && typeof data.decisions === "object") return data;
    } catch (e) {
      // fall through to a fresh store
    }
    return { reviewer: "", decisions: {} };
  }

  function saveStore(store) {
    try {
      app.storage.setItem(KEY, JSON.stringify(store));
    } catch (e) {
      // storage unavailable: decisions last for this session only
    }
  }

  function today() {
    const d = new Date(Date.now() + 8 * 3600 * 1000); // HKT
    return d.toISOString().slice(0, 10);
  }

  function downloadCsv(store) {
    const csv = St.reviewsToCsv(store.decisions);
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = h("a", { href: url, download: "teacher_reviews.csv" });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function show() {
    if (!bank || app.buildMode !== "dev") return app.showHome();
    const store = loadStore();
    if (!levelId) levelId = bank.levels[0].id;
    const level = bank.levels.find((l) => l.id === levelId);
    const questions = bank.questions.filter((q) => q.level_id === levelId).sort((a, b) => a.sequence - b.sequence);
    const decided = Object.values(store.decisions);
    const nApproved = decided.filter((d) => d.decision === "approved").length;
    const nRejected = decided.filter((d) => d.decision === "rejected").length;

    const reviewerInput = h("input", { class: "input", id: "reviewer", maxlength: "20", placeholder: "例如：LCH", value: store.reviewer, autocomplete: "off" });
    reviewerInput.addEventListener("change", () => {
      const s = loadStore();
      s.reviewer = reviewerInput.value.trim();
      saveStore(s);
    });
    const err = h("p", { class: "form-error", role: "alert" });

    const levelSelect = h(
      "select",
      { class: "input", id: "level" },
      bank.levels.map((l) => {
        const opt = h("option", { value: l.id }, `${l.id} ${l.name}`);
        if (l.id === levelId) opt.selected = true;
        return opt;
      })
    );
    levelSelect.addEventListener("change", () => {
      levelId = levelSelect.value;
      show();
    });

    const decide = (q, decision, noteInput) => {
      const reviewer = reviewerInput.value.trim();
      if (!reviewer) {
        err.textContent = "請先填寫審核人（例如英文縮寫）。";
        reviewerInput.focus();
        return;
      }
      if (decision === "rejected" && !noteInput.value.trim()) {
        err.textContent = "退回題目時請寫原因，方便 ChatGPT／老師修改。";
        noteInput.focus();
        return;
      }
      const s = loadStore();
      s.reviewer = reviewer;
      if (decision) s.decisions[q.question_id] = { decision, reviewer, reviewed_at: today(), note: noteInput.value.trim() };
      else delete s.decisions[q.question_id];
      saveStore(s);
      show();
    };

    app.render(
      h(
        "main",
        { class: "screen review-screen" },
        h(
          "header",
          { class: "topbar" },
          h("button", { class: "btn-back", onclick: app.showHome, "aria-label": "返回" }, "‹"),
          h("h1", {}, "教師審核（故事模式）")
        ),
        h(
          "section",
          { class: "panel" },
          h("p", { class: "hint" }, "只在開發版出現。核准的題目經匯入後才會進入正式版；退回的題目永遠不會出現。"),
          h("label", { class: "label", for: "reviewer" }, "審核人"),
          reviewerInput,
          h("label", { class: "label label-gap", for: "level" }, "關卡"),
          levelSelect,
          h("p", { class: "hint" }, `目前共核准 ${nApproved} 題、退回 ${nRejected} 題（全部 ${bank.questions.length} 題）`),
          h("button", { class: "btn btn-primary", onclick: () => downloadCsv(loadStore()) }, "匯出 teacher_reviews.csv"),
          h("p", { class: "hint" }, "匯出後把檔案放進 data/question_bank/，再執行 python3 tools/import_story_bank.py …")
        ),
        err,
        h("p", { class: "hint center" }, `${level.id} ${level.name}｜目標：${level.learning_goal}`),
        questions.map((q) => {
          const d = store.decisions[q.question_id];
          const noteInput = h("input", { class: "input", maxlength: "200", placeholder: "備註（退回時必填）", value: d ? d.note : "", "aria-label": `${q.question_id} 備註` });
          const status = d ? (d.decision === "approved" ? "已核准" : "已退回") : `待審（Excel：${q.excel_status}）`;
          return h(
            "section",
            { class: `panel review-card ${d ? "decided-" + d.decision : ""}` },
            h(
              "div",
              { class: "q-meta" },
              h("span", { class: "chip" }, q.question_id),
              q.boss ? h("span", { class: "chip chip-boss" }, "小 Boss 題") : null,
              h("span", { class: d && d.decision === "approved" ? "chip chip-ok" : "chip chip-warn" }, status)
            ),
            h("p", { class: "stem" }, q.stem),
            h(
              "ol",
              { class: "review-options" },
              Q.optionsOf(q).map((o) =>
                h("li", { class: o.letter === q.answer ? "is-answer" : "" }, `${o.letter}. ${o.text}`, o.letter === q.answer ? h("b", {}, "　← 答案") : null)
              )
            ),
            h("p", { class: "review-exp" }, `解說：${q.explanation}`),
            noteInput,
            h(
              "div",
              { class: "review-actions" },
              h("button", { class: "btn btn-small btn-approve", onclick: () => decide(q, "approved", noteInput) }, "核准"),
              h("button", { class: "btn btn-small btn-reject", onclick: () => decide(q, "rejected", noteInput) }, "退回"),
              d ? h("button", { class: "btn btn-small", onclick: () => decide(q, null, noteInput) }, "清除") : null
            )
          );
        })
      )
    );
  }

  root.ITE.reviewUi = { show };
})(globalThis);
