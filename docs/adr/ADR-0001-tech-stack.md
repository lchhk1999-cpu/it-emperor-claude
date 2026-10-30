# ADR-0001：技術架構（狀態：ACCEPTED — 用戶 2026-10-30 批准）

日期：2026-10-30　負責：Coordinator + architect

## 背景
- 目標：iPhone App Store 上架的 2D 日系 Q 版教育 RPG，日後需要校際公會（線上、伺服器判分）。
- 維護者可能是初學者；成本要低；未批准前不開付費服務。
- **開發機現況（2026-10-30 實測）**：未安裝 Xcode / Command Line Tools、git、Node、Python、Homebrew。只有 macOS 內建 JavaScriptCore（`jsc`）與 Chrome / Safari。

## 候選比較

| 方案 | iOS 上架 | 2D RPG 適合度 | 成本 | 初學者維護 | 線上擴展 | 本機現在可否運行 |
|---|---|---|---|---|---|---|
| A. Web（HTML/CSS/JS 模組）→ 日後用 Capacitor 包裝 iOS | 可（需 Xcode 打包） | 答題 + 選單型 RPG 非常合適；動畫用 CSS/Canvas | 免費 | 高；瀏覽器即測 | 易接任何後端（REST/Supabase/Firebase） | **可以**（瀏覽器 + jsc 測試） |
| B. SwiftUI + SpriteKit 原生 | 最佳 | 好 | 免費（開發者帳戶 US$99/年另計） | 中；只限 Mac | 中 | 不可（需安裝 Xcode） |
| C. Godot 4 | 可（需 Xcode 匯出） | 好 | 免費開源 | 中；GDScript | 中 | 不可（需安裝 Godot） |
| D. Unity | 可 | 好但偏重 | 授權政策曾變動 | 低；龐大 | 好 | 不可 |
| E. Flutter（+Flame） | 可 | 中 | 免費 | 中 | 好 | 不可（需 SDK + Xcode） |

## 建議決定
**採用方案 A：Web-first，核心邏輯與畫面分離。**
1. `src/core/`：純 JavaScript、無 DOM、可測試的遊戲規則（戰鬥、題庫驗證、抽題、存檔）。日後若轉 Swift/Godot，可按測試逐條移植。
2. `src/ui/`：DOM + CSS 畫面，手機直向優先、繁中字體。
3. 現階段**無建置步驟**：瀏覽器直接開 `index.html` 即可玩；`jsc` 跑單元測試。
4. 安裝 Node 後（Phase 0-03）再引入 TypeScript / Vite / Vitest / ESLint；安裝 Xcode 後以 Capacitor 包裝 iOS 及模擬器測試。
5. 存檔：本機 `localStorage`（Capacitor 下可改 Preferences），有版本號與損壞保護。
6. 線上功能（公會、排行）延至 Phase 4，後端選型另立 ADR 並需人手批准。

## 取捨與風險
- Web 包裝的 App 需提供足夠「App 感」才易過 App Store 審核（Guideline 4.2）；遊戲型互動通常可接受，但需在 Phase 5 驗證。
- 動畫表現比 SpriteKit/Godot 弱；對答題 RPG 影響小。若之後需要大量粒子／地圖移動，可在 UI 層加入 Phaser/PixiJS 而不改 core。
- 未有 Xcode 前**無法**驗證 iOS 模擬器／真機（P1 完成條件之一），列為 blocker。

## 需要用戶決定
- 2026-10-30 用戶批准方案 A（Web-first）。Capacitor 包裝與 iOS 模擬器測試待安裝 Xcode 後進行。
