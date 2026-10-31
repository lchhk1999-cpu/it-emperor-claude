# 安裝 Xcode 及 Node.js（給你的步驟）

兩樣都免費。安裝要用你的 Apple ID 及 Mac 密碼，所以要由你親自做（Claude 不可代你輸入密碼）。你的 Mac：Apple 晶片（arm64）、macOS 26.5.1、可用空間約 392 GB，足夠。

## A. 安裝 Xcode（約 1–2 小時，視乎網速）

1. 打開 Mac 的「App Store」。
2. 搜尋「Xcode」，按「取得」→「安裝」（約 15 GB 以上）。
3. 安裝完成後，打開 Xcode 一次：
   - 出現「同意授權條款」按「Agree」，再輸入 Mac 密碼。
   - 如果問要安裝哪些平台，剔選 **iOS**，按「Download & Install」。
4. 打開「終端機」，貼上以下指令並按 Enter（會問 Mac 密碼，輸入時畫面不會顯示字，輸完按 Enter）：

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

5. 檢查：貼上以下指令，應顯示 `/Applications/Xcode.app/Contents/Developer`：

```bash
xcode-select -p
```

## B. 安裝 Node.js（約 5 分鐘）

1. 用瀏覽器打開 https://nodejs.org/
2. 下載標示 **LTS** 的 macOS 安裝檔（.pkg）。
3. 打開安裝檔，一路按「繼續」→「安裝」，輸入 Mac 密碼。
4. 檢查：在終端機貼上以下指令，應顯示版本號（例如 v22.x）：

```bash
node -v
```

## 完成後

回來告訴 Claude「Xcode 及 Node 已安裝」。Claude 會：
1. 用 Capacitor 把遊戲包裝成 iOS App（只在專案資料夾內加入 `ios/` 資料夾）。
2. 在 iPhone 模擬器打開遊戲，逐頁測試。
3. 教你用 USB 線在自己的 iPhone 試玩（免費 Apple ID 已可以在自己手機測試 7 天）。

加入 Apple Developer Program（US$99／年）要等你批准後才做；模擬器及自己手機測試不需要付費。
