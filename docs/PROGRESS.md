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
