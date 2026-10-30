# Progress log

## Run 1 — 2026-10-30（HKT）
- **Branch / commit / PR:** 用戶安裝 Command Line Tools 後建立本機 repo；`main` 只有空白初始 commit，全部工作在 `feat/p1-boss-battle-prototype`（未 merge main）。未有 GitHub remote，故未 push、未開 PR。
- **Tasks attempted:** P0-01（ADR，待確認）、P0-03（jsc 測試框架）、P1-01、P1-02、P1-03、P1-04（原型）、P2-03、P2-04（core）
- **What changed:**
  - `docs/adr/ADR-0001-tech-stack.md`：建議 Web-first（HTML/JS），日後 Capacitor 包裝 iOS
  - `docs/09_BACKLOG.md`：任務、依賴、驗收準則；`docs/10_AGENCY_AND_SCHEDULE.md`：Agent 分工及排程清單
  - `src/core/*`：戰鬥狀態機、題目驗證／approved 閘門／抽題、存檔（損壞回退＋備份）、可重現亂數
  - `src/ui/*`、`index.html`：主畫面 → 選關 → Boss 戰 → 解說 → 結算／錯題溫習；原創佔位 SVG 角色
  - `src/data/stages.js` 關卡設定；`src/data/dev_sample_questions.js`：12 條**開發測試樣例**（draft，非 DSE），1 個關卡
  - `scripts/test.sh`、`scripts/build.sh [dev|release]`（產生單檔 HTML）
- **Verification (actual):**
  - `./scripts/test.sh` → `29 passed, 0 failed, 29 total`，exit 0
  - 故意加入失敗測試 → `29 passed, 1 failed`，exit 3（確認失敗會阻擋）
  - `./scripts/build.sh` → `built dist/it-emperor.html (38748 bytes)`
  - Claude 內建瀏覽器 375×812 手機尺寸實玩：主畫面、選關、答對（Boss -50）、答錯（隊伍 -20、顯示正確答案及解說）、勝利結算（5/6, 83%）、中途返回後「繼續戰鬥」HP 保持一致；無橫向捲動
  - 未驗證：iOS 模擬器／真機（無 Xcode）；預覽環境下 localStorage 不可用，跨重新整理的存檔只由單元測試驗證
- **QA review (qa-security-reviewer, independent):** 2 BLOCKER、4 SHOULD-FIX、5 NIT
  - 已修 BLOCKER 1：恢復戰鬥時以目前題池重新綁定題目（`battle.rebindDeck`），存檔中的非 approved／被竄改題目不會顯示
  - 已修 BLOCKER 2：`save.isValidBattle` 嚴格檢查進行中戰鬥，損壞即丟棄該戰鬥、保留其餘存檔
  - 已修：release 建置模式（`./scripts/build.sh release`，不打包測試題，test.sh 自動檢查）；關卡紀錄清理；空題池訊息；重複 ID 正規化；備份不覆蓋；aria-live 範圍；HP 0 除數
  - 未處理：DOM/XSS 自動測試、375px／44px 自動檢查、匯入報告 checksum、source_year 等欄位驗證（列入 P2-02）
  - 修正後**尚未**再請 reviewer 複審（下一輪先做）
- **Verification after fixes (actual):** `./scripts/test.sh` → `34 passed, 0 failed, 34 total` + `✓ release bundle contains no dev sample questions`，exit 0；瀏覽器重玩 dev（繼續戰鬥、失敗結算）及 release（無測試題、無開發標示、顯示「暫時未有可用題目」）
- **Security / production changes:** NONE
- **Next task:** 用戶建立 GitHub private repo → push feature branch、開 draft PR → 設定排程；QA 複審；有 Excel 後做 P2-01/P2-02
- **Human decisions required:**
  1. ~~確認 ADR-0001~~ → 用戶 2026-10-30 批准 Web-first
  2. ~~安裝 Command Line Tools~~（已完成：git 2.50.1、Python 3.9.6、Swift 6.3.3）→ 請建立 GitHub private repo
  3. 提供 2 張畫風參考圖至 `assets/style_references/`
  4. 提供 ChatGPT 題庫 Excel 至 `data/question_bank/`
  5. 戰鬥原型數值（答錯扣 20 HP、10 題、Combo 加傷）是否可接受

## Run 2 — 2026-10-30（HKT，routine A）
- **Branch / base:** `routine/20261030-P3-05`，基於 `origin/feat/p1-boss-battle-prototype`（main 尚無 `src/core/battle.js`）。
- **Task:** P3-05 虛構學校公會 demo — 第一步（計分 core，無 UI）。其餘 TODO 皆被阻塞（P2-02 依賴 P2-01 的真實 Excel）。
- **What changed:**
  - `src/core/guild.js`：個人成績（正確率 70% / 完成度 25% / 速度 5%）、學校分數＝前 N 名平均（預設 N=5）、參與人數不足者不排名、確定性排名。全部標示 PROPOSAL。
  - `src/data/demo_guilds.js`：3 間虛構學校、虛構暱稱（無真實資料）。
  - `tests/guild.test.js`：6 項測試；已登記於 `tests/run.js`。未接入 index.html／UI。
- **Verification (actual):** `./scripts/test.sh` → `40 passed, 0 failed, 40 total` + `✓ release bundle contains no dev sample questions`，exit 0。（首次運行有 2 項測試預期值寫錯，已修正測試後重跑通過；非程式碼缺陷。）
- **Blockers:** 無新增。未做獨立 reviewer 複審。
- **Next task:** P3-05 UI 畫面（積分榜 demo 頁）；QA 複審 Run 1 修正。
- **Human decisions needed:** docs/07 的 7 項 OPEN_DECISION（尤其 #4 計分方式：本次以「前 N 名平均」作示範，請確認或否決）；仍需 Excel、參考圖、GitHub 合併 feat 分支。

## Run 3 — 2026-10-30（HKT，coordinator，接續 PR #2）
- **Branch:** `routine/20261030-P3-05`（同一 draft PR #2）
- **Why:** 用戶確認公會規則（見 `docs/07` 新章節）：玩家自建公會；共享高血量 Boss；每人每天 1 次限時作答，答對造成傷害；週結按攻擊總量排名，人多有利屬刻意設計。Run 2 的「前 N 名平均」方案因此作廢。
- **What changed:** 刪除 `src/core/guild.js`、`tests/guild.test.js`；新增 `src/core/guildRaid.js`（香港時間日／週、建立及加入公會、限時攻擊、每日一次、同日並行只計一次、週轉換開新 Boss、溢出傷害計入、週排名）；改寫 `src/data/demo_guilds.js`（虛構公會＋攻擊紀錄）；`tests/guildRaid.test.js` 10 項。`docs/05`、`docs/07`、`docs/09` 已更新。
- **Verification (actual):** `./scripts/test.sh` → `44 passed, 0 failed, 44 total` + `✓ release bundle contains no dev sample questions`，exit 0。突變測試：移除每日限制 → `42 passed, 2 failed`（測試確實能捕捉），還原後 44 passed。
- **Not done:** 公會畫面 UI；伺服器判分（Phase 4，需批准）。尚未經 QA 複審（今日 17:08 Routine B）。
- **Human decisions needed:** `docs/07` 公會「仍待決定」7 項（時限、Boss 血量、Boss 被打倒後處理、人數上限／轉會、真實校名授權、獎勵、防作弊）。

## Run 4 — 2026-10-30（HKT，coordinator，接續 PR #2）
- **Branch:** `routine/20261030-P3-05`（draft PR #2）
- **Task:** P3-05 公會畫面（單機示範）
- **What changed:**
  - `src/ui/guild.js`（新）：加入／建立公會（暱稱及校名私隱提示）、公會首頁（本週 Boss 血量、公會總傷害、週結倒數、今日挑戰、本週公會排名、成員貢獻、兩步確認離開）、限時副本（倒數計時、答後 0.7 秒顯示對錯、離開即結算）、結算及錯題溫習
  - `src/core/guildRaid.js`：`weekStart`、`msUntilNextWeek`、`buildRaid`、`demoAttacks`、攻擊 `log`、紀錄包含 `weekKey`
  - `src/core/save.js`：存檔新增 `guild`（暱稱、公會、自己的攻擊紀錄），損壞即丟棄、舊存檔相容
  - 主畫面「校際公會」按鈕開放；`index.html` 載入新檔；`style.css` 公會樣式
- **Verification (actual):**
  - `./scripts/test.sh` → `50 passed, 0 failed, 50 total` + `✓ release bundle contains no dev sample questions`
  - 瀏覽器 375×812 實玩：未填暱稱有錯誤提示；暱稱含 `<b>` 以純文字顯示（無注入）；加入虛構公會；對、對、錯、對 → 傷害 160（50+60+0+50）；中途離開即結算並計入（公會 2,410→2,570，Boss 47,430）；今日按鈕轉為「今日已挑戰」；把時鐘撥前 121 秒 → 自動結束並計入；兩步離開公會；空白公會名被拒；建立自己的公會並出現在排名；無橫向捲動；所有按鈕 ≥44px；release 版無題目時顯示「暫時未有可用題目」
- **Known limits:** 單機示範（其他公會為虛構）；離開再加入可在同日再挑戰（防作弊屬低優先，用戶決定）；挑戰中關閉 App 不會保存該次挑戰。
- **Next:** QA 複審（Routine B 17:08）；公會數值待用戶決定；多人共享需後端選型（需批准）。
## Run 5 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/p2-question-import`（基於 `main`，PR 待開）
- **Task:** P2-01／P2-02／P2-03：匯入 ChatGPT 題庫 `IT_Emperor_DseMcQs.xlsx`
- **What changed:**
  - `tools/import_question_bank.py`（Python 標準庫，無需安裝套件）：只讀 `Questions`；Topic 來自 `Topics` 表；欄名對照表；公式儲存格保留公式文字；拒絕並列明原因；SHA-256；答案分佈警告
  - 產生 `src/data/question_bank.js`（382 題）、`src/data/question_bank.release.js`（14 題 approved）、`docs/QUESTION_BANK_IMPORT_REPORT.md`
  - 遊戲改用匯入題庫；Topic 名稱來自題庫；答錯時顯示 `wrong_tip_zh` 提示；開發版橫幅改為「包含未經教師核准（review）的題目」
  - `scripts/build.js` release 改用 approved-only 檔；`scripts/test.sh` 加入 Python 測試及「release 不含非 approved 題」檢查
- **Verification (actual):** `./scripts/test.sh` → JS `38 passed, 0 failed` + Python `Ran 10 tests ... OK` + `✓ release bundle contains no dev samples and no non-approved questions`；反向確認：dev 打包含 368 條 review（檢查能捕捉）；瀏覽器：dev 版顯示真題、Topic 中文名、review 標籤、答錯提示；release 版只有 14 題 approved、無開發標示、可完整打勝一局
- **Import result:** 414 → 382 匯入、32 拒絕（topic_id 不在 Topics 表：ALGORITHM 13、NETWORK 12、DATA 5、INFO 1、NETDEVICE 1）；8 個公式儲存格已保留文字；答案 D 只佔 3%
- **Human decisions needed:** 交 ChatGPT 修正 32 題 topic_id；教師審核把 review 改 approved（正式版現只有 14 題）；是否在遊戲中打亂選項次序；故事模式題庫（129 題）是否接入

## Run 6 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/p1-07-art-style`（合併了 PR #2 公會及 PR #3 題庫，再套用美術；PR #2、#3 合併後此 PR 只剩美術改動）
- **Task:** P1-07 套用 Art Bible（用戶已選 Q 版 2.5 頭身）
- **What changed:**
  - `src/ui/sprites.js`：重畫 Q 版主角（紫色衛衣、圓眼鏡、小皇冠、手提電腦）及 Bug 王、新增公會 Boss；表情函數：主角 idle／happy／speechless／surprised，Boss idle／hurt／smug
  - 戰鬥：答對主角笑、Boss ✕ 眼；答錯主角無語（藍色直線＋汗滴）、Boss 得意；結算勝利主角笑、失敗 Boss 得意
  - `src/ui/style.css`：Art Bible 8 色 token；主按鈕改帝黃；停用按鈕對比加強；戰鬥背景改天藍＋桃膚平塗；公會畫面取消漸變及色相濾鏡；倒數紅色狀態改深色字（對比度）
  - 合併衝突（docs 表格、進度、測試清單、樣式表）均為雙方新增內容，全部保留
- **Verification (actual):** `./scripts/test.sh` → `54 passed, 0 failed` + Python `Ran 10 tests OK` + `✓ release bundle: no dev samples; all 14 questions are approved`；瀏覽器 375×812：主畫面、選關、戰鬥（答對／答錯表情）、公會首頁；無橫向捲動；所有按鈕 ≥44px
- **Still PLACEHOLDER:** 角色仍為程式繪製 SVG，正式插畫待製作

## Run 7 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/story-mode`（基於 `main`，已含 PR #2 公會、#3 題庫、#4 美術）
- **Task:** P3-06 單機故事模式：先完成 A-01–A-03
- **What changed:**
  - `tools/import_story_bank.py`：只讀 `Story_Questions`；`Levels`／`Worlds` 提供關卡資料；驗證（level_id、答案、四選項、sequence、boss_eligible、重複 ID）；教師審核 CSV（最嚴格者優先）；SHA-256；答案分佈警告 → `src/data/story_bank.js`（129 題）、`story_bank.release.js`（0 題 approved）、`docs/STORY_BANK_IMPORT_REPORT.md`
  - `src/core/story.js`：關卡建立、解鎖、練習抽題＋小 Boss、答對按分數攻擊、答錯重排、星數、進度紀錄、審核 CSV 匯出（防 Excel 公式注入）
  - `src/ui/story.js`：故事地圖（5 個世界 43 關，A-01–A-03 可玩，其餘「即將開放」）、關卡介紹、戰鬥、過關畫面（星數、溫習答錯題、下一關）
  - `src/ui/review.js`：開發版「教師審核」畫面（審核人、逐關檢視答案及解說、核准／退回＋原因、匯出 CSV）；正式版不打包
  - `src/core/save.js`：存檔加入 `story`（舊存檔相容、損壞記錄修復）；`src/core/rng.js`：種子先打散（相鄰種子首值相關）
  - 主畫面：故事模式／DSE 題庫挑戰／校際公會／教師審核（開發版）
- **Verification (actual):**
  - `./scripts/test.sh` → JS `68 passed, 0 failed` + Python `Ran 18 tests OK` + `✓ release bundle: no dev samples; all 14 questions are approved`（亦檢查正式版不含教師審核畫面）
  - 瀏覽器 375×812 實玩：A-01 故意答錯一題 → 顯示中文解說、題目在小 Boss 後重現 → 2 星過關、解鎖 A-02；A-02、A-03 全對 3 星；A-03 後顯示「A-04 即將開放」；地圖星數 8；無橫向捲動；按鈕 ≥44px
  - 教師審核畫面：未填審核人、退回未寫原因均被阻止；匯出 CSV 內容正確
  - 端對端（在臨時副本，未改動正式檔案）：CSV 核准 A-01 三題、退回 A-02-02 → 匯入 → 正式版只有該 3 題、A-01 可玩、A-02／A-03「等待老師審核」、A-02-02 完全不在正式版、無審核畫面
  - 本機 HTTP 伺服器（真正 localStorage）：過關後重新整理，進度及解鎖仍在；遊玩期間沒有任何外部網絡請求
- **DSE 題庫重新匯入：未採用。** 17:21 版 `Questions` 表 414 題全部改為 approved，但 Topic_* 檢閱表、`DSE_來源追蹤`（320 題 review，「待教師最後確認」）及 `2024_可行性評估`（33 題待覆核）均顯示未經教師審核，且題目內容沒有任何改動。維持上一版（14 題 approved），待用戶確認。
- **Human decisions needed:** DSE 題庫 382 題是否真的已由教師審核；選項是否打亂（故事題庫 0 個 D 答案）；`STORY-A-02-02`「資料驗證」用詞與 DSE 題庫「數據核對」不一致；教師開始審核故事題目
## Run 8 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/dse-bank-approved`（基於 `main`）
- **Task:** 重新匯入 DSE 題庫（17:21 版），用戶確認 382 題已經教師審核
- **What changed:** `src/data/question_bank.js`、`question_bank.release.js`、`docs/QUESTION_BANK_IMPORT_REPORT.md`（加入審核確認紀錄）、`docs/05_DECISIONS.md`
- **Import result:** 414 → 382 匯入（全部 approved）、32 拒絕（課題代碼不在 Topics 表：ALGORITHM 13、NETWORK 12、DATA 5、INFO 1、NETDEVICE 1）；題目內容與上一版相同，只有狀態改變
- **Follow-up:** 活頁簿內 Topic_*、DSE_來源追蹤、2024_可行性評估 狀態未同步；32 題課題代碼待修正；D 答案只佔 3%

## Run 9 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/shuffle-options`（基於 `main`）
- **Task:** 用戶決定由遊戲打亂選項（故事題庫 0 個 D 答案、DSE 題庫 D 只佔 3%）
- **What changed:**
  - `src/core/questions.js`：`shuffleOptions`／`applyOptionOrder`／`isOptionOrder`；顯示用副本記錄 `option_order`（原字母），答案字母跟隨選項文字；原題不變
  - DSE 挑戰（`battle.js`）、公會（`guildRaid.js`）、故事（`story.js`）出題時打亂；DSE 中途存檔繼續時沿用相同次序（次序被竄改則不恢復）；故事模式答錯重現時再打亂；過關溫習按學生看到的字母顯示
  - 事前檢查：511 題中沒有以字母指向其他選項的選項，可安全打亂
- **Verification (actual):** `./scripts/test.sh` → JS `74 passed, 0 failed`（新增 6 項）+ Python `Ran 18 tests OK` + `✓ release bundle: … all 382 questions are approved`；突變測試：停用打亂 → `70 passed, 4 failed`，還原後 74 passed；瀏覽器 375×812：故事 A-01 題庫答案 B「資訊」顯示為 D，綠色標示與「正確答案是 D」一致，重現時其餘選項位置改變，溫習顯示「D. 資訊」；DSE 挑戰 5 題中 4 題答案位置改變、全部判定正確並勝利；公會答對造成 50 傷害
