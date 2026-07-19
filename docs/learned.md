# Learned

Project knowledge migrated from spacecraft missions.

## Solved

| Mission | Date | Problem | Solution | Evidence |
|---------|------|---------|----------|----------|
| M7X2O2BC | 2026-07-19 | Public `/` was a landing stub; need Postcard Atlas home with low-friction trip entry | Journeasy-inspired Joii landing: parallax hero, single query → `#create` stub (no auth), destinations, local recent, editorial bands, motion | bun verify; draft v4 approved; validate --strict |
| M7X446EU | 2026-07-19 | Landing could not create a real trip without account session (#172) | `POST /api/v1/public/trips` guest bootstrap (nullable owner, member session) + Start Planning wire; account create stays auth-gated | public_trip_create_contract; create-trip tests; validate --strict |

## Lessons

| Mission | Date | Lesson | Why it matters |
|---------|------|--------|----------------|
| M7WZPF5E | 2026-07-19 | After GREEN, re-capture evidence with an explicit mission id and confirm a new exitCode 0 JSONL row for each plan label — console success alone is not enough | Evidence-gated closeouts fail when only RED-phase rows remain for a label |
| M7X2O2BC | 2026-07-19 | On a public entry surface, seed only what unlocks the next step (destination query); defer From/Dates/Party to create/cockpit | Multi-field Flights forms raise friction and fight no-auth-first create |
| M7X2O2BC | 2026-07-19 | `spacecraft validate --strict` requires evidence labels that exactly match each plan task `evidence[]` entry | Aggregate verify labels do not satisfy per-task gates |
| M7X446EU | 2026-07-19 | Prefer an explicit anonymous bootstrap that mints the resource session type over relaxing account-authenticated create | Keeps account auth boundaries intact while enabling guest entry |
