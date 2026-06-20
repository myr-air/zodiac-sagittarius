import { describe, expect, it } from "vitest";
import { recordLocalExpenseReminderInTrip } from "./expenses";
import type { Trip } from "./types";

describe("expense reminder local mutations", () => {
  it("records local expense reminders with deterministic timestamps", () => {
    const trip = {
      expenseReminders: [
        {
          tripPlanId: "plan-main",
          from: "member-beam",
          to: "member-aom",
          amount: 42.5,
          lastRemindedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    } as Pick<Trip, "expenseReminders">;

    const nextTrip = recordLocalExpenseReminderInTrip(
      trip,
      { from: "member-beam", to: "member-aom", amount: 42.5 },
      {
        tripPlanId: "plan-main",
        remindedAt: "2026-06-02T00:00:00.000Z",
      },
    );

    expect(nextTrip).not.toBe(trip);
    expect(nextTrip.expenseReminders).toEqual([
      {
        tripPlanId: "plan-main",
        from: "member-beam",
        to: "member-aom",
        amount: 42.5,
        lastRemindedAt: "2026-06-02T00:00:00.000Z",
      },
    ]);
  });
});
