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
