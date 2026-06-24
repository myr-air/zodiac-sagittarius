import { describe, expect, it } from "vitest";
import {
  contextRailBookingDocTypeSelectOptions,
  contextRailExpenseCategorySelectOptions,
  contextRailMemberSelectOptions,
} from "../context-rail-select-options";

describe("context rail select options", () => {
  it("builds payer options from member display names", () => {
    expect(
      contextRailMemberSelectOptions([
        { id: "member-aom", displayName: "Aom" },
        { id: "member-beam", displayName: "Beam" },
      ]),
    ).toEqual([
      { value: "member-aom", label: "Aom" },
      { value: "member-beam", label: "Beam" },
    ]);
  });

  it("keeps expense categories in context rail source order", () => {
    expect(contextRailExpenseCategorySelectOptions()).toEqual([
      { value: "food", label: "food" },
      { value: "transport", label: "transport" },
      { value: "tickets", label: "tickets" },
      { value: "stay", label: "stay" },
      { value: "shopping", label: "shopping" },
      { value: "settlement", label: "settlement" },
    ]);
  });

  it("formats booking document type options from the domain type list", () => {
    expect(contextRailBookingDocTypeSelectOptions()).toEqual([
      { value: "flight", label: "Flight" },
      { value: "train", label: "Train" },
      { value: "public_transport", label: "Public Transport" },
      { value: "hotel", label: "Hotel" },
      { value: "insurance", label: "Insurance" },
      { value: "passport", label: "Passport" },
      { value: "visa", label: "Visa" },
      { value: "activity_ticket", label: "Activity Ticket" },
      { value: "other", label: "Other" },
    ]);
  });
});
