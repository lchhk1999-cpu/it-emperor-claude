# 遊戲資料匯入報告（自動產生）

- 來源檔案：`IT_Emperor_DseMcQs.xlsx`
- SHA-256：`f50eab4ec1846c0c2d20b9c453d2f4dfbe20e9af49552ce23c178d8056d9406a`
- 匯入時間：2026-10-31T10:01:27Z
- 工作表：`Characters`、`GameConfig`、`Missions`、`Titles`、`Equipment`、`Pools`、`Materials`、`Stages`、`Events`（Topics 用作檢查課題）

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
| CH-ITDOG-CORGI | 柯基 IT狗 | PY_BASIC | R | 95 | 105 | 20% |
| CH-ITDOG-HUSKY | 哈士奇 IT狗 | PY_BASIC | SR | 100 | 110 | 20% |
| CH-ITDOG-GOLDEN | 黃金獵犬 IT狗 | PY_BASIC | SR | 100 | 110 | 20% |
| CH-ITDOG-MECHA | 機械老虎狗 | PY_BASIC | SSR | 105 | 116 | 20% |
| CH-DB-JR | 見習數據庫師 | SQL | R | 95 | 90 | 20% |
| CH-DB-INDEX | 索引大師 | SQL | SR | 100 | 95 | 20% |
| CH-DB-CHIEF | 首席數據庫師 | SQL | SSR | 105 | 100 | 20% |
| CH-GOLD-BRONZE | 青銅職員 | HARDWARE | R | 95 | 105 | 20% |
| CH-GOLD-SILVER | 白銀職員 | HARDWARE | R | 95 | 105 | 20% |
| CH-GOLD-DIAMOND | 鑽石職員 | HARDWARE | SSR | 105 | 115 | 20% |
| CH-HACK-ROOKIE | 見習白帽 | SECURITY | R | 105 | 86 | 20% |
| CH-HACK-FIREWALL | 防火牆騎士 | SECURITY | SR | 110 | 90 | 20% |
| CH-HACK-LEGEND | 白帽傳說 | SECURITY | SSR | 115 | 94 | 20% |
| CH-OFFICE-INTERN | 實習生 | EXCEL | R | 95 | 110 | 20% |
| CH-OFFICE-LEAD | 試算表主任 | EXCEL | SR | 100 | 116 | 20% |
| CH-OFFICE-PIVOT | 樞紐分析師 | EXCEL | SR | 100 | 116 | 20% |
| CH-OFFICE-QUEEN | 公式女王 | EXCEL | SSR | 105 | 121 | 20% |
| CH-BROADBAND-FIBRE | 光纖技師 | NET_DEVICE | R | 105 | 95 | 20% |
| CH-BROADBAND-ROUTER | 路由器隊長 | NET_DEVICE | SR | 110 | 100 | 20% |
| CH-BROADBAND-5G | 5G 工程師 | NET_DEVICE | SR | 110 | 100 | 20% |
| CH-BROADBAND-CHIEF | 網絡總指揮 | NET_DEVICE | SSR | 116 | 105 | 20% |
| CH-AIBOT-STUDY | 學習機械人 | ALL | R | 95 | 95 | 10% |
| CH-AIBOT-CHAT | 對話機械人 | ALL | SR | 100 | 100 | 10% |
| CH-AIBOT-QUANTUM | 量子機械人 | ALL | SSR | 105 | 105 | 10% |

## 遊戲設定

| 鍵 | 值 |
|---|---|
| team_slots_max | 5 |
| initial_team_slots | 1 |
| specialist_bonus | 0.2 |
| pvp_stats_normalized | 1 |
| gacha_paid_enabled | 0 |
| starter_stamina | 40 |
| level_up_stamina | 2 |

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
| T-WORLD-A | 資訊處理達人 | world_correct | 30 | A | ✅ |
| T-WORLD-B | 硬件工匠 | world_correct | 30 | B | ✅ |
| T-WORLD-C | 網絡守護者 | world_correct | 30 | C | ✅ |
| T-WORLD-D | 程式魔法師 | world_correct | 30 | D | ✅ |
| T-WORLD-E | 社會觀察家 | world_correct | 30 | E | ✅ |
| T-STREAK10 | 穩打穩紮 | best_streak | 10 | — | ✅ |
| T-STREAK20 | 無錯神手 | best_streak | 20 | — | ✅ |
| T-CORRECT200 | 勤學小兵 | total_correct | 200 | — | ✅ |
| T-CORRECT500 | ICT 學霸 | total_correct | 500 | — | ✅ |
| T-CORRECT1000 | IT 帝王 | total_correct | 1000 | — | ✅ |
| T-ULTIMATE | 究極挑戰者 | ultimate_clear | 1 | — | ✅ |
| T-ALLSTAGES | 全制霸 | all_world_stages | 20 | — | ✅ |
| T-STORY | 故事完結者 | story_complete | 43 | — | ✅ |
| T-CHECKIN7 | 每日報到 | checkin_days | 7 | — | ✅ |
| T-CHECKIN30 | 全勤之星 | checkin_days | 30 | — | ✅ |
| T-EVOLVE | 進化大師 | evolve_max | 1 | — | ✅ |
| T-COLLECT | 收藏家 | own_characters | 20 | — | ✅ |
| T-DRILL | 操練狂人 | drill_answers | 100 | — | ✅ |

註：`Titles` 表沒有課題欄，`topic_correct` 稱號的課題取自 title_id 後綴（例如 T-EXCEL → EXCEL）。建議在 Excel 加入明確的 topic_id 欄。

## 裝備（第 1 階效果；進化未開放）

| ID | 名稱 | 類型 | 第 1 階 | 解讀數值 | 遊戲支援 |
|---|---|---|---|---|---|
| EQ-AI | AI 模型 | hint | 刪去 1 個錯誤選項；冷卻 6 題 | remove=1、cooldown=6 | ✅ |
| EQ-EYEDROP | 眼藥水 | healing | 回復 10 HP | heal=10 | ✅ |
| EQ-COMPUTER | 電腦 | damage | 冷卻 6 題：額外傷害 40 | cooldown=6、bonus=40 | ✅ |
| EQ-ANTIVIRUS | 防毒軟件 | defense | 受傷害 -10% | reduce_pct=10 | ✅ |
| EQ-GLASSES | 眼鏡 | time | 每題 +3 秒 | seconds=3 | ❌ 即將開放 |

## 抽蛋池（只用免費寶石）

| 池 | 類型 | 稀有度 | 機率 | 保底 |
|---|---|---|---|---|
| CHAR-STD | character | R | 77.0% | — |
| CHAR-STD | character | SR | 20.0% | — |
| CHAR-STD | character | SSR | 3.0% | 50 |
| EQUIP-STD | equipment | R | 75.0% | — |
| EQUIP-STD | equipment | SR | 22.0% | — |
| EQUIP-STD | equipment | SSR | 3.0% | 80 |

註：`Equipment` 表沒有稀有度欄，裝備池的稀有度機率暫時無法套用；遊戲內每件可用裝備機率相同，並清楚註明。建議在 Excel 加入 rarity 欄。

## 素材（背包）

| ID | 名稱 | 課題 | 稀有度 | 說明 |
|---|---|---|---|---|
| MAT-EXCEL | 函數晶片 | EXCEL | 普通 | Excel 角色進化用途 |
| MAT-SQL | 資料碎片 | SQL | 普通 | SQL 角色進化用途 |
| MAT-HW | 矽晶礦石 | HARDWARE | 普通 | 硬件角色進化用途 |
| MAT-NET | 光纖能量 | NET_DEVICE | 普通 | 網絡角色進化用途 |
| MAT-SEC | 防火牆核心 | SECURITY | 稀有 | 安全類角色進化用途 |
| MAT-PY | 程式碼殘片 | PY_BASIC | 普通 | Python 角色進化用途 |
| MAT-RARE | 傳說核心 | ALL | 傳說 | 高階角色及裝備進化用途 |
| MAT-COIN | 金幣寶箱 | ALL | 普通 | 額外金幣 |
| MAT-EXP | 經驗芯片 | ALL | 普通 | 額外經驗 |

## 每日限定素材關（每週輪換）

| 星期 | 活動 | 關卡 | 課題 | 難度 | 題數 | 素材 |
|---|---|---|---|---|---|---|
| 一 | Python 進化素材日 | 迴圈冒險 | PY_BASIC | easy | 5 | MAT-PY |
| 二 | Excel 進化素材日 | IF 函數試煉 | EXCEL | easy | 5 | MAT-EXCEL |
| 三 | SQL 進化素材日 | 尋找遺失的記錄 | SQL | medium | 6 | MAT-SQL |
| 四 | 硬件進化素材日 | RAM 守衛戰 | HARDWARE | easy | 5 | MAT-HW |
| 五 | 網絡進化素材日 | 交換器迷宮 | NET_DEVICE | medium | 6 | MAT-NET |
| 六 | 金幣寶庫 | 金幣之門 | ALL | medium | 10 | MAT-COIN |
| 日 | 究極混合地下城 | 究極混合副本 | ALL | ultimate | 15 | MAT-RARE |

註：`Stages` 表的 boss_hp、reward_coins、reward_exp 暫未使用（Boss 血量按遊戲傷害公式計算）。stamina_cost 為 0 的限定關，體力按題數計算。

## 拒絕的資料

沒有。
