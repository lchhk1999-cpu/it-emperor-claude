# 《IT帝》Claude Code 全新開發啟動套裝

## 定位
這是**由零重新開發**的 Claude Code 專案，不是 Codex 程式碼移植。**遊戲需求延續，程式碼不依賴舊 Codex**。

本套裝根據使用者最初企劃及後續已知決定**重構為交接規格**，並非逐字原始聊天記錄；凡未確認規則均列作 `OPEN_DECISION`。

## 使用方式
1. 在電腦建立新的 Private GitHub Repository（例如 `it-emperor-claude`），將本 ZIP 解壓至專案根目錄並提交。不要把 API keys、憑證放入 repository。
2. 在 Claude Desktop 的 Code 分頁開啟該專案，或以 Claude Code CLI 開啟專案。
3. 把 `docs/01_MASTER_PROMPT.md` 完整貼入 Claude Code 第一次對話。
4. 要求 Claude 先完成架構決策記錄 (ADR)、最小可玩原型及測試，再逐一實作。
5. 若 Claude Code 帳戶提供雲端 Routines／`/schedule`，依 `docs/03_AUTOMATION.md` 建立每日例行工作；設定好之前**不會自動運行**。
6. 如需工作完全自動化，必須連結 repo、授權排程、處理帳戶額度與權限；有些雲端任務可能因資源／權限／測試限制而中斷。嚴禁自動發布 App 或使用付費 API。
7. 遊戲題庫由 ChatGPT 獨立維護；每次取得新的經審核 Excel 才手動交付或設立明確的同步流程。**Claude 不自行重造／改寫 DSE 題庫作正式發布**。

## 文件導覽
- `docs/00_ORIGINAL_INTENT.md` 最初意圖重構及確認／待定分野
- `docs/01_MASTER_PROMPT.md` 貼給 Claude 的完整啟動指令
- `docs/02_ROADMAP.md` 階段、完成條件和第一批任務
- `docs/03_AUTOMATION.md` 自動排程＋AI Agency 規則
- `docs/04_QUESTION_BANK_CONTRACT.md` ChatGPT Excel → Claude 匯入契約
- `CLAUDE.md` 常駐執行指引
- `.claude/agents/*.md` 不同職責的專業 AI Subagents
- `docs/05_DECISIONS.md` 決策及待定項目

## v2 增補
- `docs/06_ART_DIRECTION.md` 美術風格文字規格；**原設計圖未附**，圖片放 `assets/style_references/`。
- `docs/07_SCHOOL_GUILD_BATTLE.md` 新增學校公會／校際對戰設計。
- `docs/08_CLAUDE_CLICK_BY_CLICK.md` 打開 Claude Desktop Code 的逐步指引。
