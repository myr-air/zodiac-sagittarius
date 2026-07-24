/**
 * @vitest-environment happy-dom
 *
 * ItineraryContextRail — unified empty cue + Resolve honesty (M81LW2UJ T5).
 * Landmarks: places-bulk-ingest-draft-v1.html rail (Map link / Resolve) +
 * empty selection must not compete as dual cards.
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import {
  ItineraryContextRail,
  type ItineraryContextSelectedItem,
} from "./ItineraryContextRail";
import { seedFieldBag } from "../../src/trip/itinerary-type-fields";
import type { PlanSuggestionSummary } from "../../src/trip/plan-check-api";

/** Competing dual-card titles from the pre-fix empty rail (must not both appear). */
const CTX_EMPTY_TITLE = "No activity selected";
const EMPTY_START_HEADING = "Start here";
/** Clear empty guidance — kept as the single empty cue body. */
const EMPTY_START_BODY = "Add under a day. Fields appear as you enrich.";

/** Draft rail Map link (places-bulk-ingest-draft-v1.html #rail-link). */
const MAP_LINK_LABEL = "Map link";
const MAP_LINK_PLACEHOLDER = "Resolve to fill";
/** Draft rail Resolve control — optional if Place-cell Resolve is the trigger. */
const RAIL_RESOLVE_LABEL = "Resolve place";
/** Dishonest fallback copy when no Map link field exists to paste into. */
const PASTE_MAP_LINK_CLAIM = /paste a map link/i;

describe("ItineraryContextRail empty-start cue", () => {
  afterEach(() => {
    cleanup();
  });

  it("With no selection, rail shows a single empty cue (not competing No activity selected + Start here dual cards)", () => {
    render(<ItineraryContextRail />);

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });

    const emptyTitle = within(context).queryByRole("heading", {
      name: new RegExp(`^${CTX_EMPTY_TITLE}$`, "i"),
    });
    const startHere = within(context).queryByRole("heading", {
      name: new RegExp(`^${EMPTY_START_HEADING}$`, "i"),
    });

    // Unified empty: exactly one of the former dual-card headings — not both.
    const competingCueCount = [emptyTitle, startHere].filter(Boolean).length;
    expect(competingCueCount).toBe(1);

    // Still a clear empty cue with guidance (not a marketing card grid).
    expect(within(context).getByText(EMPTY_START_BODY)).toBeInTheDocument();
    expect(within(context).queryAllByRole("article")).toHaveLength(0);

    // Empty state must not show competing CTAs (e.g. Resolve beside Start here).
    expect(
      within(context).queryByRole("button", { name: new RegExp(RAIL_RESOLVE_LABEL, "i") }),
    ).not.toBeInTheDocument();
    expect(
      within(context).queryByRole("button", { name: /^resolve$/i }),
    ).not.toBeInTheDocument();
  });
});

/**
 * M82LQRZD T4 #1 — plan-check-inspector-draft-v3.html: empty rail (no stop
 * selected) shows plan-check chrome (#run-check + mode-idle/never/clean
 * copy) instead of the pre-existing "No activity selected" cue, and must
 * NOT render a detached full-plan finding queue (draft note: "empty rail =
 * Run/stale/empty only (no split-out full queue)"). Props are stubs pinned
 * ahead of full page orchestration (planCheckMode / planPendingCount /
 * onRunPlanCheck) — no page wiring here.
 */
describe("ItineraryContextRail plan-check empty state (M82LQRZD T4 #1)", () => {
  afterEach(() => {
    cleanup();
  });

  it("With no stop selected the rail shows plan-check chrome (Run check + never-checked / zero-findings / idle summary count) and NOT a detached full-plan finding queue", () => {
    const onRunPlanCheck = vi.fn();

    const { rerender } = render(
      <ItineraryContextRail
        planCheckMode="idle"
        planPendingCount={3}
        onRunPlanCheck={onRunPlanCheck}
      />,
    );

    let context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });

    // Draft #run-check (.btn-run) — always available when nothing selected.
    const runCheckBtn = within(context).getByRole("button", {
      name: /run check/i,
    });
    expect(runCheckBtn).toBeInTheDocument();

    // Draft mode-idle summary: "<em>3 checks</em> on this plan — open a stop
    // with a cue to triage." — derived from planPendingCount, not hardcoded.
    expect(
      within(context).getByText(/3 checks?/i),
    ).toBeInTheDocument();
    expect(within(context).getByText(/on this plan/i)).toBeInTheDocument();

    // NOT a detached full-plan finding queue (draft .queue-list / .finding
    // triage rows belong only to a selected stop, never the empty rail).
    expect(within(context).queryByRole("list")).not.toBeInTheDocument();
    expect(
      within(context).queryAllByRole("button", { name: /^accept$/i }),
    ).toHaveLength(0);
    expect(
      within(context).queryAllByRole("button", { name: /^dismiss$/i }),
    ).toHaveLength(0);

    fireEvent.click(runCheckBtn);
    expect(onRunPlanCheck).toHaveBeenCalledTimes(1);

    // Draft mode-never: "No plan check yet" / run-to-check guidance.
    rerender(
      <ItineraryContextRail
        planCheckMode="never"
        onRunPlanCheck={onRunPlanCheck}
      />,
    );
    context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    expect(within(context).getByText(/no plan check yet/i)).toBeInTheDocument();
    expect(
      within(context).getByRole("button", { name: /run check/i }),
    ).toBeInTheDocument();
    expect(within(context).queryByRole("list")).not.toBeInTheDocument();
    expect(
      within(context).queryAllByRole("button", { name: /^accept$/i }),
    ).toHaveLength(0);

    // Draft mode-clean: "No suggestions right now" (zero findings).
    rerender(
      <ItineraryContextRail
        planCheckMode="clean"
        onRunPlanCheck={onRunPlanCheck}
      />,
    );
    context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    expect(
      within(context).getByText(/no suggestions right now/i),
    ).toBeInTheDocument();
    expect(within(context).queryByRole("list")).not.toBeInTheDocument();
    expect(
      within(context).queryAllByRole("button", { name: /^accept$/i }),
    ).toHaveLength(0);
  });
});

/**
 * M82LQRZD T4 #2 — plan-check-inspector-draft-v3.html stale mode: a stale
 * fingerprint surfaces the calm stale cue on the empty rail without
 * auto-invoking onRunPlanCheck on render/mount (no silent auto-rerun).
 * Clicking Run check still invokes onRunPlanCheck so the parent can POST
 * runPlanCheck — that POST/orchestration itself is T7, not asserted here.
 */
describe("ItineraryContextRail stale plan-check cue (M82LQRZD T4 #2)", () => {
  afterEach(() => {
    cleanup();
  });

  it("Run check click invokes onRunPlanCheck; stale mode shows stale cue without auto-invoking onRunPlanCheck on render", () => {
    const onRunPlanCheck = vi.fn();

    render(
      <ItineraryContextRail
        planCheckMode="stale"
        onRunPlanCheck={onRunPlanCheck}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });

    // Calm stale cue visible, draft copy ("Plan changed since this check…") —
    // must not auto-call onRunPlanCheck just from mounting in stale mode.
    const staleCue = within(context).getByText(
      /plan changed since this check/i,
    );
    expect(staleCue).toBeInTheDocument();
    expect(staleCue).toHaveClass("stale-cue");
    expect(onRunPlanCheck).not.toHaveBeenCalled();

    // Run check is still available and, when clicked, invokes onRunPlanCheck
    // (parent performs the actual runPlanCheck POST — T7 orchestration).
    const runCheckBtn = within(context).getByRole("button", {
      name: /run check/i,
    });
    fireEvent.click(runCheckBtn);
    expect(onRunPlanCheck).toHaveBeenCalledTimes(1);
  });
});

describe("ItineraryContextRail Resolve honesty", () => {
  afterEach(() => {
    cleanup();
  });

  it("Selected stop exposes Map link so paste-map-link is honest; rail does not claim paste without that field", () => {
    render(
      <ItineraryContextRail
        selectedItem={{
          id: "item-rail-resolve-honesty",
          activity: "Ichiran dinner",
          activityType: "food",
          status: "idea",
          dayLabel: "Day 1",
          fieldBag: {
            place: "Ichiran Shinjuku",
            meal: "Dinner",
            reservation: "",
          },
        }}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });

    // Draft #rail-link — paste path / resolve fill target lives in the rail.
    const mapLink = within(context).getByLabelText(
      new RegExp(`^${MAP_LINK_LABEL}$`, "i"),
    );
    expect(mapLink).toHaveAttribute("placeholder", MAP_LINK_PLACEHOLDER);

    // Honesty: never claim paste-map-link without the Map link field above.
    const pasteClaim = within(context).queryByText(PASTE_MAP_LINK_CLAIM);
    if (pasteClaim) {
      expect(mapLink).toBeInTheDocument();
    }

    // If rail Resolve is present (draft #btn-resolve-rail), Map link must pair it.
    // Place-cell Resolve alone is OK — no rail Resolve required.
    const railResolve = within(context).queryByRole("button", {
      name: new RegExp(RAIL_RESOLVE_LABEL, "i"),
    });
    if (railResolve) {
      expect(mapLink).toBeInTheDocument();
    }
  });
});

/**
 * M81DDKSC T4 #2 — rail fields with no /api/v1 itinerary-item persistence
 * (table soft-map has no target) must be clearly read-only, not silent
 * local-only bag writes that look saved.
 * Independent literal: food Reservation — no place/activitySubtype/details
 * mapping on existing PATCH (unlike Meal → details.meal).
 */
const FOOD_SELECTED = {
  id: "item-rail-food-readonly",
  activity: "Ichiran",
  activityType: "food",
  status: "idea",
  dayLabel: "Day 1",
  fieldBag: {
    place: "Ichiran Shinjuku",
    meal: "Lunch",
    reservation: "",
  },
} as const;
const RESERVATION_TYPED = "Name · booking # silent-local";

describe("ItineraryContextRail non-persistent type fields", () => {
  afterEach(() => {
    cleanup();
  });

  it("Any rail field that cannot persist on existing /api/v1 is clearly read-only (not a silent local-only write that looks saved)", async () => {
    const user = userEvent.setup();
    const onFieldBagChange = vi.fn();

    render(
      <ItineraryContextRail
        selectedItem={{ ...FOOD_SELECTED, fieldBag: { ...FOOD_SELECTED.fieldBag } }}
        onFieldBagChange={onFieldBagChange}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    const reservation = within(context).getByLabelText(/^reservation$/i);

    // Same affordance as Day Time Duration: readonly — not an editable control
    // that quietly mutates the local bag and looks saved.
    expect(reservation).toHaveAttribute("readonly");
    expect(reservation).toHaveValue("");
    // Visual mute (DESIGN.md calm tokens) — not attribute-only.
    expect(reservation.className).toMatch(/color-surface-muted/);
    expect(reservation.className).toMatch(/color-text-muted/);

    await user.type(reservation, RESERVATION_TYPED);

    expect(reservation).toHaveValue("");
    expect(onFieldBagChange).not.toHaveBeenCalled();
  });
});

/**
 * M82GSOYG T3 #2 — rail commitRailField already delegates to
 * softMapBagKeyToPatch (T1, already done), so a From/To/By edit must PATCH
 * details.origin/details.destination/details.mode (not just the derived
 * activity/activitySubtype). After a simulated reload — the app re-seeding
 * selectedItem.fieldBag via seedFieldBag(patchedItem), same as T2 — the rail
 * must still show the typed From/To/By (hydrate accepts the API detail key
 * set, not only the legacy bag). Independent literals distinct from the
 * table's M82GSOYG T3 #1 fixtures above.
 */
const RAIL_ROUTE_ITEM_ID = "item-rail-travel-details-roundtrip";
const RAIL_ROUTE_TRIP_ID = "trip-rail-details-roundtrip";
const RAIL_ROUTE_SESSION_TOKEN = "member-session-token-rail-details-roundtrip";
const RAIL_ROUTE_API_BASE = "http://127.0.0.1:5181";
const RAIL_ROUTE_FROM = "Denpasar";
const RAIL_ROUTE_TO = "Ubud";
const RAIL_ROUTE_BY = "car";
const RAIL_ROUTE_INITIAL_VERSION = 2;
const RAIL_ROUTE_INITIAL_ACTIVITY = "Flight";

/**
 * Minimal controlled harness (mirrors ItineraryPlanPage's rail wiring): holds
 * the selected item's fieldBag/version and, on a successful PATCH, re-seeds
 * the bag from the persisted item via seedFieldBag — the same hydrate step a
 * real reload performs.
 */
function RailHarness({
  initialItem,
  ...railProps
}: {
  initialItem: ItineraryContextSelectedItem;
  tripId: string;
  sessionToken: string;
  apiBaseUrl: string;
  fetch: typeof fetch;
  onPatchedSpy: (item: Parameters<NonNullable<Parameters<typeof ItineraryContextRail>[0]["onPatched"]>>[0]) => void;
}) {
  const [item, setItem] = useState<ItineraryContextSelectedItem>(initialItem);
  return (
    <ItineraryContextRail
      {...railProps}
      selectedItem={item}
      onFieldBagChange={(_, fieldBag) =>
        setItem((prev) => ({ ...prev, fieldBag }))
      }
      onPatched={(patched) => {
        railProps.onPatchedSpy(patched);
        setItem((prev) => ({
          ...prev,
          version: patched.version,
          activity: patched.activity,
          fieldBag: seedFieldBag(patched),
        }));
      }}
    />
  );
}

describe("ItineraryContextRail softMapBagKeyToPatch details persistence + reload hydrate (M82GSOYG T3)", () => {
  afterEach(() => {
    cleanup();
  });

  it("rail From/To/By edits PATCH details.origin/details.destination/details.mode, and a simulated reload (seedFieldBag re-seed) still shows the typed From/To/By", async () => {
    const user = userEvent.setup();

    // Simulated backend: merges + echoes back only what patch.details/activitySubtype
    // actually carried (no client-only memory) — proves real persistence.
    let persistedDetails: Record<string, unknown> = {};
    let persistedActivity = RAIL_ROUTE_INITIAL_ACTIVITY;
    let persistedActivitySubtype: string | null | undefined;
    let persistedVersion = RAIL_ROUTE_INITIAL_VERSION;

    const fetchMock = vi.fn(async (_input: unknown, init?: RequestInit) => {
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method !== "PATCH") {
        return new Response(
          JSON.stringify({ error: { message: "unexpected" } }),
          { status: 404 },
        );
      }
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        patch?: {
          activity?: string;
          activitySubtype?: string | null;
          details?: Record<string, unknown>;
        };
      };
      if (body.patch?.activity !== undefined) {
        persistedActivity = body.patch.activity;
      }
      if (body.patch?.activitySubtype !== undefined) {
        persistedActivitySubtype = body.patch.activitySubtype;
      }
      if (body.patch?.details) {
        persistedDetails = { ...persistedDetails, ...body.patch.details };
      }
      persistedVersion += 1;
      return new Response(
        JSON.stringify({
          id: RAIL_ROUTE_ITEM_ID,
          tripId: RAIL_ROUTE_TRIP_ID,
          planVariantId: "plan-rail-details-roundtrip",
          day: "2026-04-12",
          activity: persistedActivity,
          activityType: "travel",
          activitySubtype: persistedActivitySubtype ?? undefined,
          place: "",
          startTime: "09:00",
          status: "idea",
          version: persistedVersion,
          details: persistedDetails,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });

    const onPatchedSpy = vi.fn();

    render(
      <RailHarness
        initialItem={{
          id: RAIL_ROUTE_ITEM_ID,
          activity: RAIL_ROUTE_INITIAL_ACTIVITY,
          activityType: "travel",
          status: "idea",
          dayLabel: "Day 1",
          version: RAIL_ROUTE_INITIAL_VERSION,
          fieldBag: { from: "", to: "", by: "" },
        }}
        tripId={RAIL_ROUTE_TRIP_ID}
        sessionToken={RAIL_ROUTE_SESSION_TOKEN}
        apiBaseUrl={RAIL_ROUTE_API_BASE}
        fetch={fetchMock as unknown as typeof fetch}
        onPatchedSpy={onPatchedSpy}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });

    // --- To blur → PATCH must carry details.origin/details.destination ---
    // fireEvent.change (not user.type) avoids an incidental blur-on-focus-shift
    // commit for "from" alone before "to" is filled in (matches the table's
    // equivalent From/To PATCH test pattern).
    const fromInput = within(context).getByLabelText(/^from$/i);
    const toInput = within(context).getByLabelText(/^to$/i);
    fireEvent.change(fromInput, { target: { value: RAIL_ROUTE_FROM } });
    fireEvent.change(toInput, { target: { value: RAIL_ROUTE_TO } });
    fireEvent.blur(toInput);

    await waitFor(() => {
      expect(onPatchedSpy).toHaveBeenCalledTimes(1);
    });
    const routeCall = fetchMock.mock.calls.find(
      ([, init]) => String((init as RequestInit | undefined)?.method ?? "").toUpperCase() === "PATCH",
    )!;
    const routeBody = JSON.parse(
      String((routeCall[1] as RequestInit | undefined)?.body ?? "{}"),
    ) as { patch?: Record<string, unknown> };
    expect(routeBody.patch).toEqual(
      expect.objectContaining({
        details: expect.objectContaining({
          origin: RAIL_ROUTE_FROM,
          destination: RAIL_ROUTE_TO,
        }),
      }),
    );

    // --- By select → PATCH must carry details.mode alongside activitySubtype ---
    fetchMock.mockClear();
    onPatchedSpy.mockClear();
    const byField = within(context).getByLabelText(/^by$/i);
    await user.selectOptions(byField, RAIL_ROUTE_BY);
    await waitFor(() => {
      expect(onPatchedSpy).toHaveBeenCalledTimes(1);
    });
    const byCall = fetchMock.mock.calls.find(
      ([, init]) => String((init as RequestInit | undefined)?.method ?? "").toUpperCase() === "PATCH",
    )!;
    const byBody = JSON.parse(
      String((byCall[1] as RequestInit | undefined)?.body ?? "{}"),
    ) as { patch?: Record<string, unknown> };
    expect(byBody.patch).toEqual(
      expect.objectContaining({
        activitySubtype: RAIL_ROUTE_BY,
        details: expect.objectContaining({ mode: RAIL_ROUTE_BY }),
      }),
    );

    // --- Reload hydrate: after the harness re-seeds fieldBag via
    // seedFieldBag(patchedItem) (same as a real cockpit reload), the rail
    // must still show From/To/By — not just the top-level fields.
    await waitFor(() => {
      expect(within(context).getByLabelText(/^from$/i)).toHaveValue(
        RAIL_ROUTE_FROM,
      );
      expect(within(context).getByLabelText(/^to$/i)).toHaveValue(
        RAIL_ROUTE_TO,
      );
      expect(within(context).getByLabelText(/^by$/i)).toHaveValue(
        RAIL_ROUTE_BY,
      );
    });
  });
});

/**
 * M82LQRZD T5 #1 — plan-check-inspector-draft-v3.html mode-selected: a
 * selected stop with pending plan-check findings keeps its existing details
 * (title + Type fields panel) and adds a "Checks for this stop" triage list
 * (severity, explanation.en, recommendedAction.en, Accept/Dismiss/Snooze),
 * scoped to only that stop's pending findings — a sibling stop's finding
 * must not leak into the rail. `planCheckFindingsByStop` mirrors the shape
 * SmartItineraryTable already accepts (M82LQRZD T3 #1,
 * `Record<string, PlanSuggestionSummary[]>` keyed by targetItemId) so a
 * future page (T7) can pass the same groupFindingsByStop output to both the
 * table and this rail. Independent literals distinct from every other
 * fixture in this file (own trip/plan-check/suggestion ids + explanation
 * copy) so this test cannot pass by accidentally matching another test's
 * strings.
 */
const TRIAGE_SELECTED_ITEM: ItineraryContextSelectedItem = {
  id: "item-triage-selected-stop-t5",
  activity: "Ryokan check-in",
  activityType: "stay",
  status: "planned",
  dayLabel: "Day 2",
};
const TRIAGE_SIBLING_ITEM_ID = "item-triage-sibling-stop-t5";

const TRIAGE_SELECTED_FINDING: PlanSuggestionSummary = {
  id: "suggestion-triage-selected-stop-t5",
  tripId: "trip-triage-scope-t5",
  planCheckId: "plan-check-triage-scope-t5",
  severity: "warning",
  scope: "item",
  targetItemIds: [TRIAGE_SELECTED_ITEM.id],
  explanation: {
    en: "Lodging item is missing check-in or check-out timing.",
    th: "",
  },
  recommendedAction: {
    en: "Add check-in and check-out details for this stay.",
    th: "",
  },
  actionKind: null,
  actionPayload: null,
  status: "pending",
  snoozedUntil: null,
  createdAt: "2026-05-01T00:00:00Z",
  updatedAt: "2026-05-01T00:00:00Z",
  version: 1,
};

const TRIAGE_SIBLING_STOP_FINDING: PlanSuggestionSummary = {
  ...TRIAGE_SELECTED_FINDING,
  id: "suggestion-triage-sibling-stop-t5",
  targetItemIds: [TRIAGE_SIBLING_ITEM_ID],
  explanation: {
    en: "Travel segment is missing an arrival time.",
    th: "",
  },
  recommendedAction: {
    en: "Add the arrival time for this travel segment.",
    th: "",
  },
};

describe("ItineraryContextRail selected-stop triage list (M82LQRZD T5 #1)", () => {
  afterEach(() => {
    cleanup();
  });

  it("Selecting a stop with pending findings keeps its details and adds a 'Checks for this stop' triage list (severity, explanation, recommendedAction, Accept/Dismiss/Snooze) scoped to that stop only", () => {
    render(
      <ItineraryContextRail
        selectedItem={TRIAGE_SELECTED_ITEM}
        planCheckFindingsByStop={{
          [TRIAGE_SELECTED_ITEM.id]: [TRIAGE_SELECTED_FINDING],
          [TRIAGE_SIBLING_ITEM_ID]: [TRIAGE_SIBLING_STOP_FINDING],
        }}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });

    // Stop details are still shown — triage does not replace them.
    expect(
      within(context).getByRole("heading", {
        name: TRIAGE_SELECTED_ITEM.activity,
      }),
    ).toBeInTheDocument();
    expect(
      within(context).getByRole("heading", { name: /type fields \(rail\)/i }),
    ).toBeInTheDocument();

    // Draft rail-section-label "Checks for this stop"
    // (plan-check-inspector-draft-v3.html mode-selected).
    expect(
      within(context).getByRole("heading", { name: /checks for this stop/i }),
    ).toBeInTheDocument();

    // Severity + explanation.en + recommendedAction.en for THIS stop's finding.
    expect(within(context).getByText(/warning/i)).toBeInTheDocument();
    expect(
      within(context).getByText(TRIAGE_SELECTED_FINDING.explanation.en),
    ).toBeInTheDocument();
    expect(
      within(context).getByText(TRIAGE_SELECTED_FINDING.recommendedAction.en),
    ).toBeInTheDocument();

    // Accept / Dismiss / Snooze triage controls (draft .btn-triage set).
    expect(
      within(context).getByRole("button", { name: /^accept$/i }),
    ).toBeInTheDocument();
    expect(
      within(context).getByRole("button", { name: /^dismiss$/i }),
    ).toBeInTheDocument();
    expect(
      within(context).getByRole("button", { name: /^snooze$/i }),
    ).toBeInTheDocument();

    // Scoped to this stop only — a sibling stop's finding must not leak in.
    expect(
      within(context).queryByText(TRIAGE_SIBLING_STOP_FINDING.explanation.en),
    ).not.toBeInTheDocument();
  });
});

/**
 * M82LQRZD T5 #2 — Dismiss and Snooze are status-only triage: both call
 * onPlanSuggestionTriage (the rail's public triage contract; the parent owns
 * the actual PATCH /plan-suggestions/{id} call, T5 wiring) with
 * { suggestionId, status, expectedVersion } — Snooze additionally carries a
 * snoozedUntil timestamp. Neither ever applies the finding's action_payload
 * (that apply path is Accept-only, T6) — asserted here by a fetch spy that
 * must stay uncalled, even though this fixture's finding carries a non-null
 * actionPayload. Accept is present (queue affordance parity) but not
 * exercised — its payload-apply behavior belongs to T6. Independent
 * literals (own item/suggestion ids, version, actionPayload) distinct from
 * every other fixture in this file.
 */
const DISMISS_SNOOZE_SELECTED_ITEM: ItineraryContextSelectedItem = {
  id: "item-triage-dismiss-snooze-t5",
  activity: "Onsen visit",
  activityType: "experience",
  status: "planned",
  dayLabel: "Day 3",
};

const DISMISS_SNOOZE_FINDING: PlanSuggestionSummary = {
  id: "suggestion-triage-dismiss-snooze-t5",
  tripId: "trip-triage-dismiss-snooze-t5",
  planCheckId: "plan-check-triage-dismiss-snooze-t5",
  severity: "info",
  scope: "item",
  targetItemIds: [DISMISS_SNOOZE_SELECTED_ITEM.id],
  explanation: {
    en: "Experience booking link is missing.",
    th: "",
  },
  recommendedAction: {
    en: "Add a booking reference for this experience.",
    th: "",
  },
  actionKind: "set_item_fields",
  actionPayload: {
    itemId: DISMISS_SNOOZE_SELECTED_ITEM.id,
    patch: { activity: "Onsen visit (booked)" },
  },
  status: "pending",
  snoozedUntil: null,
  createdAt: "2026-05-02T00:00:00Z",
  updatedAt: "2026-05-02T00:00:00Z",
  version: 7,
};

describe("ItineraryContextRail Dismiss/Snooze status-only triage (M82LQRZD T5 #2)", () => {
  afterEach(() => {
    cleanup();
  });

  it("Dismiss calls onPlanSuggestionTriage with status dismissed + expectedVersion; Snooze calls with status snoozed + expectedVersion + snoozedUntil; neither ever applies action_payload (no itinerary PATCH fires)", () => {
    const fetchMock = vi.fn();
    const onPlanSuggestionTriage = vi.fn();

    render(
      <ItineraryContextRail
        selectedItem={DISMISS_SNOOZE_SELECTED_ITEM}
        planCheckFindingsByStop={{
          [DISMISS_SNOOZE_SELECTED_ITEM.id]: [DISMISS_SNOOZE_FINDING],
        }}
        onPlanSuggestionTriage={onPlanSuggestionTriage}
        tripId="trip-triage-dismiss-snooze-t5"
        sessionToken="session-triage-dismiss-snooze-t5"
        apiBaseUrl="http://127.0.0.1:5181"
        fetch={fetchMock as unknown as typeof fetch}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });

    // Accept is present (queue affordance parity) — not exercised: payload
    // apply on Accept is T6, out of scope for this status-only acceptance.
    expect(
      within(context).getByRole("button", { name: /^accept$/i }),
    ).toBeInTheDocument();

    fireEvent.click(
      within(context).getByRole("button", { name: /^dismiss$/i }),
    );
    expect(onPlanSuggestionTriage).toHaveBeenCalledTimes(1);
    expect(onPlanSuggestionTriage).toHaveBeenLastCalledWith({
      suggestionId: DISMISS_SNOOZE_FINDING.id,
      status: "dismissed",
      expectedVersion: DISMISS_SNOOZE_FINDING.version,
    });

    fireEvent.click(
      within(context).getByRole("button", { name: /^snooze$/i }),
    );
    expect(onPlanSuggestionTriage).toHaveBeenCalledTimes(2);
    expect(onPlanSuggestionTriage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        suggestionId: DISMISS_SNOOZE_FINDING.id,
        status: "snoozed",
        expectedVersion: DISMISS_SNOOZE_FINDING.version,
        snoozedUntil: expect.any(String),
      }),
    );

    // Status-only triage never enters the item-payload-apply path (Accept
    // is the only path that PATCHes the itinerary item, T6) — no fetch at
    // all, even though this finding's actionPayload is non-null.
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

/**
 * M82LQRZD T5 #3 — a suggestion version_conflict triggers a latest reload
 * and leaves the finding pending. Contract pinned here: `onPlanSuggestionTriage`
 * may return a Promise resolving to a patchPlanSuggestion-shaped outcome
 * (`{ ok: false, code: "version_conflict", error }` on conflict — the exact
 * literal shape `patchPlanSuggestion` in src/trip/plan-check-api.ts already
 * resolves with, T1 #3). When that resolved outcome is `ok: false` with
 * `code: "version_conflict"`, the rail calls a new optional
 * `onPlanCheckReload` prop (distinct from `onCockpitReload`, which is the
 * itinerary-item PATCH conflict channel used by commitRailField) so the
 * parent can reload the latest plan-check summary. Because findings are
 * props-only in this rail (no local accepted/dismissed mutation anywhere in
 * the component), "leaves the finding pending" falls out for free as long
 * as the rail does not attempt any local removal on conflict — pinned here
 * by asserting the finding's triage row (explanation + Dismiss/Snooze
 * buttons) is still present after the conflict resolves. Independent
 * literals (own item/suggestion/trip ids, version, explanation copy)
 * distinct from every other fixture in this file.
 */
const CONFLICT_SELECTED_ITEM: ItineraryContextSelectedItem = {
  id: "item-triage-version-conflict-t5",
  activity: "Kyoto tea ceremony",
  activityType: "experience",
  status: "planned",
  dayLabel: "Day 4",
};

const CONFLICT_FINDING: PlanSuggestionSummary = {
  id: "suggestion-triage-version-conflict-t5",
  tripId: "trip-triage-version-conflict-t5",
  planCheckId: "plan-check-triage-version-conflict-t5",
  severity: "warning",
  scope: "item",
  targetItemIds: [CONFLICT_SELECTED_ITEM.id],
  explanation: {
    en: "Experience is missing a meeting point.",
    th: "",
  },
  recommendedAction: {
    en: "Add a meeting point for this experience.",
    th: "",
  },
  actionKind: null,
  actionPayload: null,
  status: "pending",
  snoozedUntil: null,
  createdAt: "2026-05-03T00:00:00Z",
  updatedAt: "2026-05-03T00:00:00Z",
  version: 4,
};

describe("ItineraryContextRail suggestion version_conflict reload (M82LQRZD T5 #3)", () => {
  afterEach(() => {
    cleanup();
  });

  it("Dismiss whose triage handler resolves version_conflict calls onPlanCheckReload and leaves the finding pending (still visible, not locally accepted/dismissed)", async () => {
    const onPlanSuggestionTriage = vi.fn().mockResolvedValue({
      ok: false,
      code: "version_conflict",
      error: "Someone else updated this suggestion. Refresh and try again.",
    });
    const onPlanCheckReload = vi.fn();

    render(
      <ItineraryContextRail
        selectedItem={CONFLICT_SELECTED_ITEM}
        planCheckFindingsByStop={{
          [CONFLICT_SELECTED_ITEM.id]: [CONFLICT_FINDING],
        }}
        onPlanSuggestionTriage={onPlanSuggestionTriage}
        onPlanCheckReload={onPlanCheckReload}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });

    fireEvent.click(
      within(context).getByRole("button", { name: /^dismiss$/i }),
    );

    expect(onPlanSuggestionTriage).toHaveBeenCalledTimes(1);
    expect(onPlanSuggestionTriage).toHaveBeenLastCalledWith({
      suggestionId: CONFLICT_FINDING.id,
      status: "dismissed",
      expectedVersion: CONFLICT_FINDING.version,
    });

    // A version_conflict resolution triggers the plan-check reload channel —
    // distinct from onCockpitReload (itinerary-item PATCH conflicts).
    await waitFor(() => {
      expect(onPlanCheckReload).toHaveBeenCalledTimes(1);
    });

    // Pending: the finding's triage row is still on screen — no local
    // accepted/dismissed state was applied from this rail (props-only
    // findings; the parent alone owns whether this finding disappears,
    // and it hasn't reloaded new props here).
    expect(
      within(context).getByText(CONFLICT_FINDING.explanation.en),
    ).toBeInTheDocument();
    expect(
      within(context).getByRole("button", { name: /^dismiss$/i }),
    ).toBeInTheDocument();
    expect(
      within(context).getByRole("button", { name: /^snooze$/i }),
    ).toBeInTheDocument();
  });
});

/**
 * M82LQRZD T6 #3 — Accept in ItineraryContextRail wires to
 * acceptPlanSuggestion (src/trip/plan-check-apply) once
 * tripId/sessionToken/apiBaseUrl/fetch deps are present, instead of only
 * calling onPlanSuggestionTriage (T5's plain status-only path). A safe
 * { itemId, patch } action_payload PATCHes the itinerary item first
 * (itinerary-items/{id}) using selectedItem.version as expectedVersion, then
 * PATCHes the suggestion to accepted (plan-suggestions/{id}); onPatched
 * receives the returned item so the parent can refresh its version.
 * Dismiss/Snooze must stay on the onPlanSuggestionTriage / patchPlanSuggestion
 * path only — never acceptPlanSuggestion — asserted here by confirming
 * Dismiss never touches the itinerary-items URL, even for a finding whose
 * action_payload is the same safe shape Accept would apply. Independent
 * literals (own item/suggestion/trip ids, version) distinct from every other
 * fixture in this file.
 */
function acceptApplyJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const ACCEPT_APPLY_SELECTED_ITEM: ItineraryContextSelectedItem = {
  id: "item-accept-apply-t6",
  activity: "Night market",
  activityType: "food",
  status: "planned",
  dayLabel: "Day 5",
  version: 5,
};

const ACCEPT_APPLY_FINDING: PlanSuggestionSummary = {
  id: "suggestion-accept-apply-t6",
  tripId: "trip-accept-apply-t6",
  planCheckId: "plan-check-accept-apply-t6",
  severity: "warning",
  scope: "item",
  targetItemIds: [ACCEPT_APPLY_SELECTED_ITEM.id],
  explanation: { en: "Night market stop runs past midnight.", th: "" },
  recommendedAction: { en: "Trim the duration.", th: "" },
  actionKind: "editItem",
  actionPayload: {
    itemId: ACCEPT_APPLY_SELECTED_ITEM.id,
    patch: { durationMinutes: 60 },
  },
  status: "pending",
  snoozedUntil: null,
  createdAt: "2026-05-04T00:00:00Z",
  updatedAt: "2026-05-04T00:00:00Z",
  version: 2,
};

const ACCEPT_APPLY_ITEM_PATCH_RESPONSE = {
  id: ACCEPT_APPLY_SELECTED_ITEM.id,
  tripId: "trip-accept-apply-t6",
  planVariantId: "plan-variant-accept-apply-t6",
  day: "2026-05-05",
  activity: "Night market",
  activityType: "food",
  place: "Old City",
  startTime: "20:00",
  status: "confirmed",
  version: 6,
};

function acceptApplySuggestionResponse(
  overrides: Record<string, unknown> = {},
) {
  return {
    ...ACCEPT_APPLY_FINDING,
    status: "accepted",
    version: 3,
    ...overrides,
  };
}

describe("ItineraryContextRail Accept apply-path wiring (M82LQRZD T6 #3)", () => {
  afterEach(() => {
    cleanup();
  });

  it("Accept PATCHes the itinerary item then the suggestion, and calls onPatched with the returned item, when tripId/sessionToken/apiBaseUrl/fetch deps are present", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        acceptApplyJsonResponse(ACCEPT_APPLY_ITEM_PATCH_RESPONSE),
      )
      .mockResolvedValueOnce(
        acceptApplyJsonResponse(acceptApplySuggestionResponse()),
      );
    const onPlanSuggestionTriage = vi.fn();
    const onPatched = vi.fn();

    render(
      <ItineraryContextRail
        selectedItem={ACCEPT_APPLY_SELECTED_ITEM}
        planCheckFindingsByStop={{
          [ACCEPT_APPLY_SELECTED_ITEM.id]: [ACCEPT_APPLY_FINDING],
        }}
        tripId="trip-accept-apply-t6"
        sessionToken="session-accept-apply-t6"
        apiBaseUrl="http://127.0.0.1:5181"
        fetch={fetchMock as unknown as typeof fetch}
        onPlanSuggestionTriage={onPlanSuggestionTriage}
        onPatched={onPatched}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });

    fireEvent.click(
      within(context).getByRole("button", { name: /^accept$/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    const [itemUrl, itemInit] = fetchMock.mock.calls[0]!;
    expect(String(itemUrl)).toBe(
      "http://127.0.0.1:5181/api/v1/trips/trip-accept-apply-t6/itinerary-items/item-accept-apply-t6",
    );
    expect(itemInit?.method).toBe("PATCH");
    expect(JSON.parse(String(itemInit?.body)).expectedVersion).toBe(
      ACCEPT_APPLY_SELECTED_ITEM.version,
    );

    const [suggestionUrl, suggestionInit] = fetchMock.mock.calls[1]!;
    expect(String(suggestionUrl)).toBe(
      "http://127.0.0.1:5181/api/v1/trips/trip-accept-apply-t6/plan-suggestions/suggestion-accept-apply-t6",
    );
    expect(suggestionInit?.method).toBe("PATCH");
    expect(JSON.parse(String(suggestionInit?.body)).status).toBe("accepted");

    // Accept did not go through the plain status-only triage channel — the
    // apply path (acceptPlanSuggestion) owns this Accept, not
    // onPlanSuggestionTriage.
    expect(onPlanSuggestionTriage).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(onPatched).toHaveBeenCalledTimes(1);
    });
    expect(onPatched).toHaveBeenCalledWith(
      expect.objectContaining({
        id: ACCEPT_APPLY_SELECTED_ITEM.id,
        version: 6,
      }),
    );
  });

  it("Dismiss never hits the itinerary-items URL, even for a finding with a safe action_payload — it stays on the onPlanSuggestionTriage / patchPlanSuggestion path only", () => {
    const fetchMock = vi.fn();
    const onPlanSuggestionTriage = vi.fn();

    render(
      <ItineraryContextRail
        selectedItem={ACCEPT_APPLY_SELECTED_ITEM}
        planCheckFindingsByStop={{
          [ACCEPT_APPLY_SELECTED_ITEM.id]: [ACCEPT_APPLY_FINDING],
        }}
        tripId="trip-accept-apply-t6"
        sessionToken="session-accept-apply-t6"
        apiBaseUrl="http://127.0.0.1:5181"
        fetch={fetchMock as unknown as typeof fetch}
        onPlanSuggestionTriage={onPlanSuggestionTriage}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });

    fireEvent.click(
      within(context).getByRole("button", { name: /^dismiss$/i }),
    );

    expect(onPlanSuggestionTriage).toHaveBeenCalledTimes(1);
    expect(onPlanSuggestionTriage).toHaveBeenLastCalledWith({
      suggestionId: ACCEPT_APPLY_FINDING.id,
      status: "dismissed",
      expectedVersion: ACCEPT_APPLY_FINDING.version,
    });

    // Dismiss never calls fetch directly — patchPlanSuggestion is the
    // parent's responsibility via onPlanSuggestionTriage, not this rail —
    // and in particular never hits the itinerary-items URL that Accept's
    // apply path would use for this same finding's safe action_payload.
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
