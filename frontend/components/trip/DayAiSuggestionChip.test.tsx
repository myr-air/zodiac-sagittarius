/**
 * @vitest-environment happy-dom
 *
 * DayAiSuggestionChip — compact inline AI plan chip (M80VKAX5 T10 #1).
 * Landmarks from day-workspace-theme-a-draft-v9.html:
 *   <div class="inline-suggest">
 *     <button type="button" aria-haspopup="dialog">
 *       <strong>Plan A · …</strong> <span>summary</span> <span class="more">Details</span>
 * Theme A Calm Travel Ops — warning/teal chrome only; no purple AI styling.
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { DayAiSuggestionChip } from "./DayAiSuggestionChip";

/** Independent draft literals (Plan A chip under Wat Chedi). */
const OPTION_ID = "018f4e90-0000-7000-8000-0000000000a1";
const OPTION_LABEL = "A";
const OPTION_TITLE = "+45m buffer";
const CHIP_HEADING = "Plan A · +45m buffer";
const CHIP_SUMMARY = "Recommended · keep morning culture flow";
const DETAILS_LABEL = /^Details$/i;

/** Purple AI chrome must not appear (Theme A — teal Calm Travel Ops). */
const PURPLE_CLASS = /purple|violet|indigo|fuchsia/i;
const PURPLE_HEX = /#(?:7c3aed|8b5cf6|a855f7|9333ea|6d28d9)\b/i;

afterEach(() => {
  cleanup();
});

/**
 * T10 #1 (chip half): AI suggestions render as compact inline chips;
 * chip / Details click opens the plan dialog seam (onOpen) — not an accordion.
 */
describe("DayAiSuggestionChip compact inline chip", () => {
  it("renders a compact Plan chip with summary + Details; click opens dialog via onOpen; Theme A has no purple AI chrome", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();

    const { container } = render(
      <DayAiSuggestionChip
        option={{
          id: OPTION_ID,
          label: OPTION_LABEL,
          title: OPTION_TITLE,
          summary: CHIP_SUMMARY,
        }}
        onOpen={onOpen}
      />,
    );

    const wrap = container.querySelector(".inline-suggest");
    expect(wrap).toBeTruthy();

    const chip = screen.getByRole("button", {
      name: new RegExp(`${CHIP_HEADING}|Plan ${OPTION_LABEL}`, "i"),
    });
    expect(chip).toHaveAttribute("aria-haspopup", "dialog");
    expect(chip).toHaveTextContent(CHIP_HEADING);
    expect(chip).toHaveTextContent(CHIP_SUMMARY);
    expect(screen.getByText(DETAILS_LABEL)).toBeInTheDocument();

    // Compact: chip is a single control, not a multi-section accordion panel.
    expect(chip.closest("[data-ai-accordion], .ai-plans-panel, .suggest-strip")).toBeNull();
    expect(screen.queryByRole("region", { name: /AI plans|suggestions accordion/i })).not.toBeInTheDocument();

    // Theme A — no purple AI chrome on the chip tree.
    for (const el of [wrap!, chip, ...chip.querySelectorAll("*")]) {
      expect(el.className).not.toMatch(PURPLE_CLASS);
      const styleAttr = el.getAttribute("style") ?? "";
      expect(styleAttr).not.toMatch(PURPLE_HEX);
      expect(styleAttr).not.toMatch(PURPLE_CLASS);
    }

    await user.click(chip);
    expect(onOpen).toHaveBeenCalledTimes(1);

    onOpen.mockClear();
    await user.click(screen.getByText(DETAILS_LABEL));
    expect(onOpen).toHaveBeenCalled();
  });
});
