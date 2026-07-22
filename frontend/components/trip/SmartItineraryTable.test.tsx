/**
 * @vitest-environment happy-dom
 *
 * SmartItineraryTable — draft landmarks vs itinerary-plan-draft-v1.html.
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 *
 * T3 #2: time rail | body; no path-graph / alt-path columns.
 * T3 #3: activity types + default fallback; zebra; Day N / pretty date headers.
 * T4 #1: collapsed + Add activity per day → inline draft (Quick only).
 * T4 #2: Enter POSTs create body; Esc/✕ cancels without POST.
 * T4 #3: success appends returned summary; failure keeps draft + calm error.
 * T5 #1: inline blur/commit PATCHes itinerary-items/{itemId} with expectedVersion.
 * T5 #2: version_conflict → TripCockpit reload before next edit (no silent overwrite).
 * T5 #3: incomplete idea rows stay valid; type picker excludes default (picker set only).
 * T7 #2: static/demo weather chrome on day headers; no live weather network calls.
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
import { SmartItineraryTable } from "./SmartItineraryTable";

/** Independent literals from approved itinerary-plan-draft-v1.html (travel stop t1). */
const TRIP_ID = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const PLAN_ID = "018f4e82-3000-7c00-b111-000000000001";
const DAY = "2026-04-12";
const DAY_2 = "2026-04-13";
const START_TIME = "09:40";
const END_TIME = "05:50";
/** Draft overnight window 09:40–05:50 → 20h 10m (decisions + draft syncDuration). */
const DURATION_TEXT = "20h 10m";
const PRIMARY_TITLE = "BKK → NRT";
const SECONDARY_DETAIL = "Thai Airways · TG640";
const TYPE_ARIA_LABEL = "Travel";
const TABLE_ARIA_LABEL = /smart itinerary table/i;

/** DESIGN.md / draft --color-surface-subtle (even zebra stripe). */
const SURFACE = "#ffffff";
const SURFACE_SUBTLE = "#f8fafc";

/**
 * Draft TYPE_LABEL map (picker types only). API `default` renders as unset/"Type".
 * Spec: travel/food/shopping/attraction/experience/stay; default = fallback only.
 */
const PICKER_TYPES = [
  { activityType: "travel", ariaLabel: "Travel" },
  { activityType: "food", ariaLabel: "Food" },
  { activityType: "shopping", ariaLabel: "Shopping" },
  { activityType: "attraction", ariaLabel: "Attraction" },
  { activityType: "experience", ariaLabel: "Experience" },
  { activityType: "stay", ariaLabel: "Stay" },
] as const;

/** Draft day-spine pretty dates for 2026-04-12 / 2026-04-13. */
const DAY1_HEADER = {
  dayNum: "1",
  dataDay: "Day 1",
  datetime: DAY,
  dow: "sat",
  dom: "12",
  mon: "Apr",
} as const;
const DAY2_HEADER = {
  dayNum: "2",
  dataDay: "Day 2",
  datetime: DAY_2,
  dow: "sun",
  dom: "13",
  mon: "Apr",
} as const;

/**
 * Phase-1 row fields: API activity/place map to draft primary/secondary.
 * endTime is carried for the time rail (cockpit summary includes it).
 */
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

function stop(
  overrides: Partial<StopItem> & Pick<StopItem, "id" | "day" | "activity" | "activityType">,
): StopItem {
  return {
    tripId: TRIP_ID,
    planVariantId: PLAN_ID,
    place: "",
    startTime: "10:00",
    endTime: "11:00",
    status: "idea",
    version: 1,
    ...overrides,
  };
}

function normalizeBg(value: string): string {
  const v = value.trim().toLowerCase().replace(/\s+/g, "");
  if (v === "rgb(255,255,255)" || v === "#fff") return "#ffffff";
  if (v === "rgb(248,250,252)") return "#f8fafc";
  return v;
}

afterEach(() => {
  cleanup();
});

describe("SmartItineraryTable stop row composition", () => {
  it("each stop row matches draft composition: time rail (start–end + duration) | body (type icon + primary title + secondary detail + actions); no path-graph or alt-path columns", () => {
    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [TRAVEL_STOP],
    });

    render(<SmartItineraryTable model={model} />);

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });

    // Single Activity/Time column — reject legacy path-graph / alt-path chrome.
    expect(
      within(table).queryByRole("columnheader", {
        name: /path|alt(?:ernative)?\s*path/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      table.querySelector(
        ".path-graph, .col-path, .alt-path, [data-path-graph], [data-col='path']",
      ),
    ).toBeNull();

    const stopRow = table.querySelector("tr.stop-row");
    expect(stopRow).toBeTruthy();
    const row = stopRow as HTMLElement;

    expect(row.querySelector("td.col-stop")).toBeTruthy();
    expect(row.querySelector(".stop-block")).toBeTruthy();

    // Time rail: start – end + duration (draft .stop-when landmarks).
    const timeRail = row.querySelector(".stop-when");
    expect(timeRail).toBeTruthy();
    const when = within(timeRail as HTMLElement);
    expect(when.getByLabelText("Start time")).toHaveValue(START_TIME);
    expect(when.getByLabelText("End time")).toHaveValue(END_TIME);
    expect(row.querySelector(".time-range .time-dash")).toHaveTextContent("–");
    const duration = when.getByLabelText("Duration");
    expect(duration).toHaveTextContent(DURATION_TEXT);

    // Body: type icon + primary title + secondary detail + actions.
    const stopBody = row.querySelector(".stop-body");
    expect(stopBody).toBeTruthy();

    const typeTrigger = stopBody!.querySelector(
      "button.type-trigger[data-type-trigger]",
    );
    expect(typeTrigger).toBeTruthy();
    expect(typeTrigger).toHaveAttribute("aria-label", TYPE_ARIA_LABEL);
    expect(typeTrigger!.querySelector(".type-ico")).toBeTruthy();

    const primary = stopBody!.querySelector(".line-primary");
    expect(primary).toBeTruthy();
    expect(primary).toHaveTextContent(PRIMARY_TITLE);

    const secondary = stopBody!.querySelector(".line-secondary");
    expect(secondary).toBeTruthy();
    expect(secondary).toHaveTextContent(SECONDARY_DETAIL);

    // Draft landmark: .activity-actions / [data-activity-actions] in the body.
    expect(
      stopBody!.querySelector(".activity-actions, [data-activity-actions]"),
    ).toBeTruthy();
  });
});

describe("SmartItineraryTable activity types, zebra, and day headers", () => {
  beforeEach(() => {
    // DESIGN tokens used by draft zebra odd/even backgrounds.
    document.documentElement.style.setProperty("--color-surface", SURFACE);
    document.documentElement.style.setProperty(
      "--color-surface-subtle",
      SURFACE_SUBTLE,
    );
  });

  afterEach(() => {
    document.documentElement.style.removeProperty("--color-surface");
    document.documentElement.style.removeProperty("--color-surface-subtle");
  });

  it("Activity types render for travel/food/shopping/attraction/experience/stay with default only as fallback; zebra striping and Day N / pretty date headers match draft landmarks", () => {
    const items: StopItem[] = [
      stop({
        id: "item-travel",
        day: DAY,
        activity: "BKK → NRT",
        activityType: "travel",
        startTime: "09:40",
        endTime: "05:50",
      }),
      stop({
        id: "item-food",
        day: DAY,
        activity: "Ramen",
        activityType: "food",
        place: "Ichiran",
      }),
      stop({
        id: "item-shopping",
        day: DAY,
        activity: "Convenience run",
        activityType: "shopping",
        place: "FamilyMart",
      }),
      stop({
        id: "item-default",
        day: DAY,
        activity: "Untitled activity",
        activityType: "default",
      }),
      stop({
        id: "item-attraction",
        day: DAY_2,
        activity: "Senso-ji",
        activityType: "attraction",
      }),
      stop({
        id: "item-experience",
        day: DAY_2,
        activity: "TeamLab",
        activityType: "experience",
      }),
      stop({
        id: "item-stay",
        day: DAY_2,
        activity: "Hotel check-in",
        activityType: "stay",
        place: "Park Hyatt",
      }),
    ];

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY_2,
      planVariantId: PLAN_ID,
      itineraryItems: items,
    });

    render(<SmartItineraryTable model={model} />);

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const tbody = table.querySelector("tbody");
    expect(tbody).toBeTruthy();

    // --- Day N + pretty date headers (draft tr.day-row / .day-num / time.day-date) ---
    const dayRows = tbody!.querySelectorAll("tr.day-row");
    expect(dayRows.length).toBe(2);

    for (const expected of [DAY1_HEADER, DAY2_HEADER]) {
      const dayRow = [...dayRows].find((row) => {
        const dateEl = row.querySelector("time.day-date");
        return dateEl?.getAttribute("datetime") === expected.datetime;
      });
      expect(dayRow).toBeTruthy();

      const dayId = dayRow!.querySelector(".day-id");
      expect(dayId).toBeTruthy();
      expect(dayId).toHaveAttribute("data-dow", expected.dow);
      expect(dayRow!.querySelector(".day-num, [data-day-num]")).toHaveTextContent(
        expected.dayNum,
      );

      const dateEl = dayRow!.querySelector("time.day-date") as HTMLElement;
      expect(dateEl).toHaveAttribute("datetime", expected.datetime);
      expect(dateEl.querySelector(".dom")).toHaveTextContent(expected.dom);
      expect(dateEl.querySelector(".mon")).toHaveTextContent(expected.mon);
    }

    // Stops carry draft Day N landmark (data-day="Day N").
    expect(
      tbody!.querySelector(`tr.stop-row[data-day="${DAY1_HEADER.dataDay}"]`),
    ).toBeTruthy();
    expect(
      tbody!.querySelector(`tr.stop-row[data-day="${DAY2_HEADER.dataDay}"]`),
    ).toBeTruthy();

    // --- Activity types: picker set + default → unset/"Type" fallback ---
    for (const { activityType, ariaLabel } of PICKER_TYPES) {
      const trigger = tbody!.querySelector(
        `button.type-trigger.${activityType}[data-type-trigger]`,
      );
      expect(trigger).toBeTruthy();
      expect(trigger).toHaveAttribute("aria-label", ariaLabel);
      expect(trigger).toHaveAttribute("title", ariaLabel);
      expect(trigger!.querySelector(".type-ico")).toBeTruthy();
    }

    const defaultRow = tbody!.querySelector(
      'tr.stop-row[data-id="item-default"]',
    );
    expect(defaultRow).toBeTruthy();
    const defaultTrigger = defaultRow!.querySelector(
      "button.type-trigger[data-type-trigger]",
    );
    expect(defaultTrigger).toBeTruthy();
    // Draft unset fallback — never expose API `default` as a picker type class.
    expect(defaultTrigger).toHaveClass("unset");
    expect(defaultTrigger).not.toHaveClass("default");
    expect(defaultTrigger).toHaveAttribute("aria-label", "Type");
    expect(defaultTrigger).toHaveAttribute("title", "Type");

    // --- Zebra striping (draft odd=surface / even=surface-subtle among .stop-row) ---
    const stopRows = [...tbody!.querySelectorAll("tr.stop-row")];
    expect(stopRows.length).toBeGreaterThanOrEqual(2);

    const oddTd = stopRows[0]!.querySelector("td");
    const evenTd = stopRows[1]!.querySelector("td");
    expect(oddTd).toBeTruthy();
    expect(evenTd).toBeTruthy();

    const oddBg =
      oddTd!.style.backgroundColor ||
      oddTd!.style.background ||
      getComputedStyle(oddTd!).backgroundColor;
    const evenBg =
      evenTd!.style.backgroundColor ||
      evenTd!.style.background ||
      getComputedStyle(evenTd!).backgroundColor;

    expect(normalizeBg(oddBg)).toBe(SURFACE);
    expect(normalizeBg(evenBg)).toBe(SURFACE_SUBTLE);
  });
});

describe("SmartItineraryTable Quick-only add row", () => {
  it("each day ends with collapsed + Add activity; click opens an inline draft row (no Smart/AI paste chrome)", async () => {
    const user = userEvent.setup();
    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY_2,
      planVariantId: PLAN_ID,
      itineraryItems: [
        TRAVEL_STOP,
        stop({
          id: "item-day2",
          day: DAY_2,
          activity: "Senso-ji",
          activityType: "attraction",
        }),
      ],
    });

    render(<SmartItineraryTable model={model} />);

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const tbody = table.querySelector("tbody");
    expect(tbody).toBeTruthy();

    const dayRows = [...tbody!.querySelectorAll("tr.day-row")];
    expect(dayRows.length).toBe(2);

    const addRows = [...tbody!.querySelectorAll("tr.add-row")];
    expect(addRows.length).toBe(2);

    // Each day block ends with collapsed + Add activity (draft landmark).
    for (const expected of [DAY1_HEADER, DAY2_HEADER]) {
      const dayRow = dayRows.find((row) => {
        const dateEl = row.querySelector("time.day-date");
        return dateEl?.getAttribute("datetime") === expected.datetime;
      });
      expect(dayRow).toBeTruthy();

      let cursor: Element | null = dayRow!.nextElementSibling;
      let lastInDay: Element | null = null;
      while (cursor && !cursor.classList.contains("day-row")) {
        lastInDay = cursor;
        cursor = cursor.nextElementSibling;
      }
      // Day ends with add-row; optional hidden add-draft-row may follow.
      const terminal =
        lastInDay?.classList.contains("add-draft-row") &&
        lastInDay.previousElementSibling?.classList.contains("add-row")
          ? lastInDay.previousElementSibling
          : lastInDay;
      expect(terminal).toBeTruthy();
      expect(terminal).toHaveClass("add-row");
      expect(terminal).toHaveAttribute("data-day", expected.dataDay);
      expect(terminal).toHaveAttribute("data-open", "false");

      const trigger = terminal!.querySelector("button.add-trigger");
      expect(trigger).toBeTruthy();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(
        within(terminal as HTMLElement).getByText("Add activity"),
      ).toBeInTheDocument();
    }

    // Collapsed: draft rows exist but are not shown until click.
    const draftBefore = tbody!.querySelector(
      `tr.add-draft-row[data-day="${DAY1_HEADER.dataDay}"]`,
    );
    expect(draftBefore).toBeTruthy();
    expect(draftBefore).not.toBeVisible();

    await user.click(
      within(
        tbody!.querySelector(
          `tr.add-row[data-day="${DAY1_HEADER.dataDay}"]`,
        ) as HTMLElement,
      ).getByRole("button", { name: /add activity/i }),
    );

    const draftAfter = tbody!.querySelector(
      `tr.add-draft-row[data-day="${DAY1_HEADER.dataDay}"]`,
    );
    expect(draftAfter).toBeTruthy();
    expect(draftAfter).toBeVisible();
    // Inline draft = normal stop-shaped row, not a boxed paste composer.
    expect(draftAfter!.querySelector(".stop-block")).toBeTruthy();

    // Quick only — no Smart/AI paste chrome (decisions: Smart paste deferred).
    expect(
      within(table).queryByRole("button", { name: /^smart$/i }),
    ).not.toBeInTheDocument();
    expect(
      table.querySelector(
        "[data-add-mode], .add-mode-toggle, .smart-paste, [data-smart-paste], textarea[data-paste]",
      ),
    ).toBeNull();
    expect(
      within(draftAfter as HTMLElement).queryByPlaceholderText(/paste/i),
    ).not.toBeInTheDocument();
  });
});

/** Independent create literals — CreateItineraryItemRequest + T4 soft assumptions. */
const API_BASE = "http://127.0.0.1:5181";
const SESSION_TOKEN = "member-session-token-quick-add";
const ACTIVITY_TITLE = "Morning coffee";
/** Unset type picker → API activityType `default` (decisions.md). */
const CREATE_ACTIVITY_TYPE = "default";
/** place may be "" (create validation allows empty place). */
const CREATE_PLACE = "";
const CREATED_ITEM_ID = "018f4e83-5410-7d8b-8f25-fd52c5e7bd1f";
/** Returned summary activity — distinct from typed draft to prove append uses response. */
const RETURNED_ACTIVITY = "Espresso tasting";
/**
 * Calm failure copy from createItineraryItem (5xx, no API message) —
 * independent of table chrome.
 */
const CREATE_FAIL_MESSAGE =
  "Something went wrong adding this stop. Please try again.";

type FetchCall = {
  url: string;
  init: RequestInit;
  body: Record<string, unknown>;
};

function itineraryCreateCalls(fetchMock: ReturnType<typeof vi.fn>): FetchCall[] {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      if (method !== "POST" || !url.includes("/itinerary-items")) return null;
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

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("SmartItineraryTable Quick-add POST", () => {
  it("Enter POSTs /api/v1/trips/{tripId}/itinerary-items with clientMutationId, planVariantId, day, activity, activityType, and place; Esc/✕ cancels without POST", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        id: CREATED_ITEM_ID,
        tripId: TRIP_ID,
        planVariantId: PLAN_ID,
        day: DAY,
        activity: ACTIVITY_TITLE,
        activityType: CREATE_ACTIVITY_TYPE,
        place: CREATE_PLACE,
        startTime: "",
        status: "idea",
        version: 1,
      }),
    );

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const tbody = table.querySelector("tbody")!;
    const addRow = tbody.querySelector(
      `tr.add-row[data-day="${DAY1_HEADER.dataDay}"]`,
    ) as HTMLElement;
    const draftRow = () =>
      tbody.querySelector(
        `tr.add-draft-row[data-day="${DAY1_HEADER.dataDay}"]`,
      ) as HTMLElement;

    const openDraft = async () => {
      await user.click(
        within(addRow).getByRole("button", { name: /add activity/i }),
      );
      expect(draftRow()).toBeVisible();
    };

    // --- Esc cancels without POST ---
    await openDraft();
    await user.keyboard("{Escape}");
    expect(draftRow()).not.toBeVisible();
    expect(itineraryCreateCalls(fetchMock)).toHaveLength(0);

    // --- ✕ (Cancel) cancels without POST ---
    await openDraft();
    await user.click(
      within(draftRow()).getByRole("button", { name: /^cancel$/i }),
    );
    expect(draftRow()).not.toBeVisible();
    expect(itineraryCreateCalls(fetchMock)).toHaveLength(0);

    // --- Enter POSTs create body (CreateItineraryItemRequest camelCase) ---
    await openDraft();
    const titleField = within(draftRow()).getByRole("textbox", {
      name: /title/i,
    });
    await user.type(titleField, ACTIVITY_TITLE);
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(itineraryCreateCalls(fetchMock)).toHaveLength(1);
    });

    const createCall = itineraryCreateCalls(fetchMock)[0]!;
    expect(createCall.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items`,
    );
    const headers = new Headers(createCall.init.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${SESSION_TOKEN}`);
    expect(headers.get("Content-Type")).toMatch(/application\/json/i);

    // Required create fields from backend CreateItineraryItemRequest.
    expect(typeof createCall.body.clientMutationId).toBe("string");
    expect(String(createCall.body.clientMutationId).length).toBeGreaterThan(0);
    expect(createCall.body).toEqual(
      expect.objectContaining({
        planVariantId: PLAN_ID,
        day: DAY,
        activity: ACTIVITY_TITLE,
        activityType: CREATE_ACTIVITY_TYPE,
        place: CREATE_PLACE,
      }),
    );
  });
});

describe("SmartItineraryTable Quick-add result", () => {
  it("Successful create appends the returned ItineraryItemSummary into that day's list (optimistic enter animation allowed); API failure surfaces a calm inline error and keeps the draft", async () => {
    const user = userEvent.setup();
    const createdSummary = {
      id: CREATED_ITEM_ID,
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: DAY,
      activity: RETURNED_ACTIVITY,
      activityType: CREATE_ACTIVITY_TYPE,
      place: CREATE_PLACE,
      startTime: "",
      status: "idea",
      version: 1,
    };
    const fetchMock = vi
      .fn()
      // Success path — returned ItineraryItemSummary.
      .mockResolvedValueOnce(jsonResponse(createdSummary))
      // Failure path — calm 5xx, draft must remain.
      .mockResolvedValueOnce(jsonResponse({}, 500));

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const tbody = table.querySelector("tbody")!;
    const addRow = tbody.querySelector(
      `tr.add-row[data-day="${DAY1_HEADER.dataDay}"]`,
    ) as HTMLElement;
    const draftRow = () =>
      tbody.querySelector(
        `tr.add-draft-row[data-day="${DAY1_HEADER.dataDay}"]`,
      ) as HTMLElement;

    const openDraft = async () => {
      await user.click(
        within(addRow).getByRole("button", { name: /add activity/i }),
      );
      expect(draftRow()).toBeVisible();
    };

    // --- Success: append returned summary into that day's list ---
    await openDraft();
    await user.type(
      within(draftRow()).getByRole("textbox", { name: /title/i }),
      ACTIVITY_TITLE,
    );
    await user.keyboard("{Enter}");

    const createdStop = await waitFor(() => {
      const row = tbody.querySelector(
        `tr.stop-row[data-id="${CREATED_ITEM_ID}"][data-day="${DAY1_HEADER.dataDay}"]`,
      );
      expect(row).toBeTruthy();
      return row as HTMLElement;
    });
    expect(
      within(createdStop).getByText(RETURNED_ACTIVITY),
    ).toBeInTheDocument();
    // Draft collapses after successful create (enter animation allowed).
    expect(draftRow()).not.toBeVisible();

    // --- Failure: calm inline error; draft kept with typed title ---
    await openDraft();
    const titleField = within(draftRow()).getByRole("textbox", {
      name: /title/i,
    });
    await user.type(titleField, ACTIVITY_TITLE);
    await user.keyboard("{Enter}");

    const alert = await waitFor(() => {
      const el = within(table).getByRole("alert");
      expect(el).toHaveTextContent(CREATE_FAIL_MESSAGE);
      return el;
    });
    expect(alert).toBeVisible();
    expect(draftRow()).toBeVisible();
    expect(
      within(draftRow()).getByRole("textbox", { name: /title/i }),
    ).toHaveValue(ACTIVITY_TITLE);
  });
});

/**
 * T5 #1 — PatchItineraryItemRequest camelCase (backend itinerary_patch_contract):
 * { clientMutationId, expectedVersion, patch: { …fields } }
 * expectedVersion is required; independent literals below (not recomputed).
 */
const PATCH_SESSION_TOKEN = "member-session-token-inline-edit";
const PATCH_ITEM_ID = "item-travel-t1";
/** Matches seeded contract examples (expectedVersion required on PATCH). */
const PATCH_EXPECTED_VERSION = 4;
const PATCH_START_TIME = "10:15";
const PATCH_END_TIME = "11:45";
const PATCH_ACTIVITY = "BKK → HND";
const PATCH_PLACE = "Haneda Airport";
const PATCH_ACTIVITY_TYPE = "food";
const PATCH_STATUS = "planned";

function itineraryPatchCalls(fetchMock: ReturnType<typeof vi.fn>): FetchCall[] {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      if (method !== "PATCH" || !url.includes("/itinerary-items/")) return null;
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

describe("SmartItineraryTable inline edit PATCH", () => {
  it("Inline blur/commit on startTime, endTime, activity/title, place, activityType, or status PATCHes /api/v1/trips/{tripId}/itinerary-items/{itemId} with clientMutationId + expectedVersion + patch", async () => {
    const user = userEvent.setup();
    const editableStop: StopItem = {
      ...TRAVEL_STOP,
      id: PATCH_ITEM_ID,
      version: PATCH_EXPECTED_VERSION,
    };

    const fetchMock = vi.fn(async () =>
      jsonResponse({
        ...editableStop,
        version: PATCH_EXPECTED_VERSION + 1,
      }),
    );

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [editableStop],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={PATCH_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const row = table.querySelector(
      `tr.stop-row[data-id="${PATCH_ITEM_ID}"]`,
    ) as HTMLElement;
    expect(row).toBeTruthy();

    const patchUrl = `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${PATCH_ITEM_ID}`;

    async function expectBlurPatch(
      commit: () => void | Promise<void>,
      patch: Record<string, string>,
    ) {
      fetchMock.mockClear();
      await commit();
      await waitFor(() => {
        expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
      });
      const call = itineraryPatchCalls(fetchMock)[0]!;
      expect(call.url).toBe(patchUrl);
      expect((call.init.method ?? "").toUpperCase()).toBe("PATCH");
      const headers = new Headers(call.init.headers);
      expect(headers.get("Authorization")).toBe(`Bearer ${PATCH_SESSION_TOKEN}`);
      expect(headers.get("Content-Type")).toMatch(/application\/json/i);
      expect(typeof call.body.clientMutationId).toBe("string");
      expect(String(call.body.clientMutationId).length).toBeGreaterThan(0);
      expect(call.body.expectedVersion).toBe(PATCH_EXPECTED_VERSION);
      expect(call.body.patch).toEqual(expect.objectContaining(patch));
    }

    // --- startTime blur ---
    await expectBlurPatch(() => {
      const el = within(row).getByLabelText("Start time");
      fireEvent.change(el, { target: { value: PATCH_START_TIME } });
      fireEvent.blur(el);
    }, { startTime: PATCH_START_TIME });

    // --- endTime blur ---
    await expectBlurPatch(() => {
      const el = within(row).getByLabelText("End time");
      fireEvent.change(el, { target: { value: PATCH_END_TIME } });
      fireEvent.blur(el);
    }, { endTime: PATCH_END_TIME });

    // --- activity / title blur ---
    await expectBlurPatch(async () => {
      const el = within(row).getByRole("textbox", { name: /title|activity/i });
      await user.clear(el);
      await user.type(el, PATCH_ACTIVITY);
      await user.tab();
    }, { activity: PATCH_ACTIVITY });

    // --- place blur ---
    await expectBlurPatch(async () => {
      const el = within(row).getByRole("textbox", { name: /^place$/i });
      await user.clear(el);
      await user.type(el, PATCH_PLACE);
      await user.tab();
    }, { place: PATCH_PLACE });

    // --- activityType commit (type picker) ---
    await expectBlurPatch(async () => {
      await user.click(within(row).getByRole("button", { name: TYPE_ARIA_LABEL }));
      await user.click(
        await screen.findByRole("menuitem", { name: /^food$/i }),
      );
    }, { activityType: PATCH_ACTIVITY_TYPE });

    // --- status commit ---
    await expectBlurPatch(async () => {
      const el = within(row).getByLabelText(/^status$/i);
      if (el.tagName === "SELECT") {
        await user.selectOptions(el, PATCH_STATUS);
      } else {
        await user.click(el);
        await user.click(
          await screen.findByRole("menuitem", { name: /^planned$/i }),
        );
      }
    }, { status: PATCH_STATUS });
  });
});

/**
 * T5 #2 — PRODUCT.md: on version_conflict, reload authoritative TripCockpit
 * before retrying. Independent conflict body matches itinerary_patch_contract.
 */
const CONFLICT_CODE = "version_conflict";
const CONFLICT_LATEST_VERSION = 5;
const CONFLICT_EDIT = "Stale client title";
const CONFLICT_RETRY_EDIT = "Retry before reload";

describe("SmartItineraryTable version_conflict reload", () => {
  it("version_conflict triggers a TripCockpit reload before the next edit attempt (no silent overwrite)", async () => {
    const user = userEvent.setup();
    const onCockpitReload = vi.fn();
    const editableStop: StopItem = {
      ...TRAVEL_STOP,
      id: PATCH_ITEM_ID,
      version: PATCH_EXPECTED_VERSION,
    };

    const fetchMock = vi.fn(async () =>
      jsonResponse(
        {
          code: CONFLICT_CODE,
          latest: {
            ...editableStop,
            version: CONFLICT_LATEST_VERSION,
            activity: "Authoritative server title",
          },
        },
        409,
      ),
    );

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [editableStop],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={PATCH_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        {...{ onCockpitReload }}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const row = table.querySelector(
      `tr.stop-row[data-id="${PATCH_ITEM_ID}"]`,
    ) as HTMLElement;
    expect(row).toBeTruthy();

    // Stale edit → API version_conflict.
    const title = within(row).getByRole("textbox", { name: /title|activity/i });
    await user.clear(title);
    await user.type(title, CONFLICT_EDIT);
    await user.tab();

    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    expect(itineraryPatchCalls(fetchMock)[0]!.body.expectedVersion).toBe(
      PATCH_EXPECTED_VERSION,
    );

    // Reload must fire on conflict (parent wires this to loadTripCockpit).
    await waitFor(() => {
      expect(onCockpitReload).toHaveBeenCalledTimes(1);
    });

    // Next edit attempt before authoritative reload must not silently overwrite
    // with the same stale expectedVersion.
    fetchMock.mockClear();
    await user.clear(title);
    await user.type(title, CONFLICT_RETRY_EDIT);
    await user.tab();

    // Same async window as the conflict PATCH above — a stale retry would appear.
    let sawStaleRetry = false;
    try {
      await waitFor(
        () => {
          expect(
            itineraryPatchCalls(fetchMock).some(
              (call) => call.body.expectedVersion === PATCH_EXPECTED_VERSION,
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
 * T5 #3 — Progressive enrichment (spec/decisions): incomplete `idea` rows stay
 * valid; type menu is picker-only (no API `default`). Independent picker labels
 * match draft TYPE_LABEL / decisions lock — not recomputed from production.
 */
const IDEA_ITEM_ID = "item-idea-incomplete";
const IDEA_TITLE = "Maybe a side trip";
/** Empty optional fields — skeleton idea row (place/times unset). */
const IDEA_EMPTY = "";
/** Clearing a set startTime must PATCH null so HH:MM validation is not tripped. */
const IDEA_SEEDED_START = "10:00";
const PICKER_MENU_LABELS = [
  "Travel",
  "Food",
  "Shopping",
  "Attraction",
  "Experience",
  "Stay",
] as const;

describe("SmartItineraryTable idea status and type picker", () => {
  it("Incomplete idea-status rows remain valid; type picker excludes default and only offers travel/food/shopping/attraction/experience/stay", async () => {
    const user = userEvent.setup();
    const ideaStop: StopItem = {
      id: IDEA_ITEM_ID,
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: DAY,
      activity: IDEA_TITLE,
      activityType: "default",
      place: IDEA_EMPTY,
      startTime: IDEA_SEEDED_START,
      endTime: IDEA_EMPTY,
      status: "idea",
      version: PATCH_EXPECTED_VERSION,
    };

    const fetchMock = vi.fn(async () =>
      jsonResponse({
        ...ideaStop,
        version: PATCH_EXPECTED_VERSION + 1,
      }),
    );

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [ideaStop],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={PATCH_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const row = table.querySelector(
      `tr.stop-row[data-id="${IDEA_ITEM_ID}"]`,
    ) as HTMLElement;
    expect(row).toBeTruthy();

    // Incomplete idea skeleton remains a normal editable stop (not rejected).
    expect(within(row).queryByRole("alert")).toBeNull();
    expect(within(row).getByLabelText(/^status$/i)).toHaveValue("idea");
    expect(within(row).getByRole("textbox", { name: /^place$/i })).toHaveValue(
      IDEA_EMPTY,
    );
    expect(within(row).getByLabelText("End time")).toHaveValue(IDEA_EMPTY);
    expect(within(row).getByLabelText("Duration")).toHaveTextContent("—");
    const typeTrigger = within(row).getByRole("button", { name: /^type$/i });
    expect(typeTrigger).toHaveClass("unset");

    // Type picker: only travel/food/shopping/attraction/experience/stay — no default.
    await user.click(typeTrigger);
    const menu = await screen.findByRole("menu", { name: /activity type/i });
    const menuItems = within(menu).getAllByRole("menuitem");
    expect(menuItems.map((el) => el.textContent?.trim())).toEqual([
      ...PICKER_MENU_LABELS,
    ]);
    expect(
      within(menu).queryByRole("menuitem", { name: /^default$/i }),
    ).toBeNull();
    expect(
      within(menu).queryByRole("menuitem", { name: /^note$/i }),
    ).toBeNull();

    // Pick a type while place/end stay empty — incomplete idea row still saves.
    fetchMock.mockClear();
    await user.click(within(menu).getByRole("menuitem", { name: /^stay$/i }));
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    expect(itineraryPatchCalls(fetchMock)[0]!.body.patch).toEqual(
      expect.objectContaining({ activityType: "stay" }),
    );
    expect(within(row).queryByRole("alert")).toBeNull();
    expect(within(row).getByRole("textbox", { name: /^place$/i })).toHaveValue(
      IDEA_EMPTY,
    );

    // Clearing startTime must remain API-valid (null clear, not "" → HH:MM error).
    fetchMock.mockClear();
    const startInput = within(row).getByLabelText("Start time");
    fireEvent.change(startInput, { target: { value: IDEA_EMPTY } });
    fireEvent.blur(startInput);
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    expect(itineraryPatchCalls(fetchMock)[0]!.body.patch).toEqual(
      expect.objectContaining({ startTime: null }),
    );
    expect(within(row).queryByRole("alert")).toBeNull();
    expect(within(row).getByLabelText(/^status$/i)).toHaveValue("idea");
  });
});

/**
 * T7 #2 — Demo weather on day headers (draft `.day-wx`); no live weather fetch.
 * Independent CAL literals from approved itinerary-plan-draft-v1.html (Apr 12–13).
 * Soft: static/demo chrome OK; hard: never hit a live weather network.
 */
const DEMO_WX_DAY1 = {
  datetime: DAY,
  dataWx: "cloud",
  temp: "16°",
  ariaLabel: "Cloudy · 16° · ↑05:18 · ↓18:05",
} as const;
const DEMO_WX_DAY2 = {
  datetime: DAY_2,
  dataWx: "sun",
  temp: "18°",
  ariaLabel: "Sunny · 18° · ↑05:17 · ↓18:06",
} as const;
/** URL fragments that indicate a live weather service (spec Out: live weather API). */
const LIVE_WEATHER_URL =
  /weather|open-?meteo|openweathermap|forecast|wttr\.in|met\.no/i;

describe("SmartItineraryTable demo weather chrome", () => {
  it("Static/demo weather chrome may render on day headers; no live weather network calls", () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    const previousFetch = globalThis.fetch;
    globalThis.fetch = fetchMock as typeof fetch;

    try {
      const model = buildItineraryTableModel({
        startDate: DAY,
        endDate: DAY_2,
        planVariantId: PLAN_ID,
        itineraryItems: [],
      });

      render(
        <SmartItineraryTable
          model={model}
          tripId={TRIP_ID}
          sessionToken={SESSION_TOKEN}
          apiBaseUrl={API_BASE}
          fetch={fetchMock}
        />,
      );

      const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
      const dayRows = [...table.querySelectorAll("tr.day-row")];
      expect(dayRows.length).toBe(2);

      // Draft landmark: each day header carries static `.day-wx` chrome.
      for (const expected of [DEMO_WX_DAY1, DEMO_WX_DAY2]) {
        const dayRow = dayRows.find((row) => {
          const dateEl = row.querySelector("time.day-date");
          return dateEl?.getAttribute("datetime") === expected.datetime;
        });
        expect(dayRow).toBeTruthy();

        const wx = dayRow!.querySelector(".day-wx");
        expect(wx).toBeTruthy();
        expect(wx).toHaveAttribute("data-wx", expected.dataWx);
        expect(wx!.querySelector(".wx-icon")).toBeTruthy();
        expect(wx!.querySelector(".wx-temp")).toHaveTextContent(expected.temp);
        expect(wx).toHaveAttribute("aria-label", expected.ariaLabel);
      }

      // Hard gate: no live weather network (injected + globalThis.fetch).
      const weatherCalls = (fetchMock.mock.calls as unknown as unknown[][]).filter(
        (call) => LIVE_WEATHER_URL.test(String(call[0])),
      );
      expect(weatherCalls).toHaveLength(0);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});
