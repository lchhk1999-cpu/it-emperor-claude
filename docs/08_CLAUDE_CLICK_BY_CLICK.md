# 安裝與啟動（Windows / Mac）
1. 把 ZIP 下載至電腦並**解壓**到 `IT-Emperor-Claude`，不是在聊天上傳 ZIP。
2. 原來 ChatGPT 裏兩張畫風參考圖如仍有檔案，放 `assets/style_references/`。
3. 安裝 Claude Desktop：https://claude.com/download，登入帳號，在上方選 **Code**，不要選一般 Chat。
4. 新建 Code session：環境選 **Local**，Project Folder 選解壓後含 `CLAUDE.md` 的最外層 `IT-Emperor-Claude`。
5. 第一次用建議 **Plan** 或較保守的需核准權限模式，先讓 Claude 確認讀到 `docs/`、`.claude/agents/` 和圖片。
6. 發訊息：「請先讀 CLAUDE.md、docs/00_ORIGINAL_INTENT.md、docs/06_ART_DIRECTION.md、docs/07_SCHOOL_GUILD_BATTLE.md、docs/01_MASTER_PROMPT.md，逐項報告你理解的遊戲原意，畫風圖是否已存在，然後建立第一階段可執行原型。不要假稱自動排程已啟動。」
7. 當專案已建立且可測試，再連接 private GitHub repo；在可使用 `/schedule` 的 Claude Code 會話中設定 Routine，並核實啟用狀態及下一次執行時間。
8. 真正的 Excel 題庫由 ChatGPT 管理；先匯入測試資料，正式上線僅可用 approved 題。

如果 Code 分頁不能選 Local，先更新 Desktop 或查看官方 Code 文件；可改用已安裝的 Claude Code CLI 於專案根目錄執行 `claude`。
