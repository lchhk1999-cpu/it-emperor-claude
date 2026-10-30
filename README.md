# 《IT帝》IT Emperor — 開發原型

香港 DSE ICT 學習 × 日式 Q 版答題 RPG。專案規格見 `README_FIRST.md` 與 `docs/`。

## 現在可以做甚麼
- 主畫面 → 選關 → Boss 四選一答題戰鬥 → 答後解說 → 勝利／失敗結算及錯題溫習
- 中途離開可「繼續戰鬥」（存檔於瀏覽器 localStorage）
- **題目全為開發測試樣例（draft），不是 DSE 正式題庫**

## 執行（不需安裝任何東西）
```bash
./scripts/build.sh      # 產生 dist/it-emperor.html（單一檔案，可直接用瀏覽器開，或 AirDrop 到 iPhone 用 Safari 開）
./scripts/test.sh       # 跑全部單元測試（macOS 內建 JavaScriptCore）
```
開發時也可直接在 Safari 開 `index.html`。

## 結構
- `src/core/` 純遊戲規則（無畫面），全部有測試：`battle.js` 戰鬥、`questions.js` 題目驗證／approved 閘門／抽題、`save.js` 存檔、`rng.js` 可重現亂數
- `src/ui/` 畫面與佔位美術
- `src/data/dev_sample_questions.js` 開發測試題 + 關卡設定
- `tests/` 單元測試；`scripts/` build / test
- `docs/adr/` 架構決策；`docs/09_BACKLOG.md` 任務與驗收準則；`docs/PROGRESS.md` 每輪進度
