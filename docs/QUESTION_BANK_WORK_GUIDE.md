# 題庫整理工作指引（給用戶）＋ ChatGPT 工作 Prompt

更新：2026-10-31。題庫由 ChatGPT 整理（`docs/04_QUESTION_BANK_CONTRACT.md`），Claude 只負責匯入、檢查及遊戲。

## 一、現況（正式版可用 382 題，全部 approved）

| 世界 | 課題 | 簡單 | 中等 | 困難 |
|---|---|---|---|---|
| A 資訊處理 | INFO_PROCESS、DATA_REP、EXCEL、EXCEL_CHART、DATABASE、SQL、MULTIMEDIA | 30 | 79 | 25 |
| B 電腦系統基礎 | HARDWARE、IO、OS | 22 | 40 | **4** |
| C 互聯網及其應用 | NET_DEVICE、NET_CONCEPT、SECURITY、WEB | 32 | 57 | **4** |
| D 計算思維及程式編寫 | PY_BASIC、PY_ADV | **5** | 43 | 23 |
| E 資訊科技的社會影響 | SOCIAL | **3** | **15** | **0** |

其他問題：
1. **32 題被拒**：課題代碼不在 Topics 表（ALGORITHM 13、NETWORK 12、DATA 5、INFO 1、NETDEVICE 1）。
2. **IO（輸入輸出裝置）0 題、EXCEL_CHART 只有 1 題。**
3. **答案位置**：A 32%、B 44%、C 20%、D 3%（遊戲已會打亂選項，影響不大，但新題最好平均）。
4. **Excel 待改**：`Pools` 表 SSR 保底 80 → 50；`Characters` 表「機械 IT狗」→「機械老虎狗」。
5. **故事題庫 129 題**仍是 review，正式版故事模式是空的（另一個檔案，見第五部分）。

**目標**：每個世界每個難度至少 20 題（究極關一次用 15 題），E 世界尤其要補。

## 二、版權提醒（重要）

出版社練習題及 DSE 原卷都受版權保護。題目放入公開發佈的 App 前：
- **不可照抄**題幹、選項或解說，要由 ChatGPT **按同一知識點重新撰寫原創題目**（換情境、換數字、換寫法）。
- 每題保留來源追蹤欄（只作內部紀錄，遊戲不顯示）。
- 如果某題無法改寫成原創（例如依賴原書圖表），就不要收錄。
- 如日後想原文使用某出版社題目，要先取得該出版社書面授權。

## 三、你的步驟

1. **第一份工作（修正 DSE 主題庫）**：把 `data/question_bank/IT_Emperor_DseMcQs.xlsx` 上載給 ChatGPT，貼上下面「Prompt 1」。
2. ChatGPT 完成後，下載新檔，**檔名不變**，放回 `data/question_bank/`（舊檔可另存為「_舊」備份）。
3. **第二份工作（額外題庫）**：把你已整理的出版社題目 Excel 上載給 ChatGPT，貼上「Prompt 2」。新檔名為 `IT_Emperor_Extra_McQs.xlsx`，同樣放入 `data/question_bank/`。
4. **老師審核**：兩份檔案的新題都是 `review`。請老師逐題檢查（答案、解說、繁體用字、是否原創），把合格題目改為 `approved`。只有 `approved` 會出現在正式版；開發版可先試玩 `review` 題。
5. 回來告訴 Claude「題庫已更新」。Claude 會：匯入兩份檔案、檢查重複 ID 及格式、出匯入報告、更新每個世界的題目數量表、跑測試及試玩。

## 四、Prompt 1：修正 DSE 主題庫（複製全段給 ChatGPT）

```text
我上載了《IT帝》DSE 題庫 Excel（IT_Emperor_DseMcQs.xlsx）。請按以下要求修改，並提供修改後的 Excel 下載，檔名保持不變。

【A. 修正 32 題課題代碼】
Questions 表有 32 題的 topic_id 不在 Topics 表內，遊戲無法匯入：
ALGORITHM（13 題）、NETWORK（12 題）、DATA（5 題）、INFO（1 題）、NETDEVICE（1 題）。
請逐題按內容改為 Topics 表已有的代碼之一：
EXCEL、EXCEL_CHART、SQL、DATABASE、HARDWARE、IO、NET_DEVICE、NET_CONCEPT、SECURITY、PY_BASIC、PY_ADV、SOCIAL、DATA_REP、INFO_PROCESS、MULTIMEDIA、WEB、OS。
參考：演算法 → PY_ADV；網絡原理 → NET_CONCEPT；網絡設備 → NET_DEVICE；資料表示 → DATA_REP；資訊處理 → INFO_PROCESS。
不要新增 Topics 代碼。這 32 題的 status 改為 review（因為課題已改，需要老師再看）。

【B. 其他兩處小改】
1. Pools 表：pool_id 為 CHAR-STD、rarity 為 SSR 那一行，pity_threshold 由 80 改為 50。
2. Characters 表：character_id 為 CH-ITDOG-MECHA 那一行，character_name 由「機械 IT狗」改為「機械老虎狗」。

【C. 補充新題（原創，status 一律 review）】
請按 DSE ICT 課程，為以下不足的部分撰寫原創四選一題目（不可照抄任何出版社或 DSE 原卷字句）：
- HARDWARE／IO／OS（B 世界）：困難 16 題；其中 IO 至少 8 題（任何難度）
- NET_DEVICE／NET_CONCEPT／SECURITY／WEB（C 世界）：困難 16 題
- PY_BASIC／PY_ADV（D 世界）：簡單 15 題
- SOCIAL（E 世界）：簡單 17 題、中等 5 題、困難 20 題
- EXCEL_CHART：任何難度 8 題
每題要求：
- 欄位與 Questions 表現有欄位完全相同：question_id, course_id, topic_id, difficulty, question_type, stem_zh, option_a, option_b, option_c, option_d, correct, explanation_zh, wrong_tip_zh, tags, source_note, status, version, time_sec
- question_id 用新前綴「ICT-NEW-」加三位數字，不可與現有 ID 重複
- difficulty 只用 easy／medium／hard
- 四個選項不可重複，只有一個正確答案；correct 只填 A／B／C／D；新題的正確答案位置請平均分佈在 A、B、C、D
- explanation_zh 用繁體中文解釋為何正確；wrong_tip_zh 提示常見錯誤
- 程式題保留換行；Excel 公式選項以文字儲存（例如 =SUM(A1:A3)），不要讓 Excel 計算
- source_note 寫「原創（2026-10）」及對應課程範圍

【D. 不可改動】
- 現有已 approved 的題目內容一律不改。
- 其他工作表不要刪除或改名；Topic_* 檢閱分頁可按需要更新。

【E. 完成後請回報】
1. 32 題各改為甚麼 topic_id（列表）。
2. 新增題目數量：按世界（A–E）× 難度列表。
3. 新題答案 A／B／C／D 各多少題。
4. 確認 Pools 及 Characters 兩處已改。
```

## 五、Prompt 2：額外題庫（出版社題目改寫）

```text
我上載了一份我整理的 ICT 練習題 Excel（來源是不同出版社的練習題）。請把它整理成《IT帝》可匯入的「額外題庫」，提供下載，檔名：IT_Emperor_Extra_McQs.xlsx。

【版權要求（最重要）】
這些題目受出版社版權保護，不可原文放入 App。請把每一題「按同一知識點重新撰寫成原創題目」：
- 改寫題幹情境、數字、名稱及句式；選項及解說亦要重新撰寫。
- 不可保留可辨認的原文句子。
- 如果某題依賴原書圖表或無法改寫成原創，請不要收錄，並在報告中列出。

【檔案格式】
1. 工作表「Questions」：欄位與主題庫完全相同：
   question_id, course_id, topic_id, difficulty, question_type, stem_zh, option_a, option_b, option_c, option_d, correct, explanation_zh, wrong_tip_zh, tags, source_note, status, version, time_sec
   - question_id 前綴「ICT-EXT-」加四位數字，全檔唯一
   - course_id 填 ICT
   - topic_id 只可用：EXCEL、EXCEL_CHART、SQL、DATABASE、HARDWARE、IO、NET_DEVICE、NET_CONCEPT、SECURITY、PY_BASIC、PY_ADV、SOCIAL、DATA_REP、INFO_PROCESS、MULTIMEDIA、WEB、OS
   - difficulty 只用 easy／medium／hard
   - correct 只填 A／B／C／D；請令正確答案平均分佈在 A、B、C、D
   - status 一律填 review
   - source_note 寫「改寫自：出版社名稱／書名／章節」（只作內部紀錄，遊戲不顯示）
   - 程式題保留換行；Excel 公式選項以文字儲存
2. 工作表「Topics」：直接複製主題庫的 Topics 表（內容相同）。

【數量優先次序】
優先補充這些不足的部分（每個世界每個難度目標至少 20 題）：
E 世界 SOCIAL（全部難度）> B 世界困難 > C 世界困難 > D 世界簡單 > IO > EXCEL_CHART > 其他。

【完成後請回報】
1. 收錄題數，按世界（A–E）× 難度列表。
2. 沒有收錄的原題及原因。
3. 答案 A／B／C／D 各多少題。
4. 確認所有題目均為改寫的原創題目。
```

## 六、遊戲如何出題（回答用戶問題）

- **故事模式**：每關固定用該關的題目（來自故事題庫）。
- **DSE 挑戰（世界關、限定關）**：每次開戰都由該世界、該難度的題目中**隨機抽題**，選項次序亦會隨機打亂；同一場不會重複。題目不足時才由同一世界其他難度補上。
- 額外題庫匯入後，會與 DSE 題目合併成同一題目池，按課題代碼及難度一樣隨機抽出。
- **操練區（新）**：不扣體力、不給經驗／金幣／素材，隨意揀世界及難度，一題接一題隨機出，答錯即看解說，可隨時離開。
