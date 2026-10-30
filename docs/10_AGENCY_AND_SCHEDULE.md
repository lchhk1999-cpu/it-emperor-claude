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

## 每日雲端排程 — 狀態：已啟用並驗證（2026-10-30）
| Routine | ID | Cron (UTC) | 香港時間 | 模型 |
|---|---|---|---|---|
| A 每日開發 | `trig_015JRd1k1BsGiVbG3srjT6RB` | `0 1 * * 1-5` | 平日 09:00 | claude-sonnet-5-5 |
| B 每日 QA | `trig_011mjbXSaPeForD8h18mThmL` | `0 9 * * 1-5` | 平日 17:00 | claude-sonnet-5-5 |
| C 每週簡報 | `trig_017QNYYBkJZNi38JtNVTf4XM` | `0 10 * * 5` | 週五 18:00 | claude-sonnet-5-5 |

管理／停用：https://claude.ai/code/routines　環境：Default（anthropic_cloud）
在 `main` 合併原型前，Routine A／C 以 `feat/p1-boss-battle-prototype` 為基底並以它為 PR 目標。

- [x] 1. 安裝 Apple Command Line Tools（免費，提供 git）
- [x] 2. 建立本機 git repo、初始 commit
- [x] 3. 用戶建立 Private repo `lchhk1999-cpu/it-emperor-claude`，並把 GitHub 連接到 Claude
- [x] 4. push `main` 與 feature branch
- [x] 5. 用 RemoteTrigger 建立 Routine A／B／C
- [x] 6. 手動試跑 Routine A（session `cse_01WTembLaC6w4VAHqfeCum1C`，78 秒）：讀 repo ✓、Node 跑測試 40 passed ✓、開 draft PR #2 ✓、更新 PROGRESS ✓；本機以 jsc 重跑該分支亦 40 passed
- [x] 7. 三個 Routine 均顯示 enabled 及下次執行時間
- [x] 8. 限制寫入 prompt：每回合 1 個任務、失敗最多重試 1 次、不得 merge／部署／付費
> 注意：雲端環境同樣沒有 Xcode；iOS 模擬器測試需在本機或另行設定 macOS CI（可能涉及費用，需批准）。
