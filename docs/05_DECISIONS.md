# Decisions and assumptions

| 項目 | 狀態 | 備註 |
|---|---|---|
| 重新在 Claude Code 開發，無須移植 Codex 程式碼 | CONFIRMED | 延續原本遊戲本意 |
| ChatGPT 單獨維護 Excel 題庫 | CONFIRMED | Claude 只負責匯入器和遊戲系統 |
| 原創日系搞笑粉彩 Q 版、DSE ICT 教育 RPG | CONFIRMED | 需原創，不可複製別家遊戲素材 |
| 四選一答題 Boss 戰 | PROTOTYPE | 答錯、傷害、HP、限時待定 |
| iOS App Store | TARGET | 上架需人類操作與批准 |
| 技術棧 | CONFIRMED 2026-10-30 | Web-first（HTML/JS），日後 Capacitor 包裝 iOS；見 `docs/adr/ADR-0001-tech-stack.md` |
| 免費抽取池／是否付費 | OPEN_DECISION | 工程預設無真金錢抽蛋 |
| 公開排行榜、帳戶及對戰 | OPEN_DECISION | 涉及學生資料、安全、作弊及成本 |
| 自動例行開發啟用狀態 | ENABLED 2026-10-30 | Routine A/B/C 已建立；見 `docs/10_AGENCY_AND_SCHEDULE.md` |
| 遊戲美術素材 | NOT PROVIDED | 先以明確標註的 placeholder 開發 |
| Excel 題庫最新版本 | NOT INCLUDED | 由 ChatGPT 獨立交付並審核 |

| 學校 VS 學校的公會模式 | CONFIRMED CONCEPT | 詳見 `docs/07_SCHOOL_GUILD_BATTLE.md`；競技規則、校方授權、私隱仍待定 |
| 公會副本規則 | CONFIRMED 2026-10-30 | 玩家自建公會；共享高血量 Boss；限時作答、答對造成傷害；每人每天 1 次；週結按攻擊總量排名，人多有利屬刻意設計。數值仍待定 |
| 防作弊 | CONFIRMED 2026-10-30：低優先 | 遊戲原意是自主學習，排名只作鼓勵；只做基本措施，不建重型反作弊。私隱保護不變 |
| 畫風參考圖 | PROVIDED 2026-10-30 | 3 張，只存本機 `assets/style_references/`（不入 git）；分析見 `docs/06` |
| 角色比例 | CONFIRMED 2026-10-30 | Q 版 2.5 頭身（候選稿 A）；Art Bible 配色／線條／表情見 `docs/06` |
| 故事模式規則 | PROTOTYPE 2026-10-30 | 每關練習 2 題＋小 Boss 1 題；答錯不失敗，看解說後題目稍後重現；星數按一次答對數；過關解鎖下一關 |
| 教師審核機制 | PROPOSAL 2026-10-30 | 開發版「教師審核」畫面核准／退回（退回須寫原因）→ 匯出 teacher_reviews.csv → 匯入器套用；任何一方退回即退回；正式版只含 approved |
| 題目選項是否隨機打亂 | OPEN_DECISION | 故事題庫沒有 D 答案、DSE 題庫 D 只佔 3%；需用戶決定打亂選項或請 ChatGPT 平衡答案位置 |
