/**
 * @vitest-environment happy-dom
 *
 * TripWorkspaceShell — Calm Travel Ops cockpit grid (draft-v1).
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
import { TripWorkspaceShell } from "./TripWorkspaceShell";

/** Independent literals from approved itinerary-plan-draft-v1.html shell. */
const TRIP_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const TRIP_RAIL_PX = "240px";
const CONTEXT_RAIL_PX = "320px";
const PLACEHOLDER_COPY = /Trip cockpit placeholder/i;
/** DESIGN.md / draft Calm Travel Ops command header fill. */
const COMMAND_PRIMARY_TOKEN = "--color-primary";
/** This-trip rail destinations that stay chrome-only this phase (draft-v1). */
const NON_NAVIGATING_PLACEHOLDERS = [
  "Map",
  "Members",
  "Expenses",
  "Plans",
] as const;

/**
 * Public member-session storage key (create-trip / loadTripCockpit contract).
 * Inlined so this file stays runnable under vitest without @/ path alias.
 */
const MEMBER_SESSION_STORAGE_KEY = "joii.member.session";

/** Create-trip seed literals — must surface in command bar on first open. */
const SEED_TRIP_NAME = "Chiang Mai Escape";
const SEED_DESTINATION_LABEL = "Chiang Mai";
const SEED_START_DATE = "2026-12-12";
const SEED_END_DATE = "2026-12-18";
/**
 * Acceptance (T4): command-bar trip identity shows a human date range — same
 * compact shape as PortalTripRows formatDateRange ("12–18 Dec 2026"), not raw
 * YYYY-MM-DD–YYYY-MM-DD. Independent literal for known start/end.
 *
 * Skip-TDD: Days view-switch contrast on teal command bar is pure CSS /
 * token wiring — covered by browser gate T7, not asserted here.
 */
const SEED_DATE_RANGE = "12–18 Dec 2026";
const PLAN_ID = "bbbbbbbb-cccc-4ddd-8eee-ffffffffffff";
/** Alternate plan — must appear in switcher once tripPlans are wired (T2 #3). */
const ALT_PLAN_ID = "cccccccc-dddd-4eee-8fff-000000000000";
const ALT_PLAN_NAME = "Draft · cheaper hotels";
const OWNER_MEMBER_ID = "11111111-2222-4333-8444-555555555555";
const SESSION_TOKEN = "member-session-token-cockpit-seed";
/** Independent calm copy from loadTripCockpit missing-session path. */
const MISSING_SESSION_ERROR = "Sign in to this trip to continue.";
/** Independent calm copy from GET /trips/{id} 401 body. */
const SESSION_401_ERROR = "Session is missing or invalid.";

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Minimal TripCockpit body carrying create-trip seed fields. */
const SEED_TRIP_COCKPIT_BODY = {
  trip: {
    id: TRIP_ID,
    name: SEED_TRIP_NAME,
    destinationLabel: SEED_DESTINATION_LABEL,
    startDate: SEED_START_DATE,
    endDate: SEED_END_DATE,
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
    {
      id: ALT_PLAN_ID,
      tripId: TRIP_ID,
      name: ALT_PLAN_NAME,
      kind: "variant",
      status: "draft",
      description: "Cheaper hotels draft",
      version: 1,
    },
  ],
  itineraryItems: [],
};

afterEach(() => {
  cleanup();
});

function shellRoot(): HTMLElement {
  const byId = document.getElementById("shell");
  if (byId) return byId;
  const byClass = document.querySelector(".shell");
  expect(byClass).toBeTruthy();
  return byClass as HTMLElement;
}

/** Draft: Trip Plan panel stays collapsed until #plan-toggle expands. */
async function expandTripPlanPanel(
  user: ReturnType<typeof userEvent.setup>,
): Promise<HTMLElement> {
  const toggle = screen.getByRole("button", { name: /trip plan/i });
  expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect(
    screen.queryByRole("listbox", { name: /trip plans/i }),
  ).not.toBeInTheDocument();
  await user.click(toggle);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  return screen.getByRole("listbox", { name: /trip plans/i });
}

function cssVar(el: HTMLElement, name: string): string {
  const fromInline = el.style.getPropertyValue(name).trim();
  if (fromInline) return fromInline;
  return getComputedStyle(el).getPropertyValue(name).trim();
}

describe("TripWorkspaceShell layout", () => {
  it("renders shell grid (left trip-rail ~240px, fluid main, right context ~320px) instead of placeholder copy", () => {
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    // Old /trips/{id} placeholder must not remain the surface.
    expect(screen.queryByText(PLACEHOLDER_COPY)).not.toBeInTheDocument();

    const tripRail = screen.getByRole("complementary", {
      name: "Workspace navigation",
    });
    expect(tripRail.classList.contains("trip-rail")).toBe(true);

    const main = document.querySelector(".main");
    expect(main).toBeTruthy();
    // Prefer landmark when present; class contract matches draft either way.
    const mainLandmark = screen.queryByRole("main");
    expect(mainLandmark ?? main).toBeTruthy();

    const context = screen.getByRole("complementary", {
      name: "Context inspector",
    });
    expect(context.classList.contains("context")).toBe(true);

    const shell = shellRoot();
    expect(tripRail.closest(".shell") ?? tripRail.closest("#shell")).toBe(
      shell,
    );

    // Draft tokens: --rail 240px / fluid middle / --context 320px
    expect(cssVar(shell, "--rail")).toBe(TRIP_RAIL_PX);
    expect(cssVar(shell, "--context")).toBe(CONTEXT_RAIL_PX);

    const template = (
      shell.style.gridTemplateColumns ||
      getComputedStyle(shell).gridTemplateColumns
    )
      .replace(/\s+/g, " ")
      .trim();
    expect(template.length).toBeGreaterThan(0);
    // Accept either resolved tracks or var()/minmax form from the draft.
    const matchesDraft =
      /240px\s+minmax\(0,\s*1fr\)\s+320px/.test(template) ||
      /var\(--rail\)\s+minmax\(0,\s*1fr\)\s+var\(--context\)/.test(template);
    expect(matchesDraft).toBe(true);

    const display =
      shell.style.display || getComputedStyle(shell).display;
    expect(display).toBe("grid");
  });

  it("left rail shows Itinerary as aria-current page; Map, Members, Expenses, and Plans are non-navigating placeholders", () => {
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    const tripRail = screen.getByRole("complementary", {
      name: "Workspace navigation",
    });

    const itinerary = within(tripRail).getByRole("link", {
      name: "Itinerary",
      current: "page",
    });
    expect(itinerary).toHaveAttribute("aria-current", "page");

    for (const name of NON_NAVIGATING_PLACEHOLDERS) {
      // Draft chrome: button or inert href="#" link — never a real route.
      const item =
        within(tripRail).queryByRole("button", { name }) ??
        within(tripRail).getByRole("link", { name });
      expect(item).toBeTruthy();
      expect(item).not.toHaveAttribute("aria-current");
      const href = item.getAttribute("href");
      if (href !== null) {
        expect(href).toBe("#");
      } else {
        expect(item.tagName).toBe("BUTTON");
      }
    }
  });

  it("command bar chrome is present (trip identity slot, Main Plan switcher, Reorder off by default) with Calm Travel Ops tokens", () => {
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    const main = document.querySelector(".main");
    expect(main).toBeTruthy();

    // Draft: <header class="command"> inside .main
    const command =
      main!.querySelector("header.command") ??
      screen.queryByRole("banner");
    expect(command).toBeTruthy();
    expect((command as HTMLElement).classList.contains("command")).toBe(true);

    const commandEl = command as HTMLElement;

    // Trip identity slot — structure only; T2 fills name / destination / dates.
    const tripIdentity = commandEl.querySelector(".trip-id");
    expect(tripIdentity).toBeTruthy();

    // Main Plan switcher control (draft plan-toggle + listbox option).
    const planSwitcher =
      within(commandEl).queryByRole("button", {
        name: /trip plan|main plan/i,
      }) ??
      within(commandEl).queryByRole("listbox", { name: /trip plans/i });
    expect(planSwitcher).toBeTruthy();
    const mainPlanOption =
      within(commandEl).queryByRole("option", { name: "Main Plan" }) ??
      within(commandEl).getByText("Main Plan");
    expect(mainPlanOption).toBeTruthy();

    // Reorder toggle off by default (draft #dnd-toggle unchecked).
    const reorder = within(commandEl).getByRole("checkbox", {
      name: /reorder/i,
    });
    expect(reorder).not.toBeChecked();

    // Calm Travel Ops: command header uses primary teal token (DESIGN.md).
    const bgInline =
      commandEl.style.background || commandEl.style.backgroundColor;
    const usesPrimaryToken =
      commandEl.className.includes(COMMAND_PRIMARY_TOKEN) ||
      bgInline.includes(COMMAND_PRIMARY_TOKEN) ||
      /var\(--color-primary\)/.test(bgInline);
    expect(usesPrimaryToken).toBe(true);
  });

  /**
   * T4 #2: draft command chrome includes Share (btn-primary in draft-v1).
   * Calm non-navigating stub is OK — no parallel share backend.
   */
  it("command bar exposes a Share control as draft chrome (non-navigating stub)", () => {
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    const command =
      document.querySelector("header.command") ??
      screen.getByRole("banner");
    expect(command).toBeTruthy();
    const commandEl = command as HTMLElement;

    // Draft: <button type="button" class="btn btn-primary">Share</button>
    // inside .header-actions — stub OK; must not invent a share API route.
    const share =
      within(commandEl).queryByRole("button", { name: /^Share$/i }) ??
      within(commandEl).queryByRole("link", { name: /^Share$/i });
    expect(share).toBeTruthy();
    const href = share!.getAttribute("href");
    if (href !== null) {
      expect(href).toBe("#");
    } else {
      expect(share!.tagName).toBe("BUTTON");
    }
  });
});

/**
 * M81HY2YR T4 #1 (shell half) — command-bar Import opens draft import dialog.
 * Paste → normalize → preview lives in ItineraryImportDialog.test.tsx.
 */
describe("TripWorkspaceShell Import command", () => {
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
      jsonResponse(SEED_TRIP_COCKPIT_BODY),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("command-bar Import opens the Import itinerary draft dialog for the loaded trip", async () => {
    const user = userEvent.setup();
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    await waitFor(() => {
      expect(screen.getByText(SEED_TRIP_NAME)).toBeInTheDocument();
    });

    const command =
      document.querySelector("header.command") ??
      screen.getByRole("banner");
    const commandEl = command as HTMLElement;

    // Draft places-bulk-ingest-v1: #btn-import in command actions.
    const importBtn = within(commandEl).getByRole("button", {
      name: /^Import$/i,
    });
    expect(
      screen.queryByRole("dialog", { name: /Import itinerary/i }),
    ).not.toBeInTheDocument();

    await user.click(importBtn);

    const dialog = await waitFor(() =>
      screen.getByRole("dialog", { name: /Import itinerary/i }),
    );
    expect(dialog).toHaveAttribute("aria-modal", "true");
    // Visible plan context (Main) surfaces in dialog copy (draft subtitle).
    expect(dialog.textContent ?? "").toMatch(/appends to Main/i);
  });
});

describe("TripWorkspaceShell command bar trip seed", () => {
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
    expect(
      window.sessionStorage.getItem(MEMBER_SESSION_STORAGE_KEY),
    ).toBeTruthy();

    globalThis.fetch = vi.fn(async () =>
      jsonResponse(SEED_TRIP_COCKPIT_BODY),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("command bar shows trip name, destinationLabel, and human date range from the loaded trip", async () => {
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    const command =
      document.querySelector("header.command") ??
      screen.getByRole("banner");
    expect(command).toBeTruthy();

    const tripIdentity = await waitFor(() => {
      const slot = (command as HTMLElement).querySelector(".trip-id");
      expect(slot).toBeTruthy();
      expect(slot!.textContent).toContain(SEED_TRIP_NAME);
      return slot as HTMLElement;
    });

    // Create-trip seed must remain visible on first open (draft .trip-id).
    expect(tripIdentity.textContent).toContain(SEED_TRIP_NAME);
    expect(tripIdentity.textContent).toContain(SEED_DESTINATION_LABEL);
    // Human range (PortalTripRows shape); must not be raw ISO start–end.
    expect(tripIdentity.textContent).toContain(SEED_DATE_RANGE);
    expect(tripIdentity.textContent).not.toContain(
      `${SEED_START_DATE}–${SEED_END_DATE}`,
    );
  });

  it("plan switcher lists tripPlans and marks Main Plan (mainTripPlanId) selected", async () => {
    const user = userEvent.setup();
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    await waitFor(() => {
      expect(screen.getByText(SEED_TRIP_NAME)).toBeInTheDocument();
    });
    const planList = await expandTripPlanPanel(user);

    const mainPlan = within(planList).getByRole("option", {
      name: "Main Plan",
    });
    const altPlan = within(planList).getByRole("option", {
      name: ALT_PLAN_NAME,
    });

    // Main Plan is the tripPlans row whose id === trip.mainTripPlanId.
    expect(mainPlan).toHaveAttribute("aria-selected", "true");
    expect(altPlan).toHaveAttribute("aria-selected", "false");
  });
});

/**
 * Must-fix: Trip Plan panel is collapsed by default; toggle only expands/collapses
 * the local filter list (no set-main / Plans navigation).
 */
describe("TripWorkspaceShell Trip Plan panel honesty", () => {
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
      jsonResponse(SEED_TRIP_COCKPIT_BODY),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("Trip Plan panel stays collapsed until toggle expands; toggle only expands/collapses the local panel", async () => {
    const user = userEvent.setup();
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    await waitFor(() => {
      expect(screen.getByText(SEED_TRIP_NAME)).toBeInTheDocument();
    });

    const toggle = screen.getByRole("button", { name: /trip plan/i });
    expect(toggle).toHaveAttribute("id", "plan-toggle");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "plan-panel");
    expect(
      screen.queryByRole("listbox", { name: /trip plans/i }),
    ).not.toBeInTheDocument();

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const callsBefore = fetchMock.mock.calls.length;

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const planList = screen.getByRole("listbox", { name: /trip plans/i });
    expect(planList).toHaveAttribute("id", "plan-panel");
    expect(planList.className).toMatch(/\bopen\b/);

    // Collapse again — local panel only.
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("listbox", { name: /trip plans/i }),
    ).not.toBeInTheDocument();

    // No set-main / navigation invented by the expander itself.
    const newCalls = fetchMock.mock.calls.slice(callsBefore);
    for (const [input, init] of newCalls) {
      const url = String(input);
      expect(url).not.toContain("/set-main");
      expect(url).not.toMatch(/promote-main/i);
      const method = String(
        (init as RequestInit | undefined)?.method ?? "GET",
      ).toUpperCase();
      if (method !== "GET" && method !== "HEAD") {
        expect(url).not.toMatch(/set-main|promote-main/i);
      }
    }
  });
});

/**
 * T7 #1: newly created trip (zero itineraryItems) still shows the full day
 * spine for startDate–endDate — empty day = header + Add activity; no second
 * setup wizard (decisions: open full cockpit immediately).
 */
const TABLE_ARIA_LABEL = /smart itinerary table/i;
/** Inclusive Dec 12–18 2026 seed window → 7 empty day headers (UTC). */
const EMPTY_SEED_DAY_HEADERS = [
  { dayNum: "1", dataDay: "Day 1", datetime: "2026-12-12", dow: "sat", dom: "12", mon: "Dec" },
  { dayNum: "2", dataDay: "Day 2", datetime: "2026-12-13", dow: "sun", dom: "13", mon: "Dec" },
  { dayNum: "3", dataDay: "Day 3", datetime: "2026-12-14", dow: "mon", dom: "14", mon: "Dec" },
  { dayNum: "4", dataDay: "Day 4", datetime: "2026-12-15", dow: "tue", dom: "15", mon: "Dec" },
  { dayNum: "5", dataDay: "Day 5", datetime: "2026-12-16", dow: "wed", dom: "16", mon: "Dec" },
  { dayNum: "6", dataDay: "Day 6", datetime: "2026-12-17", dow: "thu", dom: "17", mon: "Dec" },
  { dayNum: "7", dataDay: "Day 7", datetime: "2026-12-18", dow: "fri", dom: "18", mon: "Dec" },
] as const;
/** Second setup wizard copy must not appear on first open (decisions). */
const SETUP_WIZARD_COPY =
  /set up your trip|trip setup wizard|welcome wizard|get started with your itinerary/i;

/**
 * T2 #1: Main Plan filter must use the trip’s real planVariantId
 * (activePlanVariantId) when it diverges from mainTripPlanId — Phase 1
 * `mainTripPlanId ?? activePlanVariantId` wrongly treats the plan row id
 * as the itinerary variant scope.
 */
const ACTIVE_PLAN_VARIANT_ID = "dddddddd-eeee-4fff-8000-111111111111";
/** Seeded Main Plan stop tagged with the real variant id, not mainTripPlanId. */
const MAIN_VARIANT_STOP_ID = "item-main-variant-doi-suthep";
const MAIN_VARIANT_STOP_ACTIVITY = "Wat Phra That Doi Suthep";
/** Attraction primary input is Place (activity title may be hidden). */
const MAIN_VARIANT_STOP_PLACE = "Doi Suthep";
/** Decoy tagged with mainTripPlanId — must not stand in for the real variant. */
const MAIN_PLAN_ID_DECOY_ID = "item-main-plan-id-decoy";
const MAIN_PLAN_ID_DECOY_ACTIVITY = "Decoy stop on mainTripPlanId";
const MAIN_PLAN_ID_DECOY_PLACE = "Should not appear under Main Plan";

const DIVERGE_MAIN_PLAN_COCKPIT_BODY = {
  ...SEED_TRIP_COCKPIT_BODY,
  trip: {
    ...SEED_TRIP_COCKPIT_BODY.trip,
    mainTripPlanId: PLAN_ID,
    activePlanVariantId: ACTIVE_PLAN_VARIANT_ID,
  },
  itineraryItems: [
    {
      id: MAIN_VARIANT_STOP_ID,
      tripId: TRIP_ID,
      planVariantId: ACTIVE_PLAN_VARIANT_ID,
      day: SEED_START_DATE,
      activity: MAIN_VARIANT_STOP_ACTIVITY,
      activityType: "attraction",
      place: MAIN_VARIANT_STOP_PLACE,
      startTime: "09:00",
      status: "idea",
      version: 1,
    },
    {
      id: MAIN_PLAN_ID_DECOY_ID,
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: SEED_START_DATE,
      activity: MAIN_PLAN_ID_DECOY_ACTIVITY,
      activityType: "food",
      place: MAIN_PLAN_ID_DECOY_PLACE,
      startTime: "12:00",
      status: "idea",
      version: 1,
    },
  ],
};

describe("TripWorkspaceShell Main Plan variant filter", () => {
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
    // Precondition: Main Plan row id and active variant id must diverge.
    expect(PLAN_ID).not.toBe(ACTIVE_PLAN_VARIANT_ID);
    expect(DIVERGE_MAIN_PLAN_COCKPIT_BODY.trip.mainTripPlanId).toBe(PLAN_ID);
    expect(DIVERGE_MAIN_PLAN_COCKPIT_BODY.trip.activePlanVariantId).toBe(
      ACTIVE_PLAN_VARIANT_ID,
    );

    globalThis.fetch = vi.fn(async () =>
      jsonResponse(DIVERGE_MAIN_PLAN_COCKPIT_BODY),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("when Main Plan is selected and mainTripPlanId ≠ activePlanVariantId, itinerary stops are filtered by the real activePlanVariantId", async () => {
    const user = userEvent.setup();
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    await waitFor(() => {
      expect(screen.getByText(SEED_TRIP_NAME)).toBeInTheDocument();
    });
    const planList = await expandTripPlanPanel(user);
    expect(
      within(planList).getByRole("option", { name: "Main Plan" }),
    ).toHaveAttribute("aria-selected", "true");

    const table = await waitFor(() =>
      screen.getByRole("table", { name: TABLE_ARIA_LABEL }),
    );
    const realStop = await waitFor(() => {
      const row = table.querySelector(
        `tr.stop-row[data-id="${MAIN_VARIANT_STOP_ID}"]`,
      );
      expect(row).toBeTruthy();
      return row as HTMLElement;
    });
    // Attraction field bag: primary visible input is Place, not activity title.
    expect(
      within(realStop).getByDisplayValue(MAIN_VARIANT_STOP_PLACE),
    ).toBeInTheDocument();

    // Filtering by mainTripPlanId would surface this decoy instead.
    expect(
      table.querySelector(`tr.stop-row[data-id="${MAIN_PLAN_ID_DECOY_ID}"]`),
    ).toBeNull();
    expect(
      screen.queryByDisplayValue(MAIN_PLAN_ID_DECOY_PLACE),
    ).not.toBeInTheDocument();
  });
});

/**
 * M81DDKSC T5 #1 — Selecting a non-main trip plan option must set the visible
 * filter to that plan’s id (planVariantId) and rebuild the Smart itinerary
 * table for that plan’s items. Plan switcher is filter-only (set-main deferred).
 */
const ALT_PLAN_STOP_ID = "item-alt-plan-cheaper-hotels";
const ALT_PLAN_STOP_PLACE = "Budget guesthouse";
const MAIN_ALIGNED_STOP_ID = "item-main-aligned-doi-suthep";
const MAIN_ALIGNED_STOP_PLACE = "Doi Suthep main";

const PLAN_SWITCH_ALT_COCKPIT_BODY = {
  ...SEED_TRIP_COCKPIT_BODY,
  // Aligned ids: Main Plan row id === activePlanVariantId === PLAN_ID.
  itineraryItems: [
    {
      id: MAIN_ALIGNED_STOP_ID,
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: SEED_START_DATE,
      activity: "Wat Phra That Doi Suthep",
      activityType: "attraction",
      place: MAIN_ALIGNED_STOP_PLACE,
      startTime: "09:00",
      status: "idea",
      version: 1,
    },
    {
      id: ALT_PLAN_STOP_ID,
      tripId: TRIP_ID,
      planVariantId: ALT_PLAN_ID,
      day: SEED_START_DATE,
      activity: "Budget hotel check-in",
      activityType: "stay",
      place: ALT_PLAN_STOP_PLACE,
      startTime: "15:00",
      status: "idea",
      version: 1,
    },
  ],
};

describe("TripWorkspaceShell plan switcher filter", () => {
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
    expect(PLAN_ID).not.toBe(ALT_PLAN_ID);
    expect(SEED_TRIP_COCKPIT_BODY.trip.mainTripPlanId).toBe(PLAN_ID);
    expect(SEED_TRIP_COCKPIT_BODY.trip.activePlanVariantId).toBe(PLAN_ID);

    globalThis.fetch = vi.fn(async () =>
      jsonResponse(PLAN_SWITCH_ALT_COCKPIT_BODY),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("selecting a non-main trip plan option sets the visible filter to that plan’s id (planVariantId) and rebuilds the Smart itinerary table for that plan’s items", async () => {
    const user = userEvent.setup();
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    await waitFor(() => {
      expect(screen.getByText(SEED_TRIP_NAME)).toBeInTheDocument();
    });
    const planList = await expandTripPlanPanel(user);
    const mainPlan = within(planList).getByRole("option", {
      name: "Main Plan",
    });
    const altPlan = within(planList).getByRole("option", {
      name: ALT_PLAN_NAME,
    });
    expect(mainPlan).toHaveAttribute("aria-selected", "true");
    expect(altPlan).toHaveAttribute("aria-selected", "false");

    const table = await waitFor(() =>
      screen.getByRole("table", { name: TABLE_ARIA_LABEL }),
    );
    await waitFor(() => {
      expect(
        table.querySelector(`tr.stop-row[data-id="${MAIN_ALIGNED_STOP_ID}"]`),
      ).toBeTruthy();
    });
    expect(
      table.querySelector(`tr.stop-row[data-id="${ALT_PLAN_STOP_ID}"]`),
    ).toBeNull();

    await user.click(altPlan);

    expect(altPlan).toHaveAttribute("aria-selected", "true");
    expect(mainPlan).toHaveAttribute("aria-selected", "false");

    await waitFor(() => {
      expect(
        table.querySelector(`tr.stop-row[data-id="${ALT_PLAN_STOP_ID}"]`),
      ).toBeTruthy();
    });
    expect(
      within(
        table.querySelector(
          `tr.stop-row[data-id="${ALT_PLAN_STOP_ID}"]`,
        ) as HTMLElement,
      ).getByDisplayValue(ALT_PLAN_STOP_PLACE),
    ).toBeInTheDocument();
    expect(
      table.querySelector(`tr.stop-row[data-id="${MAIN_ALIGNED_STOP_ID}"]`),
    ).toBeNull();
    expect(
      screen.queryByDisplayValue(MAIN_ALIGNED_STOP_PLACE),
    ).not.toBeInTheDocument();
  });
});

/**
 * M81DDKSC T5 #2 — Selecting Main Plan filters by the trip’s real
 * activePlanVariantId (not mainTripPlanId when they diverge) and must not
 * invent a set-main / promote-main mutation (filter-only switch).
 */
const ALT_PLAN_STOP_DIVERGE_ID = "item-alt-plan-diverge-museum";
const ALT_PLAN_STOP_DIVERGE_PLACE = "Alt museum under draft plan";
const SET_MAIN_PATH = `/api/v1/trips/${TRIP_ID}/trip-plans/`;
const SET_MAIN_SUFFIX = "/set-main";
const PROMOTE_MAIN_TOKEN = "promote-main";

const PLAN_SWITCH_MAIN_DIVERGE_COCKPIT_BODY = {
  ...DIVERGE_MAIN_PLAN_COCKPIT_BODY,
  itineraryItems: [
    ...DIVERGE_MAIN_PLAN_COCKPIT_BODY.itineraryItems,
    {
      id: ALT_PLAN_STOP_DIVERGE_ID,
      tripId: TRIP_ID,
      planVariantId: ALT_PLAN_ID,
      day: SEED_START_DATE,
      activity: "Alt museum",
      activityType: "attraction",
      place: ALT_PLAN_STOP_DIVERGE_PLACE,
      startTime: "11:00",
      status: "idea",
      version: 1,
    },
  ],
};

describe("TripWorkspaceShell Main Plan selection filter", () => {
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
    expect(PLAN_ID).not.toBe(ACTIVE_PLAN_VARIANT_ID);
    expect(PLAN_SWITCH_MAIN_DIVERGE_COCKPIT_BODY.trip.mainTripPlanId).toBe(
      PLAN_ID,
    );
    expect(
      PLAN_SWITCH_MAIN_DIVERGE_COCKPIT_BODY.trip.activePlanVariantId,
    ).toBe(ACTIVE_PLAN_VARIANT_ID);

    globalThis.fetch = vi.fn(async () =>
      jsonResponse(PLAN_SWITCH_MAIN_DIVERGE_COCKPIT_BODY),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("selecting Main Plan filters by the trip’s real activePlanVariantId (mainTripPlanId ≠ activePlanVariantId) and does not invent a set-main / promote-main mutation", async () => {
    const user = userEvent.setup();
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    await waitFor(() => {
      expect(screen.getByText(SEED_TRIP_NAME)).toBeInTheDocument();
    });
    const planList = await expandTripPlanPanel(user);
    const mainPlan = within(planList).getByRole("option", {
      name: "Main Plan",
    });
    const altPlan = within(planList).getByRole("option", {
      name: ALT_PLAN_NAME,
    });

    const table = await waitFor(() =>
      screen.getByRole("table", { name: TABLE_ARIA_LABEL }),
    );
    await waitFor(() => {
      expect(
        table.querySelector(`tr.stop-row[data-id="${MAIN_VARIANT_STOP_ID}"]`),
      ).toBeTruthy();
    });

    // Leave Main so the return path exercises “Selecting Main Plan”.
    await user.click(altPlan);
    expect(altPlan).toHaveAttribute("aria-selected", "true");
    expect(mainPlan).toHaveAttribute("aria-selected", "false");
    await waitFor(() => {
      expect(
        table.querySelector(
          `tr.stop-row[data-id="${ALT_PLAN_STOP_DIVERGE_ID}"]`,
        ),
      ).toBeTruthy();
    });

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const callsBeforeMain = fetchMock.mock.calls.length;

    await user.click(mainPlan);

    expect(mainPlan).toHaveAttribute("aria-selected", "true");
    expect(altPlan).toHaveAttribute("aria-selected", "false");

    // Real Main variant scope — not the mainTripPlanId decoy.
    await waitFor(() => {
      expect(
        table.querySelector(`tr.stop-row[data-id="${MAIN_VARIANT_STOP_ID}"]`),
      ).toBeTruthy();
    });
    expect(
      within(
        table.querySelector(
          `tr.stop-row[data-id="${MAIN_VARIANT_STOP_ID}"]`,
        ) as HTMLElement,
      ).getByDisplayValue(MAIN_VARIANT_STOP_PLACE),
    ).toBeInTheDocument();
    expect(
      table.querySelector(`tr.stop-row[data-id="${MAIN_PLAN_ID_DECOY_ID}"]`),
    ).toBeNull();
    expect(
      table.querySelector(
        `tr.stop-row[data-id="${ALT_PLAN_STOP_DIVERGE_ID}"]`,
      ),
    ).toBeNull();
    expect(
      screen.queryByDisplayValue(MAIN_PLAN_ID_DECOY_PLACE),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByDisplayValue(ALT_PLAN_STOP_DIVERGE_PLACE),
    ).not.toBeInTheDocument();

    // Filter-only: no set-main / promote-main invented on Main selection.
    const newCalls = fetchMock.mock.calls.slice(callsBeforeMain);
    for (const [input, init] of newCalls) {
      const url = String(input);
      expect(url).not.toContain(SET_MAIN_SUFFIX);
      expect(url).not.toContain(PROMOTE_MAIN_TOKEN);
      if (url.includes(SET_MAIN_PATH)) {
        expect(url.endsWith(SET_MAIN_SUFFIX)).toBe(false);
      }
      const method = String(
        (init as RequestInit | undefined)?.method ?? "GET",
      ).toUpperCase();
      if (method !== "GET" && method !== "HEAD") {
        expect(url).not.toMatch(/set-main|promote-main/i);
      }
    }
  });
});

describe("TripWorkspaceShell empty-day seed spine", () => {
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
    // SEED_TRIP_COCKPIT_BODY already has itineraryItems: [] (newly created trip).
    expect(SEED_TRIP_COCKPIT_BODY.itineraryItems).toEqual([]);
    globalThis.fetch = vi.fn(async () =>
      jsonResponse(SEED_TRIP_COCKPIT_BODY),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("newly created trip with zero itineraryItems still shows the full day spine for startDate–endDate with empty-day + Add activity per day (no second setup wizard)", async () => {
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    // Command bar seed still present — first open is the cockpit, not a wizard.
    await waitFor(() => {
      expect(screen.getByText(SEED_TRIP_NAME)).toBeInTheDocument();
    });
    expect(screen.queryByText(SETUP_WIZARD_COPY)).not.toBeInTheDocument();

    const table = await waitFor(() =>
      screen.getByRole("table", { name: TABLE_ARIA_LABEL }),
    );
    const tbody = table.querySelector("tbody");
    expect(tbody).toBeTruthy();

    const dayRows = [...tbody!.querySelectorAll("tr.day-row")];
    expect(dayRows.length).toBe(EMPTY_SEED_DAY_HEADERS.length);

    const addRows = [...tbody!.querySelectorAll("tr.add-row")];
    expect(addRows.length).toBe(EMPTY_SEED_DAY_HEADERS.length);

    // Zero stops — every day is empty-day = header + Add activity only.
    expect(tbody!.querySelectorAll("tr.stop-row").length).toBe(0);

    for (const expected of EMPTY_SEED_DAY_HEADERS) {
      const dayRow = dayRows.find((row) => {
        const dateEl = row.querySelector("time.day-date");
        return dateEl?.getAttribute("datetime") === expected.datetime;
      });
      expect(dayRow).toBeTruthy();
      expect(
        within(dayRow as HTMLElement).getByText(expected.dayNum),
      ).toBeInTheDocument();
      expect(dayRow!.querySelector("time.day-date")).toHaveAttribute(
        "datetime",
        expected.datetime,
      );
      expect(dayRow!.querySelector(".dom")?.textContent).toBe(expected.dom);
      expect(dayRow!.querySelector(".mon")?.textContent).toBe(expected.mon);

      let cursor: Element | null = dayRow!.nextElementSibling;
      let lastInDay: Element | null = null;
      while (cursor && !cursor.classList.contains("day-row")) {
        lastInDay = cursor;
        cursor = cursor.nextElementSibling;
      }
      const terminal =
        lastInDay?.classList.contains("add-draft-row") &&
        lastInDay.previousElementSibling?.classList.contains("add-row")
          ? lastInDay.previousElementSibling
          : lastInDay;
      expect(terminal).toBeTruthy();
      expect(terminal).toHaveClass("add-row");
      expect(terminal).toHaveAttribute("data-day", expected.dataDay);
      expect(terminal).toHaveAttribute("data-open", "false");
      expect(
        within(terminal as HTMLElement).getByText("Add activity"),
      ).toBeInTheDocument();
    }
  });
});

/**
 * M81DDKSC T6 #2 — Reorder (#dnd-toggle) reveals stop-row .stop-drag grips
 * for within-day reorder, but day-header .day-drag stays hidden/disabled
 * (no day-order API). Default off hides both.
 */
const REORDER_STOP_ID = "item-reorder-grip-seed";
const REORDER_STOP_ACTIVITY = "Grip seed stop";
const REORDER_GRIP_COCKPIT_BODY = {
  ...SEED_TRIP_COCKPIT_BODY,
  itineraryItems: [
    {
      id: REORDER_STOP_ID,
      tripId: TRIP_ID,
      planVariantId: PLAN_ID,
      day: SEED_START_DATE,
      activity: REORDER_STOP_ACTIVITY,
      activityType: "attraction",
      place: "Old City",
      startTime: "10:00",
      status: "idea",
      version: 1,
    },
  ],
};

/** Draft grip is shown when present and not HTML-hidden / aria-disabled. */
function isGripShown(el: Element | null): boolean {
  if (!el) return false;
  if ((el as HTMLElement).hidden) return false;
  if (el.hasAttribute("hidden")) return false;
  if (el.getAttribute("aria-disabled") === "true") return false;
  if ((el as HTMLElement).style.display === "none") return false;
  if ((el as HTMLElement).style.visibility === "hidden") return false;
  return true;
}

describe("TripWorkspaceShell Reorder drag grips", () => {
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
      jsonResponse(REORDER_GRIP_COCKPIT_BODY),
    ) as typeof fetch;
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("checking command-bar Reorder (#dnd-toggle) reveals stop-row .stop-drag grips but keeps day-header .day-drag hidden/disabled; unchecked hides stop grips (default off)", async () => {
    const user = userEvent.setup();
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    const table = await waitFor(() =>
      screen.getByRole("table", { name: TABLE_ARIA_LABEL }),
    );
    const stopRow = await waitFor(() => {
      const row = table.querySelector(
        `tr.stop-row[data-id="${REORDER_STOP_ID}"]`,
      );
      expect(row).toBeTruthy();
      return row as HTMLElement;
    });
    const dayRows = [...table.querySelectorAll("tr.day-row")];
    expect(dayRows.length).toBeGreaterThan(0);

    const command =
      document.querySelector("header.command") ??
      screen.getByRole("banner");
    const reorder = within(command as HTMLElement).getByRole("checkbox", {
      name: /reorder/i,
    });
    expect(reorder).toHaveAttribute("id", "dnd-toggle");
    // Honest chrome: Reorder never promises day-order (no day-order API).
    const reorderLabel = reorder.closest("label");
    expect(reorderLabel?.getAttribute("title") ?? "").not.toMatch(/days/i);
    expect(reorderLabel?.getAttribute("title") ?? "").toMatch(/activit/i);
    // Default off — grips hidden on day headers and stop rows.
    expect(reorder).not.toBeChecked();
    for (const dayRow of dayRows) {
      expect(isGripShown(dayRow.querySelector(".day-drag"))).toBe(false);
      const dayId = dayRow.querySelector(".day-id") as HTMLElement | null;
      expect(dayId).toBeTruthy();
      // Collapse chip — never a day-reorder grab handle.
      expect(getComputedStyle(dayId!).cursor).not.toBe("grab");
      expect(getComputedStyle(dayId!).cursor).not.toBe("grabbing");
      expect(dayId!.getAttribute("title") ?? "").not.toMatch(/reorder days/i);
    }
    expect(isGripShown(stopRow.querySelector(".stop-drag"))).toBe(false);

    await user.click(reorder);
    expect(reorder).toBeChecked();

    // Checked — within-day stop grips only; no day-order API → day-drag off.
    const dayRowsOn = [...table.querySelectorAll("tr.day-row")];
    expect(dayRowsOn.length).toBeGreaterThan(0);
    for (const dayRow of dayRowsOn) {
      expect(isGripShown(dayRow.querySelector(".day-drag"))).toBe(false);
      const dayId = dayRow.querySelector(".day-id") as HTMLElement | null;
      expect(dayId).toBeTruthy();
      expect(getComputedStyle(dayId!).cursor).not.toBe("grab");
      expect(getComputedStyle(dayId!).cursor).not.toBe("grabbing");
    }
    const stopRowOn = table.querySelector(
      `tr.stop-row[data-id="${REORDER_STOP_ID}"]`,
    );
    expect(isGripShown(stopRowOn?.querySelector(".stop-drag") ?? null)).toBe(
      true,
    );

    await user.click(reorder);
    expect(reorder).not.toBeChecked();
    const dayRowsOff = [...table.querySelectorAll("tr.day-row")];
    for (const dayRow of dayRowsOff) {
      expect(isGripShown(dayRow.querySelector(".day-drag"))).toBe(false);
    }
    const stopRowOff = table.querySelector(
      `tr.stop-row[data-id="${REORDER_STOP_ID}"]`,
    );
    expect(isGripShown(stopRowOff?.querySelector(".stop-drag") ?? null)).toBe(
      false,
    );
  });
});

/** Production deploy host — must not be hardcoded as a client API fallback. */
const PRODUCTION_API_HOST = "joii.13thx.com";
/** Independent calm copy from loadTripCockpit network/parse failure path. */
const REACH_SERVER_ERROR =
  /Could not (reach the server|load this trip)|incomplete|try again/i;

describe("TripWorkspaceShell load failure", () => {
  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    window.sessionStorage.clear();
  });

  it("missing or 401 session shows a calm recoverable error without crashing the shell", async () => {
    // --- Missing member session: no Bearer, calm error, shell stays up ---
    window.sessionStorage.clear();
    globalThis.fetch = vi.fn(async () =>
      jsonResponse(SEED_TRIP_COCKPIT_BODY),
    ) as typeof fetch;

    const { unmount } = render(<TripWorkspaceShell tripId={TRIP_ID} />);

    const missingAlert = await waitFor(() => screen.getByRole("alert"));
    expect(missingAlert).toHaveTextContent(MISSING_SESSION_ERROR);
    expect(shellRoot()).toBeTruthy();
    expect(
      screen.getByRole("complementary", { name: "Workspace navigation" }),
    ).toBeTruthy();
    expect(globalThis.fetch).not.toHaveBeenCalled();

    unmount();
    cleanup();

    // --- Present session + 401: surface API calm copy, shell stays up ---
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

    render(<TripWorkspaceShell tripId={TRIP_ID} />);

    const unauthorizedAlert = await waitFor(() =>
      screen.getByRole("alert"),
    );
    expect(unauthorizedAlert).toHaveTextContent(SESSION_401_ERROR);
    expect(shellRoot()).toBeTruthy();
    expect(
      screen.getByRole("complementary", { name: "Workspace navigation" }),
    ).toBeTruthy();
    // Seed identity must not appear from a failed load.
    expect(screen.queryByText(SEED_TRIP_NAME)).not.toBeInTheDocument();
  });

  /**
   * T4 #3: loadError path includes Retry that reloads cockpit (parity with
   * Days); empty/misconfigured API base surfaces as this failure UX — no
   * production API host hardcoding.
   */
  it("loadError path includes Retry that reloads cockpit; empty/misconfigured API base surfaces failure UX without production host hardcoding", async () => {
    const prevApiBase = process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL;
    // Empty env → same-origin relative /api/v1 (Next 404 HTML risk locally).
    process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL = "";

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

    let cockpitLoads = 0;
    globalThis.fetch = vi.fn(async (input) => {
      const url = String(input);
      // Misconfigured/empty base must not fall back to a production host.
      expect(url).not.toContain(PRODUCTION_API_HOST);
      expect(url).toMatch(
        new RegExp(`/api/v1/trips/${TRIP_ID.replace(/-/g, "\\-")}`),
      );

      if (
        url.includes(`/api/v1/trips/${TRIP_ID}`) &&
        !url.includes("/itinerary-items")
      ) {
        cockpitLoads += 1;
        if (cockpitLoads === 1) {
          // Empty/misconfigured base → Next same-origin 404 HTML, not JSON.
          return new Response("<!DOCTYPE html><title>404</title>", {
            status: 404,
            headers: { "Content-Type": "text/html" },
          });
        }
        return jsonResponse(SEED_TRIP_COCKPIT_BODY);
      }
      return jsonResponse(SEED_TRIP_COCKPIT_BODY);
    }) as typeof fetch;

    try {
      const user = userEvent.setup();
      render(<TripWorkspaceShell tripId={TRIP_ID} />);

      const alert = await waitFor(() => screen.getByRole("alert"));
      expect(alert.textContent ?? "").toMatch(REACH_SERVER_ERROR);
      expect(screen.queryByText(SEED_TRIP_NAME)).not.toBeInTheDocument();

      // Parity with Days: Retry control must reload cockpit.
      const retry = screen.getByRole("button", { name: /^Retry$/i });
      expect(cockpitLoads).toBe(1);

      await user.click(retry);

      await waitFor(() => {
        expect(cockpitLoads).toBeGreaterThan(1);
      });
      await waitFor(() => {
        expect(screen.getByText(SEED_TRIP_NAME)).toBeInTheDocument();
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    } finally {
      if (prevApiBase === undefined) {
        delete process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_SAGITTARIUS_API_BASE_URL = prevApiBase;
      }
    }
  });
});

describe("TripPage route mount", () => {
  it("app/trips/[id]/page.tsx mounts TripWorkspaceShell instead of placeholder", async () => {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const src = await readFile(
      join(process.cwd(), "app/trips/[id]/page.tsx"),
      "utf8",
    );
    expect(src).toMatch(/TripWorkspaceShell/);
    expect(src).not.toMatch(PLACEHOLDER_COPY);
  });
});

/**
 * M80VKAX5 T1 #2 — Table itinerary surface ↔ Days cross-links.
 * Draft view-switch: Table (this route) | Days → /trips/{id}/days.
 * Joii public brand only — no Sagittarius chrome.
 */
const DAYS_HREF = `/trips/${TRIP_ID}/days`;
const TABLE_HREF = `/trips/${TRIP_ID}`;

describe("TripWorkspaceShell Table ↔ Days cross-links", () => {
  it("Table itinerary surface links to /trips/{tripId}/days; Table stays on trip route; Joii brand only (no Sagittarius chrome)", () => {
    render(<TripWorkspaceShell tripId={TRIP_ID} />);

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

    expect(daysLink).toHaveAttribute("href", DAYS_HREF);
    expect(tableLink).toHaveAttribute("href", TABLE_HREF);
    expect(tableLink).toHaveAttribute("aria-current", "page");

    const chrome = document.body.textContent ?? "";
    expect(chrome).not.toMatch(/Sagittarius/i);
  });
});

