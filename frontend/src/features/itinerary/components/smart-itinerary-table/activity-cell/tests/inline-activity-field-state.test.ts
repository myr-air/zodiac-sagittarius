import { describe, expect, it } from "vitest";

import {
  commitInlineActivityFieldDraft,
  initialInlineActivityFieldState,
  resetInlineActivityFieldDraft,
  updateInlineActivityFieldDraft,
} from "../inline-activity-field-state";

describe("inline activity field state", () => {
  it("starts draft and source from the current value", () => {
    expect(initialInlineActivityFieldState("Lunch")).toEqual({
      draft: "Lunch",
      source: "Lunch",
    });
  });

  it("updates draft without changing the source value", () => {
    expect(
      updateInlineActivityFieldDraft(
        {
          draft: "Lunch",
          source: "Lunch",
        },
        "Dinner",
      ),
    ).toEqual({
      draft: "Dinner",
      source: "Lunch",
    });
  });

  it("resets draft to the source value", () => {
    expect(
      resetInlineActivityFieldDraft({
        draft: "Dinner",
        source: "Lunch",
      }),
    ).toEqual({
      draft: "Lunch",
      source: "Lunch",
    });
  });

  it("commits draft as the new source value", () => {
    expect(commitInlineActivityFieldDraft("Dinner")).toEqual({
      draft: "Dinner",
      source: "Dinner",
    });
  });
});
