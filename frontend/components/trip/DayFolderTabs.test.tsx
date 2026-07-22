/**
 * @vitest-environment happy-dom
 *
 * DayFolderTabs — Plan Day folder tabs + Add day (M80VKAX5 T2).
 * Draft landmarks: day-workspace-theme-a-draft-v9.html
 *   <div class="day-tabs" role="tablist" aria-label="Plan days">
 *   <button class="day-tab" role="tab">…</button>
 *   <button class="day-add" aria-label="Add day">+</button>
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { DayFolderTabs } from "./DayFolderTabs";

/**
 * Independent calendar spine literals (inclusive start→end).
 * Not recomputed from production helpers.
 */
const SPINE_DAYS = ["2026-04-12", "2026-04-13", "2026-04-14"] as const;
const SELECTED_DAY = "2026-04-13";
/** Draft tablist aria-label. */
const TABLIST_LABEL = /Plan days/i;
/** Draft Day N labels for a 3-day spine. */
const DAY_TAB_NAMES = [/^Day 1\b/i, /^Day 2\b/i, /^Day 3\b/i] as const;
/** Draft + control. */
const ADD_DAY_LABEL = /Add day/i;

afterEach(() => {
  cleanup();
});

describe("DayFolderTabs Plan Day spine", () => {
  it("renders one folder tab per Plan Day ISO date and selecting a tab notifies onSelectDay", async () => {
    const user = userEvent.setup();
    const onSelectDay = vi.fn();
    const onAddDay = vi.fn();

    render(
      <DayFolderTabs
        days={[...SPINE_DAYS]}
        selectedDay={SELECTED_DAY}
        onSelectDay={onSelectDay}
        onAddDay={onAddDay}
      />,
    );

    const tablist = screen.getByRole("tablist", { name: TABLIST_LABEL });
    const tabs = within(tablist).getAllByRole("tab");
    expect(tabs).toHaveLength(SPINE_DAYS.length);

    for (const [index, name] of DAY_TAB_NAMES.entries()) {
      const tab = within(tablist).getByRole("tab", { name });
      expect(tab).toBeInTheDocument();
      // Selected day is the middle spine date (Day 2).
      if (SPINE_DAYS[index] === SELECTED_DAY) {
        expect(tab).toHaveAttribute("aria-selected", "true");
      } else {
        expect(tab).not.toHaveAttribute("aria-selected", "true");
      }
    }

    const day1 = within(tablist).getByRole("tab", { name: DAY_TAB_NAMES[0] });
    await user.click(day1);

    expect(onSelectDay).toHaveBeenCalledTimes(1);
    expect(onSelectDay).toHaveBeenCalledWith(SPINE_DAYS[0]);
    expect(onAddDay).not.toHaveBeenCalled();
  });
});

describe("DayFolderTabs + day", () => {
  it("Add day control invokes onAddDay without selecting an existing tab", async () => {
    const user = userEvent.setup();
    const onSelectDay = vi.fn();
    const onAddDay = vi.fn();

    render(
      <DayFolderTabs
        days={[...SPINE_DAYS]}
        selectedDay={SELECTED_DAY}
        onSelectDay={onSelectDay}
        onAddDay={onAddDay}
      />,
    );

    const addDay = screen.getByRole("button", { name: ADD_DAY_LABEL });
    await user.click(addDay);

    expect(onAddDay).toHaveBeenCalledTimes(1);
    expect(onSelectDay).not.toHaveBeenCalled();
  });
});
