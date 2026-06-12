# Plan-scoped Records And Actual Expenses

Bookings, tickets, transport documents, tasks, activity notes, and expenses that depend on itinerary choices belong to a specific Trip Plan because different plans can use different dates, routes, costs, and commitments. Actual Expenses represent real paid or committed money and must not move automatically when the Main Plan changes; users must explicitly move, cancel, refund, or duplicate them as estimates.

**Decision**: A plan-scoped record that links an itinerary item must belong to the same Trip Plan as that item unless a later explicit cross-plan reference type is introduced. This invariant may be enforced in service code first and hardened with database constraints only after legacy data and support scripts have been audited.
