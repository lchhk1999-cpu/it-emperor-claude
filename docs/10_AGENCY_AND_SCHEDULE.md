# AI Agency 分工與每日排程部署清單

## 七個 Agents（`.claude/agents/`）與職責
| Agent | 本專案職責 | 第一輪實際使用 |
|---|---|---|
| Coordinator（主會話） | 排序 backlog、分派、合併結果、寫 PROGRESS | 是 |
| architect | ADR、技術棧、存檔與線上擴展架構 | ADR-0001 由 coordinator 起草，待用戶確認 |
| product-designer | 驗收準則、學習 UX、平衡草案、決策紀錄 | 驗收準則已寫入 `09_BACKLOG.md` |
| gameplay-engineer | 戰鬥、HP、勝負、隊伍 | `src/core/battle.js` + 測試 |
| ui-art-engineer | 繁中手機畫面、原創佔位 Q 版 | `src/ui/*`（佔位） |
| question-import-engineer | Excel `Questions` 匯入、驗證、approved 閘門 | `src/core/questions.js` 驗證器；真匯入器等 Excel |
| qa-security-reviewer | 獨立審查、測試、私隱、密鑰 | 已對本輪程式獨立審查 |
| guild-systems-designer | 校際公會規則、公平性、保護未成年人 | Phase 2 後啟動（P3-05） |

## 每個 PR 的三道關卡
1. Implementer：完成功能 + 測試，`./scripts/test.sh` 全通過。
2. Reviewer：qa-security-reviewer 審查，BLOCKER 必須清零。
3. Test-verifier：Coordinator 親自重跑測試並在 PROGRESS 記錄**真實輸出**。

## 每日雲端排程 — 啟用前清單（目前狀態：NOT CONFIGURED）
雲端 Routine 只能操作 GitHub 上的 repo，所以必須依序完成：
- [x] 1. 安裝 Apple Command Line Tools（免費，提供 git）
- [x] 2. 建立本機 git repo、初始 commit
- [ ] 3. 用戶在 GitHub 建立 **Private** repo（例如 `it-emperor-claude`），並授權 Claude 連接
- [ ] 4. push `main` 與 feature branch
- [ ] 5. 用 `/schedule` 建立 `docs/03_AUTOMATION.md` 的 Routine A（開發，平日 09:00 HKT）、B（QA，17:00）、C（週報，週五 18:00）
- [ ] 6. 手動試跑一次，確認能讀 repo、開 draft PR、更新 PROGRESS
- [ ] 7. 核對 Routine 顯示「已啟用」及下次執行時間，才可記錄為已啟用
- [ ] 8. 限制：每回合 1 個任務、失敗最多重試 1 次、不得 merge main／部署／付費

> 注意：雲端環境同樣沒有 Xcode；iOS 模擬器測試需在本機或另行設定 macOS CI（可能涉及費用，需批准）。
