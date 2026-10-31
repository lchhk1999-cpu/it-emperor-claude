# 試玩版放上網（Netlify，不公開連結）

狀態：2026-11-01 用戶批准放上網給老師及學生試玩。方式：Netlify 免費寄存，網址是一串名稱，不會被搜尋器收錄（已設 noindex 及 robots.txt），只有收到連結的人才知道。

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

## 收回或暫停
Netlify 網站頁面 → 「Site configuration」→ 最底「Delete this site」，連結即時失效。
