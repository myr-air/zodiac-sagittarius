/**
 * @vitest-environment happy-dom
 *
 * DayWorkspacePage — Theme A day workspace (M80VKAX5 T1 shell + T2 day tabs).
 * Landmarks from day-workspace-theme-a-draft-v9.html: crumb + Table|Days + day-tabs.
 * M80VKAX5 T6: left Day map pane (MapLibre) beside the day timeline.
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

/** Avoid real WebGL when DayMap mounts MapLibre in the left pane (T6). */
vi.mock("maplibre-gl", () => {
  const Map = vi.fn(function MockMap(this: {
    addSource: ReturnType<typeof vi.fn>;
    addLayer: ReturnType<typeof vi.fn>;
    addControl: ReturnType<typeof vi.fn>;
    on: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  }) {
    Object.assign(this, {
      addSource: vi.fn(),
      addLayer: vi.fn(),
      addControl: vi.fn(),
      on: vi.fn(),
      remove: vi.fn(),
      fitBounds: vi.fn(),
      getSource: vi.fn(),
    });
    return this;
  });
  const Marker = vi.fn(function MockMarker(this: {
    setLngLat: ReturnType<typeof vi.fn>;
    addTo: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  }) {
    Object.assign(this, {
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    });
    return this;
  });
  return {
    Map,
    Marker,
    NavigationControl: vi.fn(),
    default: { Map, Marker, NavigationControl: vi.fn() },
  };
});

import { DayWorkspacePage } from "./DayWorkspacePage";

/** Independent literals — trip id + cross-link hrefs for /trips/{id}/days. */
const TRIP_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const TABLE_HREF = `/trips/${TRIP_ID}`;
const DAYS_HREF = `/trips/${TRIP_ID}/days`;
/** Old placeholder / stub copy must not remain the surface. */
const PLACEHOLDER_COPY = /placeholder|coming soon|not implemented/i;

/**
 * Public member-session storage key (create-trip / loadTripCockpit contract).
 * Inlined so this file stays runnable under vitest without @/ path alias.
 */
const MEMBER_SESSION_STORAGE_KEY = "joii.member.session";
const PLAN_ID = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
const OWNER_MEMBER_ID = "11111111-2222-4333-8444-555555555555";
const SESSION_TOKEN = "member-session-token-day-workspace";
const TRIP_VERSION = 3;

/** Inclusive Plan Day spine — independent of production date helpers. */
const START_DATE = "2026-04-12";
const END_DATE = "2026-04-14";
/** Next calendar day past endDate — + day PATCH target. */
const APPENDED_END_DATE = "2026-04-15";
const DAY1_STOP = "Airport transfer";
const DAY2_STOP = "Wat Phra That Doi Suthep";
const DAY3_STOP = "Night market";
const TABLIST_LABEL = /Plan days/i;
const ADD_DAY_LABEL = /Add day/i;
const DAY_CANVAS_LABEL = /Day canvas/i;
/** Draft left pane — day-workspace-theme-a-draft-v9.html Day map section. */
const DAY_MAP_LABEL = /Day map/i;

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Minimal TripCockpit body with a 3-day spine and one stop per day. */
const TRIP_COCKPIT_BODY = {
  trip: {
    id: TRIP_ID,
    name: "Chiang Mai Escape",
    destinationLabel: "Chiang Mai",
    startDate: START_DATE,
    endDate: END_DATE,
    mainTripPlanId: PLAN_ID,
    activePlanVariantId: PLAN_ID,
    ownerMemberId: OWNER_MEMBER_ID,
    version: TRIP_VERSION,
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
      id: "item-day1",
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: START_DATE,
      activity: DAY1_STOP,
      activityType: "travel",
      place: "CNX",
      startTime: "09:00",
      status: "idea",
      version: 1,
    },
    {
      id: "item-day2",
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: "2026-04-13",
      activity: DAY2_STOP,
      activityType: "attraction",
      place: "Doi Suthep",
      startTime: "10:00",
      status: "idea",
      version: 1,
    },
    {
      id: "item-day3",
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: END_DATE,
      activity: DAY3_STOP,
      activityType: "experience",
      place: "Chiang Mai Gate",
      startTime: "19:00",
      status: "idea",
      version: 1,
    },
  ],
};

/** TripSummary-shaped PATCH response after extending endDate. */
const PATCHED_TRIP_SUMMARY = {
  ...TRIP_COCKPIT_BODY.trip,
  endDate: APPENDED_END_DATE,
  version: TRIP_VERSION + 1,
};

function tripPatchCalls(
  fetchMock: ReturnType<typeof vi.fn>,
): Array<{ url: string; body: Record<string, unknown> }> {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method !== "PATCH") return null;
      if (!url.includes(`/api/v1/trips/${TRIP_ID}`)) return null;
      // Itinerary item / order patches are out of scope for + day.
      if (url.includes("/itinerary-items")) return null;
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(String(init?.body ?? "{}")) as Record<
          string,
          unknown
        >;
      } catch {
        body = {};
      }
      return { url, body };
    })
    .filter(
      (call): call is { url: string; body: Record<string, unknown> } =>
        call !== null,
    );
}

afterEach(() => {
  cleanup();
});

describe("DayWorkspacePage Calm Travel Ops shell", () => {
  it("renders Day workspace crumb + Table|Days view switch (not a placeholder)", () => {
    render(<DayWorkspacePage tripId={TRIP_ID} />);

    expect(screen.queryByText(PLACEHOLDER_COPY)).not.toBeInTheDocument();

    // Draft crumb: <div class="crumb"><h1>Day workspace</h1>
    const heading = screen.getByRole("heading", { name: /^Day workspace$/i });
    expect(heading).toBeInTheDocument();
    expect(heading.closest(".crumb")).toBeTruthy();

    // Draft: <nav class="view-switch" aria-label="Itinerary view">
    const viewSwitch = screen.getByRole("navigation", {
      name: /Itinerary view/i,
    });
    const tableLink = within(viewSwitch).getByRole("link", {
      name: /^Table$/i,
    });
    const daysLink = within(viewSwitch).getByRole("link", {
      name: /^Days$/i,
    });

    // Days surface: Table → trip route; Days → /days (active).
    expect(tableLink).toHaveAttribute("href", TABLE_HREF);
    expect(daysLink).toHaveAttribute("href", DAYS_HREF);
    expect(daysLink).toHaveAttribute("aria-current", "page");
  });

  it("chrome shows Joii brand only — no Sagittarius", () => {
    render(<DayWorkspacePage tripId={TRIP_ID} />);

    const chrome = document.body.textContent ?? "";
    expect(chrome).not.toMatch(/Sagittarius/i);
  });
});

describe("DayWorkspacePage route mount", () => {
  it("app/trips/[id]/days/page.tsx mounts DayWorkspacePage instead of a placeholder", async () => {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const src = await readFile(
      join(process.cwd(), "app/trips/[id]/days/page.tsx"),
      "utf8",
    );
    expect(src).toMatch(/DayWorkspacePage/);
    expect(src).not.toMatch(PLACEHOLDER_COPY);
  });
});

/**
 * T2 #1: folder tabs from trip calendar spine; selecting a tab scopes the
 * day canvas to that Plan Day's stops only.
 */
describe("DayWorkspacePage Plan Day folder tabs", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.sessionStorage.setItem(
      MEMBER_SESSION_STORAGE_KEY,
      JSON.stringify({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      }),
    );

    globalThis.fetch = vi.fn(async () =>
      jsonResponse(TRIP_COCKPIT_BODY),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("shows one folder tab per Plan Day from startDate–endDate and selecting a tab scopes the canvas to that day's stops", async () => {
    const user = userEvent.setup();
    render(<DayWorkspacePage tripId={TRIP_ID} />);

    const tablist = await waitFor(() =>
      screen.getByRole("tablist", { name: TABLIST_LABEL }),
    );
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs).toHaveLength(3);

    expect(
      within(tablist).getByRole("tab", { name: /^Day 1\b/i }),
    ).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: /^Day 2\b/i }),
    ).toBeInTheDocument();
    expect(
      within(tablist).getByRole("tab", { name: /^Day 3\b/i }),
    ).toBeInTheDocument();

    const day2Tab = within(tablist).getByRole("tab", { name: /^Day 2\b/i });
    await user.click(day2Tab);

    const canvas = await waitFor(() => {
      const region = screen.getByRole("region", { name: DAY_CANVAS_LABEL });
      expect(within(region).getByText(DAY2_STOP)).toBeInTheDocument();
      return region;
    });

    expect(within(canvas).queryByText(DAY1_STOP)).not.toBeInTheDocument();
    expect(within(canvas).queryByText(DAY3_STOP)).not.toBeInTheDocument();
    expect(day2Tab).toHaveAttribute("aria-selected", "true");
  });
});

/**
 * T2 #2: + day appends the next calendar Plan Day past the spine endDate via
 * PATCH /api/v1/trips/{id} and activates the new tab.
 */
describe("DayWorkspacePage + day append", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.sessionStorage.setItem(
      MEMBER_SESSION_STORAGE_KEY,
      JSON.stringify({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      }),
    );

    globalThis.fetch = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (
        method === "PATCH" &&
        url.includes(`/api/v1/trips/${TRIP_ID}`) &&
        !url.includes("/itinerary-items")
      ) {
        return jsonResponse(PATCHED_TRIP_SUMMARY);
      }
      return jsonResponse(TRIP_COCKPIT_BODY);
    }) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("+ day extends trip endDate via PATCH /api/v1/trips/{id} past the spine and activates the new Plan Day tab", async () => {
    const user = userEvent.setup();
    render(<DayWorkspacePage tripId={TRIP_ID} />);

    const tablist = await waitFor(() =>
      screen.getByRole("tablist", { name: TABLIST_LABEL }),
    );
    expect(within(tablist).getAllByRole("tab")).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: ADD_DAY_LABEL }));

    await waitFor(() => {
      const patches = tripPatchCalls(globalThis.fetch as ReturnType<typeof vi.fn>);
      expect(patches.length).toBeGreaterThanOrEqual(1);
      const last = patches[patches.length - 1]!;
      expect(last.url).toMatch(
        new RegExp(`/api/v1/trips/${TRIP_ID}/?$`),
      );
      expect(last.body.endDate).toBe(APPENDED_END_DATE);
      expect(last.body.expectedVersion).toBe(TRIP_VERSION);
      expect(typeof last.body.clientMutationId).toBe("string");
      expect(String(last.body.clientMutationId).length).toBeGreaterThan(0);
    });

    const updatedTablist = await waitFor(() => {
      const list = screen.getByRole("tablist", { name: TABLIST_LABEL });
      expect(within(list).getAllByRole("tab")).toHaveLength(4);
      return list;
    });

    const day4Tab = within(updatedTablist).getByRole("tab", {
      name: /^Day 4\b/i,
    });
    expect(day4Tab).toHaveAttribute("aria-selected", "true");
  });
});

/**
 * T6 #1: day workspace left pane is the Day map (MapLibre DayMap), not
 * timeline-only canvas chrome.
 */
describe("DayWorkspacePage left Day map pane", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.sessionStorage.setItem(
      MEMBER_SESSION_STORAGE_KEY,
      JSON.stringify({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      }),
    );

    globalThis.fetch = vi.fn(async () =>
      jsonResponse(TRIP_COCKPIT_BODY),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("renders a Day map region as the left day-canvas pane once the Plan Day spine loads", async () => {
    render(<DayWorkspacePage tripId={TRIP_ID} />);

    const mapRegion = await waitFor(() =>
      screen.getByRole("region", { name: DAY_MAP_LABEL }),
    );
    expect(mapRegion).toBeInTheDocument();

    const workspace = mapRegion.closest(".workspace");
    expect(workspace).toBeTruthy();
    // Left pane: Day map is the first panel child of the workspace row.
    const panels = workspace!.querySelectorAll(":scope > .panel, :scope > section");
    expect(panels.length).toBeGreaterThanOrEqual(1);
    expect(panels[0]).toBe(mapRegion);
  });
});

/** Draft topbar: AI suggest + Auto route & fill (day-workspace-theme-a-draft-v9). */
const AI_SUGGEST_LABEL = /AI suggest/i;
const AUTO_ROUTE_FILL_LABEL = /Auto route\s*&\s*fill/i;
/** Assist batch literals — independent of production helpers. */
const ASSIST_BATCH_ID = "018f4e90-0000-7000-8000-0000000000aa";
const ASSIST_OPTION_A_ID = "018f4e90-0000-7000-8000-0000000000a1";
const ASSIST_OPTION_B_ID = "018f4e90-0000-7000-8000-0000000000a2";
const ASSIST_OPTION_TITLE_A = "Calm morning buffer";
const ASSIST_OPTION_SUMMARY_A = "Shift transfer later · keep temple window";
const ASSIST_OPTION_TITLE_B = "Compact walk loop";
const ASSIST_OPTION_SUMMARY_B = "Reorder nearby Old City stops";
const ASSIST_CHIP_A = /Plan A · Calm morning buffer/i;
const ASSIST_CHIP_B = /Plan B · Compact walk loop/i;
/** Day 2 active when user selects that tab before Suggest. */
const DAY2_DATE = "2026-04-13";
/** Geo for ≥2 pins on Day 1 (Auto route & fill happy path). */
const PIN_A_LAT = 18.788;
const PIN_A_LNG = 98.987;
const PIN_B_LAT = 18.801;
const PIN_B_LNG = 98.969;
const DAY1_STOP_B_ID = "item-day1-b";
const DAY1_STOP_B = "Old City walk";
/** Purple AI chrome must not appear (Theme A — teal Calm Travel Ops). */
const PURPLE_CLASS = /purple|violet|indigo|fuchsia/i;
const PURPLE_HEX = /#(?:7c3aed|8b5cf6|a855f7|9333ea|6d28d9)\b/i;
/** DESIGN.md primary teal tokens — draft .btn-ai chrome. */
const TEAL_TOKEN = /--color-primary|--color-primary-soft|--color-primary-strong|#0f766e|#115e59|#ecfeff|#99f6e4/i;

function assistOptionsBody(
  mode: "suggest" | "autoRoute",
  day: string,
  affectsItemId: string,
) {
  return {
    batchId: ASSIST_BATCH_ID,
    tripId: TRIP_ID,
    day,
    planVariantId: PLAN_ID,
    mode,
    options: [
      {
        id: ASSIST_OPTION_A_ID,
        label: "A",
        title: ASSIST_OPTION_TITLE_A,
        summary: ASSIST_OPTION_SUMMARY_A,
        why: "Temple opens early; buffer matches Saturday traffic.",
        affectsItemIds: [affectsItemId],
        proposedMutations: [{ op: "patch", itemId: affectsItemId }],
      },
      {
        id: ASSIST_OPTION_B_ID,
        label: "B",
        title: ASSIST_OPTION_TITLE_B,
        summary: ASSIST_OPTION_SUMMARY_B,
        why: "Shortens walking legs between stops.",
        affectsItemIds: [affectsItemId],
        proposedMutations: [{ op: "reorder", itemIds: [affectsItemId] }],
      },
    ],
  };
}

function dayPlanAssistCalls(
  fetchMock: ReturnType<typeof vi.fn>,
): Array<{ url: string; body: Record<string, unknown> }> {
  return fetchMock.mock.calls
    .map(([input, init]) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (method !== "POST") return null;
      if (!url.includes(`/api/v1/trips/${TRIP_ID}/day-plan-assist`)) return null;
      // Accept/Reject are under …/batches/… — out of scope for Suggest wiring.
      if (url.includes("/batches/")) return null;
      let body: Record<string, unknown> = {};
      try {
        body = JSON.parse(String(init?.body ?? "{}")) as Record<
          string,
          unknown
        >;
      } catch {
        body = {};
      }
      return { url, body };
    })
    .filter(
      (call): call is { url: string; body: Record<string, unknown> } =>
        call !== null,
    );
}

/** Cockpit with two geo-pinned Day 1 stops (≥2 pins for Auto route & fill). */
const TRIP_COCKPIT_TWO_PINS = {
  ...TRIP_COCKPIT_BODY,
  itineraryItems: [
    {
      ...TRIP_COCKPIT_BODY.itineraryItems[0],
      coordinates: { lat: PIN_A_LAT, lng: PIN_A_LNG },
    },
    {
      id: DAY1_STOP_B_ID,
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: START_DATE,
      activity: DAY1_STOP_B,
      activityType: "attraction",
      place: "Old City",
      startTime: "11:00",
      status: "idea",
      version: 1,
      coordinates: { lat: PIN_B_LAT, lng: PIN_B_LNG },
    },
    TRIP_COCKPIT_BODY.itineraryItems[1],
    TRIP_COCKPIT_BODY.itineraryItems[2],
  ],
};

/**
 * T11 #1: topbar AI Suggest + Auto route & fill invoke day-plan-assist for the
 * active day and inject returned options as inline chips.
 */
describe("DayWorkspacePage topbar AI Suggest / Auto route & fill (T11 #1)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.sessionStorage.setItem(
      MEMBER_SESSION_STORAGE_KEY,
      JSON.stringify({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      }),
    );

    globalThis.fetch = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (
        method === "POST" &&
        url.includes(`/api/v1/trips/${TRIP_ID}/day-plan-assist`) &&
        !url.includes("/batches/")
      ) {
        let body: Record<string, unknown> = {};
        try {
          body = JSON.parse(String(init?.body ?? "{}")) as Record<
            string,
            unknown
          >;
        } catch {
          body = {};
        }
        const mode =
          body.mode === "autoRoute" ? "autoRoute" : ("suggest" as const);
        const day = typeof body.day === "string" ? body.day : START_DATE;
        const affects =
          day === DAY2_DATE
            ? "item-day2"
            : day === START_DATE
              ? "item-day1"
              : "item-day1";
        return jsonResponse(assistOptionsBody(mode, day, affects));
      }
      return jsonResponse(TRIP_COCKPIT_TWO_PINS);
    }) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("AI suggest and Auto route & fill POST day-plan-assist for the active day and inject returned options as inline chips", async () => {
    const user = userEvent.setup();
    render(<DayWorkspacePage tripId={TRIP_ID} />);

    const topbar =
      document.querySelector("header.topbar") ??
      (await waitFor(() => screen.getByRole("banner")));
    const topbarEl = topbar as HTMLElement;

    // Draft landmarks in topbar.ai-actions (not map-panel Auto route).
    const aiSuggest = await waitFor(() =>
      within(topbarEl).getByRole("button", { name: AI_SUGGEST_LABEL }),
    );
    const autoRouteFill = within(topbarEl).getByRole("button", {
      name: AUTO_ROUTE_FILL_LABEL,
    });

    // Scope Suggest to Day 2 (active day must be sent on the assist body).
    const tablist = await waitFor(() =>
      screen.getByRole("tablist", { name: TABLIST_LABEL }),
    );
    await user.click(within(tablist).getByRole("tab", { name: /^Day 2\b/i }));

    await user.click(aiSuggest);

    await waitFor(() => {
      const assists = dayPlanAssistCalls(
        globalThis.fetch as ReturnType<typeof vi.fn>,
      );
      expect(assists.length).toBeGreaterThanOrEqual(1);
      const last = assists[assists.length - 1]!;
      expect(last.body.mode).toBe("suggest");
      expect(last.body.day).toBe(DAY2_DATE);
      expect(last.body.planVariantId).toBe(PLAN_ID);
    });

    const canvas = await waitFor(() => {
      const region = screen.getByRole("region", { name: DAY_CANVAS_LABEL });
      expect(
        within(region).getByRole("button", { name: ASSIST_CHIP_A }),
      ).toBeInTheDocument();
      return region;
    });
    expect(
      within(canvas).getByRole("button", { name: ASSIST_CHIP_B }),
    ).toBeInTheDocument();
    expect(
      within(canvas).getByRole("button", { name: ASSIST_CHIP_A }),
    ).toHaveAttribute("aria-haspopup", "dialog");
    expect(within(canvas).getByText(ASSIST_OPTION_SUMMARY_A)).toBeInTheDocument();

    // Auto route & fill on Day 1 (≥2 geo pins) — autoRoute mode + chips.
    await user.click(within(tablist).getByRole("tab", { name: /^Day 1\b/i }));
    const assistCountBefore = dayPlanAssistCalls(
      globalThis.fetch as ReturnType<typeof vi.fn>,
    ).length;

    await user.click(autoRouteFill);

    await waitFor(() => {
      const assists = dayPlanAssistCalls(
        globalThis.fetch as ReturnType<typeof vi.fn>,
      );
      expect(assists.length).toBeGreaterThan(assistCountBefore);
      const last = assists[assists.length - 1]!;
      expect(last.body.mode).toBe("autoRoute");
      expect(last.body.day).toBe(START_DATE);
    });

    const day1Canvas = await waitFor(() => {
      const region = screen.getByRole("region", { name: DAY_CANVAS_LABEL });
      expect(
        within(region).getByRole("button", { name: ASSIST_CHIP_A }),
      ).toBeInTheDocument();
      return region;
    });
    expect(
      within(day1Canvas).getByRole("button", { name: ASSIST_CHIP_B }),
    ).toBeInTheDocument();
  });
});

/**
 * T11 #2: Auto route & fill no-ops when the day map has fewer than 2 pins;
 * Calm Travel Ops teal chrome only (no purple AI styling).
 */
describe("DayWorkspacePage Auto route & fill pin gate (T11 #2)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.sessionStorage.setItem(
      MEMBER_SESSION_STORAGE_KEY,
      JSON.stringify({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      }),
    );

    // Default cockpit: one stop per day, no coordinates → 0 geo pins.
    globalThis.fetch = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (
        method === "POST" &&
        url.includes(`/api/v1/trips/${TRIP_ID}/day-plan-assist`) &&
        !url.includes("/batches/")
      ) {
        return jsonResponse(
          assistOptionsBody("autoRoute", START_DATE, "item-day1"),
        );
      }
      return jsonResponse(TRIP_COCKPIT_BODY);
    }) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("Auto route & fill does not POST autoRoute when day has fewer than 2 pins; topbar AI chrome is teal not purple", async () => {
    const user = userEvent.setup();
    render(<DayWorkspacePage tripId={TRIP_ID} />);

    const topbar =
      document.querySelector("header.topbar") ??
      (await waitFor(() => screen.getByRole("banner")));
    const topbarEl = topbar as HTMLElement;

    const aiSuggest = await waitFor(() =>
      within(topbarEl).getByRole("button", { name: AI_SUGGEST_LABEL }),
    );
    const autoRouteFill = within(topbarEl).getByRole("button", {
      name: AUTO_ROUTE_FILL_LABEL,
    });

    // Theme A — teal Calm Travel Ops chrome on topbar AI actions; no purple.
    const aiActions =
      topbarEl.querySelector(".ai-actions") ??
      (aiSuggest.parentElement as HTMLElement);
    for (const el of [aiActions, aiSuggest, autoRouteFill, ...aiActions.querySelectorAll("*")]) {
      const className = typeof el.className === "string" ? el.className : "";
      expect(className).not.toMatch(PURPLE_CLASS);
      const styleAttr = el.getAttribute?.("style") ?? "";
      expect(styleAttr).not.toMatch(PURPLE_HEX);
      expect(styleAttr).not.toMatch(PURPLE_CLASS);
    }
    const chromeBlob = [aiSuggest, autoRouteFill]
      .map((el) => `${el.className} ${el.getAttribute("style") ?? ""}`)
      .join(" ");
    expect(chromeBlob).toMatch(TEAL_TOKEN);

    const mapRegion = await waitFor(() =>
      screen.getByRole("region", { name: DAY_MAP_LABEL }),
    );
    const pinCountAttr =
      mapRegion.getAttribute("data-pin-count") ??
      mapRegion.querySelector("[data-pin-count]")?.getAttribute("data-pin-count");
    expect(Number(pinCountAttr ?? 0)).toBeLessThan(2);

    await user.click(autoRouteFill);

    // No assist call that implies routing (autoRoute mode) when <2 pins.
    await waitFor(() => {
      expect(screen.getByRole("region", { name: DAY_MAP_LABEL })).toBeInTheDocument();
    });
    const autoRouteAssists = dayPlanAssistCalls(
      globalThis.fetch as ReturnType<typeof vi.fn>,
    ).filter((c) => c.body.mode === "autoRoute");
    expect(autoRouteAssists).toHaveLength(0);

    expect(
      screen.queryByRole("button", { name: ASSIST_CHIP_A }),
    ).not.toBeInTheDocument();
  });
});

/** Independent calm copy from GET /trips/{id} 401 body (loadTripCockpit). */
const SESSION_401_ERROR = "Session is missing or invalid.";
/** Muted empty-day canvas copy — must not be the sole failure surface. */
const EMPTY_DAY_MUTED_COPY =
  /Plan one day at a time — pick Days here, or switch to Table for the full itinerary/i;

/**
 * T4 #1: loadTripCockpit failure surfaces explicit error (role=alert) + Retry;
 * must not present only the muted empty-day copy as if no days exist.
 */
describe("DayWorkspacePage load failure", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.sessionStorage.setItem(
      MEMBER_SESSION_STORAGE_KEY,
      JSON.stringify({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      }),
    );
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("when loadTripCockpit fails, shows role=alert error plus Retry and does not present only muted empty-day copy", async () => {
    globalThis.fetch = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: "unauthorized",
            message: SESSION_401_ERROR,
          },
        },
        401,
      ),
    ) as typeof fetch;

    render(<DayWorkspacePage tripId={TRIP_ID} />);

    const alert = await waitFor(() => screen.getByRole("alert"));
    expect(alert).toHaveTextContent(SESSION_401_ERROR);
    expect(
      screen.getByRole("button", { name: /^Retry$/i }),
    ).toBeInTheDocument();

    // Failure must not masquerade as an empty Plan Day spine.
    expect(screen.queryByText(EMPTY_DAY_MUTED_COPY)).not.toBeInTheDocument();
  });

  /**
   * T4 #2: Retry re-invokes loadTripCockpit; successful load with
   * startDate/endDate renders the Plan Day spine (tabs / + day).
   */
  it("Retry re-invokes loadTripCockpit; successful dated load renders Plan Day spine tabs and + day", async () => {
    let cockpitLoads = 0;
    globalThis.fetch = vi.fn(async (input, init) => {
      const url = String(input);
      const method = String(init?.method ?? "GET").toUpperCase();
      if (
        method === "GET" &&
        url.includes(`/api/v1/trips/${TRIP_ID}`) &&
        !url.includes("/itinerary-items")
      ) {
        cockpitLoads += 1;
        if (cockpitLoads === 1) {
          return jsonResponse(
            {
              error: {
                code: "unauthorized",
                message: SESSION_401_ERROR,
              },
            },
            401,
          );
        }
        return jsonResponse(TRIP_COCKPIT_BODY);
      }
      return jsonResponse(TRIP_COCKPIT_BODY);
    }) as typeof fetch;

    const user = userEvent.setup();
    render(<DayWorkspacePage tripId={TRIP_ID} />);

    await waitFor(() => screen.getByRole("alert"));
    expect(cockpitLoads).toBe(1);
    expect(
      screen.queryByRole("tablist", { name: TABLIST_LABEL }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Retry$/i }));

    await waitFor(() => {
      expect(cockpitLoads).toBeGreaterThan(1);
    });

    const tablist = await waitFor(() =>
      screen.getByRole("tablist", { name: TABLIST_LABEL }),
    );
    expect(within(tablist).getAllByRole("tab")).toHaveLength(3);
    expect(
      screen.getByRole("button", { name: ADD_DAY_LABEL }),
    ).toBeInTheDocument();
  });
});

/**
 * Cockpit trip with dates + session but no plan variant — itinerary model /
 * Plan Day spine cannot materialize; patchTrip/+day can still seed an endDate.
 */
const TRIP_COCKPIT_NO_SPINE = {
  trip: {
    ...TRIP_COCKPIT_BODY.trip,
    mainTripPlanId: null,
    activePlanVariantId: null,
  },
  tripPlans: [],
  itineraryItems: [],
};

/** Empty-spine recovery CTAs — independent of production copy helpers. */
const OPEN_TABLE_LABEL = /^Open Table$/i;
const ADD_FIRST_DAY_LABEL = /^Add first day$/i;
/**
 * Visible disabled reason when no Plan Day is active (T5 #2 / #182).
 * Must be on-screen copy — not only a title tooltip.
 */
const AI_SUGGEST_DISABLED_REASON =
  /select a (plan )?day|no (active )?day|day (must be|is) (selected|active)|available when a day|until a day (is )?active/i;

/**
 * T5 #1: no visible Plan Day spine → day canvas is not a dead end; primary
 * recovery actions include Open Table + Retry, and Add first day when the trip
 * is loaded and patchTrip/+day can seed.
 */
describe("DayWorkspacePage empty Plan Day spine recovery (T5 #1)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.sessionStorage.setItem(
      MEMBER_SESSION_STORAGE_KEY,
      JSON.stringify({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      }),
    );

    globalThis.fetch = vi.fn(async () =>
      jsonResponse(TRIP_COCKPIT_NO_SPINE),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("when trip is loaded but Plan Day spine is missing, day canvas offers Open Table, Retry, and Add first day", async () => {
    render(<DayWorkspacePage tripId={TRIP_ID} />);

    // Trip loaded (fetch resolved) but no folder tabs — spine not visible.
    await waitFor(() => {
      expect(
        (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length,
      ).toBeGreaterThanOrEqual(1);
    });
    expect(
      screen.queryByRole("tablist", { name: TABLIST_LABEL }),
    ).not.toBeInTheDocument();

    const canvas = await waitFor(() =>
      screen.getByRole("region", { name: DAY_CANVAS_LABEL }),
    );

    // Not a muted-copy dead end — primary recovery CTAs in the day canvas.
    expect(
      within(canvas).getByRole("link", { name: OPEN_TABLE_LABEL }),
    ).toHaveAttribute("href", TABLE_HREF);
    expect(
      within(canvas).getByRole("button", { name: /^Retry$/i }),
    ).toBeInTheDocument();
    expect(
      within(canvas).getByRole("button", { name: ADD_FIRST_DAY_LABEL }),
    ).toBeInTheDocument();
  });
});

/**
 * T5 #2: AI suggest stays disabled until a day is active, with a visible
 * reason in the UI (empty spine / no day selected).
 */
describe("DayWorkspacePage AI suggest disabled without active day (T5 #2)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.sessionStorage.setItem(
      MEMBER_SESSION_STORAGE_KEY,
      JSON.stringify({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      }),
    );

    globalThis.fetch = vi.fn(async () =>
      jsonResponse(TRIP_COCKPIT_NO_SPINE),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("AI suggest stays disabled with a visible reason when no Plan Day is active", async () => {
    render(<DayWorkspacePage tripId={TRIP_ID} />);

    await waitFor(() => {
      expect(
        screen.queryByRole("tablist", { name: TABLIST_LABEL }),
      ).not.toBeInTheDocument();
    });

    const topbar =
      document.querySelector("header.topbar") ??
      (await waitFor(() => screen.getByRole("banner")));
    const aiSuggest = await waitFor(() =>
      within(topbar as HTMLElement).getByRole("button", {
        name: AI_SUGGEST_LABEL,
      }),
    );

    expect(aiSuggest).toBeDisabled();

    // Visible on-screen reason — title-only tooltips do not satisfy #182.
    const reason = await waitFor(() =>
      screen.getByText(AI_SUGGEST_DISABLED_REASON),
    );
    expect(reason).toBeVisible();
  });
});
