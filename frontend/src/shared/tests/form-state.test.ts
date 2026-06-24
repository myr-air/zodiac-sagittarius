import { describe, expect, it } from "vitest";
import {
  toggleIdFieldState,
  updateFieldsState,
  updateFieldState,
} from "../form-state";

interface TestFormState {
  amount: string;
  exchangeRateTouched: boolean;
  relatedIds: string[];
  title: string;
}

const baseState: TestFormState = {
  amount: "100",
  exchangeRateTouched: false,
  relatedIds: ["item-1"],
  title: "Dinner",
};

describe("form state helpers", () => {
  it("updates one field without mutating current state", () => {
    const nextState = updateFieldState(baseState, "title", "Breakfast");

    expect(nextState).toEqual({
      ...baseState,
      title: "Breakfast",
    });
    expect(baseState.title).toBe("Dinner");
  });

  it("merges several fields without mutating current state", () => {
    const nextState = updateFieldsState(baseState, {
      amount: "250",
      exchangeRateTouched: true,
    });

    expect(nextState).toEqual({
      ...baseState,
      amount: "250",
      exchangeRateTouched: true,
    });
    expect(baseState.amount).toBe("100");
  });

  it("toggles an id-list field without mutating current state", () => {
    const addedState = toggleIdFieldState(baseState, "relatedIds", "item-2");
    const removedState = toggleIdFieldState(addedState, "relatedIds", "item-1");

    expect(addedState.relatedIds).toEqual(["item-1", "item-2"]);
    expect(removedState.relatedIds).toEqual(["item-2"]);
    expect(baseState.relatedIds).toEqual(["item-1"]);
  });
});
