# Plan-scoped Records And Actual Expenses

Bookings, tickets, transport documents, tasks, activity notes, and expenses that depend on itinerary choices belong to a specific Trip Plan because different plans can use different dates, routes, costs, and commitments. Actual Expenses represent real paid or committed money and must not move automatically when the Main Plan changes; users must explicitly move, cancel, refund, or duplicate them as estimates.

**Decision**: A plan-scoped record that links an itinerary item must belong to the same Trip Plan as that item unless a later explicit cross-plan reference type is introduced. This invariant may be enforced in service code first and hardened with database constraints only after legacy data and support scripts have been audited.

**Legacy unlinked expenses**: During compatibility, an existing Actual Expense
without an itinerary link may be inferred to the active Main Plan for
`trip_plan_id` backfill so the record remains visible and editable. That
inference is attribution metadata only; it is not evidence that the money
occurred in that Trip Plan. Later hardening must audit those inferred rows and
let users explicitly move, cancel, refund, or duplicate them as Plan Estimates
when the inference is wrong.
