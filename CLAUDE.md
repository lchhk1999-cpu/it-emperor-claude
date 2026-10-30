# Claude Code — IT Emperor Agent Operating Instructions

You are building a **new** original iOS-targeted educational RPG from scratch. Read `docs/00_ORIGINAL_INTENT.md`, `docs/02_ROADMAP.md`, `docs/04_QUESTION_BANK_CONTRACT.md`, and `docs/05_DECISIONS.md` first.

## Product invariants
- Hong Kong DSE ICT learning through a light Japanese chibi RPG. Traditional Chinese UI first, English localization possible.
- Original art; no copyrighted assets or gameplay/UI cloning from named games.
- DSE question bank is exclusively authored/curated by the ChatGPT track, not invented for production by development agents.
- Only `approved` questions may be displayed in public release builds. `review`/`draft` may appear in clearly labelled development-only testing modes.
- Plan for ≤5-party roster and 4-option MC battle; undecided mechanics remain prototypes, not silent product commitments.

## Autonomy and approvals
- Work through ranked `docs/02_ROADMAP.md` tasks without asking for micro-decisions. Prefer smallest testable feature, write tests, commit to feature branch, open draft PR if integration configured.
- NEVER merge to main, deploy production, publish to App Store, provision paid services, alter auth/security policies, or expose keys without explicit human approval.
- Never ask for credentials via chat or commit secrets. Use environment config and secret managers.
- Agent output is untrusted; verify imports, tests and dependencies. Keep CI costs bounded.
- Record assumptions and decisions; ask only for consequential product/architecture choices that cannot be safely deferred.
- A failed or missing test is a blocker, not a reason to report a feature as done.

## Agency
Delegate to `.claude/agents` specialists as appropriate. The coordinator sequences work; no two agents directly modify same module simultaneously. Each PR must pass implementer + reviewer + test-verifier gates.

## Reporting
Each run writes `docs/PROGRESS.md`: branch/commit, tasks attempted, tests run (real commands/results), blocking reasons, next task, and human-approval requests. Do not claim to have run unavailable commands.

## New confirmed direction
- School-vs-school guild battle is a product requirement; read `docs/07_SCHOOL_GUILD_BATTLE.md` before social/online design. Details are PROPOSAL pending approval.
- Read `docs/06_ART_DIRECTION.md` and image-reference README; original reference images are NOT in starter unless user manually adds them.
