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
| 先前聊天附上的理想畫風圖片 | NOT INCLUDED | 需使用者另放在 `assets/style_references/`；目前只有文字方向 |
