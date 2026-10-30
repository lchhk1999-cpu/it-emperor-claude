# Phase 0–2 任務清單、依賴與驗收準則

狀態：`TODO` / `DOING` / `DONE` / `BLOCKED`。每項完成必須附實際測試指令與結果（寫入 `docs/PROGRESS.md`）。

| ID | 任務 | 負責 Agent | 依賴 | 驗收準則 | 狀態 |
|---|---|---|---|---|---|
| P0-01 | 技術棧 ADR | architect | — | `docs/adr/ADR-0001` 有候選比較、成本、風險；用戶確認 | DONE（用戶 2026-10-30 批准） |
| P0-02a | 本機 git repo + .gitignore | coordinator | 安裝 Command Line Tools | `git log` 有初始 commit；無密鑰 | DONE（2026-10-30） |
| P0-02b | Private GitHub repo + draft PR 流程 | coordinator | P0-02a、用戶建立 repo | 可 push feature branch、開 draft PR | BLOCKED（等用戶建立 repo） |
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

## 優先次序（下一步）
1. 用戶：安裝 Command Line Tools（解鎖 git、Python）→ P0-02a。
2. 用戶：提供 ChatGPT Excel → P2-01 / P2-02。
3. 用戶：放入參考圖 → P1-06。
4. 若以上未到：做 P2-02 匯入器的 CSV/JSON 中介格式與驗證報告、P3-05 公會 demo 規格。
