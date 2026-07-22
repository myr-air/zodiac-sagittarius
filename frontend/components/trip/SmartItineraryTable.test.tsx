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
 * T7 #2: static/demo weather chrome on day headers; no live weather network calls.
 * M80P3JXX T4 #1: day-chip (.day-id) collapse/expand + activity-count chip persists by tripId.
 * M80P3JXX T5 #3: order PATCH failure → calm alert; no silent local-only reorder.
 * M80P3JXX T6 #2: parent chevron expands/collapses nested .subplan rows (Stay / attraction draft).
 * M80P3JXX T7 #2: Food Meal + Travel By .choice-chip on .title-with-meta (far right) → PATCH expectedVersion.
 * M80P3JXX T7 #3: Note / link / time-setup dialogs from stop actions + Set time; Save/Cancel → existing PATCH only.
 * M81DDKSC T1 #3: openStopDialog(note|link) seeds dlg fields from loaded stop note/mapLink.
 * M81DDKSC T2 #2: add child under parent stop; successful create nests via returned parentItemId.
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
import {
  MEMBER_SESSION_STORAGE_KEY,
  type StorageLike,
} from "../../src/landing/create-trip";
import {
  loadTripCockpit,
  type TripCockpitItineraryItem,
} from "../../src/trip/trip-cockpit-load";
import { buildItineraryTableModel } from "../../src/trip/itinerary-table-model";
import { SmartItineraryTable } from "./SmartItineraryTable";

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
