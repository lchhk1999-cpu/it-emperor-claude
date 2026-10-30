# 遊戲資料匯入報告（自動產生）

- 來源檔案：`IT_Emperor_DseMcQs.xlsx`
- SHA-256：`93f04990806f97f3014dcdd7403451ee8d8745daa0f4ffd6fe3adf9b1d019459`
- 匯入時間：2026-10-30T15:11:24Z
- 工作表：`Characters`、`GameConfig`、`Missions`、`Titles`（Topics 用作檢查課題）

## 角色

| ID | 名稱 | 專長 | 稀有度 | 攻擊 | HP | 專長加成 |
|---|---|---|---|---|---|---|
| CH-ITDOG | IT狗 | PY_BASIC | R | 95 | 105 | 20% |
| CH-DB | 數據庫師 | SQL | SR | 100 | 95 | 20% |
| CH-GOLD | 黃金職員 | HARDWARE | SR | 100 | 110 | 20% |
| CH-HACK | 黑客 | SECURITY | SR | 110 | 90 | 20% |
| CH-OFFICE | 辦公室職員 | EXCEL | R | 95 | 110 | 20% |
| CH-BROADBAND | 寬頻職員 | NET_DEVICE | R | 105 | 95 | 20% |
| CH-AIBOT | 人工智能機械人 | ALL | SSR | 105 | 105 | 10% |

## 遊戲設定

| 鍵 | 值 |
|---|---|
| team_slots_max | 5 |
| initial_team_slots | 1 |
| specialist_bonus | 0.2 |
| pvp_stats_normalized | 1 |
| gacha_paid_enabled | 0 |

## 任務

| ID | 週期 | 名稱 | 條件 | 目標 | 寶石 | 金幣 | 遊戲支援 |
|---|---|---|---|---|---|---|---|
| M-DAILY-01 | 每日 | 完成每日 10 題 | answer_questions | 10 | 3 | 0 | ✅ |
| M-DAILY-02 | 每日 | 完成任意一場副本 | clear_stage | 1 | 2 | 50 | ✅ |
| M-WEEK-01 | 每週 | 正確解答 50 題 | answer_correct | 50 | 10 | 100 | ✅ |
| M-WEEK-02 | 每週 | 完成六個知識世界各一場 | clear_distinct_world | 6 | 15 | 300 | ❌ 即將開放 |
| M-ACH-01 | 成就 | 完成第一次角色進化 | evolve_character | 1 | 20 | 0 | ❌ 即將開放 |

## 稱號

| ID | 名稱 | 條件 | 目標 | 課題 | 遊戲支援 |
|---|---|---|---|---|---|
| T-NEW | IT 新人王 | total_correct | 50 | — | ✅ |
| T-EXCEL | 公式達人 | topic_correct | 100 | EXCEL | ✅ |
| T-SQL | JOIN 大師 | sql_join_correct | 100 | — | ✅ |
| T-PVP | 競技王者 | season_rank | 100 | — | ❌ 即將開放 |

註：`Titles` 表沒有課題欄，`topic_correct` 稱號的課題取自 title_id 後綴（例如 T-EXCEL → EXCEL）。建議在 Excel 加入明確的 topic_id 欄。

## 拒絕的資料

沒有。
