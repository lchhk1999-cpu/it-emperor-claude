# 線上功能方案：好友、排行榜（及校際公會連線）

狀態：PROPOSAL（2026-10-31，等用戶揀選）。未開通任何服務、未付款、未建立任何帳戶。

## 1. 要解決甚麼

| 功能 | 需要線上的原因 |
|---|---|
| 好友（好友支援角色） | 要看到其他同學的隊長角色 |
| 排行榜（前 100 名、每月重置） | 要收集全部同學的分數 |
| 校際公會（現為單機示範） | 同校同學要一齊打同一隻 Boss、每週排名 |

三者都需要：**伺服器**、**學生帳戶**、**數據庫**。同一個後端可以同時服務三個功能。

## 2. 共通原則（任何方案都適用）

- **學生私隱（香港《個人資料（私隱）條例》）**：只收最少資料。
  - 不收真實姓名、電郵、電話、相片。
  - 只用「暱稱」＋「學校邀請碼」（由老師派發）。暱稱需過濾不雅字詞。
  - 學生或老師可要求刪除帳戶及全部紀錄。
  - 上線前要有私隱說明，並由學校／家長同意（建議經學校推行）。
- **帳戶方式**：匿名裝置帳戶＋學校邀請碼，不用密碼；另設「轉機碼」，換手機時可帶走進度。
- **防作弊**：題目答案現時在 App 內，學生理論上可以改分數。按之前決定（防作弊低優先），先做基本保護：伺服器檢查分數是否合理（每日上限、答題速度）、老師可以移除異常紀錄。
- **費用上限**：只用「超出免費額度就暫停、不會自動收費」的方案，避免意外帳單。
- **離線照玩**：沒有網絡時，故事模式、DSE 挑戰、培養全部照常；只有好友、排行榜、公會連線暫停。

## 3. 用量估算

假設 500 名學生，每人每日打 5 場：
- 寫入：約 2,500 次／日（每場完成時上傳 1 次）
- 讀取：排行榜及好友列表約 10,000–20,000 次／日（有快取會更少）

以下全部方案的免費額度都足夠應付這個規模。

## 4. 方案比較

| | A. Cloudflare Workers＋D1 | B. Firebase（Google） | C. Supabase | D. 不連線：老師匯出／匯入 |
|---|---|---|---|---|
| 免費額度 | 每日 10 萬次請求；D1 數據庫 5 GB、每日讀 500 萬行、寫 10 萬行 | Firestore 每日讀 5 萬、寫 2 萬；1 GB | 500 MB 數據庫、5 萬名每月用戶 | 完全免費 |
| 超出免費額度 | 當日暫停，不收費（2026-09 起 D1 超額即失敗） | 免費方案會停止服務，不收費 | 超出要升級；免費專案 **閒置 1 週會自動暫停**，要人手恢復 | 不適用 |
| 收費方案 | 約 US$5／月起 | 按用量收費，需信用卡，只有預算提示、沒有硬上限 | US$25／月起 | 不適用 |
| 伺服器邏輯（檢查分數） | 有，免費已包 | 免費方案沒有 Cloud Functions，只能用安全規則 | 有（資料庫規則＋函數） | 不適用 |
| 防作弊能力 | 中（伺服器可檢查） | 低 | 中 | 低 |
| 我的開發工作量 | 較多（帳戶部分要自己寫） | 較少 | 中 | 少 |
| 你要做的 | 自己開 Cloudflare 免費帳戶，不需信用卡 | 自己開 Google Firebase 專案 | 自己開 Supabase 帳戶 | 無 |
| 主要缺點 | 開發時間較長 | 防作弊弱；升級後有帳單風險 | 學校假期閒置會暫停 | 不是即時，要老師手動 |

## 5. 建議

**建議 A：Cloudflare Workers＋D1**，原因：
1. 免費額度最寬鬆，而且超額只會暫停、**不會產生帳單**，最符合「不經批准不付費」。
2. 免費已包伺服器邏輯，可以在伺服器檢查分數，排行榜較公平。
3. 不會因學校假期閒置而暫停（B、C 的主要問題）。

缺點是我的開發時間較長，因為帳戶系統要自己寫。

**建議分三步做**，每步完成都可以試玩：
1. 學生帳戶（暱稱＋學校邀請碼＋轉機碼）＋私隱說明頁。
2. 排行榜（每週／每月，按學校及全港）。
3. 好友（加好友碼、借用好友隊長）＋校際公會連線。

## 5A. 坊間做法（2026-10-31 補充，用戶要求參考）

| 產品／機構 | 學生點樣登入 | 排行榜／社交 |
|---|---|---|
| Kahoot、Blooket、Gimkit（課堂問答遊戲） | 老師派「加入碼」，學生自訂暱稱，**不用帳戶、不用電郵**；13 歲以下開個人帳戶要家長同意 | 排行榜只限該場遊戲／該班 |
| Prodigy（數學 RPG，最接近《IT帝》） | 老師開班，派「班級碼」連結學生帳戶；亦可用 Google Classroom 同步 | 聲明遊戲中其他玩家看不到個人資料或不當言語 |
| 香港學校 | 多數用 Google Workspace 或 Microsoft 365 學校帳戶；香港教育城 EdConnect 提供單一登入，由學校決定授權哪些服務取用學生資料 | — |
| 私隱專員公署 | 建議不收香港身份證號碼、公開學生資料前要考慮目的及必要性、事先通知／徵求家長同意 | — |

對《IT帝》的啟示：
1. **帳戶**：跟 Prodigy／Blooket 一樣用「老師派碼＋暱稱」，不收電郵、真名。日後與學校合作，可加 Google／Microsoft 學校帳戶或 EdConnect 登入。
2. **排行榜**：坊間把學生排名留在班／校內。建議**個人排行榜只限同校**；跨校只比較**學校（公會）總分**，正好配合已確認的校際公會對戰，又避免全港公開未成年學生的個人排名。
3. **好友**：只可加**同校**同學，不設自由聊天（只用預設貼圖／讚好），避免陌生人接觸學生。
4. **先試點**：先與一間學校、一位老師試行，由學校發同意書，再擴展。

結論：後端仍建議 **方案 A（Cloudflare）**；帳戶、排行榜、好友按以上坊間做法收窄範圍。

## 6. 需要你決定

1. 揀哪一個方案（A／B／C／D）。
2. 是否接受「暱稱＋學校邀請碼、不收真實姓名」的帳戶方式。
3. 排行榜範圍：建議「個人只限同校＋跨校比學校總分」，是否同意。
4. 好友只限同校、不設自由聊天，是否同意。
5. 有沒有可以合作試點的學校／老師。

揀定之後，**開帳戶要由你自己做**（我不可以代你建立帳戶或輸入密碼），我會一步一步教你。

## 7. 資料來源（2026-10-31 查閱，價錢及額度可能會變，開帳戶前再核實）

坊間做法（部分為第三方整理，僅作參考）：
- Blooket 家長指南：https://screenwiseapp.com/guides/parents-guide-to-blooket
- Kahoot（學區資源）：https://sites.google.com/rrps.net/educationtechnology/digital-resource-catalog-drc/kahoot
- Prodigy 私隱評估（加拿大學區）：https://www.sd68.bc.ca/wp-content/uploads/Prodigy-Math-PPIA.pdf
- Prodigy 學區頁面：https://www.rockford.k12.mn.us/district/departments/technology/digital-tools/prodigy
- 香港教育城 EdConnect 單一登入：https://www.edcity.hk/home/en/eddata_edconnect/
- HKIS 數碼學習手冊（Google 帳戶作單一登入）：https://handbook.hkis.edu.hk/digital-learning
- 私隱專員公署兒童私隱資料：https://pcpd.org.hk/misc/newsletters/newsletter_32/issue32/files/assets/basic-html/page-4.html 、https://www.edb.gov.hk/attachment/tc/edu-system/preprimary-kindergarten/free-quality-kg-edu/pcpd_ppt_20190608_for%20upload.pdf

後端收費：

- Cloudflare Workers 收費：https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare 方案：https://www.cloudflare.com/plans.md
- Cloudflare D1 免費額度執行（2026-09-01）：https://developers.cloudflare.com/changelog/post/2026-09-01-d1-free-tier-limit-enforcement/
- Supabase 收費：https://supabase.com/pricing.md
- Firebase 收費（第三方整理，未見官方頁）：https://www.costbench.com/software/database-as-service/firestore/ 、https://gurubase.io/g/android/firebase-product-limitations-free-tier-android
