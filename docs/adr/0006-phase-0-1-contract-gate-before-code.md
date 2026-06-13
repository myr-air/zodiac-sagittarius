# Phase 0/1 Contract Gate Before Code

Phase 0/1 Trip Plan work must freeze the compatibility contract before production code changes continue. The implementation-start gate is the combination of route-by-route API response diffs, an additive migration DDL draft checked against the shipped migration files, and an exact scenario-level test matrix; if implementation discovers a route, column, rollback stance, or test target is wrong, this ADR and the implementation spec must change before the code does.

**Considered Options**: Let API, migration, and test details emerge during implementation, or require a pre-code contract packet. Sagittarius chooses the pre-code packet because Trip Plan compatibility crosses backend DTOs, frontend mappers, local mode, realtime, import/export, booking and expense scope, and already-applied migrations; letting one layer move first would make alias drift and silent record movement too easy to ship.

**Consequences**: Phase 1 implementation commits should reference the spec's `API-*`, `DDL-*`, and `TEST-*` ids. Code may be split into smaller slices, but each slice must preserve canonical and legacy aliases together, keep Main Plan mutation separate from itinerary workspace selection, and prove through tests that Actual Expenses and other plan-scoped records do not move when the Main Plan changes.
