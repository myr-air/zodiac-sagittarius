/**
 * @vitest-environment happy-dom
 *
 * ItineraryContextRail — unified empty cue + Resolve honesty (M81LW2UJ T5).
 * Landmarks: places-bulk-ingest-draft-v1.html rail (Map link / Resolve) +
 * empty selection must not compete as dual cards.
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ItineraryContextRail } from "./ItineraryContextRail";

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
