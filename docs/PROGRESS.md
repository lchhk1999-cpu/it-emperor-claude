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
---
## 每週簡報 — 2026-10-30（Routine C，涵蓋 2026-10-24 至 10-30）
- **Branch:** `routine/weekly-20261030`（基於 `origin/main` @ `8fed601`；`src/core/battle.js` 已在 main）
- **性質:** 只改文件；以下只記錄 commit／PR 及本次實際執行的測試可證實的內容。

### 本週已完成
- **PR #1**（已合併，`69b654a`）：可玩的四選項 Boss 戰原型（`5fcbbfe`）。
- **PR #2**（已合併，`74970a1`）：虛構公會計分核心（`a356c05`）、每週公會副本取代 top-N 計分（`975b733`）、公會畫面單機示範（`c458552`）。
- **PR #3／#4**（已合併，`5068ec5`）：Excel 題庫匯入（`d957741`）；Q 版 2.5 頭身美術套用（`2257293`）。
- **PR #5**（已合併，`456a5f9`）：故事模式 A-01–A-03 及教師審核流程（`91adb0e`）；匯入教師審核的 DSE 題庫 382 題（`73bf9dd`）。
- **PR #6**（已合併，`8fed601`）：更新 backlog（`543cc40`）。
- **測試（本次於 `origin/main` 實際執行 `./scripts/test.sh`）：** JS `68 passed, 0 failed, 68 total`；Python `Ran 18 tests ... OK`；`✓ release bundle: no dev samples; all 382 questions are approved`。
- 註：PR #2–#6 在 GitHub 顯示 closed／merged 時間，但 API 的 `merged` 欄位為 false（head 合併進 main 的 merge commit 存在於歷史）；是否經人手批准合併 **未驗證**。各 PR 均無 review comment 紀錄可供查證（未逐一讀取）。
- 瀏覽器實玩結果引用自 Run 4–7 的紀錄，本次**未重跑**，屬未重新驗證。

### 未完成
- 故事模式 A-04 之後（共 43 關，僅 A-01–A-03 可玩）；故事題庫 release 版 0 題 approved（待教師審核）。
- 32 題 DSE 題目因 topic_id 不在 Topics 表被拒（ALGORITHM 13、NETWORK 12、DATA 5、INFO 1、NETDEVICE 1）。
- 公會為單機示範，其他公會為虛構；多人共享未開始。
- 角色美術仍為程式繪製 SVG 佔位。

### 風險
- 公會離開再加入可同日再挑戰；防作弊屬低優先（用戶已決定）。
- ~~答案 D 只佔 DSE 題庫約 3%、故事題庫 0 個；選項是否打亂未決定。~~ → 已解決：用戶決定由遊戲打亂選項（PR #8，Run 9）。
- 題庫活頁簿內 Topic_*、DSE_來源追蹤、2024_可行性評估 狀態與 Questions 表未同步，審核紀錄可能不一致。
- 故事題 `STORY-A-02-02`「資料驗證」與 DSE 題庫「數據核對」用詞不一致。
- 本次執行環境測試以 Node 運行（非 JavaScriptCore／iOS 實機），未涵蓋真機表現。

### 需要老師／用戶決定的事項
1. 老師審核故事題庫 129 題（現時 release 為 0 題）。
2. 請 ChatGPT 修正 32 題 topic_id 後重新匯入。
3. ~~是否在遊戲中打亂選項次序。~~ → 已決定並完成（PR #8）。
4. 公會多人共享所需後端選型（需明確批准，不會自行開通付費服務）。
5. 統一 `資料驗證`／`數據核對` 用詞。

### 下週三項重點
1. 故事模式 A-04 起的關卡（視乎老師審核進度）。
2. 重新匯入修正後的 32 題 DSE 題目並更新匯入報告。
3. 公會後端選型方案文件（僅提案，待批准）。

## Run 10 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/story-world-a`（基於 `main`）
- **Task:** P3-07 第一步：開放故事模式世界 A 其餘關卡 A-04–A-09（開發版）
- **What changed:** `STORY_RULES.enabledLevels` 加入 A-04–A-09；新增測試：每個已開放關卡可按次序過關並解鎖下一關、已開放關卡必須是連續前段（避免跳關）、世界 A 9 關全部可玩
- **Content check（非正式審核）:** 逐題閱讀 A-04–A-09 共 18 題，答案與解說一致，未發現明顯錯誤；A-07 的公式選項以純文字匯入。正式正確性仍待教師審核
- **Verification (actual):** `./scripts/test.sh` → JS `76 passed, 0 failed` + Python `Ran 18 tests OK` + `✓ release bundle: … all 382 questions are approved`；瀏覽器 375×812：由 A-01 順序打到 A-09，全部 ★★★、每關解鎖下一關、A-09 後顯示「B-01 即將開放」、地圖 27 星、無橫向捲動；A-09 長 SQL 選項分兩行顯示、無超出畫面
- **正式版:** 不受影響，故事題目仍待教師審核（0 題 approved）
- **Next:** 世界 B（B-01–B-08）

## Run 11 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/story-world-b`（基於 `main`）
- **Task:** P3-07：開放故事模式世界 B（硬件機械城）B-01–B-08（開發版）
- **What changed:** `STORY_RULES.enabledLevels` 加入 B-01–B-08；測試改為檢查世界 A、B 全部可玩，以及 A-09 過關後開啟世界 B
- **Content check（非正式審核）:** 逐題閱讀 24 題，答案與解說一致，未發現明顯錯誤。正式正確性仍待教師審核
- **Verification (actual):** `./scripts/test.sh` → JS `76 passed, 0 failed` + Python `Ran 18 tests OK` + `✓ release bundle: … all 382 questions are approved`；瀏覽器 375×812：由 A-01 順序打到 B-08 共 17 關，全部 ★★★、A-09 解鎖 B-01、B-08 後顯示「C-01 即將開放」、地圖 51 星、無橫向捲動
- **正式版:** 不受影響（故事題目 0 題 approved）
- **Next:** 世界 C（C-01–C-10）

## Run 12 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/story-world-c`（基於 `main`）
- **Task:** P3-07：開放故事模式世界 C（網絡與保安迷宮）C-01–C-10（開發版）
- **What changed:** `STORY_RULES.enabledLevels` 加入 C-01–C-10；測試加入世界 C 全部可玩及 B-08 過關後開啟世界 C
- **Content check（非正式審核）:** 逐題閱讀 30 題，答案與解說一致；發現 `STORY-C-01-01` 錯誤選項「PAN 全球網絡」把 PAN 說成全球網絡，已列入待老師處理事項（未改動題目）
- **Verification (actual):** `./scripts/test.sh` → JS `76 passed, 0 failed` + Python `Ran 18 tests OK` + `✓ release bundle: … all 382 questions are approved`；瀏覽器 375×812：由 A-01 順序打到 C-10 共 27 關，全部 ★★★、B-08 解鎖 C-01、C-10 後顯示「D-01 即將開放」、地圖 81 星、無橫向捲動；C-07 選項 `<img>`／`<h1>` 等以純文字顯示，題目卡內沒有產生任何 HTML 元素
- **正式版:** 不受影響（故事題目 0 題 approved）
- **Next:** 世界 D（D-01–D-10）

## Run 13 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/story-world-d`（基於 `main`）
- **Task:** P3-07：開放故事模式世界 D（程式魔法學院）D-01–D-10（開發版）＋修正多行題目顯示
- **Bug fix（影響正式版）:** 題目中的換行被合併成一行，令程式碼／偽代碼題難以閱讀。受影響：DSE 題庫 6 題（例如 `ICT-2024-IA-29` 重複…直至演算法，已在正式版）、故事題庫 3 題（D-03-03、D-04-03、D-05-03）。`style.css` 對題目、選項、解說及溫習文字加入 `white-space: pre-wrap`，保留換行及縮排
- **What changed:** `STORY_RULES.enabledLevels` 加入 D-01–D-10；測試加入世界 D、C-10 過關後開啟世界 D、程式碼題保留換行
- **Content check（非正式審核）:** 逐題閱讀 30 題，答案與解說一致
- **Verification (actual):** `./scripts/test.sh` → JS `77 passed, 0 failed` + Python `Ran 18 tests OK` + `✓ release bundle: … all 382 questions are approved`；瀏覽器 375×812：由 A-01 順序打到 D-10 共 37 關，全部 ★★★、C-10 解鎖 D-01、D-10 後顯示「E-01 即將開放」、地圖 111 星、無橫向捲動；D-03-03／D-04-03／D-05-03 按原本 4 行顯示；正式版 `ICT-2024-IA-29` 按 6 行顯示並保留縮排
- **Next:** 世界 E（E-01–E-06）

## Run 14 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/story-world-e`（基於 `main`）
- **Task:** P3-07 完成：開放故事模式世界 E（未來科技都市）E-01–E-06，43 關全部開放（開發版）
- **What changed:** `STORY_RULES.enabledLevels` 包含全部 43 關（與 Levels 表次序相同）；最後一關 E-06 過關後顯示「完成全部 43 關」祝賀（未全部完成則提示回地圖）；地圖頂部顯示全部完成及總星數；測試改為檢查 5 個世界全部開放、D-10 開啟 E-01、E-06 為最後一關
- **Content check（非正式審核）:** 逐題閱讀 18 題，答案與解說一致
- **Verification (actual):** `./scripts/test.sh` → JS `77 passed, 0 failed` + Python `Ran 18 tests OK` + `✓ release bundle: … all 382 questions are approved`；瀏覽器 375×812：由 A-01 順序打到 E-06 共 43 關，43/43 過關、全部 ★★★、地圖 129/129 星並顯示「全部 43 關完成」、E-06 顯示完成祝賀、無橫向捲動
- **正式版:** 不受影響（故事題目 0 題 approved，待教師審核）

## Run 15 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/characters-team`（基於 `main`）
- **Task:** P3-01 經驗／等級／金幣＋P3-02 角色與隊伍
- **What changed:**
  - `tools/import_game_data.py`：匯入 Excel `Characters`（7 角色）及 `GameConfig`，驗證稀有度、數值範圍、專長課題（對照 Topics）、重複 ID → `src/data/game_data.js`、`docs/GAME_DATA_IMPORT_REPORT.md`
  - `src/core/profile.js`：等級／經驗／金幣、可一次升多級、隊伍格按等級解鎖、加入／移出／單格替換、隊伍平均攻擊及 HP、專長加成、獎勵計算
  - `src/core/battle.js`：可選隊伍（沒有隊伍時與以前完全一樣）；傷害 × 平均攻擊 ×（1＋專長加成）
  - `src/core/save.js`：存檔加入 `profile`（舊存檔相容、數值修復）
  - 畫面：主畫面等級列、`src/ui/team.js` 角色隊伍畫面、戰鬥顯示隊伍人數及專長加成、DSE 結算及故事過關顯示獎勵／升級／解鎖隊伍位置；角色以不同顏色衛衣區分（PLACEHOLDER）
- **Verification (actual):** `./scripts/test.sh` → JS `90 passed, 0 failed`（新增 13 項）+ Python `Ran 22 tests OK`（新增遊戲資料匯入器 4 項） + `✓ release bundle: … all 382 questions are approved`；瀏覽器 375×812：Lv1 換上數據庫師、SQL 題造成 96 傷害並顯示「數據庫師 專長加成 +20%」、其他課題無加成；3 場勝利各 +50 經驗 +30 金幣，升至 Lv2、Lv3 並提示解鎖隊伍位置；Lv3 加入黑客成 2 人隊伍、第 3 人提示隊伍已滿；故事首次過關 +25 經驗 +30 金幣、重玩 +5 經驗；無橫向捲動
- **Found & fixed while play-testing:** Lv1 只有一格時無法換角色（加入顯示已滿、移出又不准空隊）→ 單格時按另一角色即替換
- **Next:** P3-08 每日任務＋稱號（排程可做）；P3-09 裝備；P4-03 抽蛋待用戶批准
- **Run 15 補充（同一分支）:** 用戶核准 7 個角色造型並放進遊戲：`src/ui/characters.js`（7 角色 × 平時／答對／無語／驚訝）；未有造型的新角色自動改用主角圖；新增 `tests/sprites.test.js`（每個角色有獨立造型、四種表情各不相同、SVG 標籤完整、無遺漏數值）。`./scripts/test.sh` → JS `93 passed, 0 failed` + Python `Ran 22 tests OK`；本機伺服器 375×812：角色隊伍 7 個造型、黑客答對時笑／答錯時汗滴及嘴角向下。註：單檔已增至約 536 KB，超出預覽窗格直接開檔上限，改用本機伺服器檢查（不影響用戶在瀏覽器開啟）

## Run 16 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/missions-titles`（基於 `main`）
- **Task:** P3-08 每日／每週任務＋稱號
- **What changed:**
  - `tools/import_game_data.py`：再匯入 Excel `Missions`（5）及 `Titles`（4），驗證週期、目標、獎勵、重複 ID、`topic_correct` 課題；遊戲未能計算的條件標為 `supported: false`；兩表為可選
  - `src/core/missions.js`：每日／每週／累計計數（按香港時間重置）、任務進度及領獎（每期一次）、稱號自動取得及佩戴、SQL JOIN 題按標籤判斷
  - 玩家資料加入免費「寶石」；存檔加入 `progress`（舊存檔相容、數值修復）
  - DSE 挑戰、故事、公會每題作答計入；DSE 勝利及故事過關計入「過關」
  - 畫面：`src/ui/missions.js`「任務與稱號」；主畫面按鈕顯示可領獎勵數目；等級列顯示寶石及佩戴的稱號
- **Excel 對照:** 支援 M-DAILY-01、M-DAILY-02、M-WEEK-01、T-NEW、T-EXCEL、T-SQL；「即將開放」：M-WEEK-02（Excel 的 6 個世界未能對應遊戲關卡）、M-ACH-01（角色進化未做）、T-PVP（競技排名未做）
- **Verification (actual):** `./scripts/test.sh` → JS `103 passed, 0 failed`（新增 10 項）+ Python `Ran 24 tests OK`（新增 2 項）+ `✓ release bundle: … all 382 questions are approved`；本機伺服器 375×812：一場 DSE（5 對 5 錯、勝利）→ 主畫面顯示 2 個可領獎勵 → 領取得寶石 5、金幣 +50；累積答對 50 題後佩戴「IT 新人王」並顯示於主畫面；重新整理後稱號、寶石、已領取狀態保留；故事一關計入 3 題及 1 次過關、公會挑戰計入作答；無橫向捲動、按鈕 ≥44px
- **Next:** P3-09 裝備；P4-03 抽蛋待用戶批准設計

## Run 17 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/equipment`（基於 `main`）
- **Task:** P3-09 裝備
- **What changed:**
  - `tools/import_game_data.py`：匯入 Excel `Equipment`，以每類型的格式把效果文字解讀為數值（3 個進化階段），格式不符即拒絕；眼鏡（time）標為未支援
  - `src/core/equipment.js`：每位隊員 1 件、一件只可由一人使用、移出隊伍即卸下；AI 提示（只刪錯誤選項、同題固定、冷卻 6 題）、眼藥水（每場一次、不超過最大 HP）、電腦（下一題答對才 +40、冷卻 6 題）、防毒（受傷 -10%）
  - `src/core/battle.js`：可選裝備；答錯受傷套用防毒；電腦獎勵只在答對時生效
  - 玩家資料加入 `equipment`（存檔修復）；角色隊伍畫面新增「裝備」下拉選單；DSE 戰鬥畫面新增技能列、刪去選項劃線停用、電腦加傷提示
- **Verification (actual):** `./scripts/test.sh` → JS `113 passed, 0 failed`（新增 10 項）+ Python `Ran 26 tests OK`（新增 2 項）+ `✓ release bundle: … all 382 questions are approved`；本機伺服器 375×812：4 名隊員各裝備 1 件、轉移裝備時自動卸下；AI 提示刪去的選項是錯誤選項並停用、冷卻顯示「6 題後」；電腦 + 答對 → 91 傷害並顯示「+40」；防毒 → 答錯受傷 18；眼藥水 83 → 93 HP 後顯示「已用」；故事模式沒有技能列；無橫向捲動
- **Found while testing:** 測試腳本原本連續答對 6 題，但隊伍傷害令 Boss 第 5 題已倒下 → 改用夾雜答錯的情境（非程式錯誤）
- **Next:** P4-03 抽蛋（待用戶批准設計）；角色／裝備進化未排期

## Run 18 — 2026-10-30（HKT，coordinator）
- **Branch:** `feat/gacha`（基於 `main`）
- **Task:** P4-03 抽蛋（用戶 2026-10-30 批准設計：每次 10 寶石、重複換金幣、只靠抽蛋取得角色、新手 IT狗＋AI 模型）
- **What changed:**
  - `tools/import_game_data.py`：匯入 Excel `Pools`（每池機率須合計 100%、稀有度不重複）
  - `src/core/gacha.js`：角色池按稀有度機率、同稀有度內平均；第 80 抽保底 SSR（抽到 SSR 即重置）；裝備池在可用裝備中平均抽（Excel 無稀有度）；重複換金幣；最近 20 次紀錄
  - 擁有權：`profile.owned`；隊伍及裝備只可用已擁有的；舊存檔自動保留已在用的角色及裝備
  - 畫面：主畫面「抽蛋」、抽蛋畫面（公開機率、保底倒數、結果、紀錄、「不設現金購買」說明）；角色隊伍顯示未擁有角色（灰色）
- **Verification (actual):** `./scripts/test.sh` → JS `124 passed, 0 failed`（新增 11 項，包括 4,000 次抽蛋機率接近 77/20/3%、第 80 抽保底）+ Python `Ran 27 tests OK` + `✓ release bundle: … all 382 questions are approved`；本機伺服器 375×812：新玩家只擁有 IT狗＋AI 模型、其餘角色灰色「未擁有」、寶石不足時按鈕停用、抽 3 次角色（2 新 1 重複 → 金幣 30）及 1 次裝備（重複 → 金幣 50）、保底倒數 77、重新整理後擁有權保留、抽到的數據庫師可換上隊伍；無橫向捲動
- **Found & fixed while play-testing:** 裝備結果卡名稱重複及空白 → 改為裝備圖示
- **Human/ChatGPT follow-up:** Excel `Equipment` 表補上稀有度欄

## Run 19 — 2026-10-30（HKT，coordinator）— 提案，待核准
- **Branch:** `feat/character-variants`
- **Why:** 用戶說明抽蛋原意是「更多角色、同一角色有不同品種及稀有度」（例如 IT狗 有不同品種）。用戶決定：7 個系列全部有品種、每系列 4–5 個、稀有度越高稍強（SR +5%、SSR +10%）、由 Claude 起草名單及造型、用戶核准後由 ChatGPT 加入 Excel
- **What changed:** `src/ui/characters.js` 改為「系列＋參數」繪圖，原有 7 個角色 28 張圖與之前逐一比對完全相同；新增 24 個品種造型（共 31 個）；`tools/character_variants_proposal.js` 產生 `docs/proposals/character_variants.csv`（可貼進 Excel `Characters` 表，新增 `family_id`／`family_name` 欄）及設計畫布「角色品種」圖鑑（由同一繪圖程式產生）
- **Verification (actual):** `./scripts/test.sh` → JS `125 passed, 0 failed`（新增品種造型檢查）+ Python OK；31 個品種四種表情 SVG 全部完整且各不相同
- **未接入遊戲:** 需用戶核准 → ChatGPT 把 CSV 加入 Excel → 重新匯入（匯入器需支援 family 欄）→ 抽蛋及角色畫面按系列顯示
- **注意（經濟節奏）:** SSR 由 1 個增至 8 個；按每週約 40 寶石（約 4 抽）計，第 80 抽保底約需 20 週，集齊全部角色需時很長，可能要調整寶石收入或保底

## Run 20 — 2026-10-31：角色品種核准及接入準備
- 分支：`feat/character-variants`
- 用戶核准 31 個品種（「可以，核准」）。記錄於 `docs/05_DECISIONS.md`；設計畫布標示為已核准；新增 backlog P4-06（等 Excel 更新）。
- 匯入器 `tools/import_game_data.py`：`Characters` 表可選 `family_id`／`family_name` 欄（兩欄須同時填寫或同時留空），輸出 `family`／`familyName`。
- `ITE.profile.familyGroups`：按系列分組（保留 Excel 次序；無系列的角色自成一組）。角色隊伍畫面按系列顯示並列出「已擁有 / 系列總數」；抽蛋結果顯示系列名稱。
- 測試：`./scripts/test.sh` → JS 126 passed, 0 failed；release 檢查通過。`python3 -m unittest discover -s tests -p 'test_*.py'` → 28 tests OK。
- 試玩：本機 http 伺服器開啟 dev bundle，角色隊伍畫面正常（7 張角色卡，沒有系列標題）；在瀏覽器暫時加入系列資料後出現兩個系列標題，卡片數正確。
- 阻塞：要等 ChatGPT 把 `docs/proposals/character_variants.csv` 加入 Excel `Characters` 表，用戶放回 `data/question_bank/` 後，才可重新匯入 31 個品種。
- 待決定：寶石經濟節奏（8 個 SSR、保底 80 抽約 20 週）。

## Run 21 — 2026-10-31：31 個角色品種接入遊戲
- 用戶以 ChatGPT 更新 `IT_Emperor_DseMcQs.xlsx`。逐表比較新舊檔：只有 `Characters` 有改動（31 行），其餘 53 張工作表完全相同；31 行與 `docs/proposals/character_variants.csv` 逐欄比對，0 個差異。
- 重新匯入：`python3 tools/import_game_data.py data/question_bank/IT_Emperor_DseMcQs.xlsx` → characters 31, rejected 0。題庫（Questions 表未變）沒有重新匯入。
- 系列內角色改為 R → SR → SSR 排列。
- 測試：`./scripts/test.sh` → JS 126 passed, 0 failed；release 檢查通過（382 題全部 approved）。Python 28 tests OK。
- 試玩（本機 http 伺服器，dev bundle）：角色隊伍 31 張卡、7 個系列標題、全部角色都有自己的造型；抽蛋機率表列出 R 11／SR 12／SSR 8。
- 用戶提出新系統清單，已加入 backlog P5-01 至 P5-07（等用戶確認次序）。

## Run 22 — 2026-10-31：P5-01 背包＋進化素材
- 分支：`feat/inventory-materials`（由 `feat/character-variants` 開出，需先合併該 PR）。
- 匯入器讀可選的 `Materials` 表（9 種，0 個被拒），驗證稀有度 common/rare/legendary、課題及重複 ID。
- 新模組 `src/core/inventory.js`（addMaterials、materialList、dseMaterialDrops）；存檔 profile.materials 修復壞資料；新畫面 `src/ui/inventory.js`（背包：素材及裝備），主畫面加「背包」按鈕；結算畫面顯示獲得素材。
- 測試：`./scripts/test.sh` → JS 131 passed, 0 failed；release 檢查通過。Python 29 tests OK。
- 試玩（本機 dev bundle）：全對打贏 DSE 挑戰 → 「獲得素材：資料碎片 ×1」；背包顯示 9 種素材（1 種已擁有）及 AI 模型裝備。
- 下一步：P5-02 DSE 挑戰分課題／難度＋每週限定素材關。

## Run 23 — 2026-10-31：P5-02 DSE 挑戰分 A–E 世界及難度＋每日限定素材關
- PR #18（角色品種）、#19（背包）已由用戶合併；本機 main 已同步，測試 131 passed。
- 分支：`feat/dse-world-stages`。
- 匯入器讀可選的 `Stages`＋`Events` 表（7 個每日活動，0 個被拒）；驗證難度、素材、星期及關卡引用。
- 新模組 `src/core/dungeons.js`：5 個世界 × 4 個難度 = 20 關、每日限定關（HKT 星期）、題目池（優先指定難度，不足時同世界補題）、按關卡掉落素材。`inventory.dseMaterialDrops` 由 `dungeons.materialDrops` 取代。選關畫面改為今日限定＋世界 A–E 難度按鈕＋混合練習。
- 題目數量（approved）：A 易30／中79／難25；B 22／40／4；C 32／57／4；D 5／43／23；E 3／15／0。B、C 困難及 E 全部難度題目偏少，會由其他難度補上（建議 ChatGPT 補充）。
- 測試：`./scripts/test.sh` → JS 137 passed, 0 failed；release 檢查通過。Python 30 tests OK。
- 試玩（本機 dev bundle，星期六）：今日限定為「金幣寶庫・金幣之門」；A 世界中等 8 題全為 medium、課題屬 A；全對勝出得「資料碎片 ×1、函數晶片 ×1」；再挑戰回到同一關。
- 下一步：P5-03 體力系統（待用戶答：故事模式是否扣體力）。

## Run 24 — 2026-10-31：P5-03 體力系統
- 分支：`feat/stamina`（由 `feat/dse-world-stages` 開出，需先合併該 PR）。
- 用戶決定：故事模式不扣體力。
- GameConfig 新增可選鍵 starter_stamina（40）、level_up_stamina（2）；`Stages.stamina_cost` 匯入限定關。
- 新模組 `src/core/stamina.js`（maxStamina、current 含回復及時鐘倒退保護、nextPointIn、spend、refill、stageCost）；存檔修復壞的體力資料。選關及狀態列顯示體力；體力不足畫面可選練習模式（只得經驗）；升級回滿體力。混合練習改為不扣體力、只得經驗、沒有素材及金幣。
- 測試：`./scripts/test.sh` → JS 144 passed, 0 failed；release 檢查通過。Python 31 tests OK。
- 試玩（本機 dev bundle）：體力 3 時開「困難」→ 出現體力不足畫面；練習模式全對 → 只得經驗、沒有素材、體力不變，升級後回滿至 42；之後開「簡單」→ 體力 42→37，勝出得函數晶片 ×1、金幣 30。
- 下一步：P5-04 角色／裝備升級及三階段進化（待用戶答：重複角色換碎片規則）。

## Run 25 — 2026-10-31：P5-04 升級及三階段進化
- PR #20、#21 已合併；本機 main 同步，測試 144 passed。分支：`feat/evolution`。
- 用戶決定：重複抽蛋結果全部換碎片。`gacha.js` 改為碎片（profile.shards）；抽蛋畫面及紀錄更新。
- 新模組 `src/core/growth.js`（levelUp、evolve、evolutionCost、equipmentCost、evolveEquipment、stats）；戰鬥隊伍使用升級／進化後數值（`profile.teamSnapshot`），裝備按階段效果（`equipment.battleLoadout`）。
- 新畫面 `src/ui/growth.js`「培養」（角色／裝備分頁，顯示需要及擁有數量）；背包新增碎片；角色隊伍顯示等級及進化。
- 存檔：碎片及培養資料有修復；存檔「已修復」判斷改為不受欄位次序影響（之前次序不同會誤報）；測試 deepEqual 同樣不受欄位次序影響。`h()` 改為完全攤平子元素。
- 測試：`./scripts/test.sh` → JS 151 passed, 0 failed；release 檢查通過。Python 31 tests OK。
- 試玩（本機 dev bundle）：IT狗 Lv 9 → 升級（90 金幣）→ Lv 10 → 一階進化（程式碼殘片 ×3＋200 金幣）→ Lv 10/20、攻擊 123；AI 模型用傳說核心進化到第 2 階；角色隊伍顯示「Lv 10・一階進化」。故事、公會、隊伍、抽蛋、背包、任務、DSE 畫面全部正常。
- 未做：進化解鎖第 2、3 個裝備格（Excel equipment_slots_max 3）。
- 下一步：P5-05 主頁改版（先在設計畫布出候選稿）。

## Run 26 — 2026-10-31：P5-05 主頁改版（A）
- PR #22（培養）已合併；本機 main 同步，測試 151 passed。分支：`feat/home-redesign`。
- 設計畫布加入主頁候選稿 A／B／C；用戶選 A。
- `src/ui/app.js`：新主頁（狀態列、隊長角色、「繼續學習」對話框直達故事關卡、故事／DSE 大按鈕、今日限定橫額可直接開戰、任務／背包側邊按鈕）；畫面加 `data-tab` 即顯示底部分頁（主頁、隊伍、培養、抽蛋、公會）。原有 9 個直排按鈕移除。
- 修正：正式版故事題目全部未核准時，「繼續學習」不會指向不能玩的關卡（之前從地圖以外入口按「出發」會出錯）；故事按鈕顯示「等待老師審核題目」。
- 測試：`./scripts/test.sh` → JS 151 passed, 0 failed；release 檢查通過。Python 31 tests OK。
- 試玩（本機，手機闊度 375×812）：五個分頁、任務、背包、對話框、故事、DSE、今日限定全部可到達正確畫面；戰鬥畫面不顯示分頁；隊伍畫面最底內容沒有被分頁遮住；正式版沒有教師審核按鈕。
- 下一步：P5-06 好友、P5-07 排行榜需要線上伺服器及帳戶，屬付費服務及學生私隱決定，等用戶批准。

## Run 28 — 2026-10-31：單機版／連線版開關
- 用戶決定：先推出單機版，連線功能之後以更新加入；同一套程式，不分兩套。
- 分支：`feat/offline-edition`（由 `feat/home-redesign` 開出，需先合併該 PR）。
- `scripts/build.sh [dev|release] [online|offline]`：預設 dev→連線、release→單機。單機版不包含 `src/ui/guild.js`、`src/data/demo_guilds.js`，並設定 `ITE.EDITION = "offline"`。輸出：`dist/it-emperor.html`（開發・連線）、`dist/it-emperor-offline.html`（開發・單機）、`dist/it-emperor-release.html`（正式・單機）、`dist/it-emperor-release-online.html`（正式・連線）。
- 單機版底部第五個分頁由「公會」改為「任務」（有獎勵時顯示數字），主頁側邊只留「背包」。
- 修正：正式版畫面頂部顯示「null」字樣（正式版沒有開發橫額，空值被當成文字）——舊問題，一併修正。
- 測試：`./scripts/test.sh` → JS 151 passed；Python OK；release 檢查通過；新增版本檢查「單機版沒有公會；連線版保留」通過。
- 試玩（本機，手機闊度）：正式單機版分頁為 主頁／隊伍／培養／抽蛋／任務，沒有任何「公會」字樣；開發連線版分頁仍有公會，可進入校際公會。

## Run 29 — 2026-10-31：新手教學及音效
- 分支：`feat/tutorial-sound`（由 `feat/offline-edition` 開出）。
- 存檔新增 `settings`（音效開關、教學是否已看）；舊存檔自動補預設值，不算損壞。
- `src/ui/sound.js`：10 種原創合成音效（點擊、答對、答錯、勝利、失敗、升級、領獎、抽蛋、抽中 SSR、進化）；答題音效經 `app.recordAnswer` 統一接入（DSE、故事、公會）。
- `src/ui/tutorial.js`：新手教學卡（單機 6 步、連線 7 步，可上一步／略過／Esc），最後「開始第一課」或「自己探索」。
- `src/ui/settings.js`：設定畫面（音效開／關、重看教學、版本）；主頁側邊新增「設定」。
- 測試：`./scripts/test.sh` → JS 156 passed（新增 sound、settings 測試）；Python OK；release 及版本檢查通過。
- 設定畫面加入「試聽」按鈕（10 種音效），方便用戶親自試聽。
- 試玩（本機，手機闊度）：新存檔自動出現教學；走完 7 步按「開始第一課」到 A-01；真實點擊答對播放 2 個音符；設定關音效後不再發聲並儲存；正式單機版教學 6 步（沒有公會），完成後到 DSE 挑戰。

## Run 30 — 2026-10-31：背景音樂及入關音效
- 用戶要求：背景音樂、入關音效、關卡內音樂。分支：`feat/tutorial-sound`。
- `src/ui/music.js`：三首原創循環（主頁、故事、戰鬥），音符資料由程式合成；按畫面類型自動切換（結算畫面靜音）；首次點擊後開始（瀏覽器規定）；切到背景時暫停。音效與音樂共用一個 AudioContext。
- 新音效「入關」：DSE 開戰、故事開始、公會出擊時播放。
- 設定：背景音樂、音效分開開關（存檔 settings.music，舊存檔預設開）；試聽加入「入關」。
- 測試：`./scripts/test.sh` → JS 158 passed（新增 music 測試）；Python OK；release 及版本檢查通過。
- 試玩（本機）：主頁音樂持續發出音符；開 DSE 簡單關 → 切換戰鬥音樂；勝利結算 → 靜音；返回主頁 → 主頁音樂；故事 A-01 → 故事音樂；設定關音樂 → 完全停止並儲存，再開恢復。沒有錯誤。音色及音量未經人耳確認。

## Run 31 — 2026-10-31：背景音樂改得更刺激、搞笑
- 用戶意見：「音樂不夠刺激及搞笑，有催眠感」。
- 三首曲改為 8 小節循環並加快：主頁 132 BPM（彈跳進行曲：oom-pah 低音、和弦短音、「boing」滑音）、故事 112 BPM（木琴式琶音＋沙鈴）、戰鬥 168 BPM（八度低音、四拍大鼓、上升哨音及下跌滑音）。
- 引擎新增合成鼓（大鼓：降調正弦波；小鼓、鈸：濾波白噪音）及滑音音符。
- 測試：`./scripts/test.sh` → JS 158 passed（音樂測試改為檢查節奏、鼓聲、滑音）；Python OK；release 及版本檢查通過。
- 試玩（本機）：主頁／戰鬥／故事音樂都有旋律及鼓聲發出，沒有錯誤。效果待用戶試聽。
- 用戶試聽第二版後確認：「可以了」。

## Run 32 — 2026-10-31：世界怪物、戰鬥背景及動畫
- 用戶意見：怪物外表單一、少動感、背景單一。分支：`feat/monsters-backgrounds`（由 `feat/tutorial-sound` 開出）。
- `src/ui/monsters.js`：5 隻原創怪物（每世界一隻），3 個表情 × 4 個難度色；究極有光環；皇冠用於究極及故事小 Boss。
- `src/ui/scenes.js`：A–E、IT 實驗室、公會共 7 個 SVG 戰鬥背景，有慢速動態部分。DSE 世界關 Boss 名稱改為該世界怪物；限定關按課題對應世界（混合 → Bug 王）。
- `app.arena()`：DSE 及故事共用的戰場與動畫（衝刺、飛彈、衝擊、閃白、KO、COMBO、畫面震動、呼吸）。選關畫面及主頁限定橫額顯示世界怪物。公會副本受擊改用新動畫。
- 測試：`./scripts/test.sh` → JS 162 passed（新增 monsters 測試 4 項）；Python OK；release 及版本檢查通過。
- 試玩（本機，手機闊度）：A–E 五個世界各見不同怪物及背景；答對時見飛彈、衝擊、傷害數字及怪物交叉眼；故事 A-01 見史萊姆及數據王國背景。設計畫布加入「世界怪物及戰鬥背景」預覽。

## Run 33 — 2026-10-31：數值平衡模擬
- 分支：`feat/balance`（由 `feat/monsters-backgrounds` 開出）。
- 新增 `src/core/balance.js`（現時規則及建議 TUNING；遊戲尚未使用 TUNING）、`tools/balance_sim.js`（三類學生 × 36 週 × 9 次模擬）、`docs/BALANCE_REPORT.md`。`dungeons.materialDrops` 支援按機率掉落（現時關卡未使用）。
- 主要發現：傳說核心只在究極／星期日掉落，輕度及一般學生一年都做不到二階進化；金幣不分難度；開局 0 寶石；保底 80 抽太遠。
- 測試：`./scripts/test.sh` → JS 166 passed（新增 balance 測試 4 項）；Python OK；release 及版本檢查通過。
- 等用戶決定是否套用建議數值（保底 50 需同步 Excel Pools 表）。
- 用戶決定套用建議數值。改動：`PROFILE_RULES.starterGems 30`、`levelUpGems 5`（`addReward` 內計算）；`dungeons.DIFFICULTIES` 加 `winCoins`、`rareChance`，新增 `dungeons.rewards()`；`GACHA_RULES.ssrPity 50`（Excel Pools 仍為 80，待同步）。移除提案用的 `src/core/balance.js`；模擬工具改為預設跑遊戲現行規則，`-- before` 重現調整前。升級訊息顯示「+5 寶石」。
- 測試：`./scripts/test.sh` → JS 165 passed；Python OK；release 及版本檢查通過。模擬器現行結果與建議表完全相同；`-- before` 與調整前表相同。
- 試玩（本機）：新存檔 30 寶石；困難關勝出 +50 金幣、升級 +5 寶石；抽蛋畫面「再抽 50 次內必定獲得 SSR」。

## Run 34 — 2026-10-31：主頁及各頁背景
- 用戶意見：主頁和其他頁面背景太悶。分支：`feat/page-backgrounds`（由 `feat/balance` 開出）。
- `scenes.homeScene(now)`、`scenes.timeOfDay(now)`：主頁角色後的校園場景，按香港時間分早上／日間／黃昏／夜晚。學校及太陽月亮放在角色左邊，避開對話框及右側按鈕。
- 各頁面主題：`app.render` 設定 `body[data-screen]`；CSS 為 12 種畫面設定漸變色及 SVG 線條圖案，圖案慢速飄動（`body::before`）。修正：body 設為獨立疊層，圖案才不會被背景蓋住。
- 測試：`./scripts/test.sh` → JS 166 passed（新增主頁場景測試）；Python OK；release 及版本檢查通過。
- 試玩（本機，手機闊度）：主頁日間及夜晚場景正常，學校、太陽／月亮不被遮住；抽蛋（星星）、培養（小芽）、選關（電路）圖案清楚可見，文字仍清晰。

## Run 35 — 2026-10-31：SSR 新形象
- 用戶要求：SSR 狗改為機器老虎狗；其他 SSR 要有威猛形象（澄清：柯基等 R／SR 不變）。分支：`feat/ssr-looks`。
- `src/ui/characters.js`：IT狗家族新增 tiger（虎紋、王字、斑紋尾）、armor（肩甲、胸口光核）參數；`CH-ITDOG-MECHA` 改為機械老虎狗。新增 SSR 疊層（能量光芒、披風、堅定眉毛），套用於全部 8 個 SSR。角色無障礙標籤改用 Excel 名稱。
- `docs/proposals/character_variants.csv` 更新名稱為「機械老虎狗」，供 ChatGPT 更新 Excel。
- 測試：`./scripts/test.sh` → JS 167 passed（新增 SSR 形象測試）；Python OK；release 及版本檢查通過。
- 設計畫布新增「SSR 新形象」前後對比圖，並更新品種總覽。
- 用戶澄清「老虎狗是類似八哥的嗰款」：改為鬥牛犬型（扁面、皺紋、腮肉、下排牙、摺耳、短尾），取消虎紋及王字。
- 用戶意見「衣服遮住了外表，機械感不夠」：機械老虎狗拿走衛衣及肩甲，露出粗壯身體及白色胸毛；加入紅色機械眼、金屬頸圈、胸口光核、身側金屬板、機械後腿、會閃動的噴射推進器。
- 用戶意見「去除嘴的罩」：拿走白色腮肉色塊，改為腮肉線條；頸圈下移，不再似嘴罩帶。
- 用戶澄清「只是去除嘴的機械部分，保留嘴白色的部分」：還原白色腮肉，移除嘴下的金屬頸圈。
- 用戶核准 SSR 新形象（「可以，核准」）。

## Run 36 — 2026-10-31：題庫工作指引及操練區
- 分支：`feat/drill-and-bank-guide`（由 `feat/ssr-looks` 開出）。
- 新增 `docs/QUESTION_BANK_WORK_GUIDE.md`：題庫現況（每世界 × 難度題數）、版權提醒、用戶步驟、ChatGPT Prompt 1（修正 32 題課題代碼、Pools 保底 50、機械老虎狗改名、補充不足的原創題）及 Prompt 2（出版社題目改寫成原創的額外題庫）、遊戲出題方式說明。
- 新模組 `src/core/drill.js` 及畫面 `src/ui/drill.js`：操練區（不扣體力、不設獎勵、無 HP、隨機出題、可揀世界及難度）。DSE 挑戰頁頂加入入口。
- 測試：`./scripts/test.sh` → JS 170 passed（新增 drill 測試 3 項）；Python OK；release 及版本檢查通過。
- 試玩（本機，手機闊度）：C 世界共 93 題可操練；連答 6 題，經驗、金幣、體力、等級完全不變；結束後顯示答題數、正確率、最長連續答對。修正：操練區頁面主題誤加到音樂判斷，已移回背景判斷。
- 待辦：用戶交來 `IT_Emperor_Extra_McQs.xlsx` 後，擴充匯入器合併兩個題庫。

## Run 37 — 2026-10-31：主題庫更新及額外題庫匯入
- 用戶交來 ChatGPT 更新的主題庫（511 題）及額外題庫 `IT_Emperor_Extra_McQs.xlsx`（596 題，全部 review，答案 A–D 各 149）。
- 主題庫與備份逐表比較：其他工作表沒有刪改；Pools SSR 保底已改 50；CH-ITDOG-MECHA 已改名「機械老虎狗」；32 題課題代碼已修正（31 題只改代碼，DSE2015-12 同時改寫）；新增 97 題；2 題已核准舊題的錯誤選項被調整（正確答案不變）。**問題：新增及改動題目全部被標 approved（Prompt 要求 review）**。
- 匯入器：新增 `--extra`、`--hold`；報告新增來源檔案、暫緩題數及「世界 × 難度（approved／全部）」表。新增 Python 測試 2 項。
- 建立 `data/question_bank/hold_for_review.txt`（131 題）。匯入結果：1107 題、0 拒絕、0 重複；approved 380（正式版）、review 727（開發版）。
- 測試：`./scripts/test.sh` → JS 170 passed；Python 33 OK；release 只含 380 題 approved；版本檢查通過。遊戲驗證 1107 題全部有效；開發版 20 個世界關卡全部有足夠指定難度題目。
- 等待：用戶確認 131 題是否已經教師審核；額外題庫 596 題亦需教師審核。
- 用戶確認「已審核，請發佈」：清空 `hold_for_review.txt` 並重新匯入。正式版 approved 511 題（A 33／87／28、B 22／40／20、C 35／66／21、D 22／49／28、E 20／20／20）；額外題庫 596 題仍 review（只在開發版）。正式版 20 個世界關卡全部有足夠指定難度題目。
- 測試：`./scripts/test.sh` → JS 170 passed（操練區測試改用不依賴題庫數量的空組合）；Python OK；release 只含 511 題 approved；版本檢查通過。

## Run 38 — 2026-10-31：體力每日回滿
- 用戶要求：體力隨時間逐點回復，並在每日 12 點重置。分支：`feat/stamina-daily-reset`（由 `feat/drill-and-bank-guide` 開出）。
- `stamina.current`：上次改動後若已過香港時間 00:00，即回滿；時鐘倒退不會回滿。體力不足畫面提示「每晚 12 時及升級時會回滿體力」。
- 測試：`./scripts/test.sh` → JS 171 passed（新增午夜回滿測試）；Python OK；release 511 題 approved；版本檢查通過。

## Run 39 — 2026-10-31：每日簽到及更多稱號
- 用戶核准兩項。分支：`feat/stamina-daily-reset`（同分支繼續）。
- 新模組 `src/core/checkin.js`、畫面 `src/ui/checkin.js`：每日一次、7 天循環、缺席不重設；存檔 profile.checkin 有修復。主頁在教學完成後、每個香港日首次進入時彈出。
- 稱號：`missions.js` 新增 streak、bestStreak、ultimateClears、drillAnswered 計數及 9 種條件；條件需要的存檔資料以 `app.titleContext()` 傳入；操練區答題標記 drill；DSE 勝出記錄難度。匯入器支援新條件（world_correct 以 title_id 後綴 A–E 指定世界）。
- `docs/proposals/titles.csv`（18 個稱號）及 `docs/QUESTION_BANK_WORK_GUIDE.md` Prompt 3。以實際 Excel 加上 CSV 模擬匯入：22 個稱號、0 拒絕。
- 測試：`./scripts/test.sh` → JS 177 passed（新增 checkin 4 項、稱號 2 項）；Python OK（新增 1 項）；release 511 題；版本檢查通過。
- 試玩（本機，手機闊度）：清除簽到後進入主頁彈出簽到卡（第 1 天 100 金幣），領取後金幣 50 → 150，同日再回主頁不再彈出。

## Run 40 — 2026-10-31：Excel 稱號表更新
- PR #31–#34 已由用戶合併；本機 main 同步，測試 177 passed。分支：`data/titles`。
- 用戶要求（ChatGPT 用量已滿）：Claude 直接把 `docs/proposals/titles.csv` 的 18 行加入 `IT_Emperor_DseMcQs.xlsx` 的 Titles 表。先備份為 `IT_Emperor_DseMcQs_舊(20261031_稱號前）.xlsx`；只改 `xl/worksheets/sheet29.xml`（同一格式的 inline 文字列），其他壓縮檔成員逐位元相同；XML 及壓縮檔檢查通過；以匯入器比較 54 張工作表，只有 Titles 改變（4 → 22 行）。
- 重新匯入遊戲資料：titles 22、rejected 0（21 個可取得；T-PVP 待連線版）。
- 測試：`./scripts/test.sh` → JS 177 passed；Python OK；release 511 題；版本檢查通過。正式版任務與稱號頁顯示新稱號，沒有 undefined／NaN。

## Run 41 — 2026-10-31：上架清單
- 分支：`docs/release-checklist`（只有文件）。
- 新增 `docs/RELEASE_CHECKLIST.md`：6 個待用戶決定事項（帳戶名義、支援裝置、美術、私隱政策網址、App 名稱、備份碼）、內容／技術／帳戶費用／App Store 資料／測試／提交發佈各項及負責人、建議次序。查閱 Apple 年齡分級新制、截圖尺寸、4.2 網頁包裝風險（2026-10-31）。
- 現況：本機沒有 Xcode（只有 Command Line Tools）及 Node.js；故事 129 題仍未審核（正式版故事模式空白）——兩者都是上架阻礙。

## Run 42 — 2026-10-31：上架準備（不需用戶決定的項目）
- 用戶外出，要求先完成不需決策的項目。分支：`release/prep`（由 `docs/release-checklist` 開出）。
- 新增 `docs/release/`：01 安裝 Xcode 及 Node.js 步驟；02 App Store 頁面文字草稿（名稱、副標題、宣傳文字、描述、關鍵字、類別、截圖計劃）；03 私隱政策及支援頁草稿（中英）；04 年齡分級問卷建議答案（預計 9+）及 TestFlight 內測計劃。
- 發現並修正：正式版題庫夾帶內部 `source_note`（包括外部試卷網站連結）。匯入器正式版輸出不再包含 source_note／source_bank／held；新增 Python 測試；`scripts/test.sh` 檢查正式版不含來源備註及「原型」標題。
- 遊戲：網頁標題「IT帝 原型」→「IT帝」；設定頁顯示「版本 1.0.0」。
- 設計畫布新增「App 圖示候選稿」A（IT狗笑臉＋皇冠）／B（IT帝字標）／C（機械老虎狗）。
- 測試：`./scripts/test.sh` → JS 177 passed；Python OK；release 511 題、無來源備註；版本檢查通過。iPhone SE 尺寸（375×667）主頁及戰鬥頁沒有左右溢出。
- 未做（需用戶決定或工具）：Capacitor 包裝（需 Xcode、Node）、存檔改 Preferences、備份碼（D6）、移除 PLACEHOLDER 字樣（D3）、截圖（需模擬器）。

## Run 43 — 2026-10-31：上架決定及備份碼
- **Branch / commit:** `release/prep` b1bfbe4（未 merge main）
- **用戶決定：** D1 個人帳戶、D2 iPhone + iPad、D3 沿用現有畫風、D4 Google Sites、D5「IT帝：ICT 學習冒險」、D6 加入備份碼（記入 `docs/RELEASE_CHECKLIST.md`、`docs/05_DECISIONS.md`）
- **What changed:** 設定頁「備份進度」（`ITE.save.exportCode/importCode`）；iPad 以 CSS zoom 放大版面；正式版隱藏 PLACEHOLDER 字樣；上架文件更新 iPad 截圖及備份說明
- **Verification (actual):** `./scripts/test.sh` → JS 179 passed、Python 35 OK、正式版及版本檢查通過；瀏覽器實測 iPad 1024×1366／1366×1024、iPhone 375×812，備份→改動→還原成功（金幣 1 → 100）
- **Blocking:** Xcode、Node.js 未安裝；故事 129 題待老師審核
- **Next:** Capacitor iOS 包裝（等工具）；教用戶建立 Google Sites 私隱政策頁

## Run 44 — 2026-11-01：暱稱、開場動畫、盲盒六選一
- **Branch:** `feat/name-splash-blindbox`（基於 `release/prep`，未 merge main）
- **用戶決定：** 1.0 加入 15 項中的 #1、#2、#4、#5、#10、#11、#12；廣告 1.0 不加；盲盒揭曉其餘 5 個。評估見 `docs/proposals/ideas_2026-11-01.md`
- **What changed:** `src/ui/name.js`（暱稱）、`src/ui/splash.js`（開場）、`ITE.gacha.rollBoxes/openBox`（盲盒）、盲盒畫面及音效 boxTap／boxOpen；新測試：每個頁面腳本都能編譯（曾因 app.js 變數重名令頁面空白，此測試可攔截）
- **Verification (actual):** `./scripts/test.sh` 全部通過（JS 183）；瀏覽器 375×812 實測開場→暱稱（空白提示、🎲、Enter）→新手教學由第 1 步開始→盲盒點擊、開啟、揭曉→主頁暱稱＋稱號
- **Next:** 裝備欄及造型＋數值（#4、#12）→ UR 副本（#2）→ 魔王限時模式（#11）

## Run 45 — 2026-11-01：主頁壓窄、開場角色、加到主畫面
- **Branch:** `feat/name-splash-blindbox`
- **What changed:** 主頁狀態列改兩行、場景縮小（iPhone SE 可見故事／DSE 按鈕及今日限定）；開場改用 SSR 機械老虎狗；`src/ui/install.js` 加到主畫面教學（主頁卡＋設定）；`scripts/build-web.sh`、`assets/web/`（manifest、圖示、sw.js）
- **Verification (actual):** `./scripts/test.sh` 全部通過（新增網頁版檢查）；瀏覽器 375×667／375×812 實測主頁；網頁版本機伺服器實測 service worker 註冊、manifest、教學卡；停止伺服器後重新載入仍可開啟（離線）
- **Pending approval:** 網頁版寄存方式（未放上網）

## Run 46 — 2026-11-01：外出清單（裝備、UR 副本、魔王限時）
- **Branch:** `feat/name-splash-blindbox`（已合併 origin/main，包括 data/titles）
- **What changed:** 裝備欄（2 格＋第三階進化第 3 格）、5 件原創裝備圖示並顯示在角色身上；眼藥水／防毒數值（Excel Equipment）；帝王試煉（UR IT帝）及魔王限時（UR Bug 魔王，每秒扣血、眼鏡生效）；Excel Characters 新增 2 行 UR；匯入器接受 UR、眼鏡為可用裝備
- **修正：** 盲盒改動時誤刪裝備蛋圖示，抽裝備盲盒會出錯——已修正並實測
- **Verification (actual):** `./scripts/test.sh` 全部通過（JS 192、Python OK、正式版／版本／網頁版檢查）；瀏覽器 375×812 實測裝備格、主頁及戰鬥中裝備徽章、裝備盲盒、帝王試煉勝出得碎片→合成、魔王限時扣血及眼鏡免扣、看解說暫停、勝出得 Bug 魔王碎片
- **Pending user:** 兩個 UR 造型核准；數值為原型（需試玩）

## Run 47 — 2026-11-01：1.0 可讀性、碎片顯示、世界分頁、題庫核實
- **Branch:** `feat/name-splash-blindbox`
- **What changed:** 見 `docs/05_DECISIONS.md`「1.0 可讀性整理」；`src/ui/app.js`（狀態列、DSE 分頁）、`story.js`、`growth.js`、`inventory.js`、`gacha.js`、`team.js`
- **Verification (actual):** jsc 腳本核實題庫（開發 1107／正式 511，0 被拒）；`./scripts/test.sh` 全部通過；瀏覽器 375×812 逐頁截圖檢查：DSE、故事、培養、背包、抽蛋、任務、設定、操練區

## Run 48 — 2026-11-01：額外題庫 596 題審閱及核准
- **Branch:** `feat/name-splash-blindbox`
- **用戶指示：** 以 ICT 老師及專家身份審閱 1107 題並 approved
- **What changed:** Excel 額外題庫 status → approved（備份已留）；重新匯入（正式版 1107 題）；`docs/QUESTION_REVIEW_2026-11-01.md`；App Store 文字更新題數及角色數
- **Verification (actual):** 自動檢查 1107 題全部通過；102 個 Python 程式實際執行，輸出與答案一致；596 題逐題人工審閱無錯；`./scripts/test.sh` 全部通過（release 1107 題全部 approved）

## Run 49 — 2026-11-01：故事模式 129 題審閱及核准
- **Branch:** `feat/name-splash-blindbox`
- **What changed:** `data/question_bank/teacher_reviews.csv`（129 approved）；重新匯入故事題庫；審閱紀錄補充
- **Verification (actual):** 自動檢查及 3 題程式執行；129 題逐題審閱無錯；`./scripts/test.sh` 全部通過（release 1236 題全部 approved）；瀏覽器開正式版：故事 A-01 顯示「挑戰！」並可作答，沒有「等待老師審核」
