/**
 * @vitest-environment happy-dom
 *
 * ItineraryContextRail — empty-start cue (T6 #2).
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
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
