import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import type { Expense } from "@/src/trip/types";
import {
  appendExpenseSplitEditorLineItem,
  changeExpenseSplitEditorMode,
  initialExpenseSplitEditorState,
  toggleExpenseSplitEditorLineParticipant,
  updateExpenseSplitEditorLineItem,
  updateExpenseSplitEditorValue,
} from "../expense-split-editor";

const members = seedTrip.members
  .filter((member) => member.id !== "member-viewer")
  .slice(0, 2);

describe("expense split editor model", () => {
  it("builds equal split state for a new expense", () => {
    expect(initialExpenseSplitEditorState({ expense: null, members })).toEqual({
      lineItems: [
        {
          id: "line-local-1",
          title: "",
          amount: "",
          participantIds: members.map((member) => member.id),
        },
      ],
      splitMode: "equal",
      splitValues: {
        [members[0].id]: "0",
        [members[1].id]: "0",
      },
    });
  });

  it("builds a personal split state for quick personal accounting", () => {
    expect(
      initialExpenseSplitEditorState({
        expense: null,
        initialSplitMode: "personal",
        members,
      }),
    ).toEqual({
      lineItems: [
        {
          id: "line-local-1",
          title: "",
          amount: "",
          participantIds: members.map((member) => member.id),
        },
      ],
      splitMode: "personal",
      splitValues: {
        [members[0].id]: "0",
        [members[1].id]: "0",
      },
    });
  });

  it("builds itemized split state from an existing line item expense", () => {
    const expense = {
      id: "expense-itemized",
      lineItems: [
        {
          id: "line-1",
          title: "Taxi",
          amount: 125,
          participantIds: [members[0].id, "removed-member"],
        },
      ],
      splits: {
        [members[0].id]: 125,
      },
    } as Expense;

    expect(initialExpenseSplitEditorState({ expense, members })).toEqual({
      lineItems: [
        {
          id: "line-1",
          title: "Taxi",
          amount: "125",
          participantIds: [members[0].id],
        },
      ],
      splitMode: "itemized",
      splitValues: {
        [members[0].id]: "125",
        [members[1].id]: "0",
      },
    });
  });

  it("applies mode transitions against the current editor state", () => {
    const state = {
      lineItems: [],
      splitMode: "equal" as const,
      splitValues: {
        [members[0].id]: "0",
        [members[1].id]: "0",
      },
    };

    expect(
      changeExpenseSplitEditorMode({
        members,
        nextMode: "shares",
        state,
      }),
    ).toEqual({
      lineItems: [],
      splitMode: "shares",
      splitValues: {
        [members[0].id]: "1",
        [members[1].id]: "1",
      },
    });

    expect(
      changeExpenseSplitEditorMode({
        members,
        nextMode: "itemized",
        state,
      }),
    ).toEqual({
      lineItems: [
        {
          id: "line-local-1",
          title: "",
          amount: "",
          participantIds: members.map((member) => member.id),
        },
      ],
      splitMode: "itemized",
      splitValues: state.splitValues,
    });
  });

  it("updates line items, participants, and member split values", () => {
    const state = initialExpenseSplitEditorState({ expense: null, members });
    const withTitle = updateExpenseSplitEditorLineItem(state, 0, {
      amount: "18",
      title: "Breakfast",
    });
    const withoutSecondMember = toggleExpenseSplitEditorLineParticipant(
      withTitle,
      0,
      members[1].id,
    );
    const withSecondLine = appendExpenseSplitEditorLineItem(
      withoutSecondMember,
      members,
    );
    const withSplitValue = updateExpenseSplitEditorValue(
      withSecondLine,
      members[0].id,
      "18",
    );

    expect(withSplitValue).toEqual({
      lineItems: [
        {
          id: "line-local-1",
          title: "Breakfast",
          amount: "18",
          participantIds: [members[0].id],
        },
        {
          id: "line-local-2",
          title: "",
          amount: "",
          participantIds: members.map((member) => member.id),
        },
      ],
      splitMode: "equal",
      splitValues: {
        [members[0].id]: "18",
        [members[1].id]: "0",
      },
    });
  });
});
