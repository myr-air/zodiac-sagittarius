# Learned

Project knowledge migrated from spacecraft missions.

## Solved

| Mission | Date | Problem | Solution | Evidence |
|---------|------|---------|----------|----------|
| M7XXVC84 | 2026-07-20 | Account create required client join credentials; portal lacked create-trip | Slim `POST /account/trips` + classify-trip-seed; landing/portal classify→review→create; uppercase `yymm-SLUG-suffix` join ids | account_trip_contract; create-trip FE tests; validate --strict |
| M7XJVDUV | 2026-07-20 | Landing `/` infinite-reloaded from unstable empty recent-search snapshots | Freeze shared `EMPTY_RECENT` for server + empty client `useSyncExternalStore` paths | landing-recent-snapshot-green; landing-home-no-reload-loop |
| M7X8ZO5N | 2026-07-19 | `/trips` was a stub; account home needed reference-matched layout with honest APIs | Draft-v3 HIL then AccountHome: live `/account`+trips+explorer; labeled placeholders for stories/friends/places | bun verify:frontend; validate --strict |
| M7X2O2BC | 2026-07-19 | Public `/` was a landing stub; need Postcard Atlas home with low-friction trip entry | Journeasy-inspired Joii landing: parallax hero, single query → `#create` stub (no auth), destinations, local recent, editorial bands, motion | bun verify; draft v4 approved; validate --strict |
| M7X446EU | 2026-07-19 | Landing could not create a real trip without account session (#172) | `POST /api/v1/public/trips` guest bootstrap (nullable owner, member session) + Start Planning wire; account create stays auth-gated | public_trip_create_contract; create-trip tests; validate --strict |
| M7X4UTQL | 2026-07-19 | Landing `getServerSnapshot` returned a fresh `[]` each call | Cache empty/client recent-search snapshots with stable identity | visual + typecheck |
| M7X4UTQL | 2026-07-19 | Hero / destination media and primary CTA text regressed after Tailwind/CSS layering | Inline hero image; `<img>` destinations; drop `a { color: inherit }`; use on-primary token | visual check on `/` |
| — | 2026-07-19 | OpenAPI handlers annotated with `JsonValue` placeholders (#171) | Optional `openapi` feature + `ToSchema` on wire types; typed path bodies; contract asserts named schemas | `cargo test -p sagittarius-api --test openapi_contract` |
| — | 2026-07-19 | Landing lacked EN/TH; auth draft-parity polish open (#173/#174) | Shared `LocaleSwitch` + draft-v3 thumbnail/tip/radius | bun verify:frontend |

## Lessons

| Mission | Date | Lesson | Why it matters |
|---------|------|--------|----------------|
| M7XXVC84 | 2026-07-20 | Record an explicit scope cut when shipping a thinner slice of an approved UX draft | Acceptance stays honest; the full mock remains north-star without blocking ship |
| M7XXVC84 | 2026-07-20 | Keep human-entered share codes entirely one case (or normalize store and lookup the same way) | Mixed-case display vs uppercased auth causes join failures and copy confusion |
| M7XKCPVU | 2026-07-20 | Keep playful document metaphors, but paint them with the same borders, shadows, and brand marks as the surrounding shell | Skeuomorphic cards otherwise read as a second product inside the page |
| M7XJVDUV | 2026-07-20 | Server and empty-client `useSyncExternalStore` snapshots must return the same cached empty reference every call | Fresh `[]` identities trigger React max update depth and Fast Refresh reload loops |
| M7X8ZO5N | 2026-07-19 | Lock reference layout via draft HTML first; keep live-data honesty as labeled Preview panels when APIs are missing | Prevents ops-stub drafts that users reject for not looking like the mock |
| M7WZPF5E | 2026-07-19 | After GREEN, re-capture evidence with an explicit mission id and confirm a new exitCode 0 JSONL row for each plan label — console success alone is not enough | Evidence-gated closeouts fail when only RED-phase rows remain for a label |
| M7X2O2BC | 2026-07-19 | On a public entry surface, seed only what unlocks the next step (destination query); defer From/Dates/Party to create/cockpit | Multi-field Flights forms raise friction and fight no-auth-first create |
| M7X2O2BC | 2026-07-19 | `spacecraft validate --strict` requires evidence labels that exactly match each plan task `evidence[]` entry | Aggregate verify labels do not satisfy per-task gates |
| M7X446EU | 2026-07-19 | Prefer an explicit anonymous bootstrap that mints the resource session type over relaxing account-authenticated create | Keeps account auth boundaries intact while enabling guest entry |
| M7X4UTQL | 2026-07-19 | Unlayered `a { color: inherit }` overrides Tailwind text color utilities; keep base resets in `@layer base` or omit inherit | Filled primary link CTAs otherwise render body text on brand fills |
| M7X4UTQL | 2026-07-19 | A blank media card is often a 404 asset URL, not a CSS overlay bug — verify the image HTTP status first | Saves time vs debugging gradients/z-index when remote CDN URLs rot |
