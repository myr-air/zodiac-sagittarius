import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  installOverviewPageClock,
  renderOverview,
} from "./support/overview-page-render";

beforeEach(() => {
  installOverviewPageClock();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("OverviewPage budget shortcuts", () => {
  it("opens the expense workspace from manager and traveler budget cards", async () => {
    const user = userEvent.setup();
    const { onOpenExpenses } = renderOverview("member-beam");

    await user.click(screen.getByRole("button", { name: /เปิดค่าใช้จ่าย/i }));

    expect(onOpenExpenses).toHaveBeenCalled();
  });

  it("offers an explicit shortcut for logging general trip expenses", async () => {
    const user = userEvent.setup();
    const { onOpenExpenses } = renderOverview("member-beam");

    await user.click(screen.getByRole("button", { name: /เพิ่มค่าใช้จ่ายทั่วไป/i }));

    expect(onOpenExpenses).toHaveBeenCalled();
  });
});
