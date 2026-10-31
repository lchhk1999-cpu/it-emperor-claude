// Guild screens: join/create -> guild home (boss, standings, members) ->
// timed raid attack -> result. Offline single-device DEMO: other guilds and
// members are fictitious (src/data/demo_guilds.js). Sharing a guild across
// phones needs a backend (pending approval, docs/07).
// User-entered names are always rendered via textContent (h() text nodes).
(function (root) {
  const R = root.ITE.guildRaid;
  const Q = root.ITE.questions;
  const demo = root.ITE.demoGuilds;
  const app = root.ITE.app;
  const { h } = app;

  const FEEDBACK_MS = 700; // how long the right/wrong colours show before the next question
  let session = null;
  let timer = null;
  let leaveArmed = false;

  function stopTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function render(screen) {
    stopTimer();
    app.render(screen);
  }

  function topbar(title, onBack, extra) {
    return h(
      "header",
      { class: "topbar" },
      h("button", { class: "btn-back", onclick: onBack, "aria-label": "返回" }, "‹"),
      h("h1", {}, title),
      extra || h("span", {})
    );
  }

  function guildState() {
    return app.getSave().guild;
  }

  function isDemoGuild(id) {
    return demo.guilds.some((g) => g.id === id);
  }

  // This week's raid for a guild: fictitious demo attacks plus the player's own.
  function raidFor(guildId, now) {
    const gs = guildState();
    const mine = gs && gs.guild.id === guildId ? gs.myAttacks : [];
    const records = (isDemoGuild(guildId) ? R.demoAttacks(demo, guildId, now) : []).concat(mine);
    return R.buildRaid(guildId, now, records);
  }

  function formatDuration(ms) {
    const hours = Math.floor(ms / 3600000);
    const days = Math.floor(hours / 24);
    return days > 0 ? `${days} 日 ${hours % 24} 小時` : `${hours} 小時 ${Math.floor((ms % 3600000) / 60000)} 分鐘`;
  }

  function cleanNickname(s) {
    return String(s || "").trim().replace(/\s+/g, " ");
  }

  // ---------- Join / create ----------
  function showJoin(message) {
    const nickInput = h("input", { class: "input", id: "nick", maxlength: "12", placeholder: "例如：小明 ICT", autocomplete: "off" });
    const nameInput = h("input", { class: "input", id: "gname", maxlength: "20", placeholder: "例如：我的 IT 學會", autocomplete: "off" });
    const err = h("p", { class: "form-error", role: "alert" }, message || "");

    const nickname = () => {
      const n = cleanNickname(nickInput.value);
      if (!n) {
        err.textContent = "請先輸入暱稱。";
        nickInput.focus();
        return null;
      }
      return n;
    };

    const join = (g) => {
      const n = nickname();
      if (!n) return;
      if (g.members.includes(n)) {
        err.textContent = "這個暱稱已有人使用，請換一個。";
        return;
      }
      app.setSave({ ...app.getSave(), guild: { nickname: n, guild: R.joinGuild(g, n), myAttacks: [] } });
      showHome();
    };

    const create = () => {
      const n = nickname();
      if (!n) return;
      try {
        const g = R.createGuild("my-" + Date.now(), nameInput.value, n);
        app.setSave({ ...app.getSave(), guild: { nickname: n, guild: g, myAttacks: [] } });
        showHome();
      } catch (e) {
        err.textContent = cleanNickname(nameInput.value) ? "公會名稱最多 20 個字。" : "請輸入公會名稱。";
      }
    };

    render(
      h(
        "main",
        { class: "screen guild", "data-tab": "guild" },
        topbar("校際公會", app.showHome),
        h("p", { class: "note" }, "示範版：其他公會及成員均為虛構，資料只存在這部手機。"),
        h(
          "section",
          { class: "panel" },
          h("label", { class: "label", for: "nick" }, "你的暱稱"),
          nickInput,
          h("p", { class: "hint" }, "請用暱稱，不要輸入真實姓名、學號或班別。")
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "建立自己的公會"),
          h("label", { class: "label", for: "gname" }, "公會名稱"),
          nameInput,
          h("p", { class: "hint" }, "未經學校同意，請不要使用真實校名或校徽。"),
          h("button", { class: "btn btn-primary", onclick: create }, "建立公會")
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "或加入現有公會"),
          demo.guilds.map((g) =>
            h(
              "div",
              { class: "guild-row" },
              h("div", { class: "guild-row-info" }, h("div", { class: "guild-row-name" }, g.name), h("div", { class: "hint" }, `會長 ${g.founder}｜${g.members.length} 人`)),
              h("button", { class: "btn btn-small", onclick: () => join(g) }, "加入")
            )
          )
        ),
        err
      )
    );
  }

  // ---------- Guild home ----------
  function showHome() {
    const gs = guildState();
    if (!gs) return showJoin();
    leaveArmed = false;
    const now = Date.now();
    const raid = raidFor(gs.guild.id, now);
    const check = R.canAttack(raid, gs.guild, gs.nickname, now);
    const myWeek = raid.attacks.filter((a) => a.nickname === gs.nickname);
    const myDamage = myWeek.reduce((s, a) => s + a.damage, 0);

    const others = demo.guilds.filter((g) => g.id !== gs.guild.id).map((g) => ({ guild: g, raid: raidFor(g.id, now) }));
    const standings = R.weeklyStandings(others.concat([{ guild: gs.guild, raid }]));

    const contributions = gs.guild.members
      .map((m) => {
        const list = raid.attacks.filter((a) => a.nickname === m);
        return { nickname: m, damage: list.reduce((s, a) => s + a.damage, 0), attacks: list.length };
      })
      .sort((a, b) => b.damage - a.damage || (a.nickname < b.nickname ? -1 : 1));

    const leaveBtn = h("button", { class: "btn-text" }, "離開公會");
    leaveBtn.addEventListener("click", () => {
      if (!leaveArmed) {
        leaveArmed = true;
        leaveBtn.textContent = "再按一次確認離開（本週紀錄會清除）";
        return;
      }
      app.setSave({ ...app.getSave(), guild: null });
      showJoin();
    });

    render(
      h(
        "main",
        { class: "screen guild", "data-tab": "guild" },
        topbar(gs.guild.name, app.showHome),
        h("p", { class: "hint center" }, `會長 ${gs.guild.founder}｜成員 ${gs.guild.members.length} 人｜我是 ${gs.nickname}`),
        h(
          "section",
          { class: "raid-boss" },
          h("div", { class: "raid-boss-name" }, `本週 ${raid.bossName}`),
          h("div", { class: "raid-sprite", html: root.ITE.sprites.raidBoss("idle") }),
          app.bar("Boss 血量", R.bossHpLeft(raid), raid.bossMaxHp, "boss"),
          h(
            "div",
            { class: "raid-stats" },
            h("span", {}, `公會總傷害 ${raid.totalDamage.toLocaleString()}`),
            h("span", {}, `週結還有 ${formatDuration(R.msUntilNextWeek(now))}`)
          )
        ),
        !app.questionPool.length
          ? h("button", { class: "btn", disabled: "" }, "暫時未有可用題目")
          : check.ok
            ? h("button", { class: "btn btn-primary", onclick: startRaid }, `今日挑戰（限時 ${R.DEFAULT_RAID_RULES.attackSeconds} 秒）`)
            : h("button", { class: "btn", disabled: "" }, "今日已挑戰，明天再來！"),
        h("p", { class: "hint center" }, `我本週貢獻 ${myDamage.toLocaleString()} 傷害（${myWeek.length} 次）`),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "本週公會排名"),
          h(
            "ol",
            { class: "rank-list" },
            standings.map((row) =>
              h(
                "li",
                { class: row.guildId === gs.guild.id ? "rank-row mine" : "rank-row" },
                h("span", { class: "rank-no" }, String(row.rank)),
                h("span", { class: "rank-name" }, row.name, h("small", {}, ` ${row.members} 人`)),
                h("span", { class: "rank-dmg" }, row.totalDamage.toLocaleString())
              )
            )
          ),
          h("p", { class: "hint" }, "按本週攻擊總量排名，星期一 00:00（香港時間）重置。")
        ),
        h(
          "section",
          { class: "panel" },
          h("h2", {}, "成員貢獻"),
          h(
            "ol",
            { class: "rank-list" },
            contributions.map((c) =>
              h(
                "li",
                { class: c.nickname === gs.nickname ? "rank-row mine" : "rank-row" },
                h("span", { class: "rank-name" }, c.nickname, c.nickname === gs.guild.founder ? h("small", {}, " 會長") : null),
                h("span", { class: "rank-dmg" }, c.attacks ? c.damage.toLocaleString() : "未出戰")
              )
            )
          )
        ),
        h("div", { class: "center" }, leaveBtn)
      )
    );
  }

  // ---------- Timed raid attack ----------
  function startRaid() {
    const gs = guildState();
    const now = Date.now();
    try {
      session = R.startAttack(raidFor(gs.guild.id, now), gs.guild, gs.nickname, app.questionPool, root.ITE.rng.createRng(now), now);
    } catch (e) {
      showHome();
      return;
    }
    showQuestion();
  }

  function finishRaid() {
    stopTimer();
    if (!session) return;
    const gs = guildState();
    const done = { ...session, finished: true };
    session = null;
    const raid = raidFor(gs.guild.id, Date.now());
    const after = R.recordAttack(raid, done);
    const recorded = after.attacks.length > raid.attacks.length;
    if (recorded) {
      const attack = after.attacks[after.attacks.length - 1];
      app.setSave({ ...app.getSave(), guild: { ...gs, myAttacks: gs.myAttacks.concat([attack]) } });
    }
    showResult(done, recorded);
  }

  function showQuestion(feedback) {
    const s = session;
    const q = feedback ? s.deck[s.index - 1] : s.deck[s.index];
    const r = s.lastResult;
    const timeEl = h("span", { class: "chip chip-timer", "aria-live": "off" }, `⏱ ${R.secondsLeft(s, Date.now())} 秒`);

    const options = Q.optionsOf(q).map(({ letter, text }) => {
      let cls = "opt";
      if (feedback) cls += letter === q.answer ? " opt-correct" : letter === r.choice ? " opt-wrong" : " opt-dim";
      return h(
        "button",
        { class: cls, onclick: () => onAnswer(letter), ...(feedback ? { disabled: "" } : {}) },
        h("span", { class: "opt-letter" }, letter),
        h("span", { class: "opt-text" }, text)
      );
    });

    render(
      h(
        "main",
        { class: "screen guild raid" },
        topbar("公會副本", finishRaid, timeEl),
        h(
          "section",
          { class: "raid-hud" },
          h("div", { class: `raid-sprite small ${feedback && r.correct ? "shake" : ""}`, html: root.ITE.sprites.raidBoss(feedback && r.correct ? "hurt" : "idle") }),
          h(
            "div",
            { class: "raid-hud-info" },
            h("div", { class: "raid-dmg-total" }, `本次傷害 ${s.damage.toLocaleString()}`),
            h("div", { class: "hint" }, `答對 ${s.correct} / ${s.answered}${s.combo > 1 ? `｜${s.combo} COMBO` : ""}`)
          ),
          feedback && r.correct ? h("div", { class: "dmg-pop" }, `-${r.damage}`) : null
        ),
        h(
          "section",
          { class: "question-card" },
          h(
            "div",
            { class: "q-meta" },
            h("span", { class: "chip" }, Q.TOPICS[q.topic_id]),
            q.review_status !== "approved" ? h("span", { class: "chip chip-warn" }, `狀態：${q.review_status}`) : null
          ),
          h("p", { class: "stem" }, q.stem),
          h("div", { class: "options" }, options)
        ),
        h("p", { class: "hint center" }, "離開（‹）會結束今日挑戰並計算已造成的傷害。")
      )
    );

    timer = setInterval(() => {
      const left = R.secondsLeft(s, Date.now());
      timeEl.textContent = `⏱ ${left} 秒`;
      if (left <= 10) timeEl.classList.add("chip-urgent");
      if (left <= 0) finishRaid();
    }, 250);
  }

  function onAnswer(letter) {
    if (!session || session.finished) return;
    const before = session.answered;
    session = R.answerAttack(session, letter, Date.now());
    if (session.answered === before) return finishRaid(); // time ran out; answer not counted
    app.recordAnswer(session.deck[session.index - 1], session.lastResult.correct);
    showQuestion(true);
    const shown = session;
    setTimeout(() => {
      if (session !== shown) return; // already finished (back button / timer)
      if (session.finished) finishRaid();
      else showQuestion();
    }, FEEDBACK_MS);
  }

  // ---------- Result ----------
  function showResult(done, recorded) {
    const wrong = done.log
      .filter((l) => !l.correct)
      .map((l) => done.deck.find((q) => q.question_id === l.questionId))
      .filter(Boolean);
    render(
      h(
        "main",
        { class: "screen guild result" },
        h("h1", { class: "win" }, "挑戰完成！"),
        h("div", { class: "result-sprite", html: root.ITE.sprites.hero("happy") }),
        h(
          "dl",
          { class: "stats" },
          h("dt", {}, "造成傷害"), h("dd", {}, done.damage.toLocaleString()),
          h("dt", {}, "答對"), h("dd", {}, `${done.correct} / ${done.answered}`),
          h("dt", {}, "正確率"), h("dd", {}, done.answered ? `${Math.round((done.correct / done.answered) * 100)}%` : "—")
        ),
        recorded ? h("p", { class: "note" }, "傷害已計入公會本週總量。") : h("p", { class: "note" }, "這次挑戰未有計入（今日已挑戰或已跨週）。"),
        wrong.length
          ? h(
              "section",
              { class: "review" },
              h("h2", {}, "溫習答錯的題目"),
              wrong.map((q) =>
                h(
                  "div",
                  { class: "review-item" },
                  h("p", { class: "stem" }, q.stem),
                  h("p", { class: "review-ans" }, `正確答案：${q.answer}. ${Q.optionsOf(q).find((o) => o.letter === q.answer).text}`),
                  h("p", { class: "review-exp" }, q.explanation)
                )
              )
            )
          : done.answered
            ? h("p", { class: "note" }, "全部答對，非常好！")
            : null,
        h("div", { class: "menu" }, h("button", { class: "btn btn-primary", onclick: showHome }, "返回公會"))
      )
    );
  }

  root.ITE.guildUi = { show: showHome };
})(globalThis);
