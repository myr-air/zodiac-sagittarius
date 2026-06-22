import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import {
  appendEmptyExpenseLineItem,
  expenseSplitModeTransitionFields,
  parseExpenseLineItems,
  toggleExpenseLineParticipant,
  updateEditableExpenseLineItem,
  validExpenseLineItems,
} from "../expense-dialog-line-items";

const members = seedTrip.members.filter((member) => member.id !== "member-viewer").slice(0, 2);

describe("expense dialog line item helpers", () => {
  it("appends a blank line item with the next local id and all members", () => {
    expect(appendEmptyExpenseLineItem([
      { id: "line-local-1", title: "Taxi", amount: "10", participantIds: [members[0].id] },
    ], members)).toEqual([
      { id: "line-local-1", title: "Taxi", amount: "10", participantIds: [members[0].id] },
      {
        id: "line-local-2",
        title: "",
        amount: "",
        participantIds: members.map((member) => member.id),
      },
    ]);
  });

  it("updates only the targeted editable line item", () => {
    const lineItems = [
      { id: "line-1", title: "Taxi", amount: "10", participantIds: [members[0].id] },
      { id: "line-2", title: "Lunch", amount: "20", participantIds: [members[1].id] },
    ];

    expect(updateEditableExpenseLineItem(lineItems, 1, {
      amount: "25",
      title: "Dinner",
    })).toEqual([
      lineItems[0],
      { id: "line-2", title: "Dinner", amount: "25", participantIds: [members[1].id] },
    ]);
    expect(updateEditableExpenseLineItem(lineItems, 10, { amount: "99" })).toEqual(lineItems);
  });

  it("toggles a participant only on the targeted line item", () => {
    const lineItems = [
      {
        id: "line-1",
        title: "Taxi",
        amount: "10",
        participantIds: [members[0].id, members[1].id],
      },
      { id: "line-2", title: "Lunch", amount: "20", participantIds: [members[1].id] },
    ];

    expect(toggleExpenseLineParticipant(lineItems, 0, members[1].id)).toEqual([
      { ...lineItems[0], participantIds: [members[0].id] },
      lineItems[1],
    ]);
    expect(toggleExpenseLineParticipant(lineItems, 1, members[0].id)).toEqual([
      lineItems[0],
      { ...lineItems[1], participantIds: [members[1].id, members[0].id] },
    ]);
    expect(toggleExpenseLineParticipant(lineItems, 10, members[0].id)).toEqual(lineItems);
  });

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

  it("builds split value resets for exact, percentage, and share modes", () => {
    expect(expenseSplitModeTransitionFields({
      lineItems: [],
      members,
      nextMode: "exact",
    })).toEqual({
      splitValues: {
        [members[0].id]: "0",
        [members[1].id]: "0",
      },
    });
    expect(expenseSplitModeTransitionFields({
      lineItems: [],
      members,
      nextMode: "percentage",
    })).toEqual({
      splitValues: {
        [members[0].id]: "0",
        [members[1].id]: "0",
      },
    });
    expect(expenseSplitModeTransitionFields({
      lineItems: [],
      members,
      nextMode: "shares",
    })).toEqual({
      splitValues: {
        [members[0].id]: "1",
        [members[1].id]: "1",
      },
    });
  });

  it("creates an itemized line only when switching to itemized with no lines", () => {
    expect(expenseSplitModeTransitionFields({
      lineItems: [],
      members,
      nextMode: "itemized",
    })).toEqual({
      lineItems: [
        {
          id: "line-local-1",
          title: "",
          amount: "",
          participantIds: members.map((member) => member.id),
        },
      ],
    });

    expect(expenseSplitModeTransitionFields({
      lineItems: [{ id: "line-existing", title: "Taxi", amount: "10", participantIds: [members[0].id] }],
      members,
      nextMode: "itemized",
    })).toEqual({});
  });
});
