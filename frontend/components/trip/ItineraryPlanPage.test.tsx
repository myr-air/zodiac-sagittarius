/**
 * @vitest-environment happy-dom
 *
 * ItineraryPlanPage — stop selection → tonal style + context rail (T6 #1);
 * type-shaped enrich cues + quiet Remove DELETE after confirm (T6 #3).
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
import type { TripCockpitItineraryItem } from "../../src/trip/trip-cockpit-load";
import { buildItineraryTableModel } from "../../src/trip/itinerary-table-model";
import type { ItineraryTableModel } from "../../src/trip/itinerary-table-model";
import type {
  PlanCheckSummary,
  PlanSuggestionSummary,
} from "../../src/trip/plan-check-api";
import { ItineraryPlanPage } from "./ItineraryPlanPage";

/** Independent literals from approved itinerary-plan-draft-v1.html (travel stop t1). */
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const PLAN_ID = "018f4e82-3000-7c00-b111-000000000001";
const DAY = "2026-04-12";
const START_TIME = "09:40";
const END_TIME = "05:50";
const PRIMARY_TITLE = "BKK → NRT";
const SECONDARY_DETAIL = "Thai Airways · TG640";
const TABLE_ARIA_LABEL = /smart itinerary table/i;
/** Draft ctx-meta: TYPE_LABEL · Day N · status */
const CTX_META = "Travel · Day 1 · booked";
/** Draft clearStopSelection empty cue. */
const CTX_EMPTY_TITLE = "No activity selected";
/** DESIGN.md / draft --color-primary-soft (tonal selected fill). */
const PRIMARY_SOFT = "#ecfeff";

/** T6 #3 — draft CUE_BY_TYPE.travel + fieldsToRail(travel) + quiet Remove. */
const API_BASE = "http://127.0.0.1:5181";
const SESSION_TOKEN = "member-session-token-rail-remove";
const TRAVEL_ENRICH_CUE =
  "Travel usually wants From · To · By — fill when ready";
const TRAVEL_FIELD_LABELS = ["From", "To", "By"] as const;
const REMOVE_LABEL = "Remove";
/** Draft openStopDialog(mode=delete) landmarks. */
const DELETE_DIALOG_TITLE = "Delete activity";
const DELETE_CONFIRM_COPY = `Remove "${PRIMARY_TITLE}" from the plan?`;
const DELETE_CONFIRM_ACTION = "Delete";

type StopItem = TripCockpitItineraryItem & { endTime: string };

const TRAVEL_STOP: StopItem = {
  id: "item-travel-t1",
  tripId: TRIP_ID,
  planVariantId: PLAN_ID,
  day: DAY,
  activity: PRIMARY_TITLE,
  activityType: "travel",
  place: SECONDARY_DETAIL,
  startTime: START_TIME,
  endTime: END_TIME,
  status: "booked",
  version: 1,
};

function normalizeBg(value: string): string {
  const v = value.trim().toLowerCase().replace(/\s+/g, "");
  if (v === "rgb(236,254,255)") return "#ecfeff";
  if (v === "#ecfeff") return "#ecfeff";
  return v;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function itineraryDeleteCalls(
  fetchMock: ReturnType<typeof vi.fn>,
): Array<{ url: string; init: RequestInit }> {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method !== "DELETE" || !url.includes("/itinerary-items/")) return null;
      return { url, init: (init ?? {}) as RequestInit };
    })
    .filter((call): call is { url: string; init: RequestInit } => call !== null);
}

describe("ItineraryPlanPage stop selection and context rail", () => {
  let styleEl: HTMLStyleElement | null = null;

  beforeEach(() => {
    document.documentElement.style.setProperty(
      "--color-primary-soft",
      PRIMARY_SOFT,
    );
    // Draft landmark: tr.stop-row.selected td { background: var(--color-primary-soft) }
    styleEl = document.createElement("style");
    styleEl.textContent =
      "tr.stop-row.selected td { background: var(--color-primary-soft); background-color: var(--color-primary-soft); }";
    document.head.appendChild(styleEl);
  });

  afterEach(() => {
    cleanup();
    document.documentElement.style.removeProperty("--color-primary-soft");
    styleEl?.remove();
    styleEl = null;
  });

  it("Clicking a stop selects it (tonal selected style; second click unselects); selected stop details appear in the right context rail", () => {
    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [TRAVEL_STOP],
    });

    render(<ItineraryPlanPage model={model} tripId={TRIP_ID} />);

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const stopRow = table.querySelector(
      `tr.stop-row[data-id="${TRAVEL_STOP.id}"]`,
    ) as HTMLElement;
    expect(stopRow).toBeTruthy();

    // Click non-interactive row chrome (draft: plain click toggles select).
    fireEvent.click(stopRow);

    expect(stopRow).toHaveClass("selected");
    const selectedCell = stopRow.querySelector("td.col-stop") as HTMLElement;
    expect(selectedCell).toBeTruthy();
    expect(normalizeBg(getComputedStyle(selectedCell).backgroundColor)).toBe(
      PRIMARY_SOFT,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    expect(within(context).getByRole("heading", { level: 2 })).toHaveTextContent(
      PRIMARY_TITLE,
    );
    expect(context.querySelector("#ctx-meta")).toHaveTextContent(CTX_META);

    // Second click on the selected row unselects (draft selectStop toggle).
    fireEvent.click(stopRow);

    expect(stopRow).not.toHaveClass("selected");
    expect(within(context).getByRole("heading", { level: 2 })).toHaveTextContent(
      CTX_EMPTY_TITLE,
    );
  });
});

describe("ItineraryPlanPage rail enrich cues and Remove DELETE", () => {
  afterEach(() => {
    cleanup();
  });

  /**
   * T6 #3 — draft syncContextFromRow: CUE_BY_TYPE + fieldsToRail; quiet
   * btn-remove-stop; DELETE only after delete-confirm (Bearer, no body).
   * Backend: DELETE /api/v1/trips/{tripId}/itinerary-items/{itemId} → 200 summary.
   */
  it("Rail mirrors type-shaped enrich cues for the selected stop and exposes a quiet Remove that DELETEs /api/v1/trips/{tripId}/itinerary-items/{itemId} after confirm", async () => {
    const user = userEvent.setup();
    const deleteUrl = `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${TRAVEL_STOP.id}`;

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "DELETE" && url === deleteUrl) {
        return jsonResponse({ ...TRAVEL_STOP, version: TRAVEL_STOP.version + 1 });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [TRAVEL_STOP],
    });

    render(
      <ItineraryPlanPage
        model={model}
        tripId={TRIP_ID}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const stopRow = table.querySelector(
      `tr.stop-row[data-id="${TRAVEL_STOP.id}"]`,
    ) as HTMLElement;
    expect(stopRow).toBeTruthy();
    fireEvent.click(stopRow);

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });

    // Draft Soft cues + type-shaped rail fields for travel.
    expect(within(context).getByText(TRAVEL_ENRICH_CUE)).toBeInTheDocument();
    for (const label of TRAVEL_FIELD_LABELS) {
      expect(within(context).getByText(label)).toBeInTheDocument();
    }

    const removeBtn = within(context).getByRole("button", {
      name: REMOVE_LABEL,
    });
    expect(removeBtn).toBeInTheDocument();
    expect((removeBtn as HTMLButtonElement).disabled).toBe(false);

    // Opening alone must not DELETE — confirm drives the call.
    await user.click(removeBtn);
    expect(itineraryDeleteCalls(fetchMock)).toHaveLength(0);

    const dialog = await screen.findByRole("dialog", {
      name: DELETE_DIALOG_TITLE,
    });
    expect(within(dialog).getByText(DELETE_CONFIRM_COPY)).toBeInTheDocument();
    const cancel = within(dialog).getByRole("button", { name: /cancel/i });
    const confirm = within(dialog).getByRole("button", {
      name: DELETE_CONFIRM_ACTION,
    });
    // Cancel-first: Cancel precedes destructive confirm in DOM order.
    expect(
      cancel.compareDocumentPosition(confirm) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    await user.click(confirm);

    await waitFor(() => {
      expect(itineraryDeleteCalls(fetchMock)).toHaveLength(1);
    });
    const deleteCall = itineraryDeleteCalls(fetchMock)[0]!;
    expect(deleteCall.url).toBe(deleteUrl);
    expect((deleteCall.init.method ?? "").toUpperCase()).toBe("DELETE");
    expect(new Headers(deleteCall.init.headers).get("Authorization")).toBe(
      `Bearer ${SESSION_TOKEN}`,
    );
    expect(deleteCall.init.body).toBeUndefined();
  });
});

/**
 * T7 #1 — draft renderTypeFields + syncFieldsFromType + syncContextFromRow:
 * per-stop field bag keeps typed values across activity-type switches; table
 * and context rail mirror the same type-shaped set + values.
 */
const FIELD_BAG_SESSION = "member-session-token-field-bag";
/** Independent literals from draft travel / food field keys (enrichByType). */
const BAG_FROM = "BKK";
const BAG_TO = "NRT";
const BAG_FOOD_PLACE = "Ichiran Shinjuku";
const TRAVEL_FIELD_SET = ["From", "To", "By"] as const;
const FOOD_FIELD_SET = ["Place", "Meal"] as const;

describe("ItineraryPlanPage type-shaped field bag restore", () => {
  afterEach(() => {
    cleanup();
  });

  it("Switching activity type swaps the type-shaped field set and restores previously entered values for that type from a per-stop field bag (table + rail stay in sync)", async () => {
    const user = userEvent.setup();
    let current: StopItem = {
      ...TRAVEL_STOP,
      id: "item-field-bag-t1",
      activity: "Field bag stop",
      place: "",
      activityType: "travel",
      version: 1,
    };

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (
        method === "PATCH" &&
        url ===
          `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${current.id}`
      ) {
        let body: { patch?: Record<string, unknown> } = {};
        try {
          body = JSON.parse(String(init?.body ?? "{}")) as {
            patch?: Record<string, unknown>;
          };
        } catch {
          body = {};
        }
        current = {
          ...current,
          ...(body.patch as Partial<StopItem>),
          version: current.version + 1,
        };
        return jsonResponse(current);
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [current],
    });

    render(
      <ItineraryPlanPage
        model={model}
        tripId={TRIP_ID}
        sessionToken={FIELD_BAG_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const stopRow = table.querySelector(
      `tr.stop-row[data-id="${current.id}"]`,
    ) as HTMLElement;
    expect(stopRow).toBeTruthy();
    fireEvent.click(stopRow);

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });

    // Draft travel field set in the stop row and mirrored in the rail.
    for (const label of TRAVEL_FIELD_SET) {
      expect(within(stopRow).getByLabelText(new RegExp(`^${label}$`, "i"))).toBeInTheDocument();
      expect(within(context).getByLabelText(new RegExp(`^${label}$`, "i"))).toBeInTheDocument();
    }

    const tableFrom = within(stopRow).getByRole("textbox", { name: /^from$/i });
    const tableTo = within(stopRow).getByRole("textbox", { name: /^to$/i });
    await user.clear(tableFrom);
    await user.type(tableFrom, BAG_FROM);
    fireEvent.blur(tableFrom);
    await user.clear(tableTo);
    await user.type(tableTo, BAG_TO);
    fireEvent.blur(tableTo);

    // Table → rail sync while still on travel.
    expect(within(context).getByLabelText(/^from$/i)).toHaveValue(BAG_FROM);
    expect(within(context).getByLabelText(/^to$/i)).toHaveValue(BAG_TO);

    // Switch to food — type-shaped set swaps (travel keys leave; food keys appear).
    await user.click(within(stopRow).getByRole("button", { name: /^travel$/i }));
    await user.click(
      await screen.findByRole("menuitem", { name: /^food$/i }),
    );

    for (const label of FOOD_FIELD_SET) {
      expect(within(stopRow).getByLabelText(new RegExp(`^${label}$`, "i"))).toBeInTheDocument();
      expect(within(context).getByLabelText(new RegExp(`^${label}$`, "i"))).toBeInTheDocument();
    }
    expect(within(stopRow).queryByRole("textbox", { name: /^from$/i })).toBeNull();
    expect(within(context).queryByLabelText(/^from$/i)).toBeNull();

    const foodPlace = within(stopRow).getByRole("textbox", {
      name: /^place$/i,
    });
    await user.clear(foodPlace);
    await user.type(foodPlace, BAG_FOOD_PLACE);
    fireEvent.blur(foodPlace);
    expect(within(context).getByLabelText(/^place$/i)).toHaveValue(
      BAG_FOOD_PLACE,
    );

    // Switch back to travel — bag restores prior travel values; rail stays aligned.
    await user.click(within(stopRow).getByRole("button", { name: /^food$/i }));
    await user.click(
      await screen.findByRole("menuitem", { name: /^travel$/i }),
    );

    expect(within(stopRow).getByRole("textbox", { name: /^from$/i })).toHaveValue(
      BAG_FROM,
    );
    expect(within(stopRow).getByRole("textbox", { name: /^to$/i })).toHaveValue(
      BAG_TO,
    );
    expect(within(context).getByLabelText(/^from$/i)).toHaveValue(BAG_FROM);
    expect(within(context).getByLabelText(/^to$/i)).toHaveValue(BAG_TO);
    expect(
      within(stopRow).queryByRole("textbox", { name: /^place$/i }),
    ).toBeNull();
  });
});

/**
 * M81DDKSC T4 #1 — rail mappable type fields must PATCH via the same
 * itinerary-items write path as the table (not calm local-only bag merges).
 * Independent literals: table mapping place → place, By → activitySubtype,
 * Meal → details.meal + required clientMutationId / expectedVersion.
 */
const RAIL_PATCH_SESSION = "member-session-token-rail-patch";
const RAIL_TRAVEL_ID = "item-rail-travel-by";
const RAIL_FOOD_ID = "item-rail-food-place-meal";
const RAIL_EXPECTED_VERSION = 11;
const RAIL_BY_VALUE = "flight";
const RAIL_PLACE_VALUE = "Ichiran Shinjuku";
const RAIL_MEAL_VALUE = "Dinner";

type PatchCall = {
  url: string;
  init: RequestInit;
  body: Record<string, unknown>;
};

function itineraryPatchCalls(
  fetchMock: ReturnType<typeof vi.fn>,
): PatchCall[] {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method !== "PATCH" || !url.includes("/itinerary-items/")) return null;
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      } catch {
        body = {};
      }
      return { url, init: (init ?? {}) as RequestInit, body };
    })
    .filter((call): call is PatchCall => call !== null);
}

describe("ItineraryPlanPage rail type-field PATCH", () => {
  afterEach(() => {
    cleanup();
  });

  it("Rail commits for mappable type fields (place, travel By→activitySubtype, food Meal→details) PATCH /api/v1/trips/{tripId}/itinerary-items/{itemId} with clientMutationId + expectedVersion using the same mapping as the table", async () => {
    const user = userEvent.setup();
    const travelStop: StopItem = {
      ...TRAVEL_STOP,
      id: RAIL_TRAVEL_ID,
      version: RAIL_EXPECTED_VERSION,
    };
    const foodStop: StopItem = {
      ...TRAVEL_STOP,
      id: RAIL_FOOD_ID,
      activity: "Ichiran",
      activityType: "food",
      place: "",
      status: "idea",
      version: RAIL_EXPECTED_VERSION,
    };

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "PATCH" && url.includes("/itinerary-items/")) {
        const id = url.split("/").pop()!;
        const base = id === RAIL_FOOD_ID ? foodStop : travelStop;
        return jsonResponse({
          ...base,
          version: RAIL_EXPECTED_VERSION + 1,
        });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [travelStop, foodStop],
    });

    render(
      <ItineraryPlanPage
        model={model}
        tripId={TRIP_ID}
        sessionToken={RAIL_PATCH_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const travelRow = table.querySelector(
      `tr.stop-row[data-id="${RAIL_TRAVEL_ID}"]`,
    ) as HTMLElement;
    const foodRow = table.querySelector(
      `tr.stop-row[data-id="${RAIL_FOOD_ID}"]`,
    ) as HTMLElement;
    expect(travelRow).toBeTruthy();
    expect(foodRow).toBeTruthy();

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    const travelPatchUrl = `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${RAIL_TRAVEL_ID}`;
    const foodPatchUrl = `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${RAIL_FOOD_ID}`;

    // Travel By in the rail → same activitySubtype mapping as table choice-chip.
    fireEvent.click(travelRow);
    fetchMock.mockClear();
    await user.selectOptions(
      within(context).getByLabelText(/^by$/i),
      RAIL_BY_VALUE,
    );
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const byCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(byCall.url).toBe(travelPatchUrl);
    expect((byCall.init.method ?? "").toUpperCase()).toBe("PATCH");
    expect(new Headers(byCall.init.headers).get("Authorization")).toBe(
      `Bearer ${RAIL_PATCH_SESSION}`,
    );
    expect(typeof byCall.body.clientMutationId).toBe("string");
    expect(String(byCall.body.clientMutationId).length).toBeGreaterThan(0);
    expect(byCall.body.expectedVersion).toBe(RAIL_EXPECTED_VERSION);
    expect(byCall.body.patch).toEqual(
      expect.objectContaining({ activitySubtype: RAIL_BY_VALUE }),
    );

    // Food Place + Meal in the rail → place + details.meal (table mapping).
    fireEvent.click(foodRow);
    fetchMock.mockClear();
    const placeInput = within(context).getByLabelText(/^place$/i);
    await user.clear(placeInput);
    await user.type(placeInput, RAIL_PLACE_VALUE);
    fireEvent.blur(placeInput);
    await waitFor(() => {
      expect(
        itineraryPatchCalls(fetchMock).some((call) => {
          const patch = call.body.patch as Record<string, unknown> | undefined;
          return patch?.place === RAIL_PLACE_VALUE;
        }),
      ).toBe(true);
    });
    const placeCall = itineraryPatchCalls(fetchMock).find((call) => {
      const patch = call.body.patch as Record<string, unknown> | undefined;
      return patch?.place === RAIL_PLACE_VALUE;
    })!;
    expect(placeCall.url).toBe(foodPatchUrl);
    expect(typeof placeCall.body.clientMutationId).toBe("string");
    expect(String(placeCall.body.clientMutationId).length).toBeGreaterThan(0);
    expect(placeCall.body.expectedVersion).toBe(RAIL_EXPECTED_VERSION);

    // Allow success handler to apply returned summary before the next rail edit.
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    await Promise.resolve();
    await Promise.resolve();

    fetchMock.mockClear();
    await user.selectOptions(
      within(context).getByLabelText(/^meal$/i),
      RAIL_MEAL_VALUE,
    );
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const mealCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(mealCall.url).toBe(foodPatchUrl);
    expect((mealCall.init.method ?? "").toUpperCase()).toBe("PATCH");
    expect(typeof mealCall.body.clientMutationId).toBe("string");
    expect(String(mealCall.body.clientMutationId).length).toBeGreaterThan(0);
    // Place PATCH returned version+1 — meal must not reuse the stale seed.
    expect(mealCall.body.expectedVersion).toBe(RAIL_EXPECTED_VERSION + 1);
    expect(mealCall.body.patch).toEqual(
      expect.objectContaining({
        details: expect.objectContaining({ meal: RAIL_MEAL_VALUE }),
      }),
    );
  });
});

/**
 * Must-fix: rail PATCH applies returned summary version; version_conflict
 * reloads TripCockpit like the table (no stale expectedVersion / silent overwrite).
 */
const RAIL_VERSION_APPLY_SESSION = "member-session-token-rail-version-apply";
const RAIL_VERSION_ITEM_ID = "item-rail-version-apply";
const RAIL_VERSION_SEED = 21;
const RAIL_VERSION_RETURNED = RAIL_VERSION_SEED + 1;
const RAIL_VERSION_FIRST_PLACE = "First place rail";
const RAIL_VERSION_SECOND_PLACE = "Second place rail";
const RAIL_CONFLICT_CODE = "version_conflict";
const RAIL_CONFLICT_EDIT = "Stale rail place";

describe("ItineraryPlanPage rail PATCH applies returned version", () => {
  afterEach(() => {
    cleanup();
  });

  it("after a successful rail PATCH, the next rail edit sends the returned version as expectedVersion; version_conflict reloads cockpit", async () => {
    const user = userEvent.setup();
    const onCockpitReload = vi.fn();
    const foodStop: StopItem = {
      ...TRAVEL_STOP,
      id: RAIL_VERSION_ITEM_ID,
      activity: "Ichiran",
      activityType: "food",
      place: "",
      status: "idea",
      version: RAIL_VERSION_SEED,
    };

    let serverVersion = RAIL_VERSION_SEED;
    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "PATCH" && url.includes(`/${RAIL_VERSION_ITEM_ID}`)) {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          expectedVersion?: number;
          patch?: Record<string, unknown>;
        };
        if (body.patch && "place" in body.patch) {
          const place = String(body.patch.place ?? "");
          if (place === RAIL_CONFLICT_EDIT) {
            return jsonResponse(
              {
                code: RAIL_CONFLICT_CODE,
                latest: {
                  ...foodStop,
                  version: RAIL_VERSION_RETURNED + 1,
                  place: "Authoritative place",
                },
              },
              409,
            );
          }
        }
        serverVersion = (body.expectedVersion ?? serverVersion) + 1;
        return jsonResponse({
          ...foodStop,
          ...body.patch,
          version: serverVersion,
        });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [foodStop],
    });

    render(
      <ItineraryPlanPage
        model={model}
        tripId={TRIP_ID}
        sessionToken={RAIL_VERSION_APPLY_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        onCockpitReload={onCockpitReload}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const foodRow = table.querySelector(
      `tr.stop-row[data-id="${RAIL_VERSION_ITEM_ID}"]`,
    ) as HTMLElement;
    fireEvent.click(foodRow);

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    const placeInput = () => within(context).getByLabelText(/^place$/i);

    // First rail edit → seed expectedVersion.
    await user.clear(placeInput());
    await user.type(placeInput(), RAIL_VERSION_FIRST_PLACE);
    fireEvent.blur(placeInput());
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    expect(itineraryPatchCalls(fetchMock)[0]!.body.expectedVersion).toBe(
      RAIL_VERSION_SEED,
    );

    await Promise.resolve();
    await Promise.resolve();
    fetchMock.mockClear();

    // Second rail edit must send returned version.
    await user.clear(placeInput());
    await user.type(placeInput(), RAIL_VERSION_SECOND_PLACE);
    fireEvent.blur(placeInput());
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    expect(itineraryPatchCalls(fetchMock)[0]!.body.expectedVersion).toBe(
      RAIL_VERSION_RETURNED,
    );

    // Conflict path — reload like the table; no stale retry with seed version.
    await Promise.resolve();
    await Promise.resolve();
    fetchMock.mockClear();
    onCockpitReload.mockClear();
    await user.clear(placeInput());
    await user.type(placeInput(), RAIL_CONFLICT_EDIT);
    fireEvent.blur(placeInput());
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    await waitFor(() => {
      expect(onCockpitReload).toHaveBeenCalledTimes(1);
    });

    fetchMock.mockClear();
    await user.clear(placeInput());
    await user.type(placeInput(), "Retry before reload");
    fireEvent.blur(placeInput());
    let sawStaleRetry = false;
    try {
      await waitFor(
        () => {
          expect(
            itineraryPatchCalls(fetchMock).some(
              (call) =>
                call.body.expectedVersion === RAIL_VERSION_RETURNED ||
                call.body.expectedVersion === RAIL_VERSION_SEED,
            ),
          ).toBe(true);
        },
        { timeout: 200 },
      );
      sawStaleRetry = true;
    } catch {
      sawStaleRetry = false;
    }
    expect(sawStaleRetry).toBe(false);
  });
});

/**
 * M81DDKSC T3 #1 — nested sub-activity write-path: inline edit PATCHes and
 * rail Remove DELETEs via existing itinerary-api helpers; tree updates.
 * Backend: PATCH/DELETE /api/v1/trips/{tripId}/itinerary-items/{itemId}.
 */
const NESTED_SESSION = "member-session-token-nested-edit-remove";
const NESTED_PARENT_ID = "item-stay-parent-t3";
const NESTED_CHILD_ID = "item-stay-child-t3";
const NESTED_PARENT_ACTIVITY = "Hotel Gracery Shinjuku";
const NESTED_CHILD_PLACE = "Lobby cafe";
const NESTED_CHILD_VERSION = 2;
const NESTED_EDITED_PLACE = "Rooftop lounge";
/** Returned summary place — distinct from typed value to prove tree uses response. */
const NESTED_RETURNED_PLACE = "Rooftop lounge tasting";

describe("ItineraryPlanPage nested sub-activity edit and Remove", () => {
  afterEach(() => {
    cleanup();
  });

  it("Inline edit and Remove on a nested sub-activity PATCH/DELETE via existing itinerary-api helpers and update the tree", async () => {
    const user = userEvent.setup();
    const parentStop: StopItem = {
      ...TRAVEL_STOP,
      id: NESTED_PARENT_ID,
      activity: NESTED_PARENT_ACTIVITY,
      activityType: "stay",
      place: NESTED_PARENT_ACTIVITY,
      startTime: "15:30",
      endTime: "",
      status: "planned",
      version: 3,
      parentItemId: null,
      isPlanBlock: true,
    };
    const childStop: StopItem = {
      ...TRAVEL_STOP,
      id: NESTED_CHILD_ID,
      activity: NESTED_CHILD_PLACE,
      activityType: "food",
      place: NESTED_CHILD_PLACE,
      startTime: "16:00",
      endTime: "",
      status: "idea",
      version: NESTED_CHILD_VERSION,
      parentItemId: NESTED_PARENT_ID,
      isPlanBlock: false,
    };

    const patchUrl = `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${NESTED_CHILD_ID}`;
    const deleteUrl = patchUrl;

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "PATCH" && url === patchUrl) {
        return jsonResponse({
          ...childStop,
          place: NESTED_RETURNED_PLACE,
          activity: NESTED_RETURNED_PLACE,
          version: NESTED_CHILD_VERSION + 1,
        });
      }
      if (method === "DELETE" && url === deleteUrl) {
        return jsonResponse({
          ...childStop,
          version: NESTED_CHILD_VERSION + 2,
        });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [parentStop, childStop],
    });

    render(
      <ItineraryPlanPage
        model={model}
        tripId={TRIP_ID}
        sessionToken={NESTED_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const parentRow = table.querySelector(
      `tr.stop-row[data-id="${NESTED_PARENT_ID}"]`,
    ) as HTMLElement;
    expect(parentRow).toBeTruthy();

    const toggle = within(parentRow).getByRole("button", {
      name: /show .* sub-activit|add sub-activit|hide sub-activit/i,
    });
    await user.click(toggle);

    const panel = parentRow.querySelector(
      ".subplan[data-subplan], [data-subplan]",
    ) as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.hidden).toBe(false);

    const placeField = within(panel).getByRole("textbox", { name: /^place$/i });
    expect(placeField).toHaveValue(NESTED_CHILD_PLACE);
    // Nested place must be editable (not a read-only display stub).
    expect(placeField).not.toHaveAttribute("readonly");

    // --- Inline edit nested sub-activity → PATCH child item ---
    fetchMock.mockClear();
    fireEvent.change(placeField, { target: { value: NESTED_EDITED_PLACE } });
    fireEvent.blur(placeField);

    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const patchCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(patchCall.url).toBe(patchUrl);
    expect((patchCall.init.method ?? "").toUpperCase()).toBe("PATCH");
    expect(new Headers(patchCall.init.headers).get("Authorization")).toBe(
      `Bearer ${NESTED_SESSION}`,
    );
    expect(typeof patchCall.body.clientMutationId).toBe("string");
    expect(String(patchCall.body.clientMutationId).length).toBeGreaterThan(0);
    expect(patchCall.body.expectedVersion).toBe(NESTED_CHILD_VERSION);
    expect(patchCall.body.patch).toEqual(
      expect.objectContaining({ place: NESTED_EDITED_PLACE }),
    );

    await waitFor(() => {
      expect(
        within(panel).getByRole("textbox", { name: /^place$/i }),
      ).toHaveValue(NESTED_RETURNED_PLACE);
    });

    // --- Remove nested sub-activity via rail → DELETE child; tree drops it ---
    const nestedRow =
      panel.querySelector(
        `.subplan-row[data-id="${NESTED_CHILD_ID}"], [data-subplan-row][data-id="${NESTED_CHILD_ID}"]`,
      ) ?? panel.querySelector(".subplan-row[data-subplan-row], [data-subplan-row]");
    expect(nestedRow).toBeTruthy();
    await user.click(nestedRow as HTMLElement);

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    expect(within(context).getByRole("heading", { level: 2 })).toHaveTextContent(
      NESTED_RETURNED_PLACE,
    );

    fetchMock.mockClear();
    await user.click(within(context).getByRole("button", { name: REMOVE_LABEL }));
    const dialog = await screen.findByRole("dialog", {
      name: DELETE_DIALOG_TITLE,
    });
    await user.click(
      within(dialog).getByRole("button", { name: DELETE_CONFIRM_ACTION }),
    );

    await waitFor(() => {
      expect(itineraryDeleteCalls(fetchMock)).toHaveLength(1);
    });
    const deleteCall = itineraryDeleteCalls(fetchMock)[0]!;
    expect(deleteCall.url).toBe(deleteUrl);
    expect((deleteCall.init.method ?? "").toUpperCase()).toBe("DELETE");
    expect(new Headers(deleteCall.init.headers).get("Authorization")).toBe(
      `Bearer ${NESTED_SESSION}`,
    );
    expect(deleteCall.init.body).toBeUndefined();

    await waitFor(() => {
      const stillNested = parentRow.querySelectorAll(
        ".subplan-row[data-subplan-row], [data-subplan-row]",
      );
      expect(
        [...stillNested].some((row) =>
          row.textContent?.includes(NESTED_RETURNED_PLACE),
        ),
      ).toBe(false);
    });
    expect(
      table.querySelector(`tr.stop-row[data-id="${NESTED_PARENT_ID}"]`),
    ).toBeTruthy();
  });
});

/**
 * M81DDKSC T3 #2 — API rejects deleting an activity block that still has
 * children (invalid_request). Surface calm copy; keep parent in the tree.
 * Backend: ServiceError::InvalidRequest
 * "activity block with sub-activities cannot be deleted".
 */
const BLOCK_DELETE_SESSION = "member-session-token-block-delete";
const BLOCK_PARENT_ID = "item-attraction-block-parent";
const BLOCK_CHILD_ID = "item-attraction-block-child";
const BLOCK_PARENT_ACTIVITY = "Senso-ji";
const BLOCK_CHILD_PLACE = "Main hall";
/** Independent literal — backend itinerary delete guard message. */
const BLOCK_DELETE_API_MESSAGE =
  "activity block with sub-activities cannot be deleted";

describe("ItineraryPlanPage parent block-delete guard", () => {
  afterEach(() => {
    cleanup();
  });

  it("Deleting a parent that still has children surfaces the API invalid_request (activity block with sub-activities cannot be deleted) as calm user-visible copy and does not remove the parent locally", async () => {
    const user = userEvent.setup();
    const parentStop: StopItem = {
      ...TRAVEL_STOP,
      id: BLOCK_PARENT_ID,
      activity: BLOCK_PARENT_ACTIVITY,
      activityType: "attraction",
      place: BLOCK_PARENT_ACTIVITY,
      startTime: "10:00",
      endTime: "11:30",
      status: "planned",
      version: 4,
      parentItemId: null,
      isPlanBlock: true,
    };
    const childStop: StopItem = {
      ...TRAVEL_STOP,
      id: BLOCK_CHILD_ID,
      activity: BLOCK_CHILD_PLACE,
      activityType: "attraction",
      place: BLOCK_CHILD_PLACE,
      startTime: "10:00",
      endTime: "",
      status: "idea",
      version: 1,
      parentItemId: BLOCK_PARENT_ID,
      isPlanBlock: false,
    };

    const deleteUrl = `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${BLOCK_PARENT_ID}`;

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "DELETE" && url === deleteUrl) {
        return jsonResponse(
          {
            code: "invalid_request",
            error: { message: BLOCK_DELETE_API_MESSAGE },
            message: BLOCK_DELETE_API_MESSAGE,
          },
          400,
        );
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [parentStop, childStop],
    });

    render(
      <ItineraryPlanPage
        model={model}
        tripId={TRIP_ID}
        sessionToken={BLOCK_DELETE_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const parentRow = table.querySelector(
      `tr.stop-row[data-id="${BLOCK_PARENT_ID}"]`,
    ) as HTMLElement;
    expect(parentRow).toBeTruthy();
    fireEvent.click(parentRow);

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    expect(within(context).getByRole("heading", { level: 2 })).toHaveTextContent(
      BLOCK_PARENT_ACTIVITY,
    );

    await user.click(within(context).getByRole("button", { name: REMOVE_LABEL }));
    const dialog = await screen.findByRole("dialog", {
      name: DELETE_DIALOG_TITLE,
    });
    await user.click(
      within(dialog).getByRole("button", { name: DELETE_CONFIRM_ACTION }),
    );

    await waitFor(() => {
      expect(itineraryDeleteCalls(fetchMock)).toHaveLength(1);
    });
    expect(itineraryDeleteCalls(fetchMock)[0]!.url).toBe(deleteUrl);

    const alert = await waitFor(() => {
      const el =
        within(context).queryByRole("alert") ?? screen.getByRole("alert");
      expect(el).toHaveTextContent(BLOCK_DELETE_API_MESSAGE);
      return el;
    });
    expect(alert).toBeVisible();

    // Parent stays in the Smart itinerary tree (no local optimistic remove).
    expect(
      table.querySelector(`tr.stop-row[data-id="${BLOCK_PARENT_ID}"]`),
    ).toBeTruthy();
    expect(within(context).getByRole("heading", { level: 2 })).toHaveTextContent(
      BLOCK_PARENT_ACTIVITY,
    );
  });
});

/**
 * M82LQRZD T7 #1 — load-latest-on-active + no auto-rerun on edits.
 * ItineraryPlanPage GETs plan-checks/latest once for the visible plan when
 * plan-check deps (tripId/sessionToken/apiBaseUrl/fetch) are active, derives
 * planCheckFindingsByStop (groupFindingsByStop over pending suggestions) and
 * passes it to both SmartItineraryTable (inline check-cue row) and
 * ItineraryContextRail ("Checks for this stop" triage list), sets
 * planCheckMode from the latest summary (never/idle/clean/stale), and wires
 * Run check (rail) to POST plan-checks. Ordinary itinerary edits and model
 * prop churn must never auto-trigger the POST (no silent auto-rerun).
 * RED: ItineraryPlanPage does not yet call plan-check-api at all.
 */
const PLAN_CHECK_SESSION = "member-session-token-plan-check-t7";
const PLAN_CHECK_ID = "018f4e90-0000-7000-8000-0000000000aa";
const PLAN_CHECK_STOP_ID = "item-plan-check-t7-stop";
const PLAN_CHECK_FINDING_MESSAGE = "Missing return travel segment";
const PLAN_CHECK_LATEST_URL = `${API_BASE}/api/v1/trips/${TRIP_ID}/plan-checks/latest`;
const PLAN_CHECK_RUN_URL = `${API_BASE}/api/v1/trips/${TRIP_ID}/plan-checks`;

const planCheckStop: StopItem = {
  ...TRAVEL_STOP,
  id: PLAN_CHECK_STOP_ID,
};

function makePlanSuggestion(
  overrides: Partial<PlanSuggestionSummary> & { id: string },
): PlanSuggestionSummary {
  return {
    tripId: TRIP_ID,
    planCheckId: PLAN_CHECK_ID,
    severity: "warning",
    scope: "item",
    targetItemIds: [PLAN_CHECK_STOP_ID],
    explanation: { en: PLAN_CHECK_FINDING_MESSAGE, th: "" },
    recommendedAction: { en: "Add a return travel stop", th: "" },
    actionKind: null,
    actionPayload: null,
    status: "pending",
    snoozedUntil: null,
    createdAt: "2026-07-23T10:00:05Z",
    updatedAt: "2026-07-23T10:00:05Z",
    version: 1,
    ...overrides,
  };
}

function makePlanCheckSummary(
  overrides: Partial<PlanCheckSummary> & { suggestions: PlanSuggestionSummary[] },
): PlanCheckSummary {
  return {
    id: PLAN_CHECK_ID,
    tripId: TRIP_ID,
    tripPlanId: PLAN_ID,
    createdBy: "018f4e80-1111-7000-9000-000000000001",
    itineraryFingerprint: "sha256:t7abc123",
    stale: false,
    status: "completed",
    languageMetadata: null,
    createdAt: "2026-07-23T10:00:00Z",
    completedAt: "2026-07-23T10:00:05Z",
    version: 1,
    ...overrides,
  };
}

function planCheckLatestCalls(
  fetchMock: ReturnType<typeof vi.fn>,
): Array<{ url: string; init: RequestInit }> {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method !== "GET" || !url.includes("/plan-checks/latest")) return null;
      return { url, init: (init ?? {}) as RequestInit };
    })
    .filter((call): call is { url: string; init: RequestInit } => call !== null);
}

function planCheckRunCalls(
  fetchMock: ReturnType<typeof vi.fn>,
): Array<{ url: string; init: RequestInit }> {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (
        method !== "POST" ||
        !url.includes("/plan-checks") ||
        url.includes("/plan-checks/latest")
      ) {
        return null;
      }
      return { url, init: (init ?? {}) as RequestInit };
    })
    .filter((call): call is { url: string; init: RequestInit } => call !== null);
}

function buildPlanCheckModel(): ItineraryTableModel {
  return buildItineraryTableModel({
    startDate: DAY,
    endDate: DAY,
    planVariantId: PLAN_ID,
    itineraryItems: [planCheckStop],
  });
}

describe("ItineraryPlanPage plan-check load-latest-on-active (T7 #1)", () => {
  afterEach(() => {
    cleanup();
  });

  it("loads GET plan-checks/latest exactly once on mount for the visible plan (Bearer session; no ?tripPlanId= when the optional prop is absent)", async () => {
    const fetchMock = vi.fn(async (input) => {
      const url = String(input);
      if (url === PLAN_CHECK_LATEST_URL) return jsonResponse(null);
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    render(
      <ItineraryPlanPage
        model={buildPlanCheckModel()}
        tripId={TRIP_ID}
        sessionToken={PLAN_CHECK_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    await waitFor(() => {
      expect(planCheckLatestCalls(fetchMock)).toHaveLength(1);
    });
    const call = planCheckLatestCalls(fetchMock)[0]!;
    expect(call.url).toBe(PLAN_CHECK_LATEST_URL);
    expect(new Headers(call.init.headers).get("Authorization")).toBe(
      `Bearer ${PLAN_CHECK_SESSION}`,
    );

    // Settling further renders must not re-trigger the GET (load-once).
    await Promise.resolve();
    await Promise.resolve();
    expect(planCheckLatestCalls(fetchMock)).toHaveLength(1);
  });

  it("includes ?tripPlanId= in the latest GET when the optional tripPlanId prop is provided", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(null));

    render(
      <ItineraryPlanPage
        model={buildPlanCheckModel()}
        tripId={TRIP_ID}
        tripPlanId={PLAN_ID}
        sessionToken={PLAN_CHECK_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    await waitFor(() => {
      expect(planCheckLatestCalls(fetchMock)).toHaveLength(1);
    });
    expect(planCheckLatestCalls(fetchMock)[0]!.url).toBe(
      `${PLAN_CHECK_LATEST_URL}?tripPlanId=${PLAN_ID}`,
    );
  });

  it("passes pending findings (groupFindingsByStop) to the table inline check-cue and to the selected-stop rail 'Checks for this stop' list", async () => {
    const suggestion = makePlanSuggestion({ id: "sugg-plan-check-t7-1" });
    const summary = makePlanCheckSummary({ stale: false, suggestions: [suggestion] });
    const fetchMock = vi.fn(async (input) => {
      const url = String(input);
      if (url === PLAN_CHECK_LATEST_URL) return jsonResponse(summary);
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    render(
      <ItineraryPlanPage
        model={buildPlanCheckModel()}
        tripId={TRIP_ID}
        sessionToken={PLAN_CHECK_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    await waitFor(() => {
      expect(
        table.querySelector(`tr.check-cue[data-for="${PLAN_CHECK_STOP_ID}"]`),
      ).toBeTruthy();
    });
    expect(
      within(table.querySelector(`tr.check-cue[data-for="${PLAN_CHECK_STOP_ID}"]`) as HTMLElement)
        .getByText(PLAN_CHECK_FINDING_MESSAGE),
    ).toBeInTheDocument();

    const stopRow = table.querySelector(
      `tr.stop-row[data-id="${PLAN_CHECK_STOP_ID}"]`,
    ) as HTMLElement;
    fireEvent.click(stopRow);

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    expect(
      within(context).getByRole("heading", { name: /checks for this stop/i }),
    ).toBeInTheDocument();
    expect(
      within(context).getByText(PLAN_CHECK_FINDING_MESSAGE),
    ).toBeInTheDocument();
  });

  it("sets planCheckMode=never when the latest GET returns null (rail shows the never-checked cue)", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(null));

    render(
      <ItineraryPlanPage
        model={buildPlanCheckModel()}
        tripId={TRIP_ID}
        sessionToken={PLAN_CHECK_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    await waitFor(() => {
      expect(within(context).getByText(/no plan check yet/i)).toBeInTheDocument();
    });
  });

  it("sets planCheckMode=stale when the latest summary is stale (rail shows the stale cue; no auto POST)", async () => {
    const suggestion = makePlanSuggestion({ id: "sugg-plan-check-t7-stale" });
    const summary = makePlanCheckSummary({ stale: true, suggestions: [suggestion] });
    const fetchMock = vi.fn(async (input) => {
      const url = String(input);
      if (url === PLAN_CHECK_LATEST_URL) return jsonResponse(summary);
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    render(
      <ItineraryPlanPage
        model={buildPlanCheckModel()}
        tripId={TRIP_ID}
        sessionToken={PLAN_CHECK_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    await waitFor(() => {
      expect(
        within(context).getByText(/plan changed since this check/i),
      ).toBeInTheDocument();
    });
    expect(planCheckRunCalls(fetchMock)).toHaveLength(0);
  });

  it("sets planCheckMode=idle when the latest summary is fresh with pending findings (rail shows the pending-count summary)", async () => {
    const suggestionOne = makePlanSuggestion({ id: "sugg-plan-check-t7-idle-1" });
    const suggestionTwo = makePlanSuggestion({ id: "sugg-plan-check-t7-idle-2" });
    const summary = makePlanCheckSummary({
      stale: false,
      suggestions: [suggestionOne, suggestionTwo],
    });
    const fetchMock = vi.fn(async (input) => {
      const url = String(input);
      if (url === PLAN_CHECK_LATEST_URL) return jsonResponse(summary);
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    render(
      <ItineraryPlanPage
        model={buildPlanCheckModel()}
        tripId={TRIP_ID}
        sessionToken={PLAN_CHECK_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    await waitFor(() => {
      expect(within(context).getByText(/2 checks?/i)).toBeInTheDocument();
    });
    expect(within(context).getByText(/on this plan/i)).toBeInTheDocument();
  });

  it("sets planCheckMode=clean when the latest summary is fresh with no pending findings (rail shows the zero-findings cue)", async () => {
    const summary = makePlanCheckSummary({ stale: false, suggestions: [] });
    const fetchMock = vi.fn(async (input) => {
      const url = String(input);
      if (url === PLAN_CHECK_LATEST_URL) return jsonResponse(summary);
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    render(
      <ItineraryPlanPage
        model={buildPlanCheckModel()}
        tripId={TRIP_ID}
        sessionToken={PLAN_CHECK_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    await waitFor(() => {
      expect(
        within(context).getByText(/no suggestions right now/i),
      ).toBeInTheDocument();
    });
  });

  it("Run check in the rail POSTs plan-checks for the visible plan", async () => {
    const ranSummary = makePlanCheckSummary({ stale: false, suggestions: [] });
    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "GET" && url === PLAN_CHECK_LATEST_URL) {
        return jsonResponse(null);
      }
      if (method === "POST" && url === PLAN_CHECK_RUN_URL) {
        return jsonResponse(ranSummary);
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    render(
      <ItineraryPlanPage
        model={buildPlanCheckModel()}
        tripId={TRIP_ID}
        sessionToken={PLAN_CHECK_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    const runCheckBtn = await within(context).findByRole("button", {
      name: /run check/i,
    });
    fireEvent.click(runCheckBtn);

    await waitFor(() => {
      expect(planCheckRunCalls(fetchMock)).toHaveLength(1);
    });
    const runCall = planCheckRunCalls(fetchMock)[0]!;
    expect(runCall.url).toBe(PLAN_CHECK_RUN_URL);
    expect(new Headers(runCall.init.headers).get("Authorization")).toBe(
      `Bearer ${PLAN_CHECK_SESSION}`,
    );
  });

  it("does not POST plan-checks when an ordinary itinerary edit PATCHes an item (no auto-rerun)", async () => {
    let current: StopItem = { ...planCheckStop, version: 1 };
    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "GET" && url === PLAN_CHECK_LATEST_URL) {
        return jsonResponse(null);
      }
      if (
        method === "PATCH" &&
        url === `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${current.id}`
      ) {
        let body: { patch?: Record<string, unknown> } = {};
        try {
          body = JSON.parse(String(init?.body ?? "{}")) as {
            patch?: Record<string, unknown>;
          };
        } catch {
          body = {};
        }
        current = {
          ...current,
          ...(body.patch as Partial<StopItem>),
          version: current.version + 1,
        };
        return jsonResponse(current);
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    render(
      <ItineraryPlanPage
        model={buildItineraryTableModel({
          startDate: DAY,
          endDate: DAY,
          planVariantId: PLAN_ID,
          itineraryItems: [current],
        })}
        tripId={TRIP_ID}
        sessionToken={PLAN_CHECK_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    await waitFor(() => {
      expect(planCheckLatestCalls(fetchMock)).toHaveLength(1);
    });

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const stopRow = table.querySelector(
      `tr.stop-row[data-id="${current.id}"]`,
    ) as HTMLElement;
    fireEvent.click(stopRow);

    const tableFrom = within(stopRow).getByRole("textbox", { name: /^from$/i });
    fireEvent.change(tableFrom, { target: { value: "HKG" } });
    fireEvent.blur(tableFrom);

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(([input, init]) => {
          const url = String(input);
          const method = String(init?.method ?? "GET").toUpperCase();
          return method === "PATCH" && url.includes("/itinerary-items/");
        }),
      ).toBe(true);
    });

    expect(planCheckRunCalls(fetchMock)).toHaveLength(0);
    // The ordinary edit must not have triggered a second latest reload either.
    expect(planCheckLatestCalls(fetchMock)).toHaveLength(1);
  });

  it("does not POST plan-checks (or re-GET latest) when the model prop changes (no auto-rerun on cockpit reload)", async () => {
    const fetchMock = vi.fn(async (input) => {
      const url = String(input);
      if (url === PLAN_CHECK_LATEST_URL) return jsonResponse(null);
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const initialModel = buildPlanCheckModel();
    const { rerender } = render(
      <ItineraryPlanPage
        model={initialModel}
        tripId={TRIP_ID}
        sessionToken={PLAN_CHECK_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    await waitFor(() => {
      expect(planCheckLatestCalls(fetchMock)).toHaveLength(1);
    });

    const changedStop: StopItem = { ...planCheckStop, version: 2, status: "planned" };
    const nextModel = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [changedStop],
    });

    rerender(
      <ItineraryPlanPage
        model={nextModel}
        tripId={TRIP_ID}
        sessionToken={PLAN_CHECK_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    await Promise.resolve();
    await Promise.resolve();

    expect(planCheckLatestCalls(fetchMock)).toHaveLength(1);
    expect(planCheckRunCalls(fetchMock)).toHaveLength(0);
  });

  /**
   * M82LQRZD T7 — Accept with a safe item action_payload must PATCH the
   * item then the suggestion, and the parent (ItineraryPlanPage) must merge
   * the returned accepted suggestion via onPlanSuggestionResolved (→
   * mergePlanSuggestion) so the finding immediately leaves both the rail's
   * "Checks for this stop" triage list and the table's inline check-cue —
   * groupFindingsByStop only ever surfaces status=pending suggestions.
   */
  it("after a successful Accept (apply path), the parent merges the accepted suggestion so the finding leaves the rail triage list and the table's check-cue", async () => {
    const suggestion = makePlanSuggestion({
      id: "sugg-plan-check-t7-accept",
      actionKind: "item_patch",
      actionPayload: { itemId: PLAN_CHECK_STOP_ID, patch: { status: "planned" } },
    });
    const summary = makePlanCheckSummary({ stale: false, suggestions: [suggestion] });
    const itemPatchUrl = `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${PLAN_CHECK_STOP_ID}`;
    const suggestionPatchUrl = `${API_BASE}/api/v1/trips/${TRIP_ID}/plan-suggestions/${suggestion.id}`;

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "GET" && url === PLAN_CHECK_LATEST_URL) {
        return jsonResponse(summary);
      }
      if (method === "PATCH" && url === itemPatchUrl) {
        return jsonResponse({
          ...planCheckStop,
          status: "planned",
          version: (planCheckStop.version ?? 1) + 1,
        });
      }
      if (method === "PATCH" && url === suggestionPatchUrl) {
        return jsonResponse({
          ...suggestion,
          status: "accepted",
          version: suggestion.version + 1,
        });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    render(
      <ItineraryPlanPage
        model={buildPlanCheckModel()}
        tripId={TRIP_ID}
        sessionToken={PLAN_CHECK_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    await waitFor(() => {
      expect(
        table.querySelector(`tr.check-cue[data-for="${PLAN_CHECK_STOP_ID}"]`),
      ).toBeTruthy();
    });

    const stopRow = table.querySelector(
      `tr.stop-row[data-id="${PLAN_CHECK_STOP_ID}"]`,
    ) as HTMLElement;
    fireEvent.click(stopRow);

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });
    expect(
      within(context).getByText(PLAN_CHECK_FINDING_MESSAGE),
    ).toBeInTheDocument();

    fireEvent.click(
      within(context).getByRole("button", { name: /^accept$/i }),
    );

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([input, init]) => {
        const callUrl = String(input);
        const method = String(init?.method ?? "GET").toUpperCase();
        return method === "PATCH" && callUrl === suggestionPatchUrl;
      })).toBe(true);
    });

    // Parent merged the accepted suggestion (onPlanSuggestionResolved →
    // mergePlanSuggestion) — the finding drops out of pending everywhere.
    await waitFor(() => {
      expect(
        within(context).queryByText(PLAN_CHECK_FINDING_MESSAGE),
      ).toBeNull();
    });
    expect(
      table.querySelector(`tr.check-cue[data-for="${PLAN_CHECK_STOP_ID}"]`),
    ).toBeNull();
  });
});
