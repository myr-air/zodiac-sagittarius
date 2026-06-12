# Compatibility-first Trip Plan Rollout

Phase 0/1 will ship Trip Plan language and canonical API aliases before any storage rename or itinerary hierarchy UI rebuild. This keeps the existing `plan_variants` table, legacy routes, and local-mode state usable while establishing the new contract through `tripPlans`, `mainTripPlanId`, `status`, and `/trip-plans`.

**Considered Options**: Rename storage and rebuild the itinerary table in one large slice, or add a compatibility facade first. The compatibility-first rollout is the decision because Trip Plan selection affects itinerary rows, booking docs, tasks, expenses, stop notes, import/export, realtime events, and local history; splitting the contract from the UI rewrite reduces migration risk and gives API/local-mode tests a stable target.

**Consequences**: Phase 0/1 must be treated as a contract phase. It may add aliases, validation, routes, migration columns, and tests, but it must not silently move actual expenses, flatten activities, remove legacy fields, infer the Main Plan from repairable status metadata, or make unsupported duplicate/import plan creation look successful.

**Phase 0/1 freeze**: Phase 1 acceptance is blocked until [the implementation spec](../itinerary-trip-plan-phase-0-1-implementation-spec.md) lists the additive API request/response diffs for cockpit, account trip create/join responses, create, patch, set-main, realtime, and import/export; the `plan_variants.status` migration DDL draft with rollback and raw-write repair rules; and the exact tests that prove canonical-only, legacy-only, and mixed payloads all normalize to the same Trip Plan state.
