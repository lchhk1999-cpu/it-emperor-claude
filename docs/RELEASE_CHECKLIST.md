# 《IT帝》單機版 iPhone 上架清單

更新：2026-10-31。對象：單機版（offline edition）、免費、無內購、無廣告、無帳戶。
符號：✅ 已完成　⬜ 未做　⚠ 需要決定。負責：**你**＝專案負責人；**Claude**；**老師**；**ChatGPT**。

> 任何付費（Apple 開發者帳戶）、提交審核及正式發佈，都要你明確批准才做。

---

## 零、6 個決定（2026-10-31 你已決定）

| # | 決定 | 結果 |
|---|---|---|
| D1 | 開發者帳戶名義 | ✅ **個人**（日後可轉移給機構） |
| D2 | 支援裝置 | ✅ **iPhone + iPad**（要 iPad 版面及 13 吋截圖） |
| D3 | 美術 | ✅ **沿用現有原創畫風**作 1.0，移除「PLACEHOLDER」字樣 |
| D4 | 私隱政策網頁 | ✅ **Google Sites**（Claude 教步驟，你用自己的 Google 帳戶建立） |
| D5 | App 名稱 | ✅ **IT帝：ICT 學習冒險**（主畫面圖示下顯示「IT帝」；提交前再查同名） |
| D6 | 進度備份 | ✅ **加入備份碼** |

---

## 一、內容（遊戲裡面的東西）

| 項目 | 狀態 | 負責 | 備註 |
|---|---|---|---|
| DSE 主題庫 511 題教師核准 | ✅ | 老師 | 正式版每個世界每個難度 ≥ 20 題 |
| 故事模式 129 題教師審核 | ⬜ **阻礙上架** | 老師 | 未核准前正式版故事模式是空的（顯示「等待老師審核題目」） |
| 額外題庫 596 題教師審核 | ⬜ 可延後 | 老師 | 未核准的只在開發版出現，不影響上架 |
| 機械老虎狗改名、保底 50、22 個稱號已在 Excel | ✅ | — | |
| 瀏覽器標題「IT帝 原型」改為「IT帝」 | ✅ | Claude | |
| 移除畫面上「PLACEHOLDER 美術」字樣 | ✅ | Claude | D3 |
| 正式版不帶題目內部來源備註（含外部試卷連結） | ✅ | Claude | 測試腳本會檢查 |
| 題目版權：DSE 題為概念改編、出版社題為改寫原創，App 內不使用考評局標誌、不聲稱與考評局有關 | ⚠ | 你確認 | 描述可寫「按 HKDSE ICT 課程設計」 |
| 角色、怪物、背景、音效、音樂均為原創，沒有第三方素材 | ✅ | — | 字型使用 iPhone 內置字體（蘋方），不需授權 |

## 二、技術（Claude 做，部分要你安裝工具）

| 項目 | 狀態 | 負責 | 備註 |
|---|---|---|---|
| 安裝 Xcode（免費，App Store 下載，約 15 GB 以上） | ⬜ | 你 | 步驟：`docs/release/01_SETUP_XCODE_NODE.md` |
| 安裝 Node.js（免費） | ⬜ | 你（Claude 教步驟） | 打包工具 Capacitor 需要 |
| 用 Capacitor 把遊戲包裝成 iOS App，在模擬器及真機運行 | ⬜ | Claude | 已在 ADR-0001 預留（P1-05） |
| 存檔改用 App 專用儲存（Capacitor Preferences） | ⬜ | Claude | 網頁儲存有機會被 iOS 清除；存檔程式已預留介面 |
| 進度備份碼（D6） | ✅ | Claude | 設定頁「備份進度」：複製代碼／貼上還原 |
| App 圖示（1024×1024）及啟動畫面 | ⬜ 候選稿已出 | Claude 設計、你揀選 | 設計畫布「App 圖示候選稿」A／B／C |
| 鎖定直向、處理劉海及底部安全區域 | ⬜ | Claude | 版面已用 viewport-fit=cover；iPad 版面已按屏幕放大（1.4／1.7 倍），橫向可捲動，iPad 亦建議鎖直向 |
| 減少「只是網頁」的感覺：觸感回饋、每日簽到提醒通知（需同意才發） | ⬜ | Claude | 降低 Apple 4.2「最低功能」被拒風險 |
| 版本號（1.0.0，設定頁顯示）、建置編號 | ✅ 版本號／⬜ 建置編號 | Claude | 建置編號在 Xcode 設定 |
| 出口合規：不使用加密 | ⬜ | Claude | Info.plist 設定，免填額外文件 |
| 單元測試、正式版題目檢查、版本檢查 | ✅ | Claude | 每次改動都跑 |

## 三、帳戶及費用（全部要你親自做，我不可以代辦）

| 項目 | 狀態 | 費用 | 備註 |
|---|---|---|---|
| Apple ID 開雙重認證 | ⬜ | 免費 | |
| 加入 Apple Developer Program（視乎 D1） | ⬜ ⚠ 要你批准付費 | **每年 US$99** | 免費 App 不需要填銀行及稅務資料 |
| 在 App Store Connect 建立 App 記錄 | ⬜ | 免費 | Claude 教步驟 |

## 四、App Store 頁面資料（Claude 起草，你核准）

| 項目 | 狀態 | 備註 |
|---|---|---|
| 名稱（30 字內）、副標題（30 字內） | ⬜ 名稱已定（D5） | 見 `docs/release/02_APP_STORE_LISTING.md` |
| 描述、關鍵字（100 字元） | ⬜ 草稿已寫 | 見 `docs/release/02_APP_STORE_LISTING.md` |
| 類別：主要「教育」，次要「遊戲」 | ⬜ | |
| 截圖：iPhone 6.9 吋（1320×2868）及 iPad 13 吋（2064×2752），各 3–10 張 | ⬜ | D2 支援 iPad |
| 私隱政策網址（必須） | ⬜ 內容草稿已寫 | Google Sites（D4），步驟及可貼上文字見 `docs/release/05_GOOGLE_SITES_GUIDE.md` |
| 支援網址（必須）、聯絡電郵 | ⬜ | 可與私隱政策同一網站 |
| 私隱標籤：「不收集資料」 | ⬜ | 單機版無帳戶、無分析、無廣告 |
| 年齡分級問卷（新制：4+／9+／13+／16+／18+） | ⬜ 建議答案已寫 | 無暴力血腥、無用戶內容、無購買；「抽蛋」只用學習取得的免費寶石，機率已公開，作答時如實說明 |
| 版權（例如「© 2026 你的名字」） | ⬜ | |

## 五、測試（上架前）

| 項目 | 狀態 | 負責 |
|---|---|---|
| iOS 模擬器：iPhone SE、iPhone 標準、Pro Max 及 iPad 尺寸 | ⬜ | Claude |
| 真機測試（你的 iPhone） | ⬜ | 你＋Claude |
| TestFlight 內測：5–10 位老師及學生，1–2 星期 | ⬜ 計劃已寫 | 你邀請，Claude 整理意見；見 `docs/release/04_AGE_RATING_AND_TESTFLIGHT.md` |
| 重點：存檔不遺失、離線可玩、聲音開關、簽到跨日、體力午夜回滿 | ⬜ | Claude |

## 六、提交及發佈（每一步都要你批准）

1. ⬜ 上載建置版本到 App Store Connect
2. ⬜ 填妥第四部分全部資料
3. ⬜ **你批准後**提交審核（一般 1–3 日）
4. ⬜ 如被拒，Claude 按審核意見修改再提交
5. ⬜ **你批准後**正式發佈

## 七、可以延後（1.0 版之後）

- 連線版：好友、排行榜、校際公會（見 `docs/proposals/online_backend.md`）
- 額外題庫 596 題審核後加入正式版
- Android 版
- 畫師定稿美術

## 建議次序

1. ~~你：決定 D1–D6~~（已完成）；你：安裝 Xcode 及 Node.js；老師開始審核故事 129 題。
2. Claude：Capacitor 包裝、存檔、圖示，模擬器測試（備份碼、移除原型字樣、iPad 版面已完成）。
3. 你：批准並加入 Apple Developer Program（US$99／年）。
4. Claude：真機測試、上載 TestFlight；你邀請老師學生內測。
5. Claude 起草 App Store 資料及私隱政策；你核准並放上網。
6. 你批准提交審核 → 通過後你批准發佈。

## 資料來源（2026-10-31 查閱；提交前在 App Store Connect 再核實）

- Apple：Updated age ratings in App Store Connect — https://developer.apple.com/news/?id=ks775ehf
- 年齡分級新制報道 — https://www.macrumors.com/2025/07/25/apple-overhauls-app-store-age-ratings/
- 截圖尺寸整理（第三方）— https://studio.adalo.com/blog/app-store-screenshot-sizes-2026
- 網頁包裝 App 與 4.2 規則（第三方）— https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper ；Apple 開發者論壇 — https://developer.apple.com/forums/thread/812889
