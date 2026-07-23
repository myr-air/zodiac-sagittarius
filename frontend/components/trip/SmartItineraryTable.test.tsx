/**
 * @vitest-environment happy-dom
 *
 * SmartItineraryTable — draft landmarks vs itinerary-plan-draft-v1.html.
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 *
 * T3 #1: stroke SVG icons inside .type-ico (not empty-dot ::before) for picker types.
 * T3 #2: time rail start–end + overnight duration via cockpit endTime (09:40–05:50 → 20h 10m).
 * T3 #3: activity types + default fallback; zebra; Day N / pretty date headers.
 * T4 #1: collapsed + Add activity per day → inline draft (Quick only).
 * T4 #2: Enter POSTs create body; Esc/✕ cancels without POST.
 * T4 #3: success appends returned summary; failure keeps draft + calm error.
 * T5 #1: inline blur/commit PATCHes itinerary-items/{itemId} with expectedVersion.
 * T5 #2: version_conflict → TripCockpit reload before next edit (no silent overwrite).
 * M81DDKSC T1 #2: successful PATCH applies returned summary so next edit uses new expectedVersion.
 * T5 #3: incomplete idea rows stay valid; type picker excludes default (picker set only).
 * T7 #2 / M81LW2UJ T2: day-header weather absent or Demo/placeholder — never bare live temps.
 * M80P3JXX T4 #1: day-chip (.day-id) collapse/expand + activity-count chip persists by tripId.
 * M80P3JXX T5 #3: order PATCH failure → calm alert; no silent local-only reorder.
 * M80P3JXX T6 #2: parent chevron expands/collapses nested .subplan rows (Stay / attraction draft).
 * M80P3JXX T7 #2: Food Meal + Travel By .choice-chip on .title-with-meta (far right) → PATCH expectedVersion.
 * M80P3JXX T7 #3: Note / link / time-setup dialogs from stop actions + Set time; Save/Cancel → existing PATCH only.
 * M81DDKSC T1 #3: openStopDialog(note|link) seeds dlg fields from loaded stop note/mapLink.
 * M81DDKSC T2 #2: add child under parent stop; successful create nests via returned parentItemId.
 * M81HY2YR T3 #2 / M81LW2UJ T6: sibling overlap cues tethered under day; draft duration; honest create errors.
 * M81HY2YR T2 #1: Explicit Resolve in place cell opens candidate picker; pick → PATCH + version apply.
 * M827T84Q T2 #1: Same-day pathGroupId siblings collapse into one fork stop-row
 * ("Currently using: <active path name>" + subplan-toggle chevron); alternative
 * path options render as .subplan-row entries only while expanded (v6.1 draft chrome).
 * M827T84Q T4 #1: selecting any stop shows a collapsed "Path · …" strip row
 * with Edit path; expanding offers Assign to an existing pathGroupId already
 * in the plan, or Add alternative… → createItineraryItem with pathGroupId
 * (reused vs newly generated), pathId, pathName, pathRole:"alternative".
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
import { useState } from "react";
import {
  MEMBER_SESSION_STORAGE_KEY,
  type StorageLike,
} from "../../src/landing/create-trip";
import {
  loadTripCockpit,
  type TripCockpitItineraryItem,
} from "../../src/trip/trip-cockpit-load";
import { buildItineraryTableModel } from "../../src/trip/itinerary-table-model";
import {
  SmartItineraryTable,
  type SmartItineraryTableProps,
} from "./SmartItineraryTable";

const API_BASE = "http://127.0.0.1:5181";
const OWNER_MEMBER_ID = "018f4e81-1000-7000-a000-000000000001";
const OVERNIGHT_SESSION_TOKEN = "member-session-token-overnight-duration";

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem(key: string) {
      return key in data ? data[key]! : null;
    },
    setItem(key: string, value: string) {
      data[key] = value;
    },
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

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

describe("SmartItineraryTable overnight duration from cockpit endTime", () => {
  it("time rail shows start–end plus derived overnight duration (09:40–05:50 → 20h 10m) using cockpit endTime", async () => {
    const storage = memoryStorage({
      [MEMBER_SESSION_STORAGE_KEY]: JSON.stringify({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: OVERNIGHT_SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      }),
    });

    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        trip: {
          id: TRIP_ID,
          name: "Overnight rail trip",
          destinationLabel: "Tokyo",
          startDate: DAY,
          endDate: DAY_2,
          mainTripPlanId: PLAN_ID,
          activePlanVariantId: PLAN_ID,
          ownerMemberId: OWNER_MEMBER_ID,
          version: 1,
        },
        tripPlans: [
          {
            id: PLAN_ID,
            tripId: TRIP_ID,
            name: "Main",
            kind: "main",
            status: "main",
            description: "Primary plan",
            version: 1,
          },
        ],
        itineraryItems: [
          {
            id: TRAVEL_STOP.id,
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
          },
        ],
      }),
    );

    const outcome = await loadTripCockpit(
      { tripId: TRIP_ID },
      { fetch: fetchMock, apiBaseUrl: API_BASE, storage },
    );
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: outcome.itineraryItems,
    });

    render(<SmartItineraryTable model={model} />);

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const stopRow = table.querySelector("tr.stop-row");
    expect(stopRow).toBeTruthy();
    const when = within(stopRow!.querySelector(".stop-when") as HTMLElement);

    expect(when.getByLabelText("Start time")).toHaveValue(START_TIME);
    expect(when.getByLabelText("End time")).toHaveValue(END_TIME);
    expect(when.getByLabelText("Duration")).toHaveTextContent(DURATION_TEXT);
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

/**
 * T3 #1 — Draft TYPE_ICON fills `.type-ico` with stroke SVGs (CSS stroke:currentColor;
 * fill:none). Reject the empty-dot stand-in (`.type-ico:empty::before` color pill).
 */
describe("SmartItineraryTable stroke type icons", () => {
  it("each activity type trigger renders a stroke SVG icon inside .type-ico (not the empty-dot ::before stand-in) for travel/food/shopping/attraction/experience/stay", () => {
    const items: StopItem[] = PICKER_TYPES.map(({ activityType }, index) =>
      stop({
        id: `item-stroke-${activityType}`,
        day: DAY,
        activity: `${activityType} stop`,
        activityType,
        startTime: `${String(9 + index).padStart(2, "0")}:00`,
        endTime: `${String(10 + index).padStart(2, "0")}:00`,
      }),
    );

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: items,
    });

    render(<SmartItineraryTable model={model} />);

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const tbody = table.querySelector("tbody");
    expect(tbody).toBeTruthy();

    for (const { activityType, ariaLabel } of PICKER_TYPES) {
      const trigger = tbody!.querySelector(
        `button.type-trigger.${activityType}[data-type-trigger]`,
      );
      expect(trigger).toBeTruthy();
      expect(trigger).toHaveAttribute("aria-label", ariaLabel);

      const ico = trigger!.querySelector(".type-ico");
      expect(ico).toBeTruthy();
      // Empty .type-ico activates the color-dot ::before stand-in — icons must fill it.
      expect(ico!.matches(":empty")).toBe(false);

      const svg = ico!.querySelector("svg");
      expect(svg).toBeTruthy();
      // Draft TYPE_ICON landmark: 24×24 stroke geometry (CSS: stroke currentColor, fill none).
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
      expect(svg!.querySelector("path, circle, rect")).toBeTruthy();
      // Reject solid fill-disk icons — stroke contract is fill none (attr or CSS default).
      expect((svg!.getAttribute("fill") ?? "none").toLowerCase()).toBe("none");
    }
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
  it("Inline blur/commit on startTime, endTime, activity (via From/To), activityType, place (place-shaped type), or status PATCHes /api/v1/trips/{tripId}/itinerary-items/{itemId} with clientMutationId + expectedVersion + patch", async () => {
    const user = userEvent.setup();
    const editableStop: StopItem = {
      ...TRAVEL_STOP,
      id: PATCH_ITEM_ID,
      version: PATCH_EXPECTED_VERSION,
    };

    const fetchMock = vi.fn(async (input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        expectedVersion?: number;
      };
      const from =
        typeof body.expectedVersion === "number"
          ? body.expectedVersion
          : PATCH_EXPECTED_VERSION;
      return jsonResponse({
        ...editableStop,
        version: from + 1,
      });
    });

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
    /** Tracks local apply of returned summary after each successful PATCH. */
    let expectedVersion = PATCH_EXPECTED_VERSION;

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
      expect(call.body.expectedVersion).toBe(expectedVersion);
      expect(call.body.patch).toEqual(expect.objectContaining(patch));
      expectedVersion += 1;
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

    // --- activity via From/To blur (travel summary is derived From → To) ---
    await expectBlurPatch(() => {
      const from = within(row).getByRole("textbox", { name: /^from$/i });
      const to = within(row).getByRole("textbox", { name: /^to$/i });
      fireEvent.change(from, { target: { value: "BKK" } });
      fireEvent.change(to, { target: { value: "HND" } });
      fireEvent.blur(to);
    }, { activity: PATCH_ACTIVITY });

    // --- activityType commit (type picker) — travel has no Place; switch to food ---
    await expectBlurPatch(async () => {
      await user.click(within(row).getByRole("button", { name: TYPE_ARIA_LABEL }));
      await user.click(
        await screen.findByRole("menuitem", { name: /^food$/i }),
      );
    }, { activityType: PATCH_ACTIVITY_TYPE });

    // --- place blur on place-shaped type (food/stay/… still expose Place) ---
    await expectBlurPatch(async () => {
      const el = within(row).getByRole("textbox", { name: /^place$/i });
      await user.clear(el);
      await user.type(el, PATCH_PLACE);
      await user.tab();
    }, { place: PATCH_PLACE });

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

    // Stale edit → API version_conflict (travel activity via To blur).
    const toField = () => within(row).getByRole("textbox", { name: /^to$/i });
    await user.clear(toField());
    await user.type(toField(), CONFLICT_EDIT);
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
    await user.clear(toField());
    await user.type(toField(), CONFLICT_RETRY_EDIT);
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
 * M81DDKSC T1 #2 — After a successful table PATCH, local stop state must apply
 * the returned summary so the next edit sends the new expectedVersion (not the
 * stale pre-PATCH version). Independent returned version is a literal (+1), not
 * recomputed from production merge logic. version_conflict reload stays covered
 * by the suite above.
 */
const POST_PATCH_RETURNED_VERSION = PATCH_EXPECTED_VERSION + 1;
const POST_PATCH_FIRST_START = "10:15";
const POST_PATCH_SECOND_END = "12:30";

describe("SmartItineraryTable applies returned version after successful PATCH", () => {
  it("after a successful PATCH, the next edit sends the returned version as expectedVersion (no stale version)", async () => {
    const user = userEvent.setup();
    const editableStop: StopItem = {
      ...TRAVEL_STOP,
      id: PATCH_ITEM_ID,
      version: PATCH_EXPECTED_VERSION,
    };

    let serverVersion = PATCH_EXPECTED_VERSION;
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as {
        expectedVersion?: number;
        patch?: Record<string, unknown>;
      };
      serverVersion = (body.expectedVersion ?? serverVersion) + 1;
      return jsonResponse({
        ...editableStop,
        ...body.patch,
        version: serverVersion,
      });
    });

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

    // First edit → seed expectedVersion (stale until success applies returned summary).
    const startEl = within(row).getByLabelText("Start time");
    fireEvent.change(startEl, { target: { value: POST_PATCH_FIRST_START } });
    fireEvent.blur(startEl);

    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    expect(itineraryPatchCalls(fetchMock)[0]!.body.expectedVersion).toBe(
      PATCH_EXPECTED_VERSION,
    );
    expect(itineraryPatchCalls(fetchMock)[0]!.body.patch).toEqual(
      expect.objectContaining({ startTime: POST_PATCH_FIRST_START }),
    );

    // Allow the success handler to apply the returned summary (version bump).
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    // Microtask flush: patchItineraryItem .then must have run.
    await Promise.resolve();
    await Promise.resolve();

    fetchMock.mockClear();

    // Second edit must send the returned version — not the original seed.
    const endEl = within(row).getByLabelText("End time");
    fireEvent.change(endEl, { target: { value: POST_PATCH_SECOND_END } });
    fireEvent.blur(endEl);

    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const second = itineraryPatchCalls(fetchMock)[0]!;
    expect(second.body.expectedVersion).toBe(POST_PATCH_RETURNED_VERSION);
    expect(second.body.patch).toEqual(
      expect.objectContaining({ endTime: POST_PATCH_SECOND_END }),
    );
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
 * M81LW2UJ T2 — Day-header weather honesty (M7 owns real weather).
 * Absent OR clearly Demo/placeholder — never bare live-looking temps/sunrise.
 * Independent CAL days from approved itinerary-plan-draft-v1.html (Apr 12–13).
 */
const WX_DAY_DATETIMES = [DAY, DAY_2] as const;
/** Bare climate chrome that reads as a live forecast without a Demo badge. */
const BARE_LIVE_WX = /\d+°|↑\d{1,2}:\d{2}|↓\d{1,2}:\d{2}|sunrise|sunset/i;
const DEMO_OR_PLACEHOLDER = /demo|placeholder/i;
/** URL fragments that indicate a live weather service. */
const LIVE_WEATHER_URL =
  /weather|open-?meteo|openweathermap|forecast|wttr\.in|met\.no/i;

function weatherIsHonest(wx: Element): boolean {
  const label = `${wx.getAttribute("aria-label") ?? ""} ${wx.textContent ?? ""}`;
  const hasDemoMark =
    wx.getAttribute("data-demo") === "true" ||
    wx.getAttribute("data-placeholder") === "true" ||
    Boolean(
      wx.querySelector(
        "[data-demo], [data-placeholder], .wx-demo, .demo-badge, .wx-placeholder",
      ),
    ) ||
    DEMO_OR_PLACEHOLDER.test(label);
  if (hasDemoMark) return true;
  // No Demo/placeholder mark → must not present bare live-looking climate.
  return !BARE_LIVE_WX.test(label);
}

describe("SmartItineraryTable demo weather chrome", () => {
  it("day-header weather is absent or Demo/placeholder-labeled — never bare live-looking temps/sunrise; no live weather network calls", () => {
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

      for (const datetime of WX_DAY_DATETIMES) {
        const dayRow = dayRows.find((row) => {
          const dateEl = row.querySelector("time.day-date");
          return dateEl?.getAttribute("datetime") === datetime;
        });
        expect(dayRow).toBeTruthy();

        const wx = dayRow!.querySelector(".day-wx");
        // Honest: omit weather chrome, or label it Demo/placeholder.
        if (wx) {
          expect(weatherIsHonest(wx)).toBe(true);
        }
      }

      const weatherCalls = (fetchMock.mock.calls as unknown as unknown[][]).filter(
        (call) => LIVE_WEATHER_URL.test(String(call[0])),
      );
      expect(weatherCalls).toHaveLength(0);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

/** Independent literals: Day 1 has two stops → draft count chip "2 activities". */
const DAY1_ACTIVITY_COUNT = "2 activities";

describe("SmartItineraryTable day-chip expand/collapse", () => {
  beforeEach(() => {
    // happy-dom under Node 25 leaves window.localStorage undefined; provide Storage.
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      enumerable: true,
      value: memoryStorage(),
    });
  });

  it("day-chip (.day-id) toggles that day’s activities collapsed/expanded; collapsed state shows an activity-count chip and persists across remount for the same tripId", async () => {
    const user = userEvent.setup();
    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY_2,
      planVariantId: PLAN_ID,
      itineraryItems: [
        stop({
          id: "item-d1-a",
          day: DAY,
          activity: "Ramen",
          activityType: "food",
        }),
        stop({
          id: "item-d1-b",
          day: DAY,
          activity: "Senso-ji",
          activityType: "attraction",
        }),
        stop({
          id: "item-d2-a",
          day: DAY_2,
          activity: "TeamLab",
          activityType: "experience",
        }),
      ],
    });

    const { unmount } = render(
      <SmartItineraryTable model={model} tripId={TRIP_ID} />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const day1Row = [...table.querySelectorAll("tr.day-row")].find((row) => {
      const dateEl = row.querySelector("time.day-date");
      return dateEl?.getAttribute("datetime") === DAY;
    });
    expect(day1Row).toBeTruthy();

    const dayChip = day1Row!.querySelector("button.day-id");
    expect(dayChip).toBeTruthy();
    // Day reorder is unavailable — chip is collapse/expand only (no grab / reorder-days copy).
    expect(getComputedStyle(dayChip as HTMLElement).cursor).not.toBe("grab");
    expect((dayChip as HTMLElement).getAttribute("title") ?? "").not.toMatch(
      /reorder days/i,
    );
    await user.click(dayChip!);

    // Draft setDayCollapsed / syncDayCollapse landmarks.
    expect(day1Row).toHaveAttribute("data-collapsed", "true");
    expect(dayChip).toHaveAttribute("aria-expanded", "false");

    const countChip = day1Row!.querySelector(".day-count, [data-day-count]");
    expect(countChip).toBeTruthy();
    expect(countChip).toHaveTextContent(DAY1_ACTIVITY_COUNT);

    for (const id of ["item-d1-a", "item-d1-b"]) {
      const stopRow = table.querySelector(`tr.stop-row[data-id="${id}"]`);
      expect(stopRow).toBeTruthy();
      expect(stopRow).toHaveClass("day-body-hidden");
    }
    // Sibling day stays expanded.
    expect(
      table.querySelector('tr.stop-row[data-id="item-d2-a"]'),
    ).not.toHaveClass("day-body-hidden");

    unmount();

    // Remount same tripId — collapsed state persists (localStorage keyed by tripId OK).
    render(<SmartItineraryTable model={model} tripId={TRIP_ID} />);
    const tableRemount = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const day1Remount = [...tableRemount.querySelectorAll("tr.day-row")].find(
      (row) => {
        const dateEl = row.querySelector("time.day-date");
        return dateEl?.getAttribute("datetime") === DAY;
      },
    );
    expect(day1Remount).toHaveAttribute("data-collapsed", "true");
    expect(
      day1Remount!.querySelector(".day-count, [data-day-count]"),
    ).toHaveTextContent(DAY1_ACTIVITY_COUNT);
    expect(
      tableRemount.querySelector('tr.stop-row[data-id="item-d1-a"]'),
    ).toHaveClass("day-body-hidden");
  });
});

/**
 * M80P3JXX T5 #2 — within-Plan-Day reorder PATCHes .../itinerary-items/order.
 *
 * Test seam (happy-dom HTML5 DnD is unreliable): dispatch CustomEvent
 * `joii:plan-day-reorder` on the table with detail `{ day, itemIds }` (full
 * Plan Day scope in the new order). Production drop handler should share the
 * same commit path (`reorderItineraryItems` → PATCH body camelCase).
 */
const REORDER_SESSION_TOKEN = "member-session-token-plan-day-reorder";
const REORDER_STOP_A_ID = "item-reorder-a";
const REORDER_STOP_B_ID = "item-reorder-b";
/** Seeded day order A then B; drop commits B then A (full day scope). */
const REORDERED_DAY_ITEM_IDS = [REORDER_STOP_B_ID, REORDER_STOP_A_ID] as const;
const PLAN_DAY_REORDER_EVENT = "joii:plan-day-reorder";

type OrderFetchCall = {
  url: string;
  init: RequestInit;
  body: Record<string, unknown>;
};

function itineraryOrderCalls(
  fetchMock: ReturnType<typeof vi.fn>,
): OrderFetchCall[] {
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
    .filter((call): call is OrderFetchCall => call !== null);
}

describe("SmartItineraryTable Plan Day reorder PATCH", () => {
  it("dropping a reordered stop within a Plan Day PATCHes /api/v1/trips/{tripId}/itinerary-items/order with clientMutationId, planVariantId, day, and the full itemIds scope for that day", async () => {
    const stopA = stop({
      id: REORDER_STOP_A_ID,
      day: DAY,
      activity: "First stop",
      activityType: "attraction",
      startTime: "09:00",
      endTime: "10:00",
    });
    const stopB = stop({
      id: REORDER_STOP_B_ID,
      day: DAY,
      activity: "Second stop",
      activityType: "food",
      startTime: "11:00",
      endTime: "12:00",
    });

    const fetchMock = vi.fn(async () =>
      jsonResponse([
        { ...stopB, version: 2 },
        { ...stopA, version: 2 },
      ]),
    );

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [stopA, stopB],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={REORDER_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        reorderEnabled
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    expect(
      table.querySelector(`tr.stop-row[data-id="${REORDER_STOP_A_ID}"]`),
    ).toBeTruthy();
    expect(
      table.querySelector(`tr.stop-row[data-id="${REORDER_STOP_B_ID}"]`),
    ).toBeTruthy();

    // Simulate within-day drop commit via documented test seam.
    table.dispatchEvent(
      new CustomEvent(PLAN_DAY_REORDER_EVENT, {
        bubbles: true,
        detail: { day: DAY, itemIds: [...REORDERED_DAY_ITEM_IDS] },
      }),
    );

    await waitFor(() => {
      expect(itineraryOrderCalls(fetchMock)).toHaveLength(1);
    });

    const call = itineraryOrderCalls(fetchMock)[0]!;
    expect(call.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/order`,
    );
    expect((call.init.method ?? "").toUpperCase()).toBe("PATCH");
    const headers = new Headers(call.init.headers);
    expect(headers.get("Authorization")).toBe(
      `Bearer ${REORDER_SESSION_TOKEN}`,
    );
    expect(headers.get("Content-Type")).toMatch(/application\/json/i);
    expect(typeof call.body.clientMutationId).toBe("string");
    expect(String(call.body.clientMutationId).length).toBeGreaterThan(0);
    expect(call.body.planVariantId).toBe(PLAN_ID);
    expect(call.body.day).toBe(DAY);
    expect(call.body.itemIds).toEqual([...REORDERED_DAY_ITEM_IDS]);
  });
});

/**
 * M80P3JXX T5 #3 — order PATCH failure stays calm: no silent local-only reorder.
 * Independent fail copy matches reorderItineraryItems 5xx fallback (no API message).
 */
const REORDER_FAIL_MESSAGE =
  "Could not reorder stops. Please try again.";
/** Seeded Plan Day order (server/model) — must remain after failed PATCH. */
const SEEDED_DAY_ORDER = [REORDER_STOP_A_ID, REORDER_STOP_B_ID] as const;

describe("SmartItineraryTable Plan Day reorder failure calm", () => {
  it("order PATCH failure (version conflict or 500) keeps server/model stop order and surfaces a calm alert — no silent local-only reorder", async () => {
    const stopA = stop({
      id: REORDER_STOP_A_ID,
      day: DAY,
      activity: "First stop",
      activityType: "attraction",
      startTime: "09:00",
      endTime: "10:00",
    });
    const stopB = stop({
      id: REORDER_STOP_B_ID,
      day: DAY,
      activity: "Second stop",
      activityType: "food",
      startTime: "11:00",
      endTime: "12:00",
    });

    // Force order PATCH failure (500 — same calm path as version_conflict).
    const fetchMock = vi.fn(async () => jsonResponse({}, 500));

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [stopA, stopB],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={REORDER_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        reorderEnabled
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const stopOrder = () =>
      [...table.querySelectorAll("tr.stop-row")].map((row) =>
        row.getAttribute("data-id"),
      );

    expect(stopOrder()).toEqual([...SEEDED_DAY_ORDER]);

    table.dispatchEvent(
      new CustomEvent(PLAN_DAY_REORDER_EVENT, {
        bubbles: true,
        detail: { day: DAY, itemIds: [...REORDERED_DAY_ITEM_IDS] },
      }),
    );

    await waitFor(() => {
      expect(itineraryOrderCalls(fetchMock)).toHaveLength(1);
    });

    const alert = await waitFor(() => {
      const el = within(table).getByRole("alert");
      expect(el).toHaveTextContent(REORDER_FAIL_MESSAGE);
      return el;
    });
    expect(alert).toBeVisible();

    // Failure must not leave a silent local-only reordered DOM (B then A).
    expect(stopOrder()).toEqual([...SEEDED_DAY_ORDER]);
    expect(stopOrder()).not.toEqual([...REORDERED_DAY_ITEM_IDS]);
  });
});

/**
 * M82GSOYG T4 #1 — cross-day drop orchestration (decisions.md #177 sequence):
 * PATCH the moved item's `day` to the target Plan Day, then PATCH order for
 * BOTH the source and target Plan Day scopes with their full itemIds.
 *
 * Test seam (happy-dom HTML5 DnD is unreliable — same rationale as the
 * within-day `joii:plan-day-reorder` seam above): dispatch CustomEvent
 * `joii:plan-day-cross-day-move` on the table with detail
 * `{ itemId, fromDay, toDay, sourceItemIds, targetItemIds }`. Production
 * cross-day drop handling should share the same commit path
 * (`patchItineraryItem` for the day change, then `reorderItineraryItems`
 * for each of the two day scopes).
 */
const CROSS_DAY_SESSION_TOKEN = "member-session-token-cross-day-move";
const CROSS_DAY_MOVE_ITEM_ID = "item-cross-day-move";
const CROSS_DAY_STAY_ID = "item-cross-day-stay";
const CROSS_DAY_TARGET_ID = "item-cross-day-target";
const PLAN_DAY_CROSS_DAY_MOVE_EVENT = "joii:plan-day-cross-day-move";
/** Full source-day scope after the moved stop leaves (decisions: full itemIds). */
const CROSS_DAY_SOURCE_ITEM_IDS = [CROSS_DAY_STAY_ID] as const;
/** Full target-day scope after the moved stop lands (decisions: full itemIds). */
const CROSS_DAY_TARGET_ITEM_IDS = [
  CROSS_DAY_TARGET_ID,
  CROSS_DAY_MOVE_ITEM_ID,
] as const;

describe("SmartItineraryTable cross-day move orchestration", () => {
  it("dropping a stop onto another Plan Day PATCHes item day then reorders both source and target day scopes with full itemIds via reorderItineraryItems", async () => {
    const movedStop = stop({
      id: CROSS_DAY_MOVE_ITEM_ID,
      day: DAY,
      activity: "Moved stop",
      activityType: "attraction",
      startTime: "09:00",
      endTime: "10:00",
      version: 3,
    });
    const stayStop = stop({
      id: CROSS_DAY_STAY_ID,
      day: DAY,
      activity: "Stays on source day",
      activityType: "food",
      startTime: "11:00",
      endTime: "12:00",
    });
    const targetStop = stop({
      id: CROSS_DAY_TARGET_ID,
      day: DAY_2,
      activity: "Already on target day",
      activityType: "attraction",
      startTime: "09:00",
      endTime: "10:00",
    });

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "PATCH" && url.endsWith("/itinerary-items/order")) {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          day?: string;
          itemIds?: string[];
        };
        const items = (body.itemIds ?? []).map((id) => {
          if (id === CROSS_DAY_MOVE_ITEM_ID) return { ...movedStop, day: body.day, version: 4 };
          if (id === CROSS_DAY_STAY_ID) return stayStop;
          return targetStop;
        });
        return jsonResponse(items);
      }
      if (
        method === "PATCH" &&
        url.endsWith(`/itinerary-items/${CROSS_DAY_MOVE_ITEM_ID}`)
      ) {
        return jsonResponse({ ...movedStop, day: DAY_2, version: 4 });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY_2,
      planVariantId: PLAN_ID,
      itineraryItems: [movedStop, stayStop, targetStop],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={CROSS_DAY_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        reorderEnabled
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    expect(
      table.querySelector(`tr.stop-row[data-id="${CROSS_DAY_MOVE_ITEM_ID}"]`),
    ).toBeTruthy();
    expect(
      table.querySelector(`tr.stop-row[data-id="${CROSS_DAY_TARGET_ID}"]`),
    ).toBeTruthy();

    // Simulate a cross-day drop commit via the documented test seam.
    table.dispatchEvent(
      new CustomEvent(PLAN_DAY_CROSS_DAY_MOVE_EVENT, {
        bubbles: true,
        detail: {
          itemId: CROSS_DAY_MOVE_ITEM_ID,
          fromDay: DAY,
          toDay: DAY_2,
          sourceItemIds: [...CROSS_DAY_SOURCE_ITEM_IDS],
          targetItemIds: [...CROSS_DAY_TARGET_ITEM_IDS],
        },
      }),
    );

    // (1) Item day PATCH — moved item's day flips to the target Plan Day.
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const dayPatchCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(dayPatchCall.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${CROSS_DAY_MOVE_ITEM_ID}`,
    );
    expect((dayPatchCall.init.method ?? "").toUpperCase()).toBe("PATCH");
    const dayPatchHeaders = new Headers(dayPatchCall.init.headers);
    expect(dayPatchHeaders.get("Authorization")).toBe(
      `Bearer ${CROSS_DAY_SESSION_TOKEN}`,
    );
    expect(typeof dayPatchCall.body.clientMutationId).toBe("string");
    const dayPatch = dayPatchCall.body.patch as Record<string, unknown>;
    expect(dayPatch.day).toBe(DAY_2);

    // (2) Both Plan Day scopes reorder with full itemIds via reorderItineraryItems.
    await waitFor(() => {
      expect(itineraryOrderCalls(fetchMock)).toHaveLength(2);
    });
    const orderCalls = itineraryOrderCalls(fetchMock);

    const sourceCall = orderCalls.find((call) => call.body.day === DAY);
    expect(sourceCall).toBeTruthy();
    expect(sourceCall!.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/order`,
    );
    expect(sourceCall!.body.planVariantId).toBe(PLAN_ID);
    expect(sourceCall!.body.itemIds).toEqual([...CROSS_DAY_SOURCE_ITEM_IDS]);

    const targetCall = orderCalls.find((call) => call.body.day === DAY_2);
    expect(targetCall).toBeTruthy();
    expect(targetCall!.body.planVariantId).toBe(PLAN_ID);
    expect(targetCall!.body.itemIds).toEqual([...CROSS_DAY_TARGET_ITEM_IDS]);
  });
});

/**
 * M82GSOYG T4 #2 — plan-block parent + nested children move together
 * (decisions.md #178): dropping a parent stop that has nested children onto
 * another Plan Day must PATCH `day` for the parent ONLY — the backend now
 * cascades the day change onto every nested child itself (GREEN details
 * merge follow-up), so a redundant per-child day PATCH here would just be
 * extra client traffic for the same result. Both day scopes still reorder
 * with full itemIds, children included in the target scope, so the client
 * order stays correct even though the child rows moved server-side via
 * cascade rather than a client PATCH.
 *
 * Seam: same `joii:plan-day-cross-day-move` CustomEvent as A1, with detail
 * extended by `childItemIds` — the nested child ids that travel with the
 * parent block (used only for the reorder scopes now, not for per-child
 * PATCHes). Production PATCHes day on the parent only (reusing the existing
 * single-item day-PATCH commit path), then commits the existing dual
 * `reorderItineraryItems` calls for source/target scopes.
 */
const PARENT_MOVE_SESSION_TOKEN =
  "member-session-token-cross-day-parent-move";
const PARENT_MOVE_ID = "item-cross-day-parent-move";
const PARENT_MOVE_CHILD_1_ID = "item-cross-day-parent-child-1";
const PARENT_MOVE_CHILD_2_ID = "item-cross-day-parent-child-2";
const PARENT_MOVE_STAY_SIBLING_ID = "item-cross-day-parent-stay-sibling";
const PARENT_MOVE_TARGET_ID = "item-cross-day-parent-target";
/** Full source-day scope after the parent block leaves (sibling only). */
const PARENT_MOVE_SOURCE_ITEM_IDS = [PARENT_MOVE_STAY_SIBLING_ID] as const;
/** Full target-day scope after the parent block lands, children included. */
const PARENT_MOVE_TARGET_ITEM_IDS = [
  PARENT_MOVE_TARGET_ID,
  PARENT_MOVE_ID,
  PARENT_MOVE_CHILD_1_ID,
  PARENT_MOVE_CHILD_2_ID,
] as const;

function buildParentMoveFixture() {
  const parent = stop({
    id: PARENT_MOVE_ID,
    day: DAY,
    activity: "Plan-block parent",
    activityType: "stay",
    place: "Plan-block parent",
    startTime: "09:00",
    endTime: "",
    parentItemId: null,
    version: 3,
  });
  const child1 = stop({
    id: PARENT_MOVE_CHILD_1_ID,
    day: DAY,
    activity: "Nested child one",
    activityType: "food",
    startTime: "09:15",
    endTime: "",
    parentItemId: PARENT_MOVE_ID,
    version: 2,
  });
  const child2 = stop({
    id: PARENT_MOVE_CHILD_2_ID,
    day: DAY,
    activity: "Nested child two",
    activityType: "shopping",
    startTime: "09:30",
    endTime: "",
    parentItemId: PARENT_MOVE_ID,
    version: 2,
  });
  const staySibling = stop({
    id: PARENT_MOVE_STAY_SIBLING_ID,
    day: DAY,
    activity: "Stays on source day",
    activityType: "food",
    startTime: "11:00",
    endTime: "12:00",
  });
  const target = stop({
    id: PARENT_MOVE_TARGET_ID,
    day: DAY_2,
    activity: "Already on target day",
    activityType: "attraction",
    startTime: "09:00",
    endTime: "10:00",
  });
  return { parent, child1, child2, staySibling, target };
}

/** PATCH calls to a specific itinerary item's day endpoint (excludes /order). */
function dayPatchCallsFor(
  fetchMock: ReturnType<typeof vi.fn>,
  itemId: string,
): FetchCall[] {
  return itineraryPatchCalls(fetchMock).filter((call) =>
    call.url.endsWith(`/itinerary-items/${itemId}`),
  );
}

function dispatchParentMoveEvent(table: HTMLElement) {
  table.dispatchEvent(
    new CustomEvent(PLAN_DAY_CROSS_DAY_MOVE_EVENT, {
      bubbles: true,
      detail: {
        itemId: PARENT_MOVE_ID,
        fromDay: DAY,
        toDay: DAY_2,
        childItemIds: [PARENT_MOVE_CHILD_1_ID, PARENT_MOVE_CHILD_2_ID],
        sourceItemIds: [...PARENT_MOVE_SOURCE_ITEM_IDS],
        targetItemIds: [...PARENT_MOVE_TARGET_ITEM_IDS],
      },
    }),
  );
}

describe("SmartItineraryTable cross-day parent + nested children move", () => {
  it("dropping a plan-block parent with nested children onto another Plan Day PATCHes ONLY the parent's day to the target day (children come via backend day-cascade, not a client PATCH) before reordering both day scopes with the children included in the target itemIds", async () => {
    const { parent, child1, child2, staySibling, target } =
      buildParentMoveFixture();

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "PATCH" && url.endsWith("/itinerary-items/order")) {
        return jsonResponse([]);
      }
      if (
        method === "PATCH" &&
        url.endsWith(`/itinerary-items/${PARENT_MOVE_ID}`)
      ) {
        return jsonResponse({
          ...parent,
          day: DAY_2,
          version: parent.version + 1,
        });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY_2,
      planVariantId: PLAN_ID,
      itineraryItems: [parent, child1, child2, staySibling, target],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={PARENT_MOVE_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        reorderEnabled
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    expect(
      table.querySelector(`tr.stop-row[data-id="${PARENT_MOVE_ID}"]`),
    ).toBeTruthy();

    dispatchParentMoveEvent(table);

    // Parent's own day PATCH always fires under the existing single-item seam.
    await waitFor(() => {
      expect(dayPatchCallsFor(fetchMock, PARENT_MOVE_ID)).toHaveLength(1);
    });
    const parentPatch = dayPatchCallsFor(fetchMock, PARENT_MOVE_ID)[0]!.body
      .patch as Record<string, unknown>;
    expect(parentPatch.day).toBe(DAY_2);

    // Children get NO day PATCH of their own — the backend cascades the
    // parent's day change onto them server-side (GREEN details merge
    // follow-up), so a client-side per-child PATCH would be redundant.
    expect(dayPatchCallsFor(fetchMock, PARENT_MOVE_CHILD_1_ID)).toHaveLength(
      0,
    );
    expect(dayPatchCallsFor(fetchMock, PARENT_MOVE_CHILD_2_ID)).toHaveLength(
      0,
    );

    // Exactly 1 day PATCH total (parent only) — no per-child PATCH traffic.
    const allDayPatches = itineraryPatchCalls(fetchMock).filter(
      (call) => !call.url.endsWith("/order"),
    );
    expect(allDayPatches).toHaveLength(1);

    // Both day scopes reorder with full itemIds, children included in target
    // — children moved via backend cascade, but the client's own itemIds
    // scope must still reflect them for order.
    await waitFor(() => {
      expect(itineraryOrderCalls(fetchMock)).toHaveLength(2);
    });
    const orderCalls = itineraryOrderCalls(fetchMock);
    const sourceCall = orderCalls.find((call) => call.body.day === DAY);
    expect(sourceCall).toBeTruthy();
    expect(sourceCall!.body.itemIds).toEqual([...PARENT_MOVE_SOURCE_ITEM_IDS]);
    const targetCall = orderCalls.find((call) => call.body.day === DAY_2);
    expect(targetCall).toBeTruthy();
    expect(targetCall!.body.itemIds).toEqual([...PARENT_MOVE_TARGET_ITEM_IDS]);
  });
});

/**
 * M82GSOYG T4 #3 — cross-day move failure calm (decisions.md #179): a PATCH
 * day failure / version_conflict for the moved parent must surface a calm
 * error / cockpit reload — never a silent local-only cross-day move that
 * leaves the two day scopes reordered while the parent's day PATCH never
 * actually succeeded.
 *
 * GREEN details merge follow-up: children no longer get their own day PATCH
 * (the backend cascades the parent's day change to them), so the failure
 * seam that used to exercise a *child's* day PATCH conflict/error is
 * rewritten to exercise the *parent's* day PATCH conflict/error instead —
 * that's the only day PATCH this commit path issues.
 *
 * Mirrors the existing within-day reorder-failure and version_conflict
 * reload suites, using the parent+children cross-day seam above.
 */
describe("SmartItineraryTable cross-day parent + nested children move failure calm", () => {
  it("version_conflict on the parent's day PATCH during a parent+children cross-day move triggers onCockpitReload and blocks both day-scope reorders — no silent local-only move", async () => {
    const { parent, child1, child2, staySibling, target } =
      buildParentMoveFixture();
    const onCockpitReload = vi.fn();

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (
        method === "PATCH" &&
        url.endsWith(`/itinerary-items/${PARENT_MOVE_ID}`)
      ) {
        return jsonResponse(
          {
            code: CONFLICT_CODE,
            latest: { ...parent, version: parent.version + 5 },
          },
          409,
        );
      }
      if (method === "PATCH" && url.endsWith("/itinerary-items/order")) {
        return jsonResponse([]);
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY_2,
      planVariantId: PLAN_ID,
      itineraryItems: [parent, child1, child2, staySibling, target],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={PARENT_MOVE_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        reorderEnabled
        {...{ onCockpitReload }}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    dispatchParentMoveEvent(table);

    // The parent's own day PATCH must be attempted before the conflict
    // routes to reload.
    await waitFor(
      () => {
        expect(dayPatchCallsFor(fetchMock, PARENT_MOVE_ID)).toHaveLength(1);
      },
      { timeout: 300 },
    );

    // version_conflict on the parent routes through the same calm reload
    // path as the existing single-item / paired-PATCH conflict handling.
    await waitFor(
      () => {
        expect(onCockpitReload).toHaveBeenCalledTimes(1);
      },
      { timeout: 300 },
    );

    // No reorder for either day scope while the parent's day PATCH conflicted
    // — a partial reorder here would be a silent local-only cross-day move.
    expect(itineraryOrderCalls(fetchMock)).toHaveLength(0);
  });

  it("the parent's day PATCH failing (500, non-conflict) during a parent+children cross-day move surfaces a calm error and skips both day-scope reorders — no silent local-only cross-day move", async () => {
    const { parent, child1, child2, staySibling, target } =
      buildParentMoveFixture();

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (
        method === "PATCH" &&
        url.endsWith(`/itinerary-items/${PARENT_MOVE_ID}`)
      ) {
        return jsonResponse({}, 500);
      }
      if (method === "PATCH" && url.endsWith("/itinerary-items/order")) {
        return jsonResponse([]);
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY_2,
      planVariantId: PLAN_ID,
      itineraryItems: [parent, child1, child2, staySibling, target],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={PARENT_MOVE_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        reorderEnabled
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    dispatchParentMoveEvent(table);

    await waitFor(
      () => {
        expect(dayPatchCallsFor(fetchMock, PARENT_MOVE_ID)).toHaveLength(1);
      },
      { timeout: 300 },
    );

    const alert = await waitFor(
      () => within(table).getByRole("alert"),
      { timeout: 300 },
    );
    expect(alert).toBeVisible();

    // No reorder for either day scope while the parent's day PATCH failed —
    // a partial reorder here would be a silent local-only cross-day move.
    expect(itineraryOrderCalls(fetchMock)).toHaveLength(0);
  });
});

/**
 * M82GSOYG T5 #1 — real row `onDrop` must detect a dragged stop from a
 * different Plan Day and route to the cross-day move commit path, not the
 * within-day `moveItemId` no-op. Today the row's onDrop unconditionally
 * calls `onDropReorder(draggedId, item.id)`, which resolves via
 * `moveItemId(dayItemIds, draggedId, beforeId)` against the TARGET day's own
 * id list; a dragged id from a different day is never found there
 * (`from < 0`), so `moveItemId` returns the array unchanged and the drop is
 * silently swallowed — no PATCH at all.
 *
 * This exercises the actual DOM `drop` handler (fireEvent.drop with a
 * dataTransfer stub carrying the dragged id via "text/plain", same contract
 * as the existing `onDragStart` producer) rather than the
 * `joii:plan-day-cross-day-move` CustomEvent test seam used by T4, per the
 * smallest-public-seam guidance: prove the row wiring itself routes to the
 * same PATCH day + dual reorderItineraryItems commit path, inserting the
 * dragged stop immediately before the row it was dropped on (same "insert
 * before target" semantics as the existing within-day onDrop).
 */
const ROW_DROP_SESSION_TOKEN = "member-session-token-cross-day-row-drop";
const ROW_DROP_MOVE_ITEM_ID = "item-cross-day-row-drop-move";
const ROW_DROP_STAY_ID = "item-cross-day-row-drop-stay";
const ROW_DROP_TARGET_ID = "item-cross-day-row-drop-target";
/** Full source-day scope after the moved stop leaves. */
const ROW_DROP_SOURCE_ITEM_IDS = [ROW_DROP_STAY_ID] as const;
/** Full target-day scope: dragged stop inserted before the row dropped on. */
const ROW_DROP_TARGET_ITEM_IDS = [
  ROW_DROP_MOVE_ITEM_ID,
  ROW_DROP_TARGET_ID,
] as const;

function dataTransferStub(draggedId: string): DataTransfer {
  return {
    getData: (format: string) => (format === "text/plain" ? draggedId : ""),
    setData: () => {},
    dropEffect: "move",
    effectAllowed: "move",
  } as unknown as DataTransfer;
}

describe("SmartItineraryTable cross-day row onDrop routing", () => {
  it("row onDrop detects a dragged stop from a different day and routes to the cross-day move instead of a within-day no-op (moveItemId)", async () => {
    const movedStop = stop({
      id: ROW_DROP_MOVE_ITEM_ID,
      day: DAY,
      activity: "Moved via row drop",
      activityType: "attraction",
      startTime: "09:00",
      endTime: "10:00",
      version: 3,
    });
    const stayStop = stop({
      id: ROW_DROP_STAY_ID,
      day: DAY,
      activity: "Stays on source day",
      activityType: "food",
      startTime: "11:00",
      endTime: "12:00",
    });
    const targetStop = stop({
      id: ROW_DROP_TARGET_ID,
      day: DAY_2,
      activity: "Drop target on other day",
      activityType: "attraction",
      startTime: "09:00",
      endTime: "10:00",
    });

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "PATCH" && url.endsWith("/itinerary-items/order")) {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          day?: string;
          itemIds?: string[];
        };
        const items = (body.itemIds ?? []).map((id) => {
          if (id === ROW_DROP_MOVE_ITEM_ID) {
            return { ...movedStop, day: body.day, version: 4 };
          }
          if (id === ROW_DROP_STAY_ID) return stayStop;
          return targetStop;
        });
        return jsonResponse(items);
      }
      if (
        method === "PATCH" &&
        url.endsWith(`/itinerary-items/${ROW_DROP_MOVE_ITEM_ID}`)
      ) {
        return jsonResponse({ ...movedStop, day: DAY_2, version: 4 });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY_2,
      planVariantId: PLAN_ID,
      itineraryItems: [movedStop, stayStop, targetStop],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={ROW_DROP_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        reorderEnabled
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const targetRow = table.querySelector(
      `tr.stop-row[data-id="${ROW_DROP_TARGET_ID}"]`,
    ) as HTMLElement;
    expect(targetRow).toBeTruthy();

    // Real DnD: drop a stop dragged from Day onto a row that lives on Day 2.
    fireEvent.drop(targetRow, { dataTransfer: dataTransferStub(ROW_DROP_MOVE_ITEM_ID) });

    // (1) Item day PATCH — moved item's day flips to the target Plan Day.
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const dayPatchCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(dayPatchCall.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${ROW_DROP_MOVE_ITEM_ID}`,
    );
    const dayPatch = dayPatchCall.body.patch as Record<string, unknown>;
    expect(dayPatch.day).toBe(DAY_2);

    // (2) Both Plan Day scopes reorder with full itemIds — not a within-day no-op.
    await waitFor(() => {
      expect(itineraryOrderCalls(fetchMock)).toHaveLength(2);
    });
    const orderCalls = itineraryOrderCalls(fetchMock);

    const sourceCall = orderCalls.find((call) => call.body.day === DAY);
    expect(sourceCall).toBeTruthy();
    expect(sourceCall!.body.itemIds).toEqual([...ROW_DROP_SOURCE_ITEM_IDS]);

    const targetCall = orderCalls.find((call) => call.body.day === DAY_2);
    expect(targetCall).toBeTruthy();
    expect(targetCall!.body.itemIds).toEqual([...ROW_DROP_TARGET_ITEM_IDS]);
  });
});

/**
 * M82GSOYG T5 #2 — an empty Plan Day / day header must accept a drop and
 * append the dragged stop to that target day. Today `DayRow` (`tr.day-row`)
 * renders no `onDrop`/`onDragOver` at all, so dropping on a day header —
 * empty or not — is a pure no-op: no PATCH is ever issued.
 *
 * Fixture: Day 2 starts with zero items (the "empty Plan Day" case from the
 * acceptance). Dropping the Day-1 stop on the Day-2 header must PATCH the
 * item's day to Day 2, then reorder Day (now down to the remaining sibling)
 * and Day 2 (now containing only the appended stop).
 */
const DAY_HEADER_DROP_SESSION_TOKEN =
  "member-session-token-cross-day-day-header-drop";
const DAY_HEADER_DROP_MOVE_ITEM_ID = "item-cross-day-day-header-move";
const DAY_HEADER_DROP_STAY_ID = "item-cross-day-day-header-stay";

describe("SmartItineraryTable cross-day empty day header onDrop", () => {
  it("an empty Plan Day / day header accepts a drop and appends the stop to that target day", async () => {
    const movedStop = stop({
      id: DAY_HEADER_DROP_MOVE_ITEM_ID,
      day: DAY,
      activity: "Moved via day header drop",
      activityType: "attraction",
      startTime: "09:00",
      endTime: "10:00",
      version: 3,
    });
    const stayStop = stop({
      id: DAY_HEADER_DROP_STAY_ID,
      day: DAY,
      activity: "Stays on source day",
      activityType: "food",
      startTime: "11:00",
      endTime: "12:00",
    });

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "PATCH" && url.endsWith("/itinerary-items/order")) {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          day?: string;
          itemIds?: string[];
        };
        const items = (body.itemIds ?? []).map((id) =>
          id === DAY_HEADER_DROP_MOVE_ITEM_ID
            ? { ...movedStop, day: body.day, version: 4 }
            : stayStop,
        );
        return jsonResponse(items);
      }
      if (
        method === "PATCH" &&
        url.endsWith(`/itinerary-items/${DAY_HEADER_DROP_MOVE_ITEM_ID}`)
      ) {
        return jsonResponse({ ...movedStop, day: DAY_2, version: 4 });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    // Day 2 is seeded with NO items — the "empty Plan Day" drop target.
    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY_2,
      planVariantId: PLAN_ID,
      itineraryItems: [movedStop, stayStop],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={DAY_HEADER_DROP_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        reorderEnabled
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    // Day 2 has no stop rows yet — locate its header via the ISO `dateTime`.
    expect(
      table.querySelector(`tr.stop-row[data-day="Day 2"]`),
    ).toBeNull();
    const day2Time = table.querySelector(`time[datetime="${DAY_2}"]`);
    expect(day2Time).toBeTruthy();
    const day2Header = day2Time!.closest("tr.day-row") as HTMLElement;
    expect(day2Header).toBeTruthy();

    // Real DnD: drop the Day-1 stop directly on the empty Day-2 header.
    fireEvent.drop(day2Header, {
      dataTransfer: dataTransferStub(DAY_HEADER_DROP_MOVE_ITEM_ID),
    });

    // (1) Item day PATCH — moved item's day flips to the target Plan Day.
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const dayPatchCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(dayPatchCall.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${DAY_HEADER_DROP_MOVE_ITEM_ID}`,
    );
    const dayPatch = dayPatchCall.body.patch as Record<string, unknown>;
    expect(dayPatch.day).toBe(DAY_2);

    // (2) Source day reorders to its remaining sibling; target day reorders
    // to just the appended stop (it started empty).
    await waitFor(() => {
      expect(itineraryOrderCalls(fetchMock)).toHaveLength(2);
    });
    const orderCalls = itineraryOrderCalls(fetchMock);

    const sourceCall = orderCalls.find((call) => call.body.day === DAY);
    expect(sourceCall).toBeTruthy();
    expect(sourceCall!.body.itemIds).toEqual([DAY_HEADER_DROP_STAY_ID]);

    const targetCall = orderCalls.find((call) => call.body.day === DAY_2);
    expect(targetCall).toBeTruthy();
    expect(targetCall!.body.itemIds).toEqual([DAY_HEADER_DROP_MOVE_ITEM_ID]);
  });
});

/**
 * M80P3JXX T6 #2 — sub-activity chevron tree (draft itinerary-plan-draft-v1.html).
 *
 * Landmarks: `.activity-action.subplan-toggle` / `[data-subplan-toggle]` chevron;
 * `tr.stop-row[data-subs-open]`; nested `.subplan` → `.subplan-list` →
 * `.subplan-row[data-subplan-row]` with place fields from seeded Stay (s1) and
 * attraction (a1) `data-subs`.
 */
const STAY_PARENT_ID = "item-stay-s1";
const STAY_PARENT_ACTIVITY = "Hotel Gracery Shinjuku";
/** Draft s1 data-subs place literals (independent of production). */
const STAY_SUB_PLACES = ["Lobby cafe", "FamilyMart"] as const;
const STAY_SUB_COUNT = STAY_SUB_PLACES.length;

const ATTRACTION_PARENT_ID = "item-attraction-a1";
const ATTRACTION_PARENT_ACTIVITY = "Senso-ji";
/** Draft a1 data-subs place literals. */
const ATTRACTION_SUB_PLACES = [
  "Main hall",
  "Nakamise street",
  "Matcha soft serve",
] as const;
const ATTRACTION_SUB_COUNT = ATTRACTION_SUB_PLACES.length;

describe("SmartItineraryTable sub-activity chevron tree", () => {
  it("Parent stops with children show a chevron that expands/collapses the sub-activity tree; seeded Stay / attraction parents with children render nested subplan rows matching draft landmarks", async () => {
    const user = userEvent.setup();

    const stayParent = stop({
      id: STAY_PARENT_ID,
      day: DAY,
      activity: STAY_PARENT_ACTIVITY,
      activityType: "stay",
      place: STAY_PARENT_ACTIVITY,
      startTime: "15:30",
      endTime: "",
      parentItemId: null,
    });
    const stayChildren = STAY_SUB_PLACES.map((place, index) =>
      stop({
        id: `item-stay-sub-${index + 1}`,
        day: DAY,
        activity: place,
        activityType: index === 0 ? "food" : "shopping",
        place,
        startTime: "15:30",
        endTime: "",
        parentItemId: STAY_PARENT_ID,
      }),
    );

    const attractionParent = stop({
      id: ATTRACTION_PARENT_ID,
      day: DAY_2,
      activity: ATTRACTION_PARENT_ACTIVITY,
      activityType: "attraction",
      place: ATTRACTION_PARENT_ACTIVITY,
      startTime: "10:00",
      endTime: "11:30",
      parentItemId: null,
    });
    const attractionChildren = ATTRACTION_SUB_PLACES.map((place, index) =>
      stop({
        id: `item-attraction-sub-${index + 1}`,
        day: DAY_2,
        activity: place,
        activityType:
          index === 0 ? "attraction" : index === 1 ? "shopping" : "food",
        place,
        startTime: "10:00",
        endTime: "",
        parentItemId: ATTRACTION_PARENT_ID,
      }),
    );

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY_2,
      planVariantId: PLAN_ID,
      itineraryItems: [
        stayParent,
        ...stayChildren,
        attractionParent,
        ...attractionChildren,
      ],
    });

    render(<SmartItineraryTable model={model} />);

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });

    async function expectParentSubplanTree(
      parentId: string,
      subPlaces: readonly string[],
      subCount: number,
    ) {
      const parentRow = table.querySelector(
        `tr.stop-row[data-id="${parentId}"]`,
      ) as HTMLElement | null;
      expect(parentRow).toBeTruthy();

      // Draft chevron: .activity-action.subplan-toggle / [data-subplan-toggle].
      const toggle = parentRow!.querySelector(
        "button.activity-action.subplan-toggle[data-subplan-toggle], button[data-subplan-toggle]",
      ) as HTMLElement | null;
      expect(toggle).toBeTruthy();
      expect(toggle!.querySelector("svg")).toBeTruthy();
      expect(toggle).toHaveAttribute("data-count", String(subCount));
      expect(toggle).toHaveAttribute("aria-expanded", "false");

      // Collapsed: subplan panel absent or hidden (draft panel.hidden until open).
      const panelBefore = parentRow!.querySelector(
        ".subplan[data-subplan], [data-subplan]",
      ) as HTMLElement | null;
      if (panelBefore) {
        expect(
          panelBefore.hidden || panelBefore.getAttribute("hidden") !== null,
        ).toBe(true);
      }

      await user.click(toggle!);

      expect(parentRow).toHaveAttribute("data-subs-open", "true");
      expect(toggle).toHaveAttribute("aria-expanded", "true");

      const panel = parentRow!.querySelector(
        ".subplan[data-subplan], [data-subplan]",
      ) as HTMLElement;
      expect(panel).toBeTruthy();
      expect(panel.hidden).toBe(false);
      expect(panel.querySelector(".subplan-list, [data-subplan-list]")).toBeTruthy();

      const subRows = [
        ...panel.querySelectorAll(".subplan-row[data-subplan-row], [data-subplan-row]"),
      ];
      expect(subRows.length).toBe(subCount);
      for (const place of subPlaces) {
        expect(
          subRows.some((row) => row.textContent?.includes(place)),
        ).toBe(true);
      }

      // Collapse again.
      await user.click(toggle!);
      expect(parentRow).toHaveAttribute("data-subs-open", "false");
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      const panelAfter = parentRow!.querySelector(
        ".subplan[data-subplan], [data-subplan]",
      ) as HTMLElement | null;
      expect(panelAfter).toBeTruthy();
      expect(
        panelAfter!.hidden || panelAfter!.getAttribute("hidden") !== null,
      ).toBe(true);
    }

    await expectParentSubplanTree(
      STAY_PARENT_ID,
      STAY_SUB_PLACES,
      STAY_SUB_COUNT,
    );
    await expectParentSubplanTree(
      ATTRACTION_PARENT_ID,
      ATTRACTION_SUB_PLACES,
      ATTRACTION_SUB_COUNT,
    );
  });
});

/**
 * M81DDKSC T2 #2 — Table write-path for sub-activities: add a child under a
 * parent stop; successful create nests the new row in the chevron tree using
 * the returned parentItemId (not a flat top-level append).
 */
const ADD_CHILD_SESSION = "member-session-token-add-child";
const ADD_CHILD_PARENT_ID = "item-stay-parent-write";
const ADD_CHILD_PARENT_ACTIVITY = "Hotel Gracery Shinjuku";
const ADD_CHILD_DRAFT_TITLE = "Lobby cafe";
/** Returned summary activity — distinct from typed draft to prove nest uses response. */
const ADD_CHILD_RETURNED_ACTIVITY = "Lobby cafe tasting";
const ADD_CHILD_CREATED_ID = "018f4e83-6600-7d8b-8f25-aaaaaaaa0001";

describe("SmartItineraryTable add child under parent", () => {
  it("can add a child under a parent stop; successful create nests the new row under that parent in the chevron tree using returned parentItemId", async () => {
    const user = userEvent.setup();
    const parentStop: StopItem = stop({
      id: ADD_CHILD_PARENT_ID,
      day: DAY,
      activity: ADD_CHILD_PARENT_ACTIVITY,
      activityType: "stay",
      place: ADD_CHILD_PARENT_ACTIVITY,
      startTime: "15:30",
      endTime: "",
      parentItemId: null,
      isPlanBlock: true,
      version: 3,
    });

    const createdChildSummary = {
      id: ADD_CHILD_CREATED_ID,
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: DAY,
      activity: ADD_CHILD_RETURNED_ACTIVITY,
      activityType: "food",
      place: ADD_CHILD_RETURNED_ACTIVITY,
      startTime: "",
      status: "idea",
      version: 1,
      parentItemId: ADD_CHILD_PARENT_ID,
      isPlanBlock: false,
    };

    const fetchMock = vi.fn(async () => jsonResponse(createdChildSummary));

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [parentStop],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={ADD_CHILD_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const parentRow = table.querySelector(
      `tr.stop-row[data-id="${ADD_CHILD_PARENT_ID}"]`,
    ) as HTMLElement;
    expect(parentRow).toBeTruthy();

    // Draft landmark: add-child control under the parent (chevron / action).
    const addChildControl = within(parentRow).getByRole("button", {
      name: /add sub-activit/i,
    });
    await user.click(addChildControl);

    // Inline draft for the child (title field under the parent tree).
    const childDraft =
      within(parentRow).queryByRole("textbox", { name: /title/i }) ??
      within(table).getByRole("textbox", { name: /title/i });
    await user.type(childDraft, ADD_CHILD_DRAFT_TITLE);
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(itineraryCreateCalls(fetchMock)).toHaveLength(1);
    });

    const createCall = itineraryCreateCalls(fetchMock)[0]!;
    expect(createCall.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items`,
    );
    expect(new Headers(createCall.init.headers).get("Authorization")).toBe(
      `Bearer ${ADD_CHILD_SESSION}`,
    );
    expect(createCall.body).toEqual(
      expect.objectContaining({
        planVariantId: PLAN_ID,
        day: DAY,
        activity: ADD_CHILD_DRAFT_TITLE,
        parentItemId: ADD_CHILD_PARENT_ID,
      }),
    );

    // Nested under parent chevron tree — not a flat top-level stop-row.
    const nested = await waitFor(() => {
      const panel = parentRow.querySelector(
        ".subplan[data-subplan], [data-subplan]",
      ) as HTMLElement | null;
      expect(panel).toBeTruthy();
      expect(panel!.hidden).toBe(false);
      const subRows = [
        ...panel!.querySelectorAll(
          ".subplan-row[data-subplan-row], [data-subplan-row]",
        ),
      ];
      expect(
        subRows.some((row) =>
          row.textContent?.includes(ADD_CHILD_RETURNED_ACTIVITY),
        ),
      ).toBe(true);
      return subRows;
    });
    expect(nested.length).toBeGreaterThanOrEqual(1);

    // Must not append the child as a sibling top-level stop-row.
    expect(
      table.querySelector(
        `tr.stop-row[data-id="${ADD_CHILD_CREATED_ID}"]`,
      ),
    ).toBeNull();
  });
});

/**
 * M80P3JXX T7 #2 — draft choiceChipHtml on .title-with-meta (far right):
 * Travel By (`data-by-trigger`) + Food Meal (`data-meal-trigger.meal`) commit
 * via PATCH itinerary-items/{id} with clientMutationId + expectedVersion.
 * Independent literals: draft BY_OPTS/MEAL_OPTS + API activitySubtype / details.meal.
 */
const CHIP_SESSION_TOKEN = "member-session-token-meal-by-chips";
const CHIP_TRAVEL_ID = "item-travel-by-chip";
const CHIP_FOOD_ID = "item-food-meal-chip";
const CHIP_EXPECTED_VERSION = 7;
/** Draft BY_OPTS / validate_activity_subtype. */
const CHIP_BY_VALUE = "flight";
/** Draft MEAL_OPTS; create/patch details.meal. */
const CHIP_MEAL_VALUE = "Dinner";

describe("SmartItineraryTable meal/By choice-chips", () => {
  it("Food Meal and Travel By choice-chips sit on the title line (far right) per draft and commit via existing PATCH expectedVersion path", async () => {
    const user = userEvent.setup();
    const travelStop: StopItem = {
      ...TRAVEL_STOP,
      id: CHIP_TRAVEL_ID,
      version: CHIP_EXPECTED_VERSION,
    };
    const foodStop: StopItem = stop({
      id: CHIP_FOOD_ID,
      day: DAY,
      activity: "Ichiran Shinjuku",
      activityType: "food",
      place: "Ichiran Shinjuku",
      version: CHIP_EXPECTED_VERSION,
    });

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "PATCH" && url.includes("/itinerary-items/")) {
        const id = url.split("/").pop()!;
        const base = id === CHIP_FOOD_ID ? foodStop : travelStop;
        return jsonResponse({
          ...base,
          version: CHIP_EXPECTED_VERSION + 1,
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
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={CHIP_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const travelRow = table.querySelector(
      `tr.stop-row[data-id="${CHIP_TRAVEL_ID}"]`,
    ) as HTMLElement;
    const foodRow = table.querySelector(
      `tr.stop-row[data-id="${CHIP_FOOD_ID}"]`,
    ) as HTMLElement;
    expect(travelRow).toBeTruthy();
    expect(foodRow).toBeTruthy();

    // Draft: By chip is last child of .title-with-meta on the travel title line.
    const travelTitle = travelRow.querySelector(
      ".fields-host .line-primary .title-with-meta",
    ) as HTMLElement;
    expect(travelTitle).toBeTruthy();
    const byChip = travelTitle.querySelector(
      "button.choice-chip[data-by-trigger]",
    ) as HTMLElement;
    expect(byChip).toBeTruthy();
    expect(byChip).toHaveAttribute("aria-haspopup", "listbox");
    expect(travelTitle.lastElementChild).toBe(byChip);
    expect(byChip.querySelector(".choice-chip-label")).toHaveTextContent(/^By$/i);

    // Draft: Meal chip (class meal) is last child of food .title-with-meta.
    const foodTitle = foodRow.querySelector(
      ".fields-host .line-primary .title-with-meta",
    ) as HTMLElement;
    expect(foodTitle).toBeTruthy();
    const mealChip = foodTitle.querySelector(
      "button.choice-chip.meal[data-meal-trigger]",
    ) as HTMLElement;
    expect(mealChip).toBeTruthy();
    expect(mealChip).toHaveAttribute("aria-haspopup", "listbox");
    expect(foodTitle.lastElementChild).toBe(mealChip);
    expect(mealChip.querySelector(".choice-chip-label")).toHaveTextContent(
      /^Meal$/i,
    );

    const travelPatchUrl = `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${CHIP_TRAVEL_ID}`;
    const foodPatchUrl = `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${CHIP_FOOD_ID}`;

    // By choice → PATCH activitySubtype via expectedVersion path.
    fetchMock.mockClear();
    await user.click(byChip);
    await user.click(
      await screen.findByRole("option", { name: new RegExp(`^${CHIP_BY_VALUE}$`, "i") }),
    );
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const byCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(byCall.url).toBe(travelPatchUrl);
    expect((byCall.init.method ?? "").toUpperCase()).toBe("PATCH");
    const byHeaders = new Headers(byCall.init.headers);
    expect(byHeaders.get("Authorization")).toBe(`Bearer ${CHIP_SESSION_TOKEN}`);
    expect(typeof byCall.body.clientMutationId).toBe("string");
    expect(String(byCall.body.clientMutationId).length).toBeGreaterThan(0);
    expect(byCall.body.expectedVersion).toBe(CHIP_EXPECTED_VERSION);
    expect(byCall.body.patch).toEqual(
      expect.objectContaining({ activitySubtype: CHIP_BY_VALUE }),
    );

    // Meal choice → PATCH details.meal via expectedVersion path.
    fetchMock.mockClear();
    await user.click(mealChip);
    await user.click(
      await screen.findByRole("option", {
        name: new RegExp(`^${CHIP_MEAL_VALUE}$`, "i"),
      }),
    );
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const mealCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(mealCall.url).toBe(foodPatchUrl);
    expect((mealCall.init.method ?? "").toUpperCase()).toBe("PATCH");
    const mealHeaders = new Headers(mealCall.init.headers);
    expect(mealHeaders.get("Authorization")).toBe(
      `Bearer ${CHIP_SESSION_TOKEN}`,
    );
    expect(typeof mealCall.body.clientMutationId).toBe("string");
    expect(String(mealCall.body.clientMutationId).length).toBeGreaterThan(0);
    expect(mealCall.body.expectedVersion).toBe(CHIP_EXPECTED_VERSION);
    expect(mealCall.body.patch).toEqual(
      expect.objectContaining({
        details: expect.objectContaining({ meal: CHIP_MEAL_VALUE }),
      }),
    );
  });
});

/**
 * M82GSOYG T3 #1 — commitBagKey soft-map for travel From/To/By must persist
 * into `details` (origin/destination/mode) — not only the derived top-level
 * activity/activitySubtype fields — mirroring softMapBagKeyToPatch (T1,
 * already done). A reload built strictly from what the API actually
 * persisted (no client-only memory) must then rehydrate those values via
 * seedFieldBag (T2, already done). By has no top-level PATCH fallback field
 * in seedFieldBag, so its round-trip only survives when commitBagKey sends
 * details.mode. Independent literals: a route/mode distinct from the draft
 * chip fixtures above.
 */
const ROUTE_DETAILS_SESSION_TOKEN = "member-session-token-details-roundtrip";
const ROUTE_DETAILS_ITEM_ID = "item-travel-details-roundtrip";
const ROUTE_DETAILS_EXPECTED_VERSION = 3;
const ROUTE_DETAILS_FROM = "Chiang Mai";
const ROUTE_DETAILS_TO = "Osaka";
const ROUTE_DETAILS_BY = "ferry";

describe("SmartItineraryTable commitBagKey details persistence + reload round-trip (M82GSOYG T3)", () => {
  it("From/To blur PATCHes details.origin/details.destination and By choice PATCHes details.mode; a fresh reload model built only from what the API actually persisted rehydrates From/To/By via seedFieldBag", async () => {
    const user = userEvent.setup();
    const baseStop: StopItem = {
      ...TRAVEL_STOP,
      id: ROUTE_DETAILS_ITEM_ID,
      version: ROUTE_DETAILS_EXPECTED_VERSION,
      activity: "BKK → NRT",
    };

    // Simulated backend: echoes back only what patch.details actually carried
    // (no client-only memory of untyped fields) — proves real persistence.
    let persistedDetails: Record<string, unknown> = {};
    let persistedActivity = baseStop.activity;
    let persistedActivitySubtype: string | null | undefined;
    let persistedVersion = ROUTE_DETAILS_EXPECTED_VERSION;

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "PATCH" && url.includes("/itinerary-items/")) {
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
        return jsonResponse({
          ...baseStop,
          activity: persistedActivity,
          activitySubtype: persistedActivitySubtype ?? undefined,
          details: persistedDetails,
          version: persistedVersion,
        });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [baseStop],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={ROUTE_DETAILS_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const row = table.querySelector(
      `tr.stop-row[data-id="${ROUTE_DETAILS_ITEM_ID}"]`,
    ) as HTMLElement;
    expect(row).toBeTruthy();

    const patchUrl = `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${ROUTE_DETAILS_ITEM_ID}`;

    // --- From/To blur → PATCH must carry details.origin/details.destination ---
    fetchMock.mockClear();
    const fromInput = within(row).getByRole("textbox", { name: /^from$/i });
    const toInput = within(row).getByRole("textbox", { name: /^to$/i });
    fireEvent.change(fromInput, { target: { value: ROUTE_DETAILS_FROM } });
    fireEvent.change(toInput, { target: { value: ROUTE_DETAILS_TO } });
    fireEvent.blur(toInput);
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const routeCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(routeCall.url).toBe(patchUrl);
    expect(routeCall.body.patch).toEqual(
      expect.objectContaining({
        details: expect.objectContaining({
          origin: ROUTE_DETAILS_FROM,
          destination: ROUTE_DETAILS_TO,
        }),
      }),
    );

    // --- By choice → PATCH must carry details.mode alongside activitySubtype ---
    fetchMock.mockClear();
    const byChip = row.querySelector(
      "button.choice-chip[data-by-trigger]",
    ) as HTMLElement;
    expect(byChip).toBeTruthy();
    await user.click(byChip);
    await user.click(
      await screen.findByRole("option", {
        name: new RegExp(`^${ROUTE_DETAILS_BY}$`, "i"),
      }),
    );
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const byCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(byCall.url).toBe(patchUrl);
    expect(byCall.body.patch).toEqual(
      expect.objectContaining({
        activitySubtype: ROUTE_DETAILS_BY,
        details: expect.objectContaining({ mode: ROUTE_DETAILS_BY }),
      }),
    );

    // --- Reload round-trip: a fresh table mount from a model built strictly
    // from what the mocked API actually persisted must rehydrate From/To/By.
    cleanup();
    const reloadedStop: StopItem = {
      ...baseStop,
      activity: persistedActivity,
      activitySubtype: persistedActivitySubtype ?? undefined,
      details: persistedDetails,
      version: persistedVersion,
    };
    const reloadedModel = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [reloadedStop],
    });
    render(<SmartItineraryTable model={reloadedModel} />);
    const reloadedTable = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const reloadedRow = reloadedTable.querySelector(
      `tr.stop-row[data-id="${ROUTE_DETAILS_ITEM_ID}"]`,
    ) as HTMLElement;
    expect(reloadedRow).toBeTruthy();
    expect(
      within(reloadedRow).getByRole("textbox", { name: /^from$/i }),
    ).toHaveValue(ROUTE_DETAILS_FROM);
    expect(
      within(reloadedRow).getByRole("textbox", { name: /^to$/i }),
    ).toHaveValue(ROUTE_DETAILS_TO);
    const reloadedByChipLabel = reloadedRow.querySelector(
      "button.choice-chip[data-by-trigger] .choice-chip-label",
    );
    expect(reloadedByChipLabel).toHaveTextContent(
      new RegExp(`^${ROUTE_DETAILS_BY}$`, "i"),
    );
  });
});

/**
 * M80P3JXX T7 #3 — draft openStopDialog(note|link) + openTimeSetupDialog:
 * Note / Link from stop action controls; Time setup from [data-time-setup].
 * Remove confirm already ships (rail). Save/Cancel must reuse PATCH
 * /api/v1/trips/{tripId}/itinerary-items/{itemId} (note / mapLink / times) —
 * no parallel note/link/time backends.
 * Independent literals: draft dlg titles + API note/mapLink/startTime/endTime.
 */
const DLG_SESSION_TOKEN = "member-session-token-note-link-time";
const DLG_ITEM_ID = "item-travel-note-link-time";
const DLG_EXPECTED_VERSION = 9;
/** Draft openStopDialog / openTimeSetupDialog titles. */
const NOTE_DIALOG_TITLE = "Note";
const LINK_DIALOG_TITLE = "Link";
const TIME_DIALOG_TITLE = "Time setup";
const NOTE_BODY = "Gate closes 40m early";
const LINK_URL = "https://example.com/tg640-booking";
const DLG_START_TIME = "10:05";
const DLG_END_TIME = "18:20";
/** Independent literals — loaded stop note/mapLink that openStopDialog must seed. */
const LOADED_STOP_NOTE = "Ask for aisle near exit row 42";
const LOADED_STOP_MAP_LINK = "https://maps.example.com/bkk-nrt-tg640";

describe("SmartItineraryTable note/link/time-setup dialogs", () => {
  /**
   * M81DDKSC T1 #3 — openStopDialog(note|link) must seed dlg fields from the
   * loaded stop's note / mapLink (not always clear to empty).
   */
  it("openStopDialog(note|link) seeds dlg fields from the loaded stop note/mapLink", async () => {
    const user = userEvent.setup();
    const seededStop: StopItem = {
      ...TRAVEL_STOP,
      id: DLG_ITEM_ID,
      version: DLG_EXPECTED_VERSION,
      note: LOADED_STOP_NOTE,
      mapLink: LOADED_STOP_MAP_LINK,
    };

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [seededStop],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={DLG_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const stopRow = table.querySelector(
      `tr.stop-row[data-id="${DLG_ITEM_ID}"]`,
    ) as HTMLElement;
    expect(stopRow).toBeTruthy();

    async function openStopAction(label: RegExp) {
      const more = within(stopRow).queryByRole("button", {
        name: /more actions/i,
      });
      if (more) await user.click(more);
      await user.click(within(stopRow).getByRole("button", { name: label }));
    }

    await openStopAction(/edit note/i);
    const noteDialog = await screen.findByRole("dialog", {
      name: NOTE_DIALOG_TITLE,
    });
    const noteField =
      within(noteDialog).queryByRole("textbox", { name: /^note$/i }) ??
      within(noteDialog).getByPlaceholderText(/add a note/i);
    expect(noteField).toHaveValue(LOADED_STOP_NOTE);
    await user.click(
      within(noteDialog).getByRole("button", { name: /^cancel$/i }),
    );

    await openStopAction(/edit link/i);
    const linkDialog = await screen.findByRole("dialog", {
      name: LINK_DIALOG_TITLE,
    });
    const linkField =
      within(linkDialog).queryByRole("textbox", { name: /^url$/i }) ??
      within(linkDialog).getByPlaceholderText(/^https:\/\//i);
    expect(linkField).toHaveValue(LOADED_STOP_MAP_LINK);
  });

  it("Note, link, and time-setup dialogs open from stop action / time-setup controls (Remove confirm already ships); Save/Cancel do not invent parallel backends", async () => {
    const user = userEvent.setup();
    const travelStop: StopItem = {
      ...TRAVEL_STOP,
      id: DLG_ITEM_ID,
      version: DLG_EXPECTED_VERSION,
    };
    const patchUrl = `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${DLG_ITEM_ID}`;

    const fetchMock = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method === "PATCH" && url === patchUrl) {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          expectedVersion?: number;
        };
        const from = typeof body.expectedVersion === "number"
          ? body.expectedVersion
          : DLG_EXPECTED_VERSION;
        return jsonResponse({
          ...travelStop,
          version: from + 1,
        });
      }
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [travelStop],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={DLG_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const stopRow = table.querySelector(
      `tr.stop-row[data-id="${DLG_ITEM_ID}"]`,
    ) as HTMLElement;
    expect(stopRow).toBeTruthy();

    async function openStopAction(label: RegExp) {
      const more = within(stopRow).queryByRole("button", {
        name: /more actions/i,
      });
      if (more) await user.click(more);
      await user.click(within(stopRow).getByRole("button", { name: label }));
    }

    // --- Note: open from stop action; Cancel invents no backend ---
    fetchMock.mockClear();
    await openStopAction(/edit note/i);
    const noteDialog = await screen.findByRole("dialog", {
      name: NOTE_DIALOG_TITLE,
    });
    expect(
      within(noteDialog).getByRole("button", { name: /^cancel$/i }),
    ).toBeInTheDocument();
    expect(
      within(noteDialog).getByRole("button", { name: /^save$/i }),
    ).toBeInTheDocument();
    await user.click(
      within(noteDialog).getByRole("button", { name: /^cancel$/i }),
    );
    expect(screen.queryByRole("dialog", { name: NOTE_DIALOG_TITLE })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    // Note Save → existing item PATCH with note (not a parallel /notes route).
    await openStopAction(/edit note/i);
    const noteDialogSave = await screen.findByRole("dialog", {
      name: NOTE_DIALOG_TITLE,
    });
    const noteField =
      within(noteDialogSave).queryByRole("textbox", { name: /^note$/i }) ??
      within(noteDialogSave).getByPlaceholderText(/add a note/i);
    await user.clear(noteField);
    await user.type(noteField, NOTE_BODY);
    fetchMock.mockClear();
    await user.click(
      within(noteDialogSave).getByRole("button", { name: /^save$/i }),
    );
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const noteCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(noteCall.url).toBe(patchUrl);
    expect((noteCall.init.method ?? "").toUpperCase()).toBe("PATCH");
    expect(new Headers(noteCall.init.headers).get("Authorization")).toBe(
      `Bearer ${DLG_SESSION_TOKEN}`,
    );
    expect(typeof noteCall.body.clientMutationId).toBe("string");
    expect(String(noteCall.body.clientMutationId).length).toBeGreaterThan(0);
    expect(noteCall.body.expectedVersion).toBe(DLG_EXPECTED_VERSION);
    expect(noteCall.body.patch).toEqual(
      expect.objectContaining({ note: NOTE_BODY }),
    );
    expect(
      fetchMock.mock.calls.every(([input]) => String(input) === patchUrl),
    ).toBe(true);

    // --- Link: open from stop action; Save → mapLink on same PATCH path ---
    await openStopAction(/edit link/i);
    const linkDialog = await screen.findByRole("dialog", {
      name: LINK_DIALOG_TITLE,
    });
    const linkField =
      within(linkDialog).queryByRole("textbox", { name: /^url$/i }) ??
      within(linkDialog).getByPlaceholderText(/^https:\/\//i);
    await user.clear(linkField);
    await user.type(linkField, LINK_URL);
    fetchMock.mockClear();
    await user.click(
      within(linkDialog).getByRole("button", { name: /^save$/i }),
    );
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const linkCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(linkCall.url).toBe(patchUrl);
    expect(linkCall.body.expectedVersion).toBe(DLG_EXPECTED_VERSION + 1);
    expect(linkCall.body.patch).toEqual(
      expect.objectContaining({ mapLink: LINK_URL }),
    );
    expect(
      fetchMock.mock.calls.every(([input]) => String(input) === patchUrl),
    ).toBe(true);

    // --- Time setup: open from Set time control; Save → start/end PATCH ---
    await user.click(
      within(stopRow).getByRole("button", { name: /^set time$/i }),
    );
    const timeDialog = await screen.findByRole("dialog", {
      name: TIME_DIALOG_TITLE,
    });
    const startField = within(timeDialog).getByLabelText(/^start$/i);
    const endField = within(timeDialog).getByLabelText(/^end$/i);
    await user.clear(startField);
    await user.type(startField, DLG_START_TIME);
    await user.clear(endField);
    await user.type(endField, DLG_END_TIME);
    fetchMock.mockClear();
    await user.click(
      within(timeDialog).getByRole("button", { name: /^save$/i }),
    );
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const timeCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(timeCall.url).toBe(patchUrl);
    expect(timeCall.body.expectedVersion).toBe(DLG_EXPECTED_VERSION + 2);
    expect(timeCall.body.patch).toEqual(
      expect.objectContaining({
        startTime: DLG_START_TIME,
        endTime: DLG_END_TIME,
      }),
    );
    expect(
      fetchMock.mock.calls.every(([input]) => String(input) === patchUrl),
    ).toBe(true);
  });
});

/**
 * M81HY2YR T3 #2 — sibling overlap warning cues (places-bulk-ingest-draft-v1.html).
 *
 * Quiet advisory: `.day-cue` + `tr.has-overlap` row tint; `.overlap-note` only
 * when day cue is off. Warnings only — no alternate-path or plan-check UI.
 * Independent literals from approved draft (Ichiran dinner ∩ Night walk).
 */
const OVERLAP_DINNER_ID = "item-overlap-dinner";
const OVERLAP_WALK_ID = "item-overlap-walk";
const OVERLAP_CLEAR_ID = "item-overlap-clear";
const OVERLAP_DINNER_TITLE = "Ichiran dinner";
const OVERLAP_WALK_TITLE = "Night walk";
/** Draft `.day-cue` copy for the 18:30–20:00 ∩ 18:45–19:15 window. */
const OVERLAP_DAY_CUE =
  "2 stops overlap between 18:30–19:15 — review times.";

describe("SmartItineraryTable sibling overlap warning cues", () => {
  it("shows draft day-cue and/or has-overlap row tint for overlapping siblings; row notes only when day cue off; warnings only (no alternate-path or plan-check UI)", () => {
    const clearStop = stop({
      id: OVERLAP_CLEAR_ID,
      day: DAY,
      activity: "Hotel check-in",
      activityType: "stay",
      place: "Hotel Gracery Shinjuku",
      startTime: "15:30",
      endTime: "16:00",
    });
    const dinner = stop({
      id: OVERLAP_DINNER_ID,
      day: DAY,
      activity: OVERLAP_DINNER_TITLE,
      activityType: "food",
      place: "Ichiran Shinjuku",
      startTime: "18:30",
      endTime: "20:00",
    });
    const walk = stop({
      id: OVERLAP_WALK_ID,
      day: DAY,
      activity: OVERLAP_WALK_TITLE,
      activityType: "experience",
      place: "Kabukicho",
      startTime: "18:45",
      endTime: "19:15",
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [clearStop, dinner, walk],
    });

    const { container } = render(<SmartItineraryTable model={model} />);

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });

    // Draft quiet cues: day-cue banner and/or has-overlap tint on intersecting siblings.
    const cueHost =
      container.querySelector("[data-day-cue]") ??
      table.closest("[data-day-cue]");
    const dayCue =
      container.querySelector(".day-cue") ?? table.querySelector(".day-cue");
    expect(dayCue).toBeTruthy();
    expect(dayCue).toBeVisible();
    expect(dayCue).toHaveTextContent(OVERLAP_DAY_CUE);
    // Default quiet mode keeps day cue on (draft body[data-day-cue=on]).
    expect(cueHost ?? dayCue).toBeTruthy();
    if (cueHost) {
      expect(cueHost).toHaveAttribute("data-day-cue", "on");
    }

    const dinnerRow = table.querySelector(
      `tr.stop-row[data-id="${OVERLAP_DINNER_ID}"]`,
    ) as HTMLElement;
    const walkRow = table.querySelector(
      `tr.stop-row[data-id="${OVERLAP_WALK_ID}"]`,
    ) as HTMLElement;
    const clearRow = table.querySelector(
      `tr.stop-row[data-id="${OVERLAP_CLEAR_ID}"]`,
    ) as HTMLElement;
    expect(dinnerRow).toBeTruthy();
    expect(walkRow).toBeTruthy();
    expect(clearRow).toBeTruthy();

    expect(dinnerRow).toHaveClass("has-overlap");
    expect(walkRow).toHaveClass("has-overlap");
    expect(dinnerRow).toHaveAttribute("data-overlap", "true");
    expect(walkRow).toHaveAttribute("data-overlap", "true");
    // Non-overlapping sibling stays clear of warning tint.
    expect(clearRow).not.toHaveClass("has-overlap");
    expect(clearRow).not.toHaveAttribute("data-overlap");

    // Row notes only when day cue off: notes stay in DOM but hidden while cue on
    // (draft: body[data-day-cue=on] .overlap-note { display: none } / hidden).
    const overlapNotes = [
      ...container.querySelectorAll(".overlap-note"),
    ] as HTMLElement[];
    expect(overlapNotes.length).toBeGreaterThanOrEqual(2);
    expect(
      overlapNotes.some((n) =>
        n.textContent?.includes(`Overlaps with ${OVERLAP_WALK_TITLE}`),
      ),
    ).toBe(true);
    expect(
      overlapNotes.some((n) =>
        n.textContent?.includes(`Overlaps with ${OVERLAP_DINNER_TITLE}`),
      ),
    ).toBe(true);
    for (const note of overlapNotes) {
      expect(
        note.hidden ||
          note.getAttribute("hidden") !== null ||
          !note.checkVisibility(),
      ).toBe(true);
    }
    // RTL: "Overlaps with …" must not be exposed as visible text while cue on.
    expect(
      within(dinnerRow).queryByText(/Overlaps with/i),
    ).not.toBeInTheDocument();
    expect(
      within(walkRow).queryByText(/Overlaps with/i),
    ).not.toBeInTheDocument();

    // Warnings only — reject alternate-path / plan-check chrome (PRODUCT.md / decisions).
    expect(
      within(table).queryByRole("columnheader", {
        name: /path|alt(?:ernative)?\s*path|plan\s*check/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      table.querySelector(
        ".path-graph, .col-path, .alt-path, .plan-check, [data-path-graph], [data-plan-check], [data-col='path']",
      ),
    ).toBeNull();
    expect(
      within(container as HTMLElement).queryByText(
        /plan\s*[ab]\b|alternate\s*path|plan\s*check/i,
      ),
    ).not.toBeInTheDocument();
  });
});

/**
 * M81LW2UJ T6 — Overlap day-cues tethered under the day they describe
 * (not a global strip above the table). Days without that day's cue keep
 * row notes available (not force-hidden by a global cue flag).
 */
const TETHER_DAY1_DINNER = "item-tether-d1-dinner";
const TETHER_DAY1_WALK = "item-tether-d1-walk";
const TETHER_DAY2_CLEAR = "item-tether-d2-clear";
const TETHER_DAY2_MUSEUM = "item-tether-d2-museum";
const TETHER_DAY2_CAFE = "item-tether-d2-cafe";
const TETHER_DAY1_CUE =
  "2 stops overlap between 18:30–19:15 — review times.";
/** Day 2 overlaps (12:00–13:30 ∩ 12:15–12:45) — distinct cue copy. */
const TETHER_DAY2_CUE =
  "2 stops overlap between 12:00–12:45 — review times.";
const TETHER_DAY2_MUSEUM_TITLE = "Morning museum";
const TETHER_DAY2_CAFE_TITLE = "Cafe stop";

describe("SmartItineraryTable overlap day-cue tether", () => {
  it("tethers each overlap day-cue under its day (not a global strip); row notes stay available for days without that day's cue", () => {
    const day1Dinner = stop({
      id: TETHER_DAY1_DINNER,
      day: DAY,
      activity: OVERLAP_DINNER_TITLE,
      activityType: "food",
      place: "Ichiran Shinjuku",
      startTime: "18:30",
      endTime: "20:00",
    });
    const day1Walk = stop({
      id: TETHER_DAY1_WALK,
      day: DAY,
      activity: OVERLAP_WALK_TITLE,
      activityType: "experience",
      place: "Kabukicho",
      startTime: "18:45",
      endTime: "19:15",
    });
    const day2Clear = stop({
      id: TETHER_DAY2_CLEAR,
      day: DAY_2,
      activity: "Hotel breakfast",
      activityType: "food",
      place: "Hotel Gracery",
      startTime: "08:00",
      endTime: "09:00",
    });
    const day2Museum = stop({
      id: TETHER_DAY2_MUSEUM,
      day: DAY_2,
      activity: TETHER_DAY2_MUSEUM_TITLE,
      activityType: "attraction",
      place: "teamLab",
      startTime: "12:00",
      endTime: "13:30",
    });
    const day2Cafe = stop({
      id: TETHER_DAY2_CAFE,
      day: DAY_2,
      activity: TETHER_DAY2_CAFE_TITLE,
      activityType: "food",
      place: "Blue Bottle",
      startTime: "12:15",
      endTime: "12:45",
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY_2,
      planVariantId: PLAN_ID,
      itineraryItems: [
        day1Dinner,
        day1Walk,
        day2Clear,
        day2Museum,
        day2Cafe,
      ],
    });

    const { container } = render(<SmartItineraryTable model={model} />);
    const root = container.querySelector(".smart-itinerary") as HTMLElement;
    expect(root).toBeTruthy();
    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const dayRows = [...table.querySelectorAll("tr.day-row")];
    const day1Header = dayRows.find(
      (row) =>
        row.querySelector("time.day-date")?.getAttribute("datetime") === DAY,
    );
    const day2Header = dayRows.find(
      (row) =>
        row.querySelector("time.day-date")?.getAttribute("datetime") === DAY_2,
    );
    expect(day1Header).toBeTruthy();
    expect(day2Header).toBeTruthy();

    // Not a global strip above the table (direct children of .smart-itinerary).
    const cuesBeforeTable = [...root.querySelectorAll(":scope > .day-cue")];
    expect(cuesBeforeTable).toHaveLength(0);

    const allCues = [...root.querySelectorAll(".day-cue")] as HTMLElement[];
    const day1Cue = allCues.find((c) =>
      c.textContent?.includes(TETHER_DAY1_CUE),
    );
    const day2Cue = allCues.find((c) =>
      c.textContent?.includes(TETHER_DAY2_CUE),
    );
    expect(day1Cue).toBeTruthy();
    expect(day2Cue).toBeTruthy();

    // Each cue sits under the day it describes (after that day's header,
    // before the next day's header / end of that day block).
    expect(
      day1Header!.compareDocumentPosition(day1Cue!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      day1Cue!.compareDocumentPosition(day2Header!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      day2Header!.compareDocumentPosition(day2Cue!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(table.contains(day1Cue!)).toBe(true);
    expect(table.contains(day2Cue!)).toBe(true);

    const day2MuseumRow = table.querySelector(
      `tr.stop-row[data-id="${TETHER_DAY2_MUSEUM}"]`,
    ) as HTMLElement;
    const day2CafeRow = table.querySelector(
      `tr.stop-row[data-id="${TETHER_DAY2_CAFE}"]`,
    ) as HTMLElement;
    expect(day2MuseumRow).toHaveClass("has-overlap");
    expect(day2CafeRow).toHaveClass("has-overlap");

    const clearRow = table.querySelector(
      `tr.stop-row[data-id="${TETHER_DAY2_CLEAR}"]`,
    ) as HTMLElement;
    expect(clearRow).not.toHaveClass("has-overlap");
    expect(
      within(clearRow).queryByText(/Overlaps with/i),
    ).not.toBeInTheDocument();
  });

  it("keeps row notes available on a day that has no day-cue even when another day shows a cue", () => {
    const day1Dinner = stop({
      id: `${TETHER_DAY1_DINNER}-solo`,
      day: DAY,
      activity: OVERLAP_DINNER_TITLE,
      activityType: "food",
      place: "Ichiran Shinjuku",
      startTime: "18:30",
      endTime: "20:00",
    });
    const day1Walk = stop({
      id: `${TETHER_DAY1_WALK}-solo`,
      day: DAY,
      activity: OVERLAP_WALK_TITLE,
      activityType: "experience",
      place: "Kabukicho",
      startTime: "18:45",
      endTime: "19:15",
    });
    const day2Only = stop({
      id: `${TETHER_DAY2_CLEAR}-solo`,
      day: DAY_2,
      activity: "Park stroll",
      activityType: "experience",
      place: "Yoyogi Park",
      startTime: "10:00",
      endTime: "11:00",
    });

    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY_2,
      planVariantId: PLAN_ID,
      itineraryItems: [day1Dinner, day1Walk, day2Only],
    });

    const { container } = render(<SmartItineraryTable model={model} />);
    const root = container.querySelector(".smart-itinerary") as HTMLElement;
    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });

    const day1Cue = [...root.querySelectorAll(".day-cue")].find((c) =>
      c.textContent?.includes(TETHER_DAY1_CUE),
    );
    expect(day1Cue).toBeTruthy();
    // Only Day 1 has overlaps → exactly one day-cue.
    expect(root.querySelectorAll(".day-cue")).toHaveLength(1);

    // Cue tethered under Day 1 inside the table — not a strip above it.
    expect(table.contains(day1Cue!)).toBe(true);
    expect(root.querySelectorAll(":scope > .day-cue")).toHaveLength(0);

    const day2Row = table.querySelector(
      `tr.stop-row[data-id="${TETHER_DAY2_CLEAR}-solo"]`,
    ) as HTMLElement;
    expect(day2Row).toBeTruthy();
    expect(day2Row).not.toHaveClass("has-overlap");

    // Global notes host that blanks every day when any day has a cue is the
    // defect — cue-less days must not be swept into a table-level host.
    const globalNotesHost = root.querySelector(":scope > .overlap-notes-host");
    expect(globalNotesHost).toBeNull();
  });
});

/**
 * M81LW2UJ T6 — Draft add-activity duration updates when start + end are set.
 * Independent literal: 10:00–11:30 → 1h 30m (same formatDuration as stop rows).
 */
const DRAFT_START = "10:00";
const DRAFT_END = "11:30";
const DRAFT_DURATION = "1h 30m";

describe("SmartItineraryTable draft add-activity duration", () => {
  it("draft duration updates when start and end are set (not stuck on —)", async () => {
    const user = userEvent.setup();
    const model = buildItineraryTableModel({
      startDate: DAY,
      endDate: DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [],
    });

    render(<SmartItineraryTable model={model} />);

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const tbody = table.querySelector("tbody")!;
    const addRow = tbody.querySelector(
      `tr.add-row[data-day="${DAY1_HEADER.dataDay}"]`,
    ) as HTMLElement;

    await user.click(
      within(addRow).getByRole("button", { name: /add activity/i }),
    );

    const draft = tbody.querySelector(
      `tr.add-draft-row[data-day="${DAY1_HEADER.dataDay}"]`,
    ) as HTMLElement;
    expect(draft).toBeVisible();

    const duration = within(draft).getByLabelText("Duration");
    expect(duration).toHaveTextContent("—");

    await user.type(
      within(draft).getByLabelText("Start time"),
      DRAFT_START,
    );
    await user.type(within(draft).getByLabelText("End time"), DRAFT_END);

    expect(duration).toHaveTextContent(DRAFT_DURATION);
    expect(duration).not.toHaveTextContent(/^—$/);
  });

  it("commitDraft POSTs create body with draft startTime and endTime", async () => {
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
        startTime: DRAFT_START,
        endTime: DRAFT_END,
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

    await user.click(
      within(addRow).getByRole("button", { name: /add activity/i }),
    );

    const draft = tbody.querySelector(
      `tr.add-draft-row[data-day="${DAY1_HEADER.dataDay}"]`,
    ) as HTMLElement;
    expect(draft).toBeVisible();

    await user.type(within(draft).getByLabelText("Start time"), DRAFT_START);
    await user.type(within(draft).getByLabelText("End time"), DRAFT_END);
    await user.type(
      within(draft).getByRole("textbox", { name: /title/i }),
      ACTIVITY_TITLE,
    );
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(itineraryCreateCalls(fetchMock)).toHaveLength(1);
    });

    expect(itineraryCreateCalls(fetchMock)[0]!.body).toEqual(
      expect.objectContaining({
        planVariantId: PLAN_ID,
        day: DAY,
        activity: ACTIVITY_TITLE,
        activityType: CREATE_ACTIVITY_TYPE,
        place: CREATE_PLACE,
        startTime: DRAFT_START,
        endTime: DRAFT_END,
      }),
    );
  });
});

/**
 * M81LW2UJ T6 — commitDraft surfaces honest API 4xx messages (backend ErrorBody
 * is top-level `{ code, message }`), not false reachability when fetch returned.
 */
const CREATE_API_4XX_MESSAGE = "activity must not be blank";
const REACHABILITY_COPY =
  "Could not reach the server. Check your connection and try again.";

describe("SmartItineraryTable Quick-add honest API errors", () => {
  it("commitDraft surfaces HTTP 4xx API message — not false reachability when fetch returned a response", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () =>
      // Backend ApiError / ErrorBody: top-level code + message (not nested .error).
      jsonResponse(
        { code: "invalid_request", message: CREATE_API_4XX_MESSAGE },
        400,
      ),
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

    await user.click(
      within(addRow).getByRole("button", { name: /add activity/i }),
    );
    await user.type(
      within(draftRow()).getByRole("textbox", { name: /title/i }),
      ACTIVITY_TITLE,
    );
    await user.keyboard("{Enter}");

    const alert = await waitFor(() => {
      const el = within(table).getByRole("alert");
      expect(el).toHaveTextContent(CREATE_API_4XX_MESSAGE);
      return el;
    });
    expect(alert).toBeVisible();
    expect(alert).not.toHaveTextContent(REACHABILITY_COPY);
    expect(draftRow()).toBeVisible();
  });
});

/**
 * M81HY2YR T2 #1 — Explicit Resolve from the place cell opens the draft
 * candidate picker; picking a candidate PATCHes place/mapLink/lat/lng via the
 * existing expectedVersion path and applies the returned version for the next
 * edit. Independent literals from places-bulk-ingest-draft-v1.html.
 */
const RESOLVE_SESSION = "member-session-token-place-resolve-table";
const RESOLVE_ITEM_ID = "item-food-resolve-table";
const RESOLVE_ACTIVITY = "Ichiran dinner";
const RESOLVE_PLACE_HINT = "Ichiran Shinjuku";
const RESOLVE_EXPECTED_VERSION = 5;
const RESOLVE_RETURNED_VERSION = RESOLVE_EXPECTED_VERSION + 1;
const RESOLVE_DESTINATION = "Tokyo";
const RESOLVE_CANDIDATE_NAME = "Ichiran Shinjuku Central Rd";
const RESOLVE_CANDIDATE_MAP =
  "https://www.openstreetmap.org/?mlat=35.694&mlon=139.7028#map=17/35.694/139.7028";
const RESOLVE_CANDIDATE_LAT = 35.694;
const RESOLVE_CANDIDATE_LNG = 139.7028;
const RESOLVE_FOLLOWUP_PLACE = "Kabukicho";

describe("SmartItineraryTable place Resolve → candidate PATCH + version apply", () => {
  it("Explicit Resolve in the place cell opens the candidate picker; Apply PATCHes place, mapLink, latitude/longitude with expectedVersion and the next edit uses the returned version", async () => {
    const user = userEvent.setup();
    const foodStop: StopItem = {
      id: RESOLVE_ITEM_ID,
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: DAY,
      activity: RESOLVE_ACTIVITY,
      activityType: "food",
      place: RESOLVE_PLACE_HINT,
      startTime: "19:00",
      endTime: "20:30",
      status: "idea",
      version: RESOLVE_EXPECTED_VERSION,
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();

      if (method === "POST" && url.includes("/places/resolve")) {
        return jsonResponse({
          status: "resolved",
          candidates: [
            {
              name: RESOLVE_CANDIDATE_NAME,
              address: "1-22-7 Kabukicho, Shinjuku City, Tokyo",
              coordinates: {
                lat: RESOLVE_CANDIDATE_LAT,
                lng: RESOLVE_CANDIDATE_LNG,
              },
              mapLink: RESOLVE_CANDIDATE_MAP,
              confidence: 0.94,
              source: "nominatim",
              evidence: ["brave: Ichiran Shinjuku"],
            },
          ],
        });
      }

      if (method === "PATCH" && url.includes(`/itinerary-items/${RESOLVE_ITEM_ID}`)) {
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          expectedVersion?: number;
          patch?: Record<string, unknown>;
        };
        return jsonResponse({
          ...foodStop,
          ...body.patch,
          version: (body.expectedVersion ?? RESOLVE_EXPECTED_VERSION) + 1,
          mapLink:
            typeof body.patch?.mapLink === "string"
              ? body.patch.mapLink
              : foodStop.mapLink,
          coordinates:
            typeof body.patch?.latitude === "number" &&
            typeof body.patch?.longitude === "number"
              ? { lat: body.patch.latitude, lng: body.patch.longitude }
              : undefined,
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
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={RESOLVE_SESSION}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        destinationLabel={RESOLVE_DESTINATION}
        countries={["JP"]}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const row = table.querySelector(
      `tr.stop-row[data-id="${RESOLVE_ITEM_ID}"]`,
    ) as HTMLElement;
    expect(row).toBeTruthy();

    // Draft place-cell: Place input + Resolve control.
    const placeField = within(row).getByRole("textbox", { name: /^place$/i });
    expect(placeField).toHaveValue(RESOLVE_PLACE_HINT);
    await user.click(within(row).getByRole("button", { name: /^resolve$/i }));

    const dialog = await screen.findByRole("dialog", {
      name: /^resolve place$/i,
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const candidate = await within(dialog).findByRole("button", {
      name: new RegExp(RESOLVE_CANDIDATE_NAME, "i"),
    });
    await user.click(candidate);
    await user.click(
      within(dialog).getByRole("button", { name: /^apply to stop$/i }),
    );

    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const resolvePatch = itineraryPatchCalls(fetchMock)[0]!;
    expect(resolvePatch.url).toBe(
      `${API_BASE}/api/v1/trips/${TRIP_ID}/itinerary-items/${RESOLVE_ITEM_ID}`,
    );
    expect(resolvePatch.body.expectedVersion).toBe(RESOLVE_EXPECTED_VERSION);
    expect(resolvePatch.body.patch).toEqual(
      expect.objectContaining({
        place: RESOLVE_CANDIDATE_NAME,
        mapLink: RESOLVE_CANDIDATE_MAP,
        latitude: RESOLVE_CANDIDATE_LAT,
        longitude: RESOLVE_CANDIDATE_LNG,
      }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: /^resolve place$/i }),
      ).not.toBeInTheDocument();
    });
    await Promise.resolve();
    await Promise.resolve();

    fetchMock.mockClear();

    // Next edit must send the returned version — not the pre-resolve seed.
    const placeAfter = within(row).getByRole("textbox", { name: /^place$/i });
    await user.clear(placeAfter);
    await user.type(placeAfter, RESOLVE_FOLLOWUP_PLACE);
    await user.tab();

    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    expect(itineraryPatchCalls(fetchMock)[0]!.body.expectedVersion).toBe(
      RESOLVE_RETURNED_VERSION,
    );
    expect(itineraryPatchCalls(fetchMock)[0]!.body.patch).toEqual(
      expect.objectContaining({ place: RESOLVE_FOLLOWUP_PLACE }),
    );
  });
});

/**
 * M827T84Q T2 #1 — fork stop-row + expandable subplan of path options.
 *
 * Draft landmarks (paths-product-draft-v6.html, v6.1 "fork stop + subplan"):
 * fork parent renders as a `tr.stop-row` whose `.line-secondary` carries
 * "Currently using: <strong>Main</strong>" (`#fork-current`), with the
 * existing `.activity-action.subplan-toggle[data-subplan-toggle]` chevron
 * toggling `data-subs-open` on the row and a nested `.subplan[data-subplan]`
 * → `.subplan-list[data-subplan-list]` → `.subplan-row[data-subplan-row]`
 * per alternative path (`.path-chip` text = pathName), shown only while
 * expanded (draft `syncSubplan` / `pathRows`).
 */
const PATH_DAY = "2026-04-16";
const PATH_GROUP_ID = "pgroup-fuji-return";
const PATH_MAIN_ITEM_ID = "item-path-main-return";
const PATH_ALT_ITEM_ID = "item-path-alt-return";
const PATH_MAIN_NAME = "Main";
const PATH_ALT_NAME = "Evening ferry";

const PATH_MAIN_ITEM: StopItem = stop({
  id: PATH_MAIN_ITEM_ID,
  day: PATH_DAY,
  activity: "Return to Tokyo",
  activityType: "travel",
  place: "",
  startTime: "17:40",
  endTime: "21:10",
  pathGroupId: PATH_GROUP_ID,
  pathId: "path-main",
  pathName: PATH_MAIN_NAME,
  pathRole: "main",
});

const PATH_ALT_ITEM: StopItem = stop({
  id: PATH_ALT_ITEM_ID,
  day: PATH_DAY,
  activity: "Take the evening ferry back",
  activityType: "travel",
  place: "",
  startTime: "18:20",
  endTime: "20:50",
  pathGroupId: PATH_GROUP_ID,
  pathId: "path-ferry",
  pathName: PATH_ALT_NAME,
  pathRole: "alternative",
});

describe("SmartItineraryTable path fork stop-row", () => {
  it("A day with items sharing a pathGroupId renders one stop-row parent ('Currently using: <active path name>' + chevron subplan-toggle) with alternatives listed as .subplan-row entries only while expanded", async () => {
    const user = userEvent.setup();

    const model = buildItineraryTableModel({
      startDate: PATH_DAY,
      endDate: PATH_DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [PATH_MAIN_ITEM, PATH_ALT_ITEM],
    });

    render(<SmartItineraryTable model={model} />);

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });

    // Fork group collapses to a single stop-row parent — not one row per sibling.
    expect(table.querySelectorAll("tr.stop-row").length).toBe(1);

    const currentlyUsing = within(table).getByText(
      new RegExp(`currently using:\\s*${PATH_MAIN_NAME}`, "i"),
    );
    const forkRow = currentlyUsing.closest("tr.stop-row") as HTMLElement | null;
    expect(forkRow).toBeTruthy();

    const toggle = forkRow!.querySelector(
      "button.activity-action.subplan-toggle[data-subplan-toggle], button[data-subplan-toggle]",
    ) as HTMLElement | null;
    expect(toggle).toBeTruthy();
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    // Collapsed: the alternative's path option title is not visible yet.
    const altBefore = within(forkRow!).queryByText(PATH_ALT_NAME);
    if (altBefore) expect(altBefore).not.toBeVisible();
    else expect(altBefore).toBeNull();

    await user.click(toggle!);

    expect(forkRow).toHaveAttribute("data-subs-open", "true");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    // Expanded: ALL options render as .subplan-row siblings (designer-fix
    // v6.1) — the active/main option row may be the first one, so target
    // the alternative by data-id rather than assuming DOM order.
    const altRow = forkRow!.querySelector(
      `.subplan-row[data-id="${PATH_ALT_ITEM_ID}"]`,
    ) as HTMLElement | null;
    expect(altRow).toBeTruthy();
    expect(within(altRow!).getByText(PATH_ALT_NAME)).toBeVisible();

    await user.click(toggle!);

    expect(forkRow).toHaveAttribute("data-subs-open", "false");
    const altAfter = within(forkRow!).queryByText(PATH_ALT_NAME);
    if (altAfter) expect(altAfter).not.toBeVisible();
    else expect(altAfter).toBeNull();
  });
});

/**
 * M827T84Q T2 #2 — honest empty: a day with zero path-tagged items must not
 * grow any fork chrome as a side effect of groupPathAlternatives. Every item
 * here has no pathGroupId, so groupPathAlternatives(dayItems) returns only
 * `{ kind: "single" }` entries, `pathFork` stays undefined per stop, and
 * `showSubplanChrome` (`hasSubplan || canCreateChild || hasPathAlternatives`)
 * is false with no tripId/sessionToken and no children — no `.subplan`, no
 * `[data-subplan-toggle]`, no `data-subs-open`, no "Currently using:" text;
 * each item renders as its own plain `tr.stop-row`.
 */
const NO_PATH_DAY = "2026-04-18";

const NO_PATH_STOP_A: StopItem = stop({
  id: "item-noplath-a",
  day: NO_PATH_DAY,
  activity: "Breakfast at the ryokan",
  activityType: "food",
  place: "Ryokan dining room",
  startTime: "08:00",
  endTime: "08:45",
});

const NO_PATH_STOP_B: StopItem = stop({
  id: "item-noplath-b",
  day: NO_PATH_DAY,
  activity: "Walk to the station",
  activityType: "travel",
  place: "",
  startTime: "09:00",
  endTime: "09:20",
});

describe("SmartItineraryTable path fork honest empty", () => {
  it("a day with zero path-tagged items renders no fork chrome at all (no .subplan, no fork parent); unpathed items keep rendering as plain stop-rows", () => {
    const model = buildItineraryTableModel({
      startDate: NO_PATH_DAY,
      endDate: NO_PATH_DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [NO_PATH_STOP_A, NO_PATH_STOP_B],
    });

    render(<SmartItineraryTable model={model} />);

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });

    // No collapsing into a fork parent — one plain stop-row per item.
    const stopRows = table.querySelectorAll("tr.stop-row");
    expect(stopRows.length).toBe(2);

    // No fork chrome anywhere in the table: no "Currently using:" text, no
    // .subplan/[data-subplan] host, no subplan-toggle chevron, no
    // data-subs-open marker on any row.
    expect(within(table).queryByText(/currently using:/i)).toBeNull();
    expect(table.querySelector(".subplan, [data-subplan]")).toBeNull();
    expect(
      table.querySelector(
        "button.activity-action.subplan-toggle[data-subplan-toggle], button[data-subplan-toggle]",
      ),
    ).toBeNull();
    stopRows.forEach((row) => {
      expect(row).not.toHaveAttribute("data-subs-open");
    });
  });
});

/**
 * M827T84Q T3 #1 — radio-only path activation via paired pathRole PATCH.
 *
 * Clicking a subplan option's radio (not the row) must issue exactly two
 * PATCHes: pathRole:"main" + expectedVersion on the picked (radio-clicked)
 * item, and pathRole:"alternative" + expectedVersion on the previously-main
 * sibling. A plain click on the option row body (not the radio) must never
 * send a path PATCH. RED: no radio exists yet inside `.subplan-row` for path
 * alternatives (SmartItineraryTable only renders `.sub-title` / `.path-chip`
 * / `.sub-place`, per T2), so `within(altRow).getByRole("radio")` fails.
 */
const RADIO_PICK_DAY = "2026-04-20";
const RADIO_PICK_GROUP_ID = "pgroup-radio-pick";
const RADIO_PICK_SESSION_TOKEN = "member-session-token-path-radio-pick";
const RADIO_PICK_MAIN_ID = "item-radio-pick-main";
const RADIO_PICK_ALT_ID = "item-radio-pick-alt";
const RADIO_PICK_MAIN_NAME = "Direct route";
const RADIO_PICK_ALT_NAME = "Scenic route";
const RADIO_PICK_MAIN_VERSION = 7;
const RADIO_PICK_ALT_VERSION = 2;

const RADIO_PICK_MAIN_ITEM: StopItem = stop({
  id: RADIO_PICK_MAIN_ID,
  day: RADIO_PICK_DAY,
  activity: "Fly direct",
  activityType: "travel",
  place: "",
  startTime: "09:00",
  endTime: "11:00",
  version: RADIO_PICK_MAIN_VERSION,
  pathGroupId: RADIO_PICK_GROUP_ID,
  pathId: "path-direct",
  pathName: RADIO_PICK_MAIN_NAME,
  pathRole: "main",
});

const RADIO_PICK_ALT_ITEM: StopItem = stop({
  id: RADIO_PICK_ALT_ID,
  day: RADIO_PICK_DAY,
  activity: "Take the scenic train",
  activityType: "travel",
  place: "",
  startTime: "08:30",
  endTime: "12:15",
  version: RADIO_PICK_ALT_VERSION,
  pathGroupId: RADIO_PICK_GROUP_ID,
  pathId: "path-scenic",
  pathName: RADIO_PICK_ALT_NAME,
  pathRole: "alternative",
});

function radioPickPatchResponder(
  input: RequestInfo | URL,
  init?: RequestInit,
): Response {
  const url = String(input);
  const method = String(init?.method ?? "GET").toUpperCase();
  const body = JSON.parse(String(init?.body ?? "{}")) as {
    expectedVersion?: number;
    patch?: Record<string, unknown>;
  };
  const base = url.includes(RADIO_PICK_MAIN_ID)
    ? RADIO_PICK_MAIN_ITEM
    : url.includes(RADIO_PICK_ALT_ID)
      ? RADIO_PICK_ALT_ITEM
      : null;
  if (method !== "PATCH" || !base) {
    return jsonResponse({ error: { message: "unexpected" } }, 404);
  }
  return jsonResponse({
    ...base,
    ...body.patch,
    version: (body.expectedVersion ?? base.version) + 1,
  });
}

describe("SmartItineraryTable radio-only path activation", () => {
  it("clicking a subplan option's radio (not the row) PATCHes pathRole:'main' + expectedVersion on the picked item and pathRole:'alternative' + expectedVersion on the previously-main sibling; a plain row click sends no path PATCH", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) =>
        radioPickPatchResponder(input, init),
    );

    const model = buildItineraryTableModel({
      startDate: RADIO_PICK_DAY,
      endDate: RADIO_PICK_DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [RADIO_PICK_MAIN_ITEM, RADIO_PICK_ALT_ITEM],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={RADIO_PICK_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });

    const currentlyUsing = within(table).getByText(
      new RegExp(`currently using:\\s*${RADIO_PICK_MAIN_NAME}`, "i"),
    );
    const forkRow = currentlyUsing.closest("tr.stop-row") as HTMLElement | null;
    expect(forkRow).toBeTruthy();

    const toggle = forkRow!.querySelector(
      "button.activity-action.subplan-toggle[data-subplan-toggle], button[data-subplan-toggle]",
    ) as HTMLElement | null;
    expect(toggle).toBeTruthy();
    await user.click(toggle!);

    const altRow = forkRow!.querySelector(
      `.subplan-row[data-id="${RADIO_PICK_ALT_ID}"]`,
    ) as HTMLElement | null;
    expect(altRow).toBeTruthy();

    // Designer-fix v6.1: the active/main option renders as a .subplan-row
    // sibling too — marked is-path-active, radio checked, "Using" chip.
    const mainRow = forkRow!.querySelector(
      `.subplan-row[data-id="${RADIO_PICK_MAIN_ID}"]`,
    ) as HTMLElement | null;
    expect(mainRow).toBeTruthy();
    expect(mainRow).toHaveClass("is-path-active");
    expect(within(mainRow!).getByRole("radio")).toBeChecked();
    expect(within(mainRow!).getByText(/using/i)).toBeInTheDocument();
    expect(within(altRow!).getByRole("radio")).not.toBeChecked();

    // Fork subplan offers an "Add option…" control (designer-fix v6.1) —
    // same add-alternative flow as the Path strip.
    expect(
      within(forkRow!).getByRole("button", { name: /add option/i }),
    ).toBeInTheDocument();

    // --- Plain row click (not the radio) must never send a path PATCH. ---
    fetchMock.mockClear();
    fireEvent.click(within(altRow!).getByText(RADIO_PICK_ALT_NAME));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(itineraryPatchCalls(fetchMock)).toHaveLength(0);

    // --- Radio click on the alternative activates it via paired PATCH. ---
    fetchMock.mockClear();
    const altRadio = within(altRow!).getByRole("radio");
    await user.click(altRadio);

    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(2);
    });
    const calls = itineraryPatchCalls(fetchMock);

    const pickedCall = calls.find((call) =>
      call.url.includes(RADIO_PICK_ALT_ID),
    );
    const demotedCall = calls.find((call) =>
      call.url.includes(RADIO_PICK_MAIN_ID),
    );
    expect(pickedCall).toBeTruthy();
    expect(demotedCall).toBeTruthy();

    expect(pickedCall!.body.expectedVersion).toBe(RADIO_PICK_ALT_VERSION);
    expect(pickedCall!.body.patch).toEqual(
      expect.objectContaining({ pathRole: "main" }),
    );

    expect(demotedCall!.body.expectedVersion).toBe(RADIO_PICK_MAIN_VERSION);
    expect(demotedCall!.body.patch).toEqual(
      expect.objectContaining({ pathRole: "alternative" }),
    );
  });

  /**
   * M827T84Q T3 #2 — version_conflict on either paired PATCH must route
   * through the existing commitPatch reload path (onCockpitReload), not
   * optimistically flip the active radio. Reuses the T3 #1 fixtures but the
   * mocked PATCH responder returns 409 version_conflict for both paired
   * requests (per itinerary_patch_contract, same shape as the T5 #2 conflict
   * suite above: { code, latest }).
   */
  it("version_conflict on a radio-pick PATCH calls onCockpitReload instead of optimistically flipping the active radio (no stale pathRole persisted)", async () => {
    const user = userEvent.setup();
    const onCockpitReload = vi.fn();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method !== "PATCH") {
        return jsonResponse({ error: { message: "unexpected" } }, 404);
      }
      const base = url.includes(RADIO_PICK_MAIN_ID)
        ? RADIO_PICK_MAIN_ITEM
        : url.includes(RADIO_PICK_ALT_ID)
          ? RADIO_PICK_ALT_ITEM
          : null;
      if (!base) {
        return jsonResponse({ error: { message: "unexpected" } }, 404);
      }
      return jsonResponse(
        {
          code: CONFLICT_CODE,
          latest: { ...base, version: base.version + 3 },
        },
        409,
      );
    });

    const model = buildItineraryTableModel({
      startDate: RADIO_PICK_DAY,
      endDate: RADIO_PICK_DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [RADIO_PICK_MAIN_ITEM, RADIO_PICK_ALT_ITEM],
    });

    render(
      <SmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={RADIO_PICK_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
        {...{ onCockpitReload }}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });

    const currentlyUsing = within(table).getByText(
      new RegExp(`currently using:\\s*${RADIO_PICK_MAIN_NAME}`, "i"),
    );
    const forkRow = currentlyUsing.closest("tr.stop-row") as HTMLElement | null;
    expect(forkRow).toBeTruthy();

    const toggle = forkRow!.querySelector(
      "button.activity-action.subplan-toggle[data-subplan-toggle], button[data-subplan-toggle]",
    ) as HTMLElement | null;
    expect(toggle).toBeTruthy();
    await user.click(toggle!);

    const altRow = forkRow!.querySelector(
      `.subplan-row[data-id="${RADIO_PICK_ALT_ID}"]`,
    ) as HTMLElement | null;
    expect(altRow).toBeTruthy();

    const altRadio = within(altRow!).getByRole("radio");
    await user.click(altRadio);

    // Both paired PATCHes come back version_conflict → reload, not a flip.
    // (Each conflicting commitPatch call independently triggers the shared
    // reload callback, so onCockpitReload firing at least once — not zero —
    // is what "routes through the existing reload path" means here.)
    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(2);
    });
    await waitFor(() => {
      expect(onCockpitReload).toHaveBeenCalled();
    });

    // No stale pathRole persisted: the fork parent must still report the
    // original main path as active — never optimistically flipped to the
    // alternative that just conflicted.
    expect(
      within(table).getByText(
        new RegExp(`currently using:\\s*${RADIO_PICK_MAIN_NAME}`, "i"),
      ),
    ).toBeInTheDocument();
    expect(
      within(table).queryByText(
        new RegExp(`currently using:\\s*${RADIO_PICK_ALT_NAME}`, "i"),
      ),
    ).not.toBeInTheDocument();
  });
});

/**
 * M827T84Q T4 #1 — Path strip: selecting any stop shows a collapsed
 * "Path · …" strip row with Edit path; expanding offers Assign to an
 * existing pathGroupId already present in the plan, or Add alternative…
 * which calls createItineraryItem with pathGroupId (reused if the selection
 * already carries one, else newly generated), pathId, pathName,
 * pathRole:"alternative".
 *
 * RED: SmartItineraryTable renders no `.path-strip` / "Edit path" chrome on
 * selection yet (only the T2 fork stop-row + T3 radio pick exist), and
 * CreateItineraryItemInput (itinerary-api.ts) has no path fields to thread
 * into the POST body — so both the missing UI and the missing create-body
 * plumbing fail this test today.
 */
const STRIP_SESSION_TOKEN = "member-session-token-path-strip";

/** Existing fork group — its pathGroupId must be offered by Assign + reused by Add alternative. */
const STRIP_FORK_DAY = "2026-04-22";
const STRIP_EXISTING_GROUP_ID = "pgroup-strip-existing";
const STRIP_FORK_MAIN_ID = "item-strip-fork-main";
const STRIP_FORK_ALT_ID = "item-strip-fork-alt";
const STRIP_FORK_MAIN_NAME = "Airport express";
const STRIP_FORK_ALT_NAME = "Local bus";
const STRIP_FORK_MAIN_VERSION = 4;

const STRIP_FORK_MAIN_ITEM: StopItem = stop({
  id: STRIP_FORK_MAIN_ID,
  day: STRIP_FORK_DAY,
  activity: "Ride to the airport",
  activityType: "travel",
  place: "",
  startTime: "06:00",
  endTime: "07:00",
  version: STRIP_FORK_MAIN_VERSION,
  pathGroupId: STRIP_EXISTING_GROUP_ID,
  pathId: "path-strip-express",
  pathName: STRIP_FORK_MAIN_NAME,
  pathRole: "main",
});

const STRIP_FORK_ALT_ITEM: StopItem = stop({
  id: STRIP_FORK_ALT_ID,
  day: STRIP_FORK_DAY,
  activity: "Take the local bus",
  activityType: "travel",
  place: "",
  startTime: "05:30",
  endTime: "07:15",
  pathGroupId: STRIP_EXISTING_GROUP_ID,
  pathId: "path-strip-bus",
  pathName: STRIP_FORK_ALT_NAME,
  pathRole: "alternative",
});

/** Plain stop, no pathGroupId — Add alternative must mint a fresh one. */
const STRIP_PLAIN_DAY = "2026-04-23";
const STRIP_PLAIN_ID = "item-strip-plain";
const STRIP_PLAIN_TITLE = "Free morning";

const STRIP_PLAIN_ITEM: StopItem = stop({
  id: STRIP_PLAIN_ID,
  day: STRIP_PLAIN_DAY,
  activity: STRIP_PLAIN_TITLE,
  activityType: "default",
  place: "",
  startTime: "09:00",
  endTime: "10:00",
});

/** Typed Add-alternative names — independent per case so create bodies are distinguishable. */
const STRIP_NEW_ALT_NAME_REUSE = "Night bus";
const STRIP_NEW_ALT_NAME_FRESH = "Bike rental";

/**
 * SmartItineraryTable's `selectedId` is parent-controlled (rail sync); this
 * harness supplies the minimal controlled state a real page would own so a
 * plain row click can drive selection during the test.
 */
function SelectableSmartItineraryTable(
  props: SmartItineraryTableProps & { initialSelectedId?: string | null },
) {
  const { initialSelectedId = null, ...rest } = props;
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId,
  );
  return (
    <SmartItineraryTable
      {...rest}
      selectedId={selectedId}
      onSelect={(payload) => setSelectedId(payload.id)}
    />
  );
}

describe("SmartItineraryTable path strip: assign / add alternative", () => {
  it("selecting a stop shows a collapsed 'Path · …' strip with Edit path; expanding offers Assign to an existing pathGroupId already in the plan, and Add alternative… calls createItineraryItem with pathGroupId reused from the selection (or newly generated when absent), pathId, pathName, pathRole:'alternative'", async () => {
    const user = userEvent.setup();
    let nextCreatedId = 0;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const method = String(init?.method ?? "GET").toUpperCase();
        if (method !== "POST") {
          return jsonResponse({ error: { message: "unexpected" } }, 404);
        }
        nextCreatedId += 1;
        const body = JSON.parse(
          String(init?.body ?? "{}"),
        ) as Record<string, unknown>;
        return jsonResponse({
          id: `item-strip-created-${nextCreatedId}`,
          tripId: TRIP_ID,
          planVariantId: PLAN_ID,
          day: body.day,
          activity: body.activity,
          activityType: body.activityType,
          place: body.place ?? "",
          startTime: body.startTime ?? "",
          status: "idea",
          version: 1,
          pathGroupId: body.pathGroupId,
          pathId: body.pathId,
          pathName: body.pathName,
          pathRole: body.pathRole,
        });
      },
    );

    const model = buildItineraryTableModel({
      startDate: STRIP_FORK_DAY,
      endDate: STRIP_PLAIN_DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [
        STRIP_FORK_MAIN_ITEM,
        STRIP_FORK_ALT_ITEM,
        STRIP_PLAIN_ITEM,
      ],
    });

    render(
      <SelectableSmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={STRIP_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });

    /** Select `row`, open the Path strip editor, and Add alternative… `altName`. */
    const addAlternativeOn = async (row: HTMLElement, altName: string) => {
      await user.click(row);

      const strip = within(table)
        .getByText(/^Path\s*·/)
        .closest("tr") as HTMLElement;
      expect(strip).toBeTruthy();

      const editBtn = within(strip).getByRole("button", {
        name: /edit path/i,
      });
      await user.click(editBtn);

      // Assign offers an existing pathGroupId already present in the plan.
      const assignSelect = within(strip).getByRole("combobox", {
        name: /assign/i,
      }) as HTMLSelectElement;
      const optionValues = Array.from(assignSelect.options).map(
        (o) => o.value,
      );
      expect(optionValues).toContain(STRIP_EXISTING_GROUP_ID);

      await user.click(
        within(strip).getByRole("button", { name: /add alternative/i }),
      );
      const nameField = within(strip).getByRole("textbox", {
        name: /name/i,
      });
      await user.type(nameField, altName);
      await user.click(within(strip).getByRole("button", { name: /save/i }));
    };

    // --- Case A: selection already carries a pathGroupId → reused, not fresh. ---
    const forkRow = within(table)
      .getByText(
        new RegExp(`currently using:\\s*${STRIP_FORK_MAIN_NAME}`, "i"),
      )
      .closest("tr.stop-row") as HTMLElement;
    await addAlternativeOn(forkRow, STRIP_NEW_ALT_NAME_REUSE);

    await waitFor(() => {
      expect(itineraryCreateCalls(fetchMock)).toHaveLength(1);
    });
    const reuseCall = itineraryCreateCalls(fetchMock)[0]!;
    expect(reuseCall.body).toEqual(
      expect.objectContaining({
        pathGroupId: STRIP_EXISTING_GROUP_ID,
        pathName: STRIP_NEW_ALT_NAME_REUSE,
        pathRole: "alternative",
      }),
    );
    expect(typeof reuseCall.body.pathId).toBe("string");
    expect(String(reuseCall.body.pathId).length).toBeGreaterThan(0);

    // --- Case B: selection has no pathGroupId → a fresh one is generated. ---
    const plainRow = table.querySelector(
      `tr.stop-row[data-id="${STRIP_PLAIN_ID}"]`,
    ) as HTMLElement;
    expect(plainRow).toBeTruthy();
    fetchMock.mockClear();
    await addAlternativeOn(plainRow, STRIP_NEW_ALT_NAME_FRESH);

    await waitFor(() => {
      expect(itineraryCreateCalls(fetchMock)).toHaveLength(1);
    });
    const freshCall = itineraryCreateCalls(fetchMock)[0]!;
    expect(freshCall.body).toEqual(
      expect.objectContaining({
        pathName: STRIP_NEW_ALT_NAME_FRESH,
        pathRole: "alternative",
      }),
    );
    expect(typeof freshCall.body.pathGroupId).toBe("string");
    expect(String(freshCall.body.pathGroupId).length).toBeGreaterThan(0);
    expect(freshCall.body.pathGroupId).not.toBe(STRIP_EXISTING_GROUP_ID);
    expect(typeof freshCall.body.pathId).toBe("string");
    expect(String(freshCall.body.pathId).length).toBeGreaterThan(0);
  });
});

/**
 * Combine-gate M827T84Q — Path strip: Assign to path is wired.
 * PathStripRow's "Assign to path" <select> previously listed pathGroupIds
 * but had no onChange, so picking an existing group never PATCHed. Selecting
 * an existing pathGroupId now PATCHes pathGroupId + expectedVersion (plus
 * pathRole:"alternative", a freshly generated pathId, and pathName carried
 * over from the group's main sibling). Selecting the empty "Shared spine (no
 * path)" option behaves exactly like Clear path (nulls all four fields), so
 * the dropdown stays consistent with the dedicated Clear button.
 */
const ASSIGN_WIRE_SESSION_TOKEN = "member-session-token-path-strip-assign";

// --- Case A fixtures: joining an existing group from a plain stop. ---
const ASSIGN_WIRE_DAY = "2026-04-26";
const ASSIGN_WIRE_GROUP_ID = "pgroup-strip-assign-wire";
const ASSIGN_WIRE_MAIN_ID = "item-strip-assign-main";
const ASSIGN_WIRE_MAIN_NAME = "Airport express";
const ASSIGN_WIRE_MAIN_VERSION = 2;

const ASSIGN_WIRE_MAIN_ITEM: StopItem = stop({
  id: ASSIGN_WIRE_MAIN_ID,
  day: ASSIGN_WIRE_DAY,
  activity: "Ride to the airport",
  activityType: "travel",
  place: "",
  startTime: "06:00",
  endTime: "07:00",
  version: ASSIGN_WIRE_MAIN_VERSION,
  pathGroupId: ASSIGN_WIRE_GROUP_ID,
  pathId: "path-strip-assign-express",
  pathName: ASSIGN_WIRE_MAIN_NAME,
  pathRole: "main",
});

const ASSIGN_WIRE_PLAIN_ID = "item-strip-assign-plain";
const ASSIGN_WIRE_PLAIN_VERSION = 5;

const ASSIGN_WIRE_PLAIN_ITEM: StopItem = stop({
  id: ASSIGN_WIRE_PLAIN_ID,
  day: ASSIGN_WIRE_DAY,
  activity: "Free morning",
  activityType: "default",
  place: "",
  startTime: "09:00",
  endTime: "10:00",
  version: ASSIGN_WIRE_PLAIN_VERSION,
});

// --- Case B fixtures: the empty "Shared spine (no path)" option clears. ---
const ASSIGN_WIRE_UNASSIGN_DAY = "2026-04-27";
const ASSIGN_WIRE_UNASSIGN_GROUP_ID = "pgroup-strip-assign-wire-unassign";
const ASSIGN_WIRE_UNASSIGN_ID = "item-strip-assign-unassign";
const ASSIGN_WIRE_UNASSIGN_NAME = "Direct ferry";
const ASSIGN_WIRE_UNASSIGN_VERSION = 6;

const ASSIGN_WIRE_UNASSIGN_ITEM: StopItem = stop({
  id: ASSIGN_WIRE_UNASSIGN_ID,
  day: ASSIGN_WIRE_UNASSIGN_DAY,
  activity: "Take the ferry",
  activityType: "travel",
  place: "",
  startTime: "08:00",
  endTime: "09:00",
  version: ASSIGN_WIRE_UNASSIGN_VERSION,
  pathGroupId: ASSIGN_WIRE_UNASSIGN_GROUP_ID,
  pathId: "path-strip-assign-ferry",
  pathName: ASSIGN_WIRE_UNASSIGN_NAME,
  pathRole: "main",
});

/** PATCH mock that merges `patch` onto `base` and bumps version — matches the Clear path test's fixture pattern. */
function assignWirePatchMock(base: StopItem) {
  return vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const method = String(init?.method ?? "GET").toUpperCase();
    if (method !== "PATCH") {
      return jsonResponse({ error: { message: "unexpected" } }, 404);
    }
    const body = JSON.parse(String(init?.body ?? "{}")) as {
      expectedVersion?: number;
      patch?: Record<string, unknown>;
    };
    return jsonResponse({
      ...base,
      ...body.patch,
      version: (body.expectedVersion ?? base.version) + 1,
    });
  });
}

describe("SmartItineraryTable path strip: assign to path wiring", () => {
  it("selecting an existing pathGroupId from Assign PATCHes pathGroupId + expectedVersion (with pathRole:'alternative', a generated pathId, and the group's pathName)", async () => {
    const user = userEvent.setup();
    const fetchMock = assignWirePatchMock(ASSIGN_WIRE_PLAIN_ITEM);

    const model = buildItineraryTableModel({
      startDate: ASSIGN_WIRE_DAY,
      endDate: ASSIGN_WIRE_DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [ASSIGN_WIRE_MAIN_ITEM, ASSIGN_WIRE_PLAIN_ITEM],
    });

    render(
      <SelectableSmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={ASSIGN_WIRE_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const plainRow = table.querySelector(
      `tr.stop-row[data-id="${ASSIGN_WIRE_PLAIN_ID}"]`,
    ) as HTMLElement;
    expect(plainRow).toBeTruthy();

    const strip = await openPathStripEditor(user, table, plainRow);
    const assignSelect = within(strip).getByRole("combobox", {
      name: /assign/i,
    }) as HTMLSelectElement;
    expect(
      Array.from(assignSelect.options).map((o) => o.value),
    ).toContain(ASSIGN_WIRE_GROUP_ID);

    await user.selectOptions(assignSelect, ASSIGN_WIRE_GROUP_ID);

    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const assignCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(assignCall.url).toContain(ASSIGN_WIRE_PLAIN_ID);
    expect(assignCall.body.expectedVersion).toBe(ASSIGN_WIRE_PLAIN_VERSION);
    expect(assignCall.body.patch).toEqual(
      expect.objectContaining({
        pathGroupId: ASSIGN_WIRE_GROUP_ID,
        pathRole: "alternative",
        pathName: ASSIGN_WIRE_MAIN_NAME,
      }),
    );
    const assignPatch = assignCall.body.patch as Record<string, unknown>;
    expect(typeof assignPatch.pathId).toBe("string");
    expect(String(assignPatch.pathId).length).toBeGreaterThan(0);
  });

  it("selecting the empty 'Shared spine (no path)' option clears the path exactly like Clear path", async () => {
    const user = userEvent.setup();
    const fetchMock = assignWirePatchMock(ASSIGN_WIRE_UNASSIGN_ITEM);

    const model = buildItineraryTableModel({
      startDate: ASSIGN_WIRE_UNASSIGN_DAY,
      endDate: ASSIGN_WIRE_UNASSIGN_DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [ASSIGN_WIRE_UNASSIGN_ITEM],
    });

    render(
      <SelectableSmartItineraryTable
        model={model}
        tripId={TRIP_ID}
        sessionToken={ASSIGN_WIRE_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={fetchMock}
      />,
    );

    const table = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const row = table.querySelector(
      `tr.stop-row[data-id="${ASSIGN_WIRE_UNASSIGN_ID}"]`,
    ) as HTMLElement;
    expect(row).toBeTruthy();

    const strip = await openPathStripEditor(user, table, row);
    const assignSelect = within(strip).getByRole("combobox", {
      name: /assign/i,
    }) as HTMLSelectElement;
    expect(assignSelect.value).toBe(ASSIGN_WIRE_UNASSIGN_GROUP_ID);

    await user.selectOptions(assignSelect, "");

    await waitFor(() => {
      expect(itineraryPatchCalls(fetchMock)).toHaveLength(1);
    });
    const clearCall = itineraryPatchCalls(fetchMock)[0]!;
    expect(clearCall.url).toContain(ASSIGN_WIRE_UNASSIGN_ID);
    expect(clearCall.body.expectedVersion).toBe(ASSIGN_WIRE_UNASSIGN_VERSION);
    expect(clearCall.body.patch).toEqual({
      pathGroupId: null,
      pathId: null,
      pathName: null,
      pathRole: null,
    });
  });
});

/**
 * M827T84Q T4 #2 — Clear path sends a PATCH nulling
 * pathGroupId/pathId/pathName/pathRole with expectedVersion, and a
 * version_conflict response on that PATCH reuses the existing reload
 * pattern (onCockpitReload) instead of persisting a stale/nulled path
 * locally.
 *
 * RED: the Path strip editor (T4 #1) only renders "Assign to path" +
 * "Add alternative…" — there is no Clear-path control yet, so
 * `within(strip).getByRole("button", { name: /clear path/i })` fails.
 * Do NOT implement Clear path in this change; this test must fail on the
 * missing control.
 */
const CLEAR_PATH_SESSION_TOKEN = "member-session-token-path-clear";

const CLEAR_PATH_DAY = "2026-04-24";
const CLEAR_PATH_GROUP_ID = "pgroup-clear-path";
const CLEAR_PATH_ITEM_ID = "item-clear-path-main";
const CLEAR_PATH_NAME = "Direct ferry";
const CLEAR_PATH_VERSION = 6;

const CLEAR_PATH_ITEM: StopItem = stop({
  id: CLEAR_PATH_ITEM_ID,
  day: CLEAR_PATH_DAY,
  activity: "Take the ferry",
  activityType: "travel",
  place: "",
  startTime: "08:00",
  endTime: "09:00",
  version: CLEAR_PATH_VERSION,
  pathGroupId: CLEAR_PATH_GROUP_ID,
  pathId: "path-clear-ferry",
  pathName: CLEAR_PATH_NAME,
  pathRole: "main",
});

const CLEAR_PATH_CONFLICT_DAY = "2026-04-25";
const CLEAR_PATH_CONFLICT_GROUP_ID = "pgroup-clear-path-conflict";
const CLEAR_PATH_CONFLICT_ITEM_ID = "item-clear-path-conflict";
const CLEAR_PATH_CONFLICT_NAME = "Night train";
const CLEAR_PATH_CONFLICT_VERSION = 3;

const CLEAR_PATH_CONFLICT_ITEM: StopItem = stop({
  id: CLEAR_PATH_CONFLICT_ITEM_ID,
  day: CLEAR_PATH_CONFLICT_DAY,
  activity: "Board the night train",
  activityType: "travel",
  place: "",
  startTime: "22:00",
  endTime: "06:00",
  version: CLEAR_PATH_CONFLICT_VERSION,
  pathGroupId: CLEAR_PATH_CONFLICT_GROUP_ID,
  pathId: "path-clear-train",
  pathName: CLEAR_PATH_CONFLICT_NAME,
  pathRole: "main",
});

/** Select `row`, open the Path strip editor, and return it. */
async function openPathStripEditor(
  user: ReturnType<typeof userEvent.setup>,
  table: HTMLElement,
  row: HTMLElement,
): Promise<HTMLElement> {
  await user.click(row);
  const strip = within(table)
    .getByText(/^Path\s*·/)
    .closest("tr") as HTMLElement;
  expect(strip).toBeTruthy();
  const editBtn = within(strip).getByRole("button", { name: /edit path/i });
  await user.click(editBtn);
  return strip;
}

describe("SmartItineraryTable path strip: clear path", () => {
  it("Clear path PATCHes pathGroupId/pathId/pathName/pathRole to null with expectedVersion, and version_conflict on that PATCH calls onCockpitReload instead of optimistically nulling the path locally", async () => {
    const user = userEvent.setup();

    // --- Case A: successful Clear path PATCHes all four fields to null. ---
    const successFetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const method = String(init?.method ?? "GET").toUpperCase();
        if (method !== "PATCH") {
          return jsonResponse({ error: { message: "unexpected" } }, 404);
        }
        const body = JSON.parse(String(init?.body ?? "{}")) as {
          expectedVersion?: number;
          patch?: Record<string, unknown>;
        };
        return jsonResponse({
          ...CLEAR_PATH_ITEM,
          ...body.patch,
          version: (body.expectedVersion ?? CLEAR_PATH_VERSION) + 1,
        });
      },
    );

    const successModel = buildItineraryTableModel({
      startDate: CLEAR_PATH_DAY,
      endDate: CLEAR_PATH_DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [CLEAR_PATH_ITEM],
    });

    const { unmount } = render(
      <SelectableSmartItineraryTable
        model={successModel}
        tripId={TRIP_ID}
        sessionToken={CLEAR_PATH_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={successFetchMock}
      />,
    );

    const successTable = screen.getByRole("table", { name: TABLE_ARIA_LABEL });
    const successRow = successTable.querySelector(
      `tr.stop-row[data-id="${CLEAR_PATH_ITEM_ID}"]`,
    ) as HTMLElement;
    expect(successRow).toBeTruthy();

    const successStrip = await openPathStripEditor(
      user,
      successTable,
      successRow,
    );

    // RED: no Clear-path control exists yet inside the strip editor.
    const clearBtn = within(successStrip).getByRole("button", {
      name: /clear path/i,
    });
    await user.click(clearBtn);

    await waitFor(() => {
      expect(itineraryPatchCalls(successFetchMock)).toHaveLength(1);
    });
    const clearCall = itineraryPatchCalls(successFetchMock)[0]!;
    expect(clearCall.url).toContain(CLEAR_PATH_ITEM_ID);
    expect(clearCall.body.expectedVersion).toBe(CLEAR_PATH_VERSION);
    expect(clearCall.body.patch).toEqual({
      pathGroupId: null,
      pathId: null,
      pathName: null,
      pathRole: null,
    });

    unmount();

    // --- Case B: version_conflict routes through onCockpitReload, same
    // pattern as T3 #2 / T5 #2, instead of optimistically nulling the path
    // locally. ---
    const onCockpitReload = vi.fn();
    const conflictFetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const method = String(init?.method ?? "GET").toUpperCase();
        if (method !== "PATCH") {
          return jsonResponse({ error: { message: "unexpected" } }, 404);
        }
        return jsonResponse(
          {
            code: CONFLICT_CODE,
            latest: {
              ...CLEAR_PATH_CONFLICT_ITEM,
              version: CLEAR_PATH_CONFLICT_VERSION + 3,
            },
          },
          409,
        );
      },
    );

    const conflictModel = buildItineraryTableModel({
      startDate: CLEAR_PATH_CONFLICT_DAY,
      endDate: CLEAR_PATH_CONFLICT_DAY,
      planVariantId: PLAN_ID,
      itineraryItems: [CLEAR_PATH_CONFLICT_ITEM],
    });

    render(
      <SelectableSmartItineraryTable
        model={conflictModel}
        tripId={TRIP_ID}
        sessionToken={CLEAR_PATH_SESSION_TOKEN}
        apiBaseUrl={API_BASE}
        fetch={conflictFetchMock}
        {...{ onCockpitReload }}
      />,
    );

    const conflictTable = screen.getByRole("table", {
      name: TABLE_ARIA_LABEL,
    });
    const conflictRow = conflictTable.querySelector(
      `tr.stop-row[data-id="${CLEAR_PATH_CONFLICT_ITEM_ID}"]`,
    ) as HTMLElement;
    expect(conflictRow).toBeTruthy();

    const conflictStrip = await openPathStripEditor(
      user,
      conflictTable,
      conflictRow,
    );

    // RED: no Clear-path control exists yet inside the strip editor.
    const conflictClearBtn = within(conflictStrip).getByRole("button", {
      name: /clear path/i,
    });
    await user.click(conflictClearBtn);

    await waitFor(() => {
      expect(itineraryPatchCalls(conflictFetchMock)).toHaveLength(1);
    });
    await waitFor(() => {
      expect(onCockpitReload).toHaveBeenCalled();
    });

    // No stale/nulled path persisted locally: the collapsed strip summary
    // must still report the original path name, never the "Shared spine"
    // fallback that a locally-applied null would produce.
    expect(
      within(conflictTable).getByText(
        new RegExp(`^Path\\s*·\\s*${CLEAR_PATH_CONFLICT_NAME}$`, "i"),
      ),
    ).toBeInTheDocument();
    expect(
      within(conflictTable).queryByText(/^Path\s*·\s*Shared spine$/i),
    ).not.toBeInTheDocument();
  });
});
