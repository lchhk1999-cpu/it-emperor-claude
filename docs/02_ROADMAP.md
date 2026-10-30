# Development roadmap / backlog

## Phase 0 — Foundation
- P0-01 確認 repo / dev environment / iOS build pipeline prerequisites；記錄 ADR 技術棧選擇與成本
- P0-02 導入 AI agents、PR checks、task backlog、`docs/PROGRESS.md` 模板
- P0-03 建立測試框架、formatter / lint 和 Git ignore/secret scan
**Done =** CI 可運作、README 可按步驟啟動、基本測試通過、無密鑰入庫

## Phase 1 — Playable vertical slice
- P1-01 2D 主選單 + 單一關卡
- P1-02 Boss 戰鬥四選一答題、正確傷害、答後解說、失敗／勝利結果
- P1-03 原創佔位 UI / 角色、不同手機尺寸基本可用
- P1-04 遊戲狀態與存檔：中途退出重入不破壞資料
**Done =** 可重現操作、可在目標裝置／模擬器執行、核心測試通過

## Phase 2 — Curriculum/question-bank
- P2-01 定義 Excel 資料 schema 和版本控制
- P2-02 匯入 `Questions` 而非 Topic Sheets，驗證 IDs、Topic、答案、公式文字、解說及審核狀態
- P2-03 開發模式可看 review 題；正式版只載 approved 題
- P2-04 抽題覆蓋率、重複題防護、答後教學反饋
**Done =** 匯入報告顯示成功／拒絕明細，不靜默損壞 Excel 公式

## Phase 3 — RPG loop
- P3-01 XP／體力／通關獎勵
- P3-02 最多五人隊伍、角色專長（先以佔位平衡值原型）
- P3-03 角色／裝備系統，最多三槽，五類示範裝備
- P3-04 進化／每日週常副本（先離線可玩）
**Done =** 有效平衡測試、不因答題錯誤而過度懲罰學生

## Phase 4 — Optional online/social features
- P4-01 朋友支援與排名／1v1 同題 Boss 結算設計
- P4-02 反作弊、身份及隱私、月重置和成本評估
- P4-03 任務／稱號／背包／兩個免費貨幣抽取池
**Gate =** 先由人核定後端、私隱及公平性方案再實作

## Phase 5 — App Store readiness
- iOS 真機、效能與可及性、版權、內容審核、隱私披露、App Store 提交
**Gate =** 人手審批及持有人開發者帳戶；AI 不自動上架

## Prioritization rule
總是選擇可在一個 PR 驗證的最高優先任務。阻塞則記錄，轉往不依賴阻塞項的任務。禁止為湊進度而完成假資料功能。

## Guild addition (new scope, concept confirmed, details open)
- P3-05 School Guild UI demo: fictitious schools, sample seasonal standings, rules prototype, no personal data.
- P4-04 Guild membership verification, teacher moderation and school authorization plan (approval required).
- P4-05 Asynchronous school-vs-school Boss league, normalized fair scoring, server validation, abuse controls, privacy review (approval required).
