import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { enMessages } from "@/src/i18n/messages/en";
import { ExpenseSummaryStats } from "../components/ExpenseSummaryStats";

describe("ExpenseSummaryStats", () => {
  it("renders balance tone classes from the expenses style source", () => {
    render(
      <ExpenseSummaryStats
        currentNet={25}
        expenseSummary={{
          currentUserNetLabel: "+HK$25.00",
          groupSpend: 120,
          netByMember: {},
          settlementSuggestions: [],
        }}
        owedToYou={25}
        settlementCurrency="HKD"
        t={enMessages}
        youOwe={10}
      />,
    );

    expect(screen.getByRole("region", { name: "Money summary" })).toHaveClass("expenses-summary");
    expect(screen.getByText("+HK$25.00")).toHaveClass("text-[#15803d]");
    expect(screen.getByText("HK$25.00")).toHaveClass("text-[#15803d]");
    expect(screen.getByText("HK$10.00")).toHaveClass("text-[#b91c1c]");
  });
});
