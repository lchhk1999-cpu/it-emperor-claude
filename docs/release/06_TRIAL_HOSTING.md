# 試玩版放上網（Netlify，不公開連結）

狀態：2026-11-01 已上載。學生版 https://itdi-trial-k7q2.netlify.app/ ；老師示範版 https://itdi-trial-k7q2.netlify.app/demo/ （Claude 已在瀏覽器實測兩個版本）。方式：Netlify 免費寄存，網址是一串名稱，不會被搜尋器收錄（已設 noindex 及 robots.txt），只有收到連結的人才知道。

> 開帳戶、登入及上載要由你親自做（Claude 不可代你開帳戶或輸入密碼）。全程免費，不需信用卡。

## 要上載的資料夾
`dist/site`（Claude 已建好，Finder 會打開它）

| 網址 | 內容 | 適合 |
|---|---|---|
| `https://你的網站名.netlify.app/` | 學生正式版（由零開始） | 學生 |
| `https://你的網站名.netlify.app/demo/` | 老師示範版（資源全開、全部關卡） | 老師 |

日後更新：Claude 執行 `./scripts/build-site.sh` 重新建置，你再把新的 `dist/site` 拖入 Netlify 的「Deploys」頁即可（網址不變）。

## 步驟（約 5 分鐘）

### 1. 開 Netlify 帳戶
1. 用瀏覽器打開 https://app.netlify.com/signup
2. 按 **「Sign up with GitHub」**（用你現有的 GitHub 帳戶最方便），按指示授權。
3. 如問你「What are you planning to use Netlify for?」之類問題，隨便揀或按 Skip。

### 2. 拖放上載
1. 打開 https://app.netlify.com/drop
2. 從 Finder 把整個 **`site`** 資料夾拖到網頁中間的虛線框。
3. 等幾秒，會顯示「Published」及一個網址，例如 `https://jolly-otter-123abc.netlify.app`。

### 3. 改一個較易記但不易猜的網站名（可選）
1. 在該網站頁面按 **「Site configuration」** → **「Change site name」**。
2. 輸入例如 `itdi-trial-` 加幾個隨機字母數字（例如 `itdi-trial-k7q2`），按 Save。
3. 網址會變成 `https://itdi-trial-k7q2.netlify.app`。

### 4. 把網址貼給 Claude
Claude 會用瀏覽器打開兩個版本檢查是否正常。

## 分享給老師及學生
- 學生：只發學生版網址。
- 老師：發兩個網址，說明 `/demo/` 是示範版。
- 提醒：用 iPhone 的 Safari 打開，按「分享」→「加入主畫面」，之後像 App 一樣使用，亦可離線玩。
- 進度只存在各自手機；換手機可用「設定 → 備份進度」。
- 收集意見：可用 `04_AGE_RATING_AND_TESTFLIGHT.md` 的回饋問題做 Google Form。

## 「Powered by Netlify」徽章
Netlify 會在網站右下角加一個徽章，遮住遊戲底部分頁右邊少許（分頁仍可點）。免費帳戶要付費升級才可關掉。2026-11-01 用戶決定：試玩期間（主要給本校學生溫習）先保留 Netlify 及徽章，不付費；上架 App Store 時才處理（App 版本不會有此徽章）。如日後想換免費且無徽章的網頁寄存，可改用 Cloudflare Pages（Workers & Pages → Create application → Pages → Upload assets，拖入同一個 `dist/site` 資料夾）。

## 驗證碼（每部裝置第一次打開時輸入）
2026-11-01 用戶要求：學生打開連結後，要先輸入老師提供的驗證碼才可進入遊戲（學生版及 `/demo/` 共用同一個碼），避免只轉發連結就可以玩。

- 驗證碼存放在電腦上的 `secrets/access-code.txt`（不會上載到 GitHub），只可用英文字母及數字，不分大小楷，空格會略去。
- 網站只包含驗證碼加密後的版本，不會出現原文。
- 每部裝置成功輸入一次後會記住，之後不用再輸入。
- **換碼**：叫 Claude 更改驗證碼並執行 `./scripts/build-site.sh`，再把新的 `dist/site` 拖入 Netlify。所有裝置下次打開時要輸入新碼，**遊戲進度不受影響**。
- 限制：這只能阻止一般人隨手打開；懂技術的人仍可繞過。真正的登入保護（例如 Netlify 密碼保護）要付費，未經批准不會使用。

## 進度會否保存？
- 會。進度自動儲存在學生自己的手機或電腦瀏覽器內，關掉再開會繼續，不用重新玩過。
- 建議學生用 Safari「加入主畫面」，從主畫面圖示打開：Safari 對一般網頁，如 7 日沒有打開，有機會自動清除網站資料；加到主畫面的不受此限。遊戲亦會請求瀏覽器長期保存資料。
- 以下情況進度會消失：清除 Safari 瀏覽記錄及網站資料、用「無痕瀏覽」玩、換另一部裝置或另一個瀏覽器。
- 防止遺失：在「設定 → 備份進度」複製備份碼（例如貼在備忘錄），換機或資料被清除後貼上即可還原。

## 收回或暫停
Netlify 網站頁面 → 「Site configuration」→ 最底「Delete this site」，連結即時失效。
