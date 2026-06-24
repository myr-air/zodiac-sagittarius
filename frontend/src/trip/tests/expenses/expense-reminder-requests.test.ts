import { describe, expect, it } from "vitest";
import {
  buildExpenseReminderRequest,
  buildPaybackReminder,
  expenseReminderRequestForSuggestion,
} from "../../expenses";
import type { Trip } from "../../types";

describe("expense reminder requests", () => {
  it("builds a direct payback reminder that can be pasted into chat", () => {
    const trip = {
      name: "Weekend food crawl",
      members: [
        { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
        { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
      ],
      itineraryItems: [],
      expenses: [],
    } as unknown as Pick<Trip, "name" | "members" | "itineraryItems" | "expenses">;

    expect(buildPaybackReminder({
      trip,
      suggestion: { from: "member-beam", to: "member-aom", amount: 42.5 },
    })).toBe("Beam, please pay Aom HK$42.50 for Weekend food crawl. Mark it as paid in Joii after you send it.");
  });

  it("builds API reminder requests from settlement suggestions", () => {
    expect(
      expenseReminderRequestForSuggestion({
        from: "member-beam",
        to: "member-aom",
        amount: 42.56,
      }),
    ).toEqual({
      from: "member-beam",
      to: "member-aom",
      amountMinor: 4256,
    });
  });

  it("builds expense reminder API requests with mutation ids", () => {
    expect(
      buildExpenseReminderRequest(
        {
          from: "member-beam",
          to: "member-aom",
          amount: 42.56,
        },
        {
          clientMutationId: "expense-reminder-mutation",
        },
      ),
    ).toEqual({
      clientMutationId: "expense-reminder-mutation",
      from: "member-beam",
      to: "member-aom",
      amountMinor: 4256,
    });
  });
});
