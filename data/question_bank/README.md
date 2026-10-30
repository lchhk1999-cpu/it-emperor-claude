# 題庫（由 ChatGPT 整理，Claude 只負責匯入）

把最新 Excel 放在這個資料夾（`.xlsx` 不會提交到 git），然後在專案根目錄執行：

```bash
python3 tools/import_question_bank.py data/question_bank/IT_Emperor_DseMcQs.xlsx
```

- 只匯入 `Questions` 工作表；Topic_* 分頁只供人手檢閱，不會重複匯入。
- 有效 Topic 來自 `Topics` 工作表（active = yes）。
- 被 Excel 變成公式的儲存格會保留公式文字（例如 `=$B3*D$1`），不會用 `#VALUE!`。
- 不合格的題目會被拒絕並列在 `docs/QUESTION_BANK_IMPORT_REPORT.md`，不會默默略過。
- 產生：`src/data/question_bank.js`（開發版，含 review 題並在畫面標示）及 `src/data/question_bank.release.js`（正式版，只有 approved 題）。
- 匯入後執行 `./scripts/test.sh` 確認全部通過。

`IT_Emperor_Offline_Story_Mode_QuestionBank_129.xlsx`（故事模式）格式不同，尚未接入。
