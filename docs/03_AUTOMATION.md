# Claude Code AI Agency / scheduling runbook

## 重要
AI subagents 只是專職分工，**不會自動排程**。要在 Claude Code 帳戶設定 Cloud Routine／`/schedule`，或使用 GitHub Actions + 明確授權。以下是建議排程提示，不是本 ZIP 已實際建立的排程。

## 建議三個 Cloud Routines（需使用者自行啟用）

### Routine A: 開發（每個工作日 09:00，時區 Asia/Hong_Kong）
Repo: private it-emperor-claude
Prompt:
「讀取 CLAUDE.md、docs/02_ROADMAP.md 和 docs/PROGRESS.md。挑選一個符合依賴條件的最高優先、沒有阻塞的未完成任務。委派必要 subagents，於 feature branch 實作一個小型可驗證改動，運行測試、整理結果，建立 draft PR；不得 merge main、不得部署或支付費用。更新 docs/PROGRESS.md。若無法安全執行則報告 blocker 而不亂改。」

### Routine B: QA（每個工作日 17:00，時區 Asia/Hong_Kong）
Prompt:
「審閱當日新 PR 與變更，進行靜態分析及可用的自動測試，檢查安全、題庫 schema、UI 破損和測試覆蓋；只產生審查意見或可隔離的修正 PR；失敗要列為 blocker，不可自動合併。」

### Routine C: 每週簡報（每星期五 18:00，時區 Asia/Hong_Kong）
Prompt:
「以實際 commit、PR 和測試日誌產出本週已完成／未完成／風險／需老師決定／下週三項重點，更新 docs/PROGRESS.md。不誇稱未驗證功能。」

## 啟動驗證
1. 確認帳戶中有 `/schedule` 或 Cloud Routines 功能，並連接 Private GitHub repo。
2. 逐一新增例行工作並選擇正確時區。首次使用單次手動執行，確認能讀取 repo、建立 draft PR、更新紀錄。
3. 核對排程確實顯示啟用及下一個執行時間；僅有 prompt 檔案不算已啟用。
4. 設置 token/費用上限、並發限制 1–2、每回合任務數 1、失敗最多重試一次、PR 自動測試。
5. 完成後每星期由人檢查 demo；不可將定時運行等同「保證自動交付 App」。

## 本地替代方案
`/loop` 在 Claude Code 本地端短期重複運行，**不是**長期雲端排程，不能當作關機後每日自主開發替代品。

## 人類批准關卡
- 付費 API／雲服務開通、正式資料庫、帳戶登入、未成年人資料、抽蛋付費、公開部署、上架、merge main。
