# ChatGPT → Claude Code Excel 題庫交接契約

## Source of truth
ChatGPT 獨立整理 DSE ICT 歷屆題目，按年份做概念改編與可行性評估，儲存在 `.xlsx`：
- `Questions`：唯一供程式導入的主表
- `Topic_*`：便於人工檢閱的分頁（**不得重複導入**）
- 來源追蹤／可行性評估表：核實年份與原卷題號；不可把 DSE 原題字面大量複製進公開 App

## 欄位契約（由 Import Agent 先對照實際活頁簿作 mapping，絕不假設列名完全一樣）
- question_id: 唯一、不可空
- topic_id: 有效 Topic
- stem: 繁體中文題幹
- option_a / option_b / option_c / option_d: 文字型四選項，容許 `=SUM(...)` 這類公式作**純文字**
- answer: A/B/C/D
- explanation: 繁中知識解說
- source_year, source_question: DSE 來源追蹤
- difficulty: 可用等級
- review_status: draft/review/approved/rejected（舊欄名需 mapping）

## Import rules
- 用 Excel reader 取 cell 的 display / formula 狀態；試算表公式題目必須保存**字面文字**，不得計算成 `#VALUE!`。
- 檢查空欄、四選項、答案指向、重複 ID、題目邏輯、Topic、公式格式；不合法資料列入 reject report，不默默略過。
- `approved` 只能在有教師驗證情況下發布；所有 `review` 題即使答案存在亦不得公開。
- 產生 import report（成功數／拒絕數／重複數／Topic 數／版本 checksum）。
- 範例 Excel 位置 `data/question_bank/`，目前只放 `README.md`；由 ChatGPT 新一輪交付的檔案供人工提供／明確同步。
- 不從本 ZIP 推斷「已經匯入最新 147 題」；需實際提供並驗證 Excel。
