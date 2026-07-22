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
