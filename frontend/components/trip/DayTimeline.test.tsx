/**
 * @vitest-environment happy-dom
 *
 * DayTimeline — collapsible type-correct stop cards (M80VKAX5 T3).
 * Landmarks from day-workspace-theme-a-draft-v9.html:
 *   <section aria-label="Day timeline"> <ul class="timeline">
 *   <details class="stop"> <summary> title · place · Activity type
 *   <div class="stop-setup" aria-label="Type setup">
 * Field labels: locked M80VKAX5 matrix / WIP itinerary-type-fields.ts
 * (independent literals — not recomputed via typeFieldDefs).
 *
 * M80VKAX5 T4: day-scoped CRUD + reorder via existing itinerary-items
 * (+ order); no import / overlap-block parity in the day editor.
 * M80VKAX5 T5: time column (start/end/duration/timezone) + Edit time click.
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
import { DayTimeline } from "./DayTimeline";

/** Independent stop literals (draft Wat Chedi / Khao Soi timeline). */
const ATTRACTION_ID = "item-wat-chedi";
const ATTRACTION_TITLE = "Wat Chedi Luang";
const ATTRACTION_PLACE = "Old City";
const FOOD_ID = "item-khao-soi";
const FOOD_TITLE = "Khao Soi Nimman";
const FOOD_PLACE = "Nimman";

/** Draft timeline region + type picker / setup landmarks. */
const TIMELINE_LABEL = /Day timeline/i;
const TYPE_PICKER_LABEL = /Activity type/i;
const TYPE_SETUP_LABEL = /Type setup/i;

/**
 * Locked day-editor matrix labels (decisions.md + WIP typeFieldDefs).
 * Independent of calling typeFieldDefs() in assertions.
 */
const MATRIX_FIELD_LABELS = {
  travel: ["From", "To", "By", "Carrier", "Ref"],
  food: ["Place", "Meal", "Reservation"],
  shopping: ["Place", "To get"],
  attraction: ["Place", "Ticket", "Note"],
  experience: ["Activity", "Meet at", "Booking"],
  stay: ["Place", "Action", "Detail"],
  note: ["Note", "Place"],
} as const;

const PICKER_TYPES = [
  { activityType: "travel", label: "Travel" },
  { activityType: "food", label: "Food" },
  { activityType: "shopping", label: "Shopping" },
  { activityType: "attraction", label: "Attraction" },
  { activityType: "experience", label: "Experience" },
  { activityType: "stay", label: "Stay" },
  { activityType: "note", label: "Note" },
] as const;

type TimelineStop = {
  id: string;
  activity: string;
  activityType: string;
  place: string;
};

const DAY_STOPS: TimelineStop[] = [
  {
    id: ATTRACTION_ID,
    activity: ATTRACTION_TITLE,
    activityType: "attraction",
    place: ATTRACTION_PLACE,
  },
  {
    id: FOOD_ID,
    activity: FOOD_TITLE,
    activityType: "food",
    place: FOOD_PLACE,
  },
];

afterEach(() => {
  cleanup();
});

function stopCard(stopId: string): HTMLElement {
  const card =
    document.querySelector(`details.stop[data-stop-id="${stopId}"]`) ??
    document.querySelector(`[data-stop-id="${stopId}"]`);
  expect(card).toBeTruthy();
  return card as HTMLElement;
}

function typeSetup(card: HTMLElement): HTMLElement {
  const byLabel = within(card).queryByLabelText(TYPE_SETUP_LABEL);
  if (byLabel) return byLabel;
  return within(card).getByRole("group", { name: TYPE_SETUP_LABEL });
}

async function expandStop(
  user: ReturnType<typeof userEvent.setup>,
  card: HTMLElement,
) {
  if (card.hasAttribute("open") || card.getAttribute("aria-expanded") === "true") {
    return;
  }
  const summary =
    card.querySelector("summary") ??
    within(card).queryByRole("button", { name: /expand|collapse|toggle/i }) ??
    card;
  await user.click(summary);
}

async function openTypeMenu(
  user: ReturnType<typeof userEvent.setup>,
  card: HTMLElement,
) {
  const trigger = within(card).getByRole("button", { name: TYPE_PICKER_LABEL });
  await user.click(trigger);
}

function assertFieldLabels(container: HTMLElement, labels: readonly string[]) {
  for (const label of labels) {
    expect(
      within(container).getByLabelText(new RegExp(`^${label}$`, "i")),
    ).toBeInTheDocument();
  }
}

/**
 * T3 #1: Active-day timeline lists that day's stops as expand/collapse cards;
 * collapsed shows title/place/type; expanded shows type-correct setup fields.
 */
describe("DayTimeline expand/collapse stop cards", () => {
  it("lists the day's stops as expand/collapse cards — collapsed title/place/type; expanded typeFieldDefs setup", async () => {
    const user = userEvent.setup();
    render(<DayTimeline stops={DAY_STOPS} />);

    const timeline = screen.getByRole("region", { name: TIMELINE_LABEL });
    expect(within(timeline).getByText(ATTRACTION_TITLE)).toBeInTheDocument();
    expect(within(timeline).getByText(FOOD_TITLE)).toBeInTheDocument();

    const attraction = stopCard(ATTRACTION_ID);
    const food = stopCard(FOOD_ID);

    // Collapsed: title / place / type visible; cards start closed (no open).
    expect(within(attraction).getByText(ATTRACTION_TITLE)).toBeInTheDocument();
    expect(within(attraction).getByText(ATTRACTION_PLACE)).toBeInTheDocument();
    expect(
      within(attraction).getByRole("button", { name: TYPE_PICKER_LABEL }),
    ).toHaveTextContent(/Attraction/i);
    expect(attraction).not.toHaveAttribute("open");
    const collapsedTicket = within(attraction).queryByLabelText(/^Ticket$/i);
    if (collapsedTicket) {
      expect(collapsedTicket).not.toBeVisible();
    }

    expect(within(food).getByText(FOOD_TITLE)).toBeInTheDocument();
    expect(within(food).getByText(FOOD_PLACE)).toBeInTheDocument();
    expect(
      within(food).getByRole("button", { name: TYPE_PICKER_LABEL }),
    ).toHaveTextContent(/Food/i);
    expect(food).not.toHaveAttribute("open");

    // Expand attraction → Attraction matrix fields from typeFieldDefs.
    await expandStop(user, attraction);
    expect(attraction).toHaveAttribute("open");
    const attractionSetup = typeSetup(attraction);
    assertFieldLabels(attractionSetup, MATRIX_FIELD_LABELS.attraction);
    // Travel fields must not appear on an Attraction stop.
    expect(
      within(attractionSetup).queryByLabelText(/^From$/i),
    ).not.toBeInTheDocument();

    // Expand food → Food matrix fields.
    await expandStop(user, food);
    expect(food).toHaveAttribute("open");
    const foodSetup = typeSetup(food);
    assertFieldLabels(foodSetup, MATRIX_FIELD_LABELS.food);
  });
});

/**
 * T3 #2: Activity type picker swaps live field sets per locked matrix
 * (Travel/Food/Shopping/Attraction/Experience/Stay/Note); shared
 * itinerary-type-fields.ts is the single source for DayTimeline.
 */
describe("DayTimeline activity type picker field matrix", () => {
  it("Activity type picker swaps live field sets for every locked matrix type; DayTimeline imports typeFieldDefs from itinerary-type-fields", async () => {
    const user = userEvent.setup();
    render(
      <DayTimeline
        stops={[
          {
            id: ATTRACTION_ID,
            activity: ATTRACTION_TITLE,
            activityType: "attraction",
            place: ATTRACTION_PLACE,
          },
        ]}
      />,
    );

    const card = stopCard(ATTRACTION_ID);
    await expandStop(user, card);

    // Walk the full picker set — each choice swaps the Type setup labels live.
    for (const { activityType, label } of PICKER_TYPES) {
      await openTypeMenu(user, card);
      await user.click(
        await screen.findByRole("option", { name: new RegExp(`^${label}$`, "i") }),
      );

      expect(
        within(card).getByRole("button", { name: TYPE_PICKER_LABEL }),
      ).toHaveTextContent(new RegExp(label, "i"));

      const setup = typeSetup(card);
      assertFieldLabels(setup, MATRIX_FIELD_LABELS[activityType]);

      // Spot-check: travel-only From must vanish when not on Travel.
      if (activityType !== "travel") {
        expect(
          within(setup).queryByLabelText(/^From$/i),
        ).not.toBeInTheDocument();
      }
      // Spot-check: Experience-only Meet at vanishes off Experience.
      if (activityType !== "experience") {
        expect(
          within(setup).queryByLabelText(/^Meet at$/i),
        ).not.toBeInTheDocument();
      }
    }

    // Single source: DayTimeline must import typeFieldDefs from the shared module
    // (not a local copy of the matrix).
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const src = await readFile(
      join(process.cwd(), "components/trip/DayTimeline.tsx"),
      "utf8",
    );
    expect(src).toMatch(/typeFieldDefs/);
    expect(src).toMatch(/itinerary-type-fields/);
  });
});

/**
 * M80VKAX5 T4 #1 — Day workspace CRUD + reorder through existing
 * /api/v1/trips/{id}/itinerary-items (+ /order). Patterns mirror
 * SmartItineraryTable create/patch/reorder/delete fetch assertions
 * (clientMutationId, expectedVersion, planVariantId, day).
 * Draft landmark: button.add-stop "+ Add stop".
 *
 * Test seam for reorder (happy-dom DnD unreliable): CustomEvent
 * `joii:day-timeline-reorder` on the timeline with detail
 * `{ day, itemIds }` (active-day scope only).
 */
const API_BASE = "http://127.0.0.1:5181";
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const PLAN_ID = "018f4e82-3000-7c00-b111-000000000001";
const DAY = "2026-04-12";
const DAY_OTHER = "2026-04-13";
const SESSION_TOKEN = "member-session-token-day-timeline-crud";
const EXPECTED_VERSION = 3;
const CREATE_ACTIVITY = "New stop";
const CREATE_ACTIVITY_TYPE = "note";
const CREATE_PLACE = "";
const CREATED_ITEM_ID = "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f";
const PATCH_PLACE = "Tha Phae Gate";
const PATCH_ACTIVITY_TYPE = "food";
const REORDER_STOP_A_ID = ATTRACTION_ID;
const REORDER_STOP_B_ID = FOOD_ID;
const REORDERED_DAY_ITEM_IDS = [REORDER_STOP_B_ID, REORDER_STOP_A_ID] as const;
/** Other-day id must never appear in active-day order PATCH itemIds. */
const OTHER_DAY_STOP_ID = "item-other-day-stay";
const DAY_TIMELINE_REORDER_EVENT = "joii:day-timeline-reorder";
const DELETE_DIALOG_TITLE = "Delete activity";
const DELETE_CONFIRM_ACTION = "Delete";
const ADD_STOP_LABEL = /add stop/i;
const REMOVE_LABEL = /^remove$/i;

type FetchCall = {
  url: string;
  init: RequestInit;
  body: Record<string, unknown>;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function itineraryCreateCalls(fetchMock: ReturnType<typeof vi.fn>): FetchCall[] {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      if (method !== "POST" || !url.includes("/itinerary-items")) return null;
      if (url.includes("/itinerary-items/")) return null;
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      } catch {
        body = {};
      }
      return { url, init: init ?? {}, body };
    })
    .filter((call): call is FetchCall => call !== null);
}

function itineraryPatchCalls(fetchMock: ReturnType<typeof vi.fn>): FetchCall[] {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      if (method !== "PATCH" || !url.includes("/itinerary-items/")) return null;
      if (url.includes("/itinerary-items/order")) return null;
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      } catch {
        body = {};
      }
      return { url, init: init ?? {}, body };
    })
    .filter((call): call is FetchCall => call !== null);
}

function itineraryOrderCalls(fetchMock: ReturnType<typeof vi.fn>): FetchCall[] {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      if (method !== "PATCH" || !url.includes("/itinerary-items/order")) {
        return null;
      }
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      } catch {
        body = {};
      }
      return { url, init: init ?? {}, body };
    })
    .filter((call): call is FetchCall => call !== null);
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

/** Mutable stops with version for expectedVersion PATCH / DELETE. */
type CrudStop = TimelineStop & { version: number };

const CRUD_STOPS: CrudStop[] = [
  {
    id: ATTRACTION_ID,
    activity: ATTRACTION_TITLE,
    activityType: "attraction",
    place: ATTRACTION_PLACE,
    version: EXPECTED_VERSION,
  },
  {
    id: FOOD_ID,
    activity: FOOD_TITLE,
    activityType: "food",
    place: FOOD_PLACE,
    version: EXPECTED_VERSION,
  },
];

describe("DayTimeline day-scoped CRUD and reorder via itinerary-items", () => {
  it("Add stop POSTs itinerary-items for the active day; type/setup blur PATCHes the item; reorder PATCHes .../order with that day's itemIds only; Remove DELETEs the item — all via existing /api/v1 routes (no parallel itinerary API)", async () => {
    const user = userEvent.setup();
    const attractionSummary = {
      id: ATTRACTION_ID,
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: DAY,
      activity: ATTRACTION_TITLE,
      activityType: "attraction",
      place: ATTRACTION_PLACE,
      startTime: "09:00",
      status: "idea",
      version: EXPECTED_VERSION,
    };
    const foodSummary = {
      id: FOOD_ID,
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: DAY,
      activity: FOOD_TITLE,
      activityType: "food",
      place: FOOD_PLACE,
      startTime: "12:00",
      status: "idea",
      version: EXPECTED_VERSION,
    };
    const createdSummary = {
      id: CREATED_ITEM_ID,
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: DAY,
      activity: CREATE_ACTIVITY,
      activityType: CREATE_ACTIVITY_TYPE,
      place: CREATE_PLACE,
      startTime: "",
      status: "idea",
      version: 1,
    };

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "POST" && url.endsWith(`/itinerary-items`)) {
        return jsonResponse(createdSummary);
      }
      if (method === "PATCH" && url.includes(`/itinerary-items/${ATTRACTION_ID}`)) {
        return jsonResponse({
          ...attractionSummary,
          version: EXPECTED_VERSION + 1,
        });
      }
      if (method === "PATCH" && url.includes("/itinerary-items/order")) {
        return jsonResponse([
          { ...foodSummary, version: EXPECTED_VERSION + 1 },
          { ...attractionSummary, version: EXPECTED_VERSION + 1 },
        ]);
      }
      if (method === "DELETE" && url.includes(`/itinerary-items/${FOOD_ID}`)) {
        return jsonResponse({
          ...foodSummary,
          version: EXPECTED_VERSION + 1,
        });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    render(
      <DayTimeline
        stops={CRUD_STOPS}
        tripId={TRIP_ID}
        planVariantId={PLAN_ID}
        day={DAY}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        reorderEnabled
      />,
    );

    const timeline = screen.getByRole("region", { name: TIMELINE_LABEL });

    // --- Add stop → POST /api/v1/trips/{tripId}/itinerary-items (active day) ---
    await user.click(
      within(timeline).getByRole("button", { name: ADD_STOP_LABEL }),
    );

    await waitFor(() => {
      expect(itineraryCreateCalls(fetchMock)).toHaveLength(1);
    });
    const createCall = itineraryCreateCalls(fetchMock)[0]!;
    expect(createCall.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items`,
    );
    expect((createCall.init.method ?? "").toUpperCase()).toBe("POST");
    const createHeaders = new Headers(createCall.init.headers);
    expect(createHeaders.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(createHeaders.get("Content-Type")).toMatch(/application\/json/i);
    expect(typeof createCall.body.clientMutationId).toBe("string");
    expect(String(createCall.body.clientMutationId).length).toBeGreaterThan(0);
    expect(createCall.body).toEqual(
      expect.objectContaining({
        planVariantId: PLAN_ID,
        day: DAY,
        activity: CREATE_ACTIVITY,
        activityType: CREATE_ACTIVITY_TYPE,
        place: CREATE_PLACE,
      }),
    );
    // Active day only — create must not invent another day.
    expect(createCall.body.day).not.toBe(DAY_OTHER);
    // Existing itinerary-items route only (no parallel day/stop API).
    expect(createCall.url).not.toMatch(/\/day-stops\b|\/timeline-items\b/);

    // --- Type/setup commit → PATCH itinerary-items/{itemId} ---
    fetchMock.mockClear();
    const attraction = stopCard(ATTRACTION_ID);
    await expandStop(user, attraction);

    // Activity type picker commit.
    await openTypeMenu(user, attraction);
    await user.click(
      await screen.findByRole("option", { name: /^Food$/i }),
    );
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const typePatch = itineraryPatchCalls(fetchMock)[0]!;
    expect(typePatch.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${ATTRACTION_ID}`,
    );
    expect((typePatch.init.method ?? "").toUpperCase()).toBe("PATCH");
    expect(new Headers(typePatch.init.headers).get("Authorization")).toBe(
      `Bearer ${SESSION_TOKEN}`,
    );
    expect(typeof typePatch.body.clientMutationId).toBe("string");
    expect(String(typePatch.body.clientMutationId).length).toBeGreaterThan(0);
    expect(typePatch.body.expectedVersion).toBe(EXPECTED_VERSION);
    expect(typePatch.body.patch).toEqual(
      expect.objectContaining({ activityType: PATCH_ACTIVITY_TYPE }),
    );

    // Setup field blur (Place).
    fetchMock.mockClear();
    const setup = typeSetup(attraction);
    const placeField = within(setup).getByLabelText(/^Place$/i);
    fireEvent.change(placeField, { target: { value: PATCH_PLACE } });
    fireEvent.blur(placeField);
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const placePatch = itineraryPatchCalls(fetchMock)[0]!;
    expect(placePatch.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${ATTRACTION_ID}`,
    );
    expect(typeof placePatch.body.clientMutationId).toBe("string");
    expect(placePatch.body.expectedVersion).toBe(EXPECTED_VERSION);
    expect(placePatch.body.patch).toEqual(
      expect.objectContaining({ place: PATCH_PLACE }),
    );

    // --- Reorder within day → PATCH .../order (active-day itemIds only) ---
    fetchMock.mockClear();
    timeline.dispatchEvent(
      new CustomEvent(DAY_TIMELINE_REORDER_EVENT, {
        bubbles: true,
        detail: {
          day: DAY,
          itemIds: [...REORDERED_DAY_ITEM_IDS],
          // Caller must not smuggle other-day ids into the day scope.
          _otherDayStopId: OTHER_DAY_STOP_ID,
        },
      }),
    );
    await waitFor(() => {
      expect(itineraryOrderCalls(fetchMock)).toHaveLength(1);
    });
    const orderCall = itineraryOrderCalls(fetchMock)[0]!;
    expect(orderCall.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/order`,
    );
    expect((orderCall.init.method ?? "").toUpperCase()).toBe("PATCH");
    expect(new Headers(orderCall.init.headers).get("Authorization")).toBe(
      `Bearer ${SESSION_TOKEN}`,
    );
    expect(typeof orderCall.body.clientMutationId).toBe("string");
    expect(String(orderCall.body.clientMutationId).length).toBeGreaterThan(0);
    expect(orderCall.body.planVariantId).toBe(PLAN_ID);
    expect(orderCall.body.day).toBe(DAY);
    expect(orderCall.body.itemIds).toEqual([...REORDERED_DAY_ITEM_IDS]);
    expect(orderCall.body.itemIds).not.toContain(OTHER_DAY_STOP_ID);
    expect(orderCall.body.day).not.toBe(DAY_OTHER);

    // --- Delete → DELETE itinerary-items/{itemId} ---
    fetchMock.mockClear();
    const food = stopCard(FOOD_ID);
    const removeBtn = within(food).getByRole("button", { name: REMOVE_LABEL });
    await user.click(removeBtn);
    // Opening alone must not DELETE — confirm drives the call (destructive dialog).
    expect(itineraryDeleteCalls(fetchMock)).toHaveLength(0);
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
    expect(deleteCall.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${FOOD_ID}`,
    );
    expect((deleteCall.init.method ?? "").toUpperCase()).toBe("DELETE");
    expect(new Headers(deleteCall.init.headers).get("Authorization")).toBe(
      `Bearer ${SESSION_TOKEN}`,
    );
    expect(deleteCall.init.body).toBeUndefined();
    // Still the existing itinerary-items path — not a parallel day API.
    expect(deleteCall.url).toMatch(
      /\/api\/v1\/trips\/.+\/itinerary-items\/.+/,
    );
    expect(deleteCall.url).not.toMatch(/\/day-stops\b|\/timeline-items\b/);
  });
});

/**
 * M80VKAX5 T4 #2 — v1 day editor scope: CRUD chrome (+ Add stop) without
 * Table-route import UI or overlap-block parity.
 */
describe("DayTimeline v1 day editor scope (no import / overlap-block)", () => {
  it("exposes + Add stop for day CRUD and does not ship import UI or overlap-block parity", () => {
    render(
      <DayTimeline
        stops={CRUD_STOPS}
        tripId={TRIP_ID}
        planVariantId={PLAN_ID}
        day={DAY}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
      />,
    );

    const timeline = screen.getByRole("region", { name: TIMELINE_LABEL });

    // Day editor has Add stop (draft .add-stop) — wiring lands in T4 #1.
    expect(
      within(timeline).getByRole("button", { name: ADD_STOP_LABEL }),
    ).toBeInTheDocument();
    expect(timeline.querySelector("button.add-stop")).toBeTruthy();

    // Out of v1 day-editor scope (remain Table-route concerns).
    expect(
      within(timeline).queryByRole("button", { name: /^import$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /import\s+(itinerary|stops|plan)/i }),
    ).not.toBeInTheDocument();
    expect(
      timeline.querySelector(
        ".overlap-block, [data-overlap-block], [data-overlap], .overlap-warning",
      ),
    ).toBeNull();
    expect(
      within(timeline).queryByText(/overlap/i),
    ).not.toBeInTheDocument();
  });
});

/**
 * M80VKAX5 T5 #2 — Timeline time column (draft .time-block):
 * start, end, duration (xh ym), timezone — center-aligned; click opens
 * Edit time dialog. Soft: timezone label at least (auto place/country soft).
 * Independent literals: draft Wat Chedi 09:00–10:30 → "1h 30m" / ICT.
 */
const TIME_START = "09:00";
const TIME_END = "10:30";
/** Draft durLabel(09:00, 10:30) → "1h 30m". */
const TIME_DURATION = "1h 30m";
const TIME_TZ_IANA = "Asia/Bangkok";
const TIME_TZ_LABEL = "ICT";
const TIME_EDIT_DIALOG_TITLE = "Edit time";
const TIME_BLOCK_LABEL = new RegExp(
  `Edit time for ${ATTRACTION_TITLE}`,
  "i",
);

type TimedStop = CrudStop & {
  startTime: string;
  endTime: string;
  timezone?: string;
  timezoneLabel?: string;
};

const TIMED_STOPS: TimedStop[] = [
  {
    id: ATTRACTION_ID,
    activity: ATTRACTION_TITLE,
    activityType: "attraction",
    place: ATTRACTION_PLACE,
    version: EXPECTED_VERSION,
    startTime: TIME_START,
    endTime: TIME_END,
    timezone: TIME_TZ_IANA,
    timezoneLabel: TIME_TZ_LABEL,
  },
  {
    id: FOOD_ID,
    activity: FOOD_TITLE,
    activityType: "food",
    place: FOOD_PLACE,
    version: EXPECTED_VERSION,
    startTime: "12:30",
    endTime: "13:30",
    timezone: TIME_TZ_IANA,
    timezoneLabel: TIME_TZ_LABEL,
  },
];

describe("DayTimeline time column display and Edit time click", () => {
  it("time column shows center-aligned start, end, duration, and timezone; click opens Edit time dialog", async () => {
    const user = userEvent.setup();
    render(
      <DayTimeline
        stops={TIMED_STOPS}
        tripId={TRIP_ID}
        planVariantId={PLAN_ID}
        day={DAY}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
      />,
    );

    const timeline = screen.getByRole("region", { name: TIMELINE_LABEL });
    const timeBlock = within(timeline).getByRole("button", {
      name: TIME_BLOCK_LABEL,
    });

    expect(timeBlock).toHaveAttribute("aria-haspopup", "dialog");
    expect(timeBlock).toHaveClass("time-block");

    // Start / end / duration / timezone visible in the column.
    expect(within(timeBlock).getByText(TIME_START)).toBeInTheDocument();
    expect(within(timeBlock).getByText(TIME_END)).toBeInTheDocument();
    expect(within(timeBlock).getByText(TIME_DURATION)).toBeInTheDocument();
    expect(within(timeBlock).getByText(TIME_TZ_LABEL)).toBeInTheDocument();

    // Center-aligned (draft .time-block { text-align: center }).
    expect(getComputedStyle(timeBlock).textAlign).toBe("center");

    // Click opens must-finish Edit time dialog (destructive/must-finish may use dialogs).
    expect(
      screen.queryByRole("dialog", { name: TIME_EDIT_DIALOG_TITLE }),
    ).not.toBeInTheDocument();
    await user.click(timeBlock);
    const dialog = await screen.findByRole("dialog", {
      name: TIME_EDIT_DIALOG_TITLE,
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByLabelText(/^Start$/i)).toHaveValue(TIME_START);
    expect(within(dialog).getByLabelText(/^End$/i)).toHaveValue(TIME_END);
  });
});

/**
 * M80VKAX5 T10 #1 — Inline AI chips under related stops (outside expand/
 * collapse cards). Chip / Details opens plan dialog with Why + affects +
 * Accept/Reject. Bottom accordion / suggest-strip panel is retired.
 * Draft landmarks: .inline-suggest sibling after details.stop; #plan-dialog.
 */
const AI_BATCH_ID = "018f4e90-0000-7000-8000-0000000000aa";
const AI_OPTION_A_ID = "018f4e90-0000-7000-8000-0000000000a1";
const AI_CHIP_HEADING = "Plan A · +45m buffer";
const AI_CHIP_SUMMARY = "Recommended · keep morning culture flow";
const AI_WHY =
  "Temple opens early; songthaew is usual for this leg; 45m buffer matches afternoon traffic toward Doi Suthep from Nimman on Saturdays.";
const AI_AFFECTS = "Affects: Wat Chedi Luang · Doi Suthep overlook";
const AI_DIALOG_TITLE = /Plan A · Culture morning/i;

describe("DayTimeline inline AI suggestion chips under stops", () => {
  it("places compact AI chips under related stops outside expand/collapse cards; chip opens Why/Accept dialog — no bottom accordion", async () => {
    const user = userEvent.setup();

    render(
      <DayTimeline
        stops={DAY_STOPS}
        tripId={TRIP_ID}
        planVariantId={PLAN_ID}
        day={DAY}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        aiSuggestions={[
          {
            relatedStopId: ATTRACTION_ID,
            batchId: AI_BATCH_ID,
            option: {
              id: AI_OPTION_A_ID,
              label: "A",
              title: "Culture morning",
              summary: AI_CHIP_SUMMARY,
              why: AI_WHY,
              affectsItemIds: [ATTRACTION_ID, "item-doi-suthep"],
              proposedMutations: [],
            },
            chipTitle: "+45m buffer",
            affectLabels: ["Wat Chedi Luang", "Doi Suthep overlook"],
          },
        ]}
      />,
    );

    const timeline = screen.getByRole("region", { name: TIMELINE_LABEL });
    const attractionCard = stopCard(ATTRACTION_ID);

    const chip = within(timeline).getByRole("button", {
      name: new RegExp(AI_CHIP_HEADING, "i"),
    });
    expect(chip).toHaveAttribute("aria-haspopup", "dialog");
    expect(chip).toHaveTextContent(AI_CHIP_SUMMARY);
    expect(chip).toHaveTextContent(/Details/i);

    // Outside the expand/collapse card; still under the related stop row.
    expect(attractionCard.contains(chip)).toBe(false);
    const stopRow = attractionCard.closest("li");
    expect(stopRow).toBeTruthy();
    expect(stopRow!.contains(chip)).toBe(true);
    expect(attractionCard.querySelector(".inline-suggest")).toBeNull();
    expect(chip.closest(".inline-suggest")).toBeTruthy();

    // Food stop has no suggestion for this batch — chip is stop-scoped.
    const foodCard = stopCard(FOOD_ID);
    const foodRow = foodCard.closest("li");
    expect(foodRow).toBeTruthy();
    expect(
      within(foodRow as HTMLElement).queryByRole("button", {
        name: new RegExp(AI_CHIP_HEADING, "i"),
      }),
    ).not.toBeInTheDocument();

    // Retired bottom accordion / suggest strip — dialog only on demand.
    expect(timeline.querySelector(".suggest-strip")).toBeNull();
    expect(
      document.querySelector(
        "[data-ai-accordion], .ai-plans-panel, .ai-plans-accordion",
      ),
    ).toBeNull();
    expect(
      screen.queryByRole("region", {
        name: /AI plans|suggestion accordion|plan options/i,
      }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("dialog", { name: AI_DIALOG_TITLE }),
    ).not.toBeInTheDocument();

    await user.click(chip);

    const dialog = await screen.findByRole("dialog", { name: AI_DIALOG_TITLE });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(within(dialog).getByText(/^Why$/i)).toBeInTheDocument();
    expect(within(dialog).getByText(AI_WHY)).toBeInTheDocument();
    expect(within(dialog).getByText(AI_AFFECTS)).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /^Accept$/i }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: /^Reject$/i }),
    ).toBeInTheDocument();
  });
});
