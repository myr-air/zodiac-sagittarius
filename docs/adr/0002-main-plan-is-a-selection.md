# Main Plan Is A Selection

The Main Plan is the Trip Plan currently selected for real-world use, not an immutable original plan. Any Trip Plan can become the Main Plan, and changing that selection must not merge, delete, or silently rewrite other plans.

**Decision**: During compatibility, the stored pointer `trips.active_plan_variant_id` is the authoritative Main Plan identity and is exposed as both `activePlanVariantId` and `mainTripPlanId`. Plan `status = 'main'` is display/workflow metadata that should be kept in sync by set-main transactions, but if pointer and status disagree, readers treat the pointer as canonical and repair status separately.
