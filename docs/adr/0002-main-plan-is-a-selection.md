# Main Plan Is A Selection

The Main Plan is the Trip Plan currently selected for real-world use, not an immutable original plan. Any Trip Plan can become the Main Plan, and changing that selection must not merge, delete, or silently rewrite other plans.

**Decision**: During compatibility, the stored pointer `trips.active_plan_variant_id` is the authoritative Main Plan identity and is exposed as both `activePlanVariantId` and `mainTripPlanId`. Plan `status = 'main'` is display/workflow metadata that should be kept in sync by set-main transactions, but if pointer and status disagree, readers treat the pointer as canonical and repair status separately.

**Editing selection**: The Trip Plan a user is currently viewing or editing in the itinerary workspace is a UI/session selection, not the Main Plan pointer. Switching the itinerary selector must not call set-main, publish a plan, demote the previous Main Plan, or move plan-scoped records. Only an explicit set-main command changes the Main Plan.

**Consequences**: Local mode and API mode need two concepts in application state: the selected Trip Plan for editing/filtering and the Main Plan for real-world use. Create, import, and duplicate flows may select a draft Trip Plan for editing without making it Main. Tests must prove that selecting a draft changes the visible itinerary rows while `mainTripPlanId`/`activePlanVariantId` remain unchanged until the explicit set-main action succeeds.
