# Itinerary Hierarchy And Time Windows

The itinerary hierarchy is exactly Plan Day -> Activity -> Sub-activity, with Activity Blocks emerging from activities that have sub-activities. Activity time is modeled for users as an optional Time Window with start and optional end that can cross days, while duration remains derived or compatibility data during migration.

**Considered Options**: Keep a flat itinerary and represent journeys through repeated sibling rows, allow arbitrary-depth nesting, or use one explicit child level under real activities. The one-child-level hierarchy is the decision because organizers need grouped journey blocks such as airport buffer -> ticketed segment -> immigration, but arbitrary nesting makes ordering, warnings, mobile editing, import/export, and plan comparison harder to reason about.

**Decision**: A Trip Plan contains Plan Days; a Plan Day contains top-level Activities; an Activity may contain Sub-activities; a Sub-activity cannot contain children. A parent activity that has children is still an Activity Block with its own name, type, details, and time window. Sibling overlaps remain sibling activities with warnings unless a user deliberately changes hierarchy or creates an explicit Alternative Path in a later phase.

**Time model**: Users enter start and end times, not duration. `endTime` is optional. `endOffsetDays` records cross-day endings such as `02:00+1`; duration is derived only when enough data exists. A timed sub-activity should sit inside its parent Activity Block's time window; violations are warnings in the hierarchy phase, not automatic rewrites.

**Consequences**: Import/export, API responses, local state, and UI sorting must preserve `parentItemId`, `isPlanBlock`, `endTime`, and `endOffsetDays`. Backend validation must block self-parent, grandchild nesting, cycles, and cross-plan/cross-day parents before the UI can rely on hierarchy. Existing path fields remain compatibility data; overlap detection must not synthesize Alternative Paths from parallel sibling activities.
