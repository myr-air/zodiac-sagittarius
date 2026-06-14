# Trip Plan Language Over Plan Variants

Sagittarius will use **Trip Plan** as the domain and user-facing language for a complete named itinerary version, while keeping the existing `plan_variants` storage table during the transition. This avoids a high-risk table rename while creating an anti-corruption layer that stops `Trip Sheet`, `PlanVariant`, and generated `Plan A/B` wording from leaking into the product language.

**Considered Options**: Rename `plan_variants` immediately, or add canonical Trip Plan API fields and routes as a compatibility facade. The facade is the Phase 0/1 choice because it lets frontend, API clients, migrations, import/export, realtime events, and tests move in smaller verified steps.

**Consequences**: Phase 0/1 responses must carry both canonical fields (`tripPlans`, `mainTripPlanId`, `status`) and legacy fields (`planVariants`, `activePlanVariantId`, `kind`). New code should prefer Trip Plan language, while compatibility code keeps writing the legacy storage fields until a later migration removes them deliberately.

**Boundary**: Storage, legacy routes, and realtime event names may keep `plan_variant` during compatibility; product copy, new route helpers, API mappers, docs, and new domain-facing code should use Trip Plan language. The compatibility layer can be removed only after external callers, import/export, frontend state, realtime subscribers, and tests no longer require the legacy names.
