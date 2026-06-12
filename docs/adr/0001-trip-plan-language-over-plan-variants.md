# Trip Plan Language Over Plan Variants

Sagittarius will use **Trip Plan** as the domain and user-facing language for a complete named itinerary version, while keeping the existing `plan_variants` storage table during the transition. This avoids a high-risk table rename while creating an anti-corruption layer that stops `Trip Sheet`, `PlanVariant`, and generated `Plan A/B` wording from leaking into the product language.
