/**
 * @vitest-environment happy-dom
 *
 * ItineraryContextRail — empty-start cue (T6 #2).
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ItineraryContextRail } from "./ItineraryContextRail";

/** Independent literals from approved itinerary-plan-draft-v1.html clearStopSelection + empty-only panel. */
const CTX_EMPTY_TITLE = "No activity selected";
const CTX_EMPTY_META = "Select a stop to inspect";
const EMPTY_START_HEADING = "Start here";
const EMPTY_START_BODY = "Add under a day. Fields appear as you enrich.";

describe("ItineraryContextRail empty-start cue", () => {
  afterEach(() => {
    cleanup();
  });

  it("With no selection, rail shows the empty-start cue (not a marketing card grid)", () => {
    render(<ItineraryContextRail />);

    const context = screen.getByRole("complementary", {
      name: /context inspector/i,
    });

    expect(within(context).getByRole("heading", { level: 2 })).toHaveTextContent(
      CTX_EMPTY_TITLE,
    );
    expect(context.querySelector("#ctx-meta")).toHaveTextContent(CTX_EMPTY_META);

    // Draft empty-only panel (itinerary-plan-draft-v1.html) — not a marketing card grid.
    expect(
      within(context).getByRole("heading", { name: EMPTY_START_HEADING }),
    ).toBeInTheDocument();
    expect(within(context).getByText(EMPTY_START_BODY)).toBeInTheDocument();
    expect(within(context).queryAllByRole("article")).toHaveLength(0);
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
