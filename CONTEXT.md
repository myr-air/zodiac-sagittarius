# Sagittarius

Sagittarius is a group-trip planning context for organizing a shared itinerary, members, trip decisions, and shared costs.

## Language

**Trip Plan**:
A complete named version of the trip itinerary, including its own days, activities, and sub-activities. A trip can have multiple trip plans for real use, drafts, backups, or client proposals.
_Avoid_: Sheet, plan variant

**Main Plan**:
The trip plan currently selected as the plan to use in real life. Any trip plan can become the main plan.
_Avoid_: Original plan, default-only plan

**Backup Plan**:
A named trip plan kept as an operational fallback to the main plan, such as a rain plan or budget plan.
_Avoid_: Draft sheet, Plan A, proposal plan

**Proposal Plan**:
A named trip plan prepared for presentation or comparison before it is chosen for real-world use.
_Avoid_: Backup Plan

**Plan Status**:
The role of a trip plan in the planning workflow, such as main, draft, proposal, or backup. A plan status is separate from the plan's name.
_Avoid_: Plan name, sheet kind

**Plan-scoped Record**:
A booking, ticket, transport document, expense, task, or activity note that belongs to a specific trip plan because a different plan may use different dates, transport, costs, or commitments.
_Avoid_: Shared itinerary record

**Actual Expense**:
Money that a trip member has really paid or committed to pay. Actual expenses stay with the trip plan where they occurred unless a person explicitly moves, cancels, refunds, or duplicates them as an estimate.
_Avoid_: Budget estimate, auto-moved expense

**Plan Estimate**:
A projected cost used to compare or present a trip plan before the money is actually paid.
_Avoid_: Actual expense

**Plan Commitment**:
A booking, ticket, hotel stay, transport reservation, or other real-world commitment tied to a trip plan. A plan commitment may have a linked actual expense when money has been paid or committed.
_Avoid_: Standalone booking

**Plan Check Suggestion**:
A system-detected planning issue or improvement candidate. A plan check suggestion can recommend an edit, dismissal, snooze, or review path, but it does not change the itinerary, trip plan, actual expenses, or commitments until a person explicitly chooses what to do.
_Avoid_: Auto-fix, silent correction

**Journey Block**:
An activity block that represents the full operational window of a journey, including buffer time before and after the ticketed segment. The ticketed flight, train, or transport segment can be a sub-activity within the journey block.
_Avoid_: Flight-only activity

**Ticketed Segment**:
The specific flight, train, ferry, bus, or other transport segment that has a ticket or reservation. A ticketed segment can sit inside a broader journey block.
_Avoid_: Whole journey, transfer buffer

**Itinerary**:
The ordered trip plan grouped by day and made of activities that the group can compare, edit, and follow.
_Avoid_: Schedule, agenda

**Activity**:
A planned item in a day of the itinerary. An activity can stand alone or contain sub-activities.
_Avoid_: Stop, row

**Activity Type**:
A broad category used to keep planning fast: transport, stay, food, activity, or note. Specific details such as flight, train, hotel, ticket, or reservation belong in the activity's details or commitment, not in the top-level type.
_Avoid_: Over-specific type list

**Sub-activity**:
A child activity nested under another activity. When a sub-activity has time, it belongs within its parent activity's time window, and the itinerary does not nest below this level.
_Avoid_: Child item, nested row

**Flexible Sub-activity**:
A sub-activity without a fixed time. Flexible sub-activities stay inside their activity block and follow the user's manual order.
_Avoid_: Unscheduled child item, inferred time

**Time Window**:
The optional start and end time for an activity or sub-activity. A time window may be incomplete, and its end may fall on a later day.
_Avoid_: Required duration

**Activity Block**:
An activity that has sub-activities while still being a real itinerary activity with its own details.
_Avoid_: Plan block, container

**Day Activity Order**:
The order of top-level activities within a day. Sub-activities stay with their parent activity block instead of being interleaved with sibling activities by time.
_Avoid_: Global time interleaving

**Plan Day**:
A day that belongs to a specific trip plan. Different trip plans in the same trip may have different dates or day counts.
_Avoid_: Global trip day

**Parallel Activities**:
Sibling activities in the same day whose time windows overlap. Parallel activities remain separate activities unless a person explicitly nests one as a sub-activity.
_Avoid_: Automatic sub-activities, automatic alternatives

**Parallel Overlap Warning**:
A warning that sibling activities or sibling sub-activities have overlapping time windows. The warning does not turn the activities into alternatives or nested activities by itself.
_Avoid_: Auto-fix overlap, implicit alternative

**Sub-activity Bounds Warning**:
A warning that a timed sub-activity sits outside its parent activity block's time window.
_Avoid_: Child conflict

**Alternative Path**:
An explicit route option for comparing alternate sets of activities, such as a rain route or outdoor route. Alternative paths are chosen deliberately, are not created merely because sibling activities overlap, and apply to top-level activities with sub-activities following their parent activity.
_Avoid_: Automatic Plan A, automatic Plan B
