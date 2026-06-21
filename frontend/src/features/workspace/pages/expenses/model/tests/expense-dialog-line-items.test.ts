import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  parseExpenseLineItems,
  validExpenseLineItems,
} from "../expense-dialog-line-items";

const members = seedTrip.members.filter((member) => member.id !== "member-viewer").slice(0, 2);

describe("expense dialog line item helpers", () => {
  it("parses and filters itemized lines for split calculations", () => {
    const parsed = parseExpenseLineItems([
      { id: "", title: "  Taxi  ", amount: "15.5", participantIds: [members[0].id] },
      { id: "line-empty", title: "  ", amount: "10", participantIds: [members[0].id] },
      { id: "line-zero", title: "Snack", amount: "0", participantIds: [members[0].id] },
      { id: "line-none", title: "Tea", amount: "4", participantIds: [] },
    ]);

    expect(parsed[0]).toEqual({
      id: "line-1",
      title: "Taxi",
      amount: 15.5,
      participantIds: [members[0].id],
    });
    expect(validExpenseLineItems(parsed)).toEqual([parsed[0]]);
  });
});
