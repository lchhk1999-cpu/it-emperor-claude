# Phase 0–2 任務清單、依賴與驗收準則

狀態：`TODO` / `DOING` / `DONE` / `BLOCKED`。每項完成必須附實際測試指令與結果（寫入 `docs/PROGRESS.md`）。

| ID | 任務 | 負責 Agent | 依賴 | 驗收準則 | 狀態 |
|---|---|---|---|---|---|
| P0-01 | 技術棧 ADR | architect | — | `docs/adr/ADR-0001` 有候選比較、成本、風險；用戶確認 | DONE（用戶 2026-10-30 批准） |
| P0-02a | 本機 git repo + .gitignore | coordinator | 安裝 Command Line Tools | `git log` 有初始 commit；無密鑰 | DONE（2026-10-30） |
| P0-02b | Private GitHub repo + draft PR 流程 | coordinator | P0-02a、用戶建立 repo | 可 push feature branch、開 draft PR | DONE（2026-10-30：lchhk1999-cpu/it-emperor-claude；PR #1–#5 已合併） |
| P0-03 | 測試框架 | gameplay-engineer | — | `jsc tests/run.js` 全部通過；之後換 Vitest | DONE（jsc 版） |
| P0-04 | Node 工具鏈（TS / lint / formatter / secret scan / CI） | architect | 安裝 Node | CI 在 PR 上自動跑測試 | BLOCKED |
| P1-01 | 主畫面 + 單一關卡 | ui-art-engineer | P0-03 | 可從主畫面進入關卡選擇再進戰鬥 | DONE（原型） |
| P1-02 | Boss 四選一戰鬥、傷害、解說、勝敗結算 | gameplay-engineer | P0-03 | 單元測試覆蓋答對傷害、答錯受傷、勝／敗、重複作答保護；可完整玩一局 | DONE（原型） |
| P1-03 | 原創佔位 UI / 角色，手機尺寸可用 | ui-art-engineer | P1-01 | 375px 寬無橫向捲動；按鈕 ≥44px；標示 PLACEHOLDER | DONE（原型） |
| P1-04 | 存檔：中途退出重入不破壞資料 | gameplay-engineer | P1-02 | 測試：存檔往返、損壞存檔回退預設、版本不符處理；可「繼續戰鬥」 | DONE（原型） |
| P1-05 | iOS 模擬器運行 | architect | 安裝 Xcode、ADR 確認 | Capacitor 包裝在模擬器啟動 | BLOCKED |
| P1-06 | Art Bible + 3 張 mockup | ui-art-engineer | 用戶提供參考圖 | 用戶核准 | DONE（2026-10-30：用戶選 A Q 版 2.5 頭身） |
| P1-07 | 把 Art Bible 套用到遊戲畫面（配色、Q 版主角／Boss、按鈕、表情） | ui-art-engineer | P1-06 | 現有主畫面、戰鬥、結算、公會畫面改用 Art Bible；375px 可用；仍標 PLACEHOLDER 直至正式美術 | DONE（2026-10-30：Q 版主角／Bug 王／公會 Boss 連表情、Art Bible 配色及按鈕） |
| P2-01 | Excel schema mapping | question-import-engineer | 取得 ChatGPT Excel | 對照真實活頁簿欄名的 mapping 文件 | DONE（2026-10-30，`tools/import_question_bank.py` COLUMN_MAP） |
| P2-02 | `Questions` 匯入器 + 報告 | question-import-engineer | P2-01 | 成功／拒絕／重複／Topic 數／checksum 報告；公式保留文字 | DONE（2026-10-30：414 題 → 382 匯入、32 拒絕） |
| P2-03 | 發佈模式只載 approved | question-import-engineer | — | 測試：release 模式過濾非 approved；release 打包不含非 approved 題 | DONE（core + 打包檢查） |
| P2-04 | 抽題覆蓋率、防重複 | gameplay-engineer | — | 測試：無重複、可按 Topic 篩選 | DONE（core 基本版） |
| P3-05 | 公會副本 demo（玩家自建公會、共享 Boss、每日 1 次限時作答、週結攻擊總量） | guild-systems-designer | P1 完成 | 規則依 docs/07「用戶確認的公會規則」；只用虛構資料；數值標 PLACEHOLDER | DONE（單機示範，2026-10-30）：加入／建立公會、公會首頁、限時副本、結算；多人共享需後端（P4，待批准） |
| P3-06 | 單機故事模式（Story_Questions 129 題、43 關） | gameplay-engineer + question-import-engineer | P2-02 | 只讀 Story_Questions；按 level_id 配對；練習抽題＋小 Boss；答對攻擊、答錯中文解說並稍後重答；過關解鎖下一關；本機存檔；離線可玩；教師審核後才進正式版 | DONE（2026-10-30：A-01–A-03，PR #5） |
| P3-07 | 開放故事模式其餘 40 關（開發版） | gameplay-engineer | P3-06 | 每次開放一個世界：把關卡 ID 加入 `STORY_RULES.enabledLevels`；為該世界每關寫自動測試（可過關、解鎖次序）；正式版自動只顯示 approved 題，**不需等教師審核**；不得改動題目內容或 review_status | DONE（2026-10-30：5 個世界共 43 關已在開發版開放並逐關試玩；正式版待教師審核故事題目） |
| P3-01 | 經驗值、等級、金幣、過關獎勵 | gameplay-engineer | — | DSE 挑戰及故事過關有獎勵；輸了亦按答對題數得經驗；可一次升多級；存檔保存 | DONE（2026-10-30，PROTOTYPE 數值） |
| P3-02 | 角色與隊伍（最多 5 人，按等級解鎖） | gameplay-engineer + ui-art-engineer | P3-01 | 角色資料來自 Excel `Characters`；專長課題加傷；只用於 DSE 挑戰；故事及公會不受影響 | DONE（2026-10-30，角色暫時全部可用） |
| P3-08 | 每日／每週任務＋稱號 | gameplay-engineer | P3-01 | 資料來自 Excel `Missions`、`Titles`（匯入器驗證）；按香港時間每日／每週重置；任務獎勵寶石／金幣；稱號可在主畫面顯示；只用暱稱 | DONE（2026-10-30：3 個任務、3 個稱號可用；2 個任務及 1 個稱號待相關功能，顯示「即將開放」） |
| P3-09 | 裝備（5 類、最多 3 格） | gameplay-engineer | P3-02 | 資料來自 Excel `Equipment`；只用於 DSE 挑戰；校際公會禁用（GameConfig pvp_stats_normalized=1）；AI 提示只刪去錯誤選項，不直接給答案 | DONE（2026-10-30：4 件可用、眼鏡待限時戰鬥；每位隊員 1 格，進化未做） |
| P4-03 | 抽蛋（角色／裝備兩池） | gameplay-engineer | P3-08 | 只用遊戲內免費寶石（GameConfig gacha_paid_enabled=0）；遊戲內公開機率；保底規則；需用戶批准設計後才實作 | DONE（2026-10-30：用戶批准設計；角色池按 Excel 機率及保底；裝備池暫為平均機率，待 Excel 補稀有度） |
| P4-06 | 角色品種（31 個）接入遊戲 | gameplay-engineer + ui-art-engineer | ChatGPT 把 `docs/proposals/character_variants.csv` 加入 Excel | 匯入器讀 family 欄；角色隊伍及抽蛋按系列顯示；機率表列出全部品種；測試及試玩 | DONE 2026-10-31（Excel 已更新，31 個角色匯入） |
| P5-01 | 背包＋進化素材（Excel `Materials`） | gameplay-engineer | — | 素材可存取、背包畫面、存檔修復 | DONE 2026-10-31（暫定掉落：DSE 挑戰勝出得 1 個課題素材，P5-02 改為按關卡掉落） |
| P5-02 | DSE 挑戰分課題（A–E）及難度（簡單／中等／困難／究極）＋每週限定素材關（Excel `Stages`／`Events`） | gameplay-engineer + content-pipeline | P5-01 | 每關掉落素材；限定關掉落較多 | DONE 2026-10-31（PROTOTYPE 數值；全部關卡開放，未設解鎖條件） |
| P5-03 | 體力系統（Excel `Stages.stamina_cost`） | gameplay-engineer | P5-02 | 體力上限、回復時間、故事模式是否免體力 | DONE 2026-10-31（故事模式及公會不扣體力） |
| P5-04 | 角色／裝備升級及三階段進化；第三階段需重複角色分解碎片 | gameplay-engineer | P5-01 | 重複角色／裝備全部換碎片（用戶 2026-10-31 決定） | DONE 2026-10-31（PROTOTYPE 數值；裝備格數 3 格未做） |
| P5-05 | 主頁改版（原創設計，參考手機 RPG 常見佈局，不複製 P&D 介面） | ui-art-engineer | — | 用戶選用 A（2026-10-31） | DONE 2026-10-31 |
| P5-06 | 好友系統（好友支援角色） | backend（未建立） | 線上後端 | 需要伺服器及帳戶，屬付費服務及學生私隱決定 | NEEDS APPROVAL |
| P5-07 | 排行榜（前 100 名、每月重置） | backend（未建立） | 線上後端 | `docs/05` 已列 OPEN_DECISION：學生資料、作弊、成本 | NEEDS APPROVAL |

## 優先次序（下一步）
1. 用戶：安裝 Command Line Tools（解鎖 git、Python）→ P0-02a。
2. 用戶：提供 ChatGPT Excel → P2-01 / P2-02。
3. 用戶：放入參考圖 → P1-06。
4. 若以上未到：做 P2-02 匯入器的 CSV/JSON 中介格式與驗證報告、P3-05 公會 demo 規格。

## 需要用戶決定（排程不可自行處理）
- `STORY-A-02-02`「資料驗證」與 DSE 題庫「數據核對」用詞
- `STORY-C-01-01` 錯誤選項「PAN 全球網絡」把 PAN（個人區域網絡）說成全球網絡，可能令學生記錯，建議老師審核時修改
- 公會數值（時限、Boss 血量、人數上限）
- 32 題 DSE 題目課題代碼修正（由 ChatGPT 改 Excel）
- Excel `Equipment` 表補上稀有度欄（裝備池才可按 R/SR/SSR 機率）
