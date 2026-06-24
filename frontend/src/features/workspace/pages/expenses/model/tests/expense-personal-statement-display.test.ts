import { describe, expect, it } from "vitest";
import { enExpensesMessages } from "@/src/i18n/messages/en.expenses";
import { seedTrip } from "@/src/trip/seed";
import { personalStatementRows } from "../expense-personal-statement-display";

const copy = {
  dateFallback: enExpensesMessages.statement.dateFallback,
  flow: enExpensesMessages.statement.personal.flow,
  includedLineItems: enExpensesMessages.statement.personal.includedLineItems,
  noDirectAllocation: enExpensesMessages.statement.personal.noDirectAllocation,
  paymentMethod: enExpensesMessages.statement.personal.paymentMethod,
  relatedMember: enExpensesMessages.statement.personal.relatedMember,
};

describe("personal statement display", () => {
  it("breaks the current member statement down by owed spend and payback records", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
      displayCurrency: "THB",
      displayExchangeRate: 4.62,
      locale: "en",
      settlementCurrency: "HKD",
      trip: seedTrip,
    });

    expect(rows.find((row) => row.id === "spend-expense-airport-express-member-beam")).toMatchObject({
      amountLabel: "HK$115.00",
      flow: "paidForGroup",
      paidWithLabel: "Paid at source",
      relatedMemberLabel: "You paid",
    });
    expect(rows.find((row) => row.id === "spend-expense-luk-yu-dinner-member-beam")).toMatchObject({
      amountLabel: "HK$380.00",
      flow: "friendPaid",
      paidWithLabel: "Not paid back yet",
      relatedMemberLabel: "Paid for you by Explorer Friend",
    });
    expect(rows.find((row) => row.id === "settlement-sent-expense-beam-paid-aom")).toMatchObject({
      amountLabel: "HK$650.00",
      flow: "paybackSent",
      relatedMemberLabel: "Sent to Demo Traveler",
    });
    expect(rows.some((row) => row.includedLabel.includes("Adult tickets"))).toBe(true);
  });

  it("marks friend-paid expenses covered when a payback to that payer exists", () => {
    const rows = personalStatementRows({
      copy,
      currentMemberId: "member-beam",
      displayCurrency: "HKD",
      displayExchangeRate: 1,
      locale: "en",
      settlementCurrency: "HKD",
      trip: seedTrip,
    });

    expect(rows.find((row) => row.id === "spend-expense-dimsum-member-beam")).toMatchObject({
      flow: "friendPaid",
      paidWithLabel: "Partly paid back · Aom received Beam payback",
      settlementState: "partial",
    });
    expect(rows.find((row) => row.id === "spend-expense-hotel-deposit-member-beam")).toMatchObject({
      flow: "friendPaid",
      paidWithLabel: "Paid back · Aom received Beam payback",
      settlementState: "covered",
    });
  });
});
