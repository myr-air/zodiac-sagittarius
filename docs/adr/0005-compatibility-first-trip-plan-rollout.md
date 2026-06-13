# Compatibility-first Trip Plan Rollout

Phase 0/1 will ship Trip Plan language and canonical API aliases before any storage rename or itinerary hierarchy UI rebuild. This keeps the existing `plan_variants` table, legacy routes, and local-mode state usable while establishing the new contract through `tripPlans`, `mainTripPlanId`, `status`, and `/trip-plans`.

**Considered Options**: Rename storage and rebuild the itinerary table in one large slice, or add a compatibility facade first. The compatibility-first rollout is the decision because Trip Plan selection affects itinerary rows, booking docs, tasks, expenses, stop notes, import/export, realtime events, and local history; splitting the contract from the UI rewrite reduces migration risk and gives API/local-mode tests a stable target.

**Consequences**: Phase 0/1 must be treated as a contract phase. It may add aliases, validation, routes, migration columns, and tests, but it must not silently move actual expenses, flatten activities, remove legacy fields, infer the Main Plan from repairable status metadata, or make unsupported duplicate/import plan creation look successful.

**Phase 0/1 freeze**: Phase 1 acceptance is blocked until [the implementation spec](../itinerary-trip-plan-phase-0-1-implementation-spec.md) lists the additive API request/response diffs for cockpit, account trip create/join responses, create, patch, set-main, realtime, and import/export; the `plan_variants.status` migration DDL draft with rollback and raw-write repair rules; and the exact tests that prove canonical-only, legacy-only, and mixed payloads all normalize to the same Trip Plan state.

**Concurrency boundary**: Set-main does not take `expectedVersion` in Phase 1.
The compatibility route is last-writer-wins after transactional row locks, while
duplicate `clientMutationId` values remain rejected by the existing mutation
guard. Adding a future optional `expectedTripVersion` is allowed as a hardening
change; making it mandatory or changing no-version behavior requires a new ADR.

**Legacy path boundary**: Existing overlap-generated path data may remain as
compatibility state in Phase 0/1, but it is not canonical Alternative Path
semantics. New imports must not synthesize Alternative Paths from sibling
overlaps, and Phase 4 needs a separate ADR before deleting, migrating, or
explicitly converting legacy path data.

**Contract freeze detail**: Phase 1 compatibility responses must be additive and
deterministic. Backend-owned Trip Plan responses emit `status`; mixed
`tripPlans`/`planVariants` payloads must not drift; import/export compatibility
uses the existing top-level `trip` envelope rather than inventing a parallel
`metadata` envelope; create, patch, and set-main realtime mutations keep legacy
`plan_variant.*` wrappers while carrying canonical aliases; and Main Plan repair
always follows the stored trip pointer before repairable status metadata.
