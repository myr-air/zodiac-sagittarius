import { describe, expect, it } from "vitest";
import {
  expenseCategorySelectOptions,
  expenseCategoryValues,
} from "@/src/trip/expenses";

describe("expense options", () => {
  it("builds category select options from the canonical category values", () => {
    expect(expenseCategorySelectOptions()).toEqual(
      expenseCategoryValues.map((value) => ({ value, label: value })),
    );
  });
});
