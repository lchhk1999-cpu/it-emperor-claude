// 知識修練館 screens (src/core/revision.js): the hall (接續上次 / 今日需複習 /
// 按課題探索 + search), chapter cards, self-tests that reveal the answer only
// after the student tries, the pilot labs (A11, D11, C07) and a line-by-line
// Python tracer for every Python example in the notes.
(function (root) {
  const app = root.ITE.app;
  const { h } = app;
  const R = root.ITE.revision;
  const L = root.ITE.revisionLabs;
  const X = root.ITE.excel;
  const PT = root.ITE.pytrace;

  let topic = "A";
  let query = "";
  let showDue = false;

  const now = () => Date.now();
  const profile = () => app.getSave().profile;
  const setProfile = (p) => app.setSave({ ...app.getSave(), profile: p });
  const fontClass = () => `screen revision rv-font-${(profile().revision && profile().revision.font) || 0}`;
  const STATUS_MARK = { new: "○", learning: "◐", due: "⏰", solid: "✔" };

  // EXP from the revision rules goes through the game's normal reward path.
  function reward(result) {
    setProfile(result.profile);
    if (!result.exp) return result.reasons.length ? { text: "今日此卡的獎勵已達上限，明天再複習可再得經驗。", capped: true } : null;
    const g = app.grantReward({ exp: result.exp, coins: 0 });
    const why = result.reasons.filter((r) => r.exp).map((r) => r.name).join("＋");
    return { text: `+${result.exp} 經驗（${why}）${g.levelsGained ? `　升級！Lv ${g.level}` : ""}`, capped: result.capped };
  }
  const rewardLine = (r) => (r ? h("p", { class: r.capped ? "rv-reward hint" : "rv-reward", role: "status" }, r.text) : null);

  function cycleFont() {
    const p = profile();
    const rv = p.revision || { last: null, cards: {} };
    setProfile({ ...p, revision: { ...rv, font: (((rv.font || 0) + 1) % 3) } });
  }

  function topbar(title, back, extra) {
    return h(
      "header",
      { class: "topbar" },
      h("button", { class: "btn-back", onclick: back, "aria-label": "返回" }, "‹"),
      h("h1", {}, title),
      extra || null
    );
  }
  const fontButton = (rerender) => h("button", { class: "btn rv-font-btn", onclick: () => (cycleFont(), rerender()), "aria-label": "調整字體大小" }, "字");

  // ---------- hall ----------
  function chapterRow(ch) {
    const pr = R.chapterProgress(profile(), ch, now());
    const hasLab = R.cardsOf(ch).some((c) => c.kind === "lab");
    return h(
      "button",
      { class: "rv-chapter", onclick: () => openChapter(ch.id) },
      h("span", { class: "rv-chapter-id" }, ch.id),
      h(
        "span",
        { class: "rv-chapter-main" },
        h("span", { class: "rv-chapter-title" }, ch.title, ch.scope === "bridge" ? h("span", { class: "rv-badge" }, "銜接練習") : null, hasLab ? h("span", { class: "rv-badge rv-badge-lab" }, "互動") : null),
        h("span", { class: "rv-chapter-keys" }, ch.keywords.join("・"))
      ),
      h("span", { class: "rv-chapter-progress", "aria-label": `完成 ${pr.done}/${pr.total} 張卡${pr.due ? `，${pr.due} 張待複習` : ""}` }, `${pr.done}/${pr.total}`, pr.due ? h("span", { class: "rv-due-dot" }, `⏰${pr.due}`) : null)
    );
  }

  function results() {
    if (showDue) {
      const due = R.dueCards(profile(), now());
      return h(
        "section",
        { class: "panel" },
        h("h2", {}, `今日需複習（${due.length}）`),
        due.length ? due.map((c) => h("button", { class: "rv-chapter", onclick: () => openCard(c.id) }, h("span", { class: "rv-chapter-id" }, c.id), h("span", { class: "rv-chapter-main" }, h("span", { class: "rv-chapter-title" }, `${R.chapterById(c.chapterId).title}・${c.title}`)))) : h("p", { class: "hint" }, "今日沒有到期的卡，做得好！可以探索新篇章。"),
        h("button", { class: "btn", onclick: () => ((showDue = false), show()) }, "返回課題列表")
      );
    }
    if (query.trim()) {
      const found = R.search(query);
      return h("section", { class: "panel" }, h("h2", {}, `搜尋「${query.trim()}」：${found.length} 篇`), found.length ? found.map(chapterRow) : h("p", { class: "hint" }, "找不到相關篇章，試試其他關鍵字，例如 VLOOKUP、MFA、range。"));
    }
    const isElective = topic === "elective";
    return h(
      "section",
      { class: "panel rv-topics" },
      h(
        "div",
        { class: "world-tabs", role: "tablist", "aria-label": "課題" },
        R.TOPICS.map((t) => h("button", { class: topic === t.id ? "world-tab active" : "world-tab", role: "tab", "aria-selected": topic === t.id ? "true" : "false", onclick: () => ((topic = t.id), show()) }, h("span", { class: "world-tab-big" }, t.id), h("span", { class: "world-tab-small" }, t.name))),
        h("button", { class: isElective ? "world-tab active" : "world-tab", role: "tab", "aria-selected": isElective ? "true" : "false", onclick: () => ((topic = "elective"), show()) }, h("span", { class: "world-tab-big" }, "選"), h("span", { class: "world-tab-small" }, "選修"))
      ),
      isElective
        ? [
            h("p", { class: "hint" }, "選修部分的深入內容另設入口；完整筆記準備中，暫時未提供。"),
            R.ELECTIVES.map((e) => h("div", { class: "rv-chapter rv-elective", "aria-disabled": "true" }, h("span", { class: "rv-chapter-id" }, e.id), h("span", { class: "rv-chapter-main" }, h("span", { class: "rv-chapter-title" }, e.name, h("span", { class: "rv-badge" }, "準備中")), h("span", { class: "rv-chapter-keys" }, e.note)))),
          ]
        : R.chapters().filter((c) => c.topic === topic).map(chapterRow)
    );
  }

  function show() {
    const last = R.lastCard(profile());
    const due = R.dueCards(profile(), now());
    const list = h("div", { class: "rv-results" }, results());
    const search = h("input", { class: "input rv-search", type: "search", value: query, placeholder: "搜尋關鍵字，例如 VLOOKUP、MFA、range", "aria-label": "搜尋篇章" });
    search.addEventListener("input", () => {
      query = search.value;
      showDue = false;
      list.replaceChildren(results());
    });
    app.render(
      h(
        "main",
        { class: fontClass() },
        topbar("知識修練館", () => app.showHome(), fontButton(show)),
        h("p", { class: "hint center" }, "五大必修課題・47 篇原創筆記。先嘗試作答，再看解說；隔天複習記得更牢。"),
        h(
          "div",
          { class: "rv-entries" },
          h("button", { class: "rv-entry", onclick: () => (last ? openCard(last.id) : openChapter("A01")), ...(last ? {} : {}) }, h("span", { class: "rv-entry-icon" }, "📖"), h("span", { class: "rv-entry-title" }, "接續上次"), h("span", { class: "rv-entry-sub" }, last ? `${last.id} ${R.chapterById(last.chapterId).title}・${last.title}` : "由 A01 開始")),
          h("button", { class: "rv-entry", onclick: () => ((showDue = true), (query = ""), show()) }, h("span", { class: "rv-entry-icon" }, "⏰"), h("span", { class: "rv-entry-title" }, "今日需複習"), h("span", { class: "rv-entry-sub" }, due.length ? `${due.length} 張卡到期` : "暫時沒有")),
          h("button", { class: "rv-entry", onclick: () => ((showDue = false), (query = ""), show(), root.document.querySelector(".rv-topics") && root.document.querySelector(".rv-topics").scrollIntoView({ block: "start" })) }, h("span", { class: "rv-entry-icon" }, "🧭"), h("span", { class: "rv-entry-title" }, "按課題探索"), h("span", { class: "rv-entry-sub" }, "A 至 E 五大課題"))
        ),
        search,
        list,
        h("p", { class: "hint center" }, "筆記為原創溫習整理，不是官方指定必考清單或押題資料。")
      )
    );
  }

  // ---------- chapter and cards ----------
  function openChapter(chapterId) {
    const cards = R.cardsOf(R.chapterById(chapterId));
    const p = profile();
    // First card not yet finished, else the first card.
    const next = cards.find((c) => R.status(p, c.id, now()) === "new") || cards[0];
    openCard(next.id);
  }

  function openCard(cardId, opts) {
    const card = R.cardById(cardId);
    if (!card) return show();
    setProfile(R.open(profile(), cardId, now()));
    renderCard(card, opts || {});
  }

  function blockView(b) {
    if (b.t === "p") return h("p", { class: "rv-p" }, b.text);
    if (b.t === "table") {
      const [head, ...rows] = b.rows;
      return h("div", { class: "rv-table-wrap" }, h("table", { class: "rv-table" }, h("thead", {}, h("tr", {}, head.map((c) => h("th", { scope: "col" }, c)))), h("tbody", {}, rows.map((r) => h("tr", {}, r.map((c) => h("td", {}, c)))))));
    }
    const runnable = !PT.trace(b.text).error;
    const box = h("div", { class: "rv-code-box" });
    const code = codeView(b.text, null);
    box.append(code);
    if (runnable) {
      const btn = h("button", { class: "btn rv-trace-btn" }, "▶ 逐步追蹤");
      btn.onclick = () => {
        btn.remove();
        code.replaceWith(tracer(b.text));
      };
      box.append(btn);
    }
    return box;
  }

  function codeView(text, line) {
    return h("pre", { class: "rv-code", tabindex: "0" }, text.split("\n").map((l, i) => h("span", { class: i + 1 === line ? "rv-line current" : "rv-line" }, h("span", { class: "rv-ln", "aria-hidden": "true" }, String(i + 1)), l || " ")));
  }

  const EVENT_TEXT = { true: "條件成立 → 執行下面的區塊", false: "條件不成立 → 跳過", else: "前面條件都不成立 → 執行 else", next: "取出下一個值", end: "循環結束", break: "break：立即離開循環", print: "輸出一行" };

  // Line-by-line tracer: highlight, variables and output after each step.
  function tracer(code, onDone) {
    const r = PT.trace(code);
    let i = -1;
    const wrap = h("div", { class: "rv-tracer" });
    function draw() {
      const s = i >= 0 ? r.steps[i] : null;
      const vars = s ? s.vars : {};
      const names = Object.keys(r.vars);
      const done = i === r.steps.length - 1;
      wrap.replaceChildren(
        codeView(code, s ? s.line : null),
        h("p", { class: "rv-trace-note", role: "status" }, s ? `第 ${s.line} 行${s.event ? `：${EVENT_TEXT[s.event]}` : ""}` : "按「下一步」開始執行第一行。", r.error && done ? h("b", {}, `　${r.error.kind}：${r.error.message}`) : null),
        h("table", { class: "rv-table rv-vars" }, h("thead", {}, h("tr", {}, h("th", {}, "變量"), h("th", {}, "值"))), h("tbody", {}, names.map((n) => h("tr", { class: s && s.vars[n] !== (i > 0 ? r.steps[i - 1].vars[n] : undefined) ? "changed" : "" }, h("td", {}, n), h("td", {}, n in vars ? vars[n] : "尚未賦值"))))),
        h("div", { class: "rv-output" }, h("span", { class: "rv-output-label" }, "輸出"), h("pre", {}, (s ? s.output : []).join("\n") || " ")),
        h(
          "div",
          { class: "rv-trace-controls" },
          h("button", { class: "btn", onclick: () => ((i = -1), draw()), ...(i < 0 ? { disabled: "" } : {}) }, "⟲ 重來"),
          h("button", { class: "btn", onclick: () => ((i = Math.max(-1, i - 1)), draw()), ...(i < 0 ? { disabled: "" } : {}) }, "‹ 上一步"),
          h("button", { class: "btn btn-primary", onclick: () => ((i = Math.min(r.steps.length - 1, i + 1)), draw(), i === r.steps.length - 1 && onDone && onDone()), ...(done ? { disabled: "" } : {}) }, "下一步 ›")
        ),
        h("p", { class: "hint" }, `共 ${r.steps.length} 步${i >= 0 ? `，現在第 ${i + 1} 步` : ""}`)
      );
    }
    draw();
    return wrap;
  }

  function cardTabs(card) {
    const cards = R.cardsOf(R.chapterById(card.chapterId));
    const p = profile();
    return h(
      "nav",
      { class: "rv-cardtabs", "aria-label": "卡片" },
      cards.map((c) => {
        const st = R.status(p, c.id, now());
        return h("button", { class: c.id === card.id ? "rv-cardtab active" : "rv-cardtab", "aria-current": c.id === card.id ? "step" : "false", onclick: () => openCard(c.id), "aria-label": `${c.title}，${R.STATUS_NAMES[st]}` }, h("span", { class: "rv-cardtab-mark", "aria-hidden": "true" }, STATUS_MARK[st]), c.kind === "lab" ? "實驗室" : c.title);
      })
    );
  }

  function nextCard(card) {
    const cards = R.cardsOf(R.chapterById(card.chapterId));
    return cards[cards.findIndex((c) => c.id === card.id) + 1] || null;
  }

  function backLinkButtons(cardId) {
    return h("div", { class: "rv-backlinks" }, h("span", { class: "hint" }, "補回概念："), R.backLinks(cardId).map((c) => h("button", { class: "btn btn-small", onclick: () => openCard(c.id) }, `${c.id} ${c.title}`)));
  }

  function renderCard(card, opts) {
    const ch = R.chapterById(card.chapterId);
    let body;
    if (card.kind === "selftest") body = selfTest(card);
    else if (card.kind === "lab") body = lab(card, opts);
    else body = reading(card);
    app.render(
      h(
        "main",
        { class: fontClass() },
        topbar(`${ch.id} ${ch.title}`, show, fontButton(() => renderCard(card, opts))),
        h("p", { class: "rv-tagline" }, ch.topicName, ch.scope === "bridge" ? h("span", { class: "rv-badge" }, "銜接練習") : null, ...ch.keywords.map((k) => h("span", { class: "rv-chip" }, k))),
        cardTabs(card),
        h("section", { class: `panel rv-card rv-card-${card.kind}` }, body)
      )
    );
    root.scrollTo && root.scrollTo(0, 0);
  }

  function reading(card) {
    const next = nextCard(card);
    const out = h("p", { class: "rv-reward-slot" });
    return [
      card.sections.map((s) => h("div", { class: "rv-section" }, h("h2", {}, s.kind === "mistake" ? "⚠ " + s.heading : s.heading), s.blocks.map(blockView))),
      out,
      h(
        "button",
        {
          class: "btn btn-primary rv-next",
          onclick: () => {
            const msg = reward(R.finishReading(profile(), card.id, now()));
            app.sfx("tap");
            if (msg && next) {
              out.replaceWith(rewardLine(msg));
              setTimeout(() => openCard(next.id), 900);
            } else if (next) openCard(next.id);
            else show();
          },
        },
        next ? `明白了，下一張：${next.kind === "lab" ? "實驗室" : next.title} ›` : "完成本篇"
      ),
    ];
  }

  // Self-test: try first (typing is optional), then reveal, then judge honestly.
  function selfTest(card) {
    return [
      h("h2", {}, "即時自測"),
      h("p", { class: "hint" }, "先自己想或寫下答案，再按「揭曉」。自評只用來安排複習時間，不影響獎勵。"),
      card.questions.map((t, i) => {
        const box = h("div", { class: "rv-q" });
        const note = h("textarea", { class: "input rv-answer-input", rows: "2", placeholder: "寫下你的答案（可選）", "aria-label": `第 ${i + 1} 題你的答案` });
        const judge = (correct) => {
          const msg = reward(R.answer(profile(), card.id, { correct, graded: false }, now()));
          box.querySelector(".rv-judge").replaceWith(
            h("div", { class: "rv-judge" }, h("p", { class: correct ? "rv-ok" : "rv-ng" }, correct ? "✓ 已記錄：答對" : "✕ 已記錄：未答對，稍後會再出現在「今日需複習」"), rewardLine(msg), correct ? null : backLinkButtons(card.id))
          );
        };
        box.append(
          h("p", { class: "rv-q-text" }, `${i + 1}. ${t.q}`),
          note,
          h(
            "button",
            {
              class: "btn btn-primary",
              onclick: (e) => {
                e.target.replaceWith(
                  h("div", { class: "rv-reveal" }, h("p", { class: "rv-answer" }, h("b", {}, "答案："), t.a)),
                  h("div", { class: "rv-judge" }, h("button", { class: "btn rv-ok-btn", onclick: () => judge(true) }, "✓ 我答對了"), h("button", { class: "btn rv-ng-btn", onclick: () => judge(false) }, "✕ 我未答對"))
                );
              },
            },
            "揭曉答案"
          )
        );
        return box;
      }),
      h("button", { class: "btn rv-next", onclick: show }, "返回修練館"),
    ];
  }

  // ---------- labs ----------
  function lab(card, opts) {
    const tasks = opts.tasks || L.tasks(card.lab, Math.random);
    const k = opts.task || 0;
    const t = tasks[k];
    const results = opts.results || [];
    const go = (n, extra) => renderCard(card, { tasks, task: n, results: results.concat(extra || []) });
    if (!t) {
      const right = results.filter(Boolean).length;
      return [
        h("h2", {}, `🧪 ${card.title}：完成`),
        h("p", { class: "rv-p" }, `答對 ${right} / ${results.length} 題。`),
        h("p", { class: "hint" }, "每次「再做新例子」都會換新數據，系統會重新計算答案。到期複習答對可得最多經驗。"),
        h("div", { class: "rv-actions" }, h("button", { class: "btn btn-primary", onclick: () => renderCard(card, {}) }, "再做新例子"), h("button", { class: "btn", onclick: show }, "返回修練館")),
      ];
    }
    const head = [h("p", { class: "rv-step" }, `🧪 ${card.title}・任務 ${k + 1}/${tasks.length}：${t.title}`), h("p", { class: "rv-q-text" }, t.prompt)];
    if (t.type === "excel-explore") return [head, excelExplore(), h("button", { class: "btn btn-primary rv-next", onclick: () => go(k + 1) }, "繼續 ›")];
    if (t.type === "trace") {
      const tableSlot = h("div", {});
      const done = h("button", { class: "btn btn-primary rv-next", onclick: () => go(k + 1) }, "繼續 ›");
      return [
        head,
        tracer(t.code, () => tableSlot.replaceChildren(traceTable(t.code))),
        tableSlot,
        done,
      ];
    }
    // choice
    const feedback = h("div", { class: "rv-feedback", "aria-live": "polite" });
    const buttons = t.options.map((o) =>
      h(
        "button",
        {
          class: "btn rv-option",
          onclick: (e) => {
            const correct = o === t.answer;
            buttons.forEach((b) => {
              b.disabled = true;
              if (b.textContent === t.answer) b.classList.add("rv-option-right");
            });
            if (!correct) e.currentTarget.classList.add("rv-option-wrong");
            const msg = reward(R.answer(profile(), card.id, { correct, graded: !!t.graded }, now()));
            app.sfx(correct ? "correct" : "wrong");
            feedback.replaceChildren(
              ...[
                h("p", { class: correct ? "rv-ok" : "rv-ng" }, correct ? "✓ 答對！" : `✕ 未答對。正確答案：${t.answer}`),
                h("p", { class: "rv-p" }, t.explain),
                rewardLine(msg),
                correct ? null : backLinkButtons(card.id),
                h("button", { class: "btn btn-primary rv-next", onclick: () => go(k + 1, [correct]) }, k + 1 < tasks.length ? "下一個任務 ›" : "完成"),
              ].filter(Boolean)
            );
          },
        },
        o
      )
    );
    return [head, t.code ? codeView(t.code, null) : null, t.sheet ? sheetView(L.a11Sheet(), [5]) : null, h("div", { class: "rv-options" }, buttons), feedback];
  }

  function sheetView(sheet, highlightRows, extraRow) {
    const rows = [1, 2, 3, 4, 5, 6].concat(extraRow ? [extraRow] : []);
    return h(
      "div",
      { class: "rv-table-wrap" },
      h(
        "table",
        { class: "rv-table rv-sheet" },
        h("thead", {}, h("tr", {}, h("th", {}, ""), ["A", "B", "C", "D"].map((c) => h("th", { scope: "col" }, c)))),
        h("tbody", {}, rows.map((r) => h("tr", { class: (highlightRows || []).includes(r) ? "hl" : "" }, h("th", { scope: "row" }, String(r)), ["A", "B", "C", "D"].map((c) => h("td", {}, X.display(sheet[c + r] === undefined ? "" : sheet[c + r]))))))
      )
    );
  }

  // A11 explore: change row 7 and watch every part of the formula recalculate.
  function excelExplore() {
    const state = { score: 60, attempts: 2 };
    const wrap = h("div", { class: "rv-explore" });
    const stepper = (label, key, min, max) =>
      h(
        "div",
        { class: "rv-stepper" },
        h("span", {}, label),
        h("button", { class: "btn btn-small", "aria-label": `${label}減 1`, onclick: () => ((state[key] = Math.max(min, state[key] - 1)), draw()) }, "−"),
        h("b", { class: "rv-stepper-value" }, String(state[key])),
        h("button", { class: "btn btn-small", "aria-label": `${label}加 1`, onclick: () => ((state[key] = Math.min(max, state[key] + 1)), draw()) }, "＋")
      );
    function draw() {
      const b = L.a11Breakdown(state.score, state.attempts);
      wrap.replaceChildren(
        sheetView(L.a11Sheet(state), [L.A11_TEST_ROW], L.A11_TEST_ROW),
        h("div", { class: "rv-steppers" }, stepper("B7 分數", "score", 0, 100), stepper("C7 挑戰次數", "attempts", 0, 9)),
        h("p", { class: "rv-formula" }, h("span", { class: "rv-fx" }, "fx"), b.formula),
        h("ul", { class: "rv-breakdown" }, b.parts.map((p) => h("li", {}, h("code", {}, p.label), `　${p.text} → `, h("b", { class: p.value === "TRUE" ? "rv-true" : "rv-false" }, p.value === "TRUE" ? "TRUE ✓" : "FALSE ✕")))),
        h("p", { class: "rv-result", role: "status" }, "結果：", h("b", {}, b.result))
      );
    }
    draw();
    return wrap;
  }

  function traceTable(code) {
    const t = L.d11Table(code);
    return h(
      "div",
      { class: "rv-section" },
      h("h2", {}, "追蹤表"),
      h("div", { class: "rv-table-wrap" }, h("table", { class: "rv-table" }, h("thead", {}, h("tr", {}, ["時刻", "x", "count", "total"].map((c) => h("th", { scope: "col" }, c)))), h("tbody", {}, t.rows.map((r) => h("tr", {}, h("td", {}, r.when), h("td", {}, r.x), h("td", {}, r.count), h("td", {}, r.total)))))),
      h("p", { class: "rv-p" }, `輸出 ${t.output}。`)
    );
  }

  // Home-screen banner: due reviews first, else 接續上次.
  function homeBanner() {
    const p = profile();
    const due = R.dueCards(p, now()).length;
    const last = R.lastCard(p);
    return h(
      "button",
      { class: "rv-home", onclick: show },
      h("span", { class: "rv-home-icon", "aria-hidden": "true" }, "📚"),
      h("span", { class: "rv-home-info" }, h("span", { class: "rv-home-title" }, "知識修練館"), h("span", { class: "rv-home-sub" }, due ? `今日有 ${due} 張卡要複習` : last ? `接續：${last.id} ${R.chapterById(last.chapterId).title}` : "47 篇原創筆記・Excel 及 Python 互動練習")),
      h("span", { class: "rv-home-go" }, due ? `⏰ ${due}` : "溫習 ›")
    );
  }

  root.ITE.revisionUi = { show, openChapter, openCard, homeBanner };
})(globalThis);
