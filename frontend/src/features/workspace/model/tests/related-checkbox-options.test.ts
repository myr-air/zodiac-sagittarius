import { describe, expect, it } from "vitest";
import {
  buildExpenseOptions,
  buildItineraryItemOptions,
  buildMemberOptions,
  buildStopNoteOptions,
  buildTaskOptions,
} from "../related-checkbox-options";

describe("workspace related checkbox options", () => {
  it("builds itinerary labels from the shared day/activity format", () => {
    expect(buildItineraryItemOptions([
      { id: "item-1", day: "Day 2", activity: "Ferry to Macau" },
    ])).toEqual([{ id: "item-1", label: "Day 2 · Ferry to Macau" }]);
  });

  it("builds relation option labels from workspace record display fields", () => {
    expect(buildMemberOptions([{ id: "member-1", displayName: "Aom" }])).toEqual([
      { id: "member-1", label: "Aom" },
    ]);
    expect(buildTaskOptions([{ id: "task-1", title: "Book train" }])).toEqual([
      { id: "task-1", label: "Book train" },
    ]);
    expect(buildExpenseOptions([{ id: "expense-1", title: "Lunch" }])).toEqual([
      { id: "expense-1", label: "Lunch" },
    ]);
    expect(buildStopNoteOptions([{ id: "note-1", body: "Meet at gate A" }])).toEqual([
      { id: "note-1", label: "Meet at gate A" },
    ]);
  });
});
