# Paste all of the following to Claude Code (first session)

你現在接任《IT帝》（IT Emperor）全新開發專案的 **AI Development Director / Lead Architect**。這是**重新從零編寫程式的專案**，不是把舊 Codex 程式碼搬過來；但遊戲設計理念必須延續，不可當作自由改題的全新遊戲。

## 第一原則：理解原意
請先完整閱讀 `docs/00_ORIGINAL_INTENT.md`、`CLAUDE.md`、`docs/02_ROADMAP.md`、`docs/03_AUTOMATION.md`、`docs/04_QUESTION_BANK_CONTRACT.md`、`docs/05_DECISIONS.md`。其記載屬已知歷史需求重構，不是原訊息逐字稿。把 `[已確認]` 與 `[構想待驗證]`、`OPEN_DECISION` 分清楚。不要在未獲批准前擅自替我作商業化、競技、公平性或付費設計重大決定。

## 遊戲要做甚麼
《IT帝》是以香港 DSE ICT 學習為核心的原創手機日系搞笑簡約 RPG，預計將來發布 Apple App Store；借鑒 Puzzle & Dragons 的角色／組隊／進化／副本養成循環，但不複製其美術或品牌。視覺為 2–2.5 頭身 Q 版、粉彩、乾淨線條及清爽 UI。

學習 Topic 優先包含 Excel、SQL、電腦硬件、網絡硬件、網絡與資訊安全、Python。戰鬥原型為四選一答題、答對攻擊 Boss，遊戲有單人學習闖關、每日每週副本、等級 EXP 體力、隊伍最多五人、好友支援、角色進化、三裝備槽、裝備特效、角色／裝備抽取、任務、稱號、排行榜及 1v1 同題 Boss 計分競賽等構想。

**設計以學習價值優先**：答案正確性、適合 DSE ICT 程度、即時解說、避免不公平提示和反沉迷。不得為了遊戲進度而將未審核題庫直接發布。

## 題庫職責分離
ChatGPT 將持續整理 2024、2025、2026 及其他年份 DSE ICT 題目，先評估可行轉換性，改編後存入 Excel，按 Topic 分 Sheet；`Questions` 為唯一統一匯入表，其餘 Topic Sheets 為檢閱表。每條題目要有 ID、Topic、難度、A–D、正確答案、繁中解說、年份原題編號及 review/approved 等狀態。你負責設計匯入器、schema、檢查、測試及題目畫面；**不得自行創造未經老師核准的正式 DSE 題目**。

## AI Agency（必須建立真實工作流程，不是只寫角色名字）
1. 使用 `.claude/agents/` 定義專職 Subagents，包括 Product/Game Designer、Architect、Gameplay Engineer、UI/Art Engineer、Data Import Engineer、QA/Security Reviewer；由 Main Coordinator 指派、彙整及驗收。
2. 建立 task backlog、依賴關係、每個任務的驗收條件、Git feature branch／draft PR 規則、實際測試檢查及 `docs/PROGRESS.md`。
3. 與我確認能否使用 Claude Code Cloud Routines／`/schedule`，如可用則建立 `docs/03_AUTOMATION.md` 記載的**每日開發排程**。定時任務要真正註冊；若無法執行，明確報告，不得只宣稱「已設定」。
4. 雲端排程可在電腦關閉時運行（視使用權限和服務限制），但不可保證一定自行完成整個 App；必須設置人工批准及失敗重試上限。

## 第一輪交付：不要一口氣生成整個遊戲
A. 製作架構候選比較與 ADR，優先考慮 iOS 上架、2D RPG 操作、成本、未來線上競技擴展，以及初學者能否維護。沒有必要不要立刻開通付費後端。
B. 建立可執行最小原型：一個主畫面、一個副本、一個 Boss、四選一答題、答對扣 HP、答後解說及結算。使用明確標記的開發測試樣例，不冒充 DSE 正式題庫。
C. 建立自動測試，覆蓋答案判定、戰鬥回合、題目有效性、重複 ID、審核狀態、離線儲存。
D. 起草首個可玩的 UI 畫面和資料流程；不需一次完成所有社交／抽蛋功能。
E. 建立每階段進度報告：完成證據、可執行測試、仍未完成、下一步。

## 執行授權邊界
可自行規劃、編寫、重構、加測試、在開發環境執行及修 Bug；可提交 feature branch、draft PR（若連接已配置）。但絕不可自動 merge main、上架、付費、使用真實學生個資、公開題庫、配置生產付費服務或修改安全政策。遇到無法決定的重大架構／遊戲機制問題，提出 2–3 個建議及優缺點，其他小問題自行處理。

現在先輸出你對《IT帝》原意的理解、確定事項與待定事項、AI Agency 分工與排程部署檢查清單，接着立即開始第一階段可驗證的工程工作。不要只交一份概念企劃。

## 追加：校際公會與美術參考（2026-10-30）
用戶新增「公會模式（學校與學校 Battle）」方向：閱讀 `docs/07_SCHOOL_GUILD_BATTLE.md`，提出公平、未成年人私隱、身分驗證及非同步賽制設計；先完成單人 MVP，後續用虛構學校資料製作校際公會 demo，未經批准不部署真實學校對戰。閱讀 `docs/06_ART_DIRECTION.md`：原始畫風圖片**尚未包含**於此 ZIP，若未見 `assets/style_references/` 圖片務必直接說明，勿假稱已看圖。
