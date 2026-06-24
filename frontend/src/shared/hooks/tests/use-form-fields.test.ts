import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFormFields } from "../use-form-fields";

interface TestFields {
  amount: string;
  title: string;
  touched: boolean;
}

describe("useFormFields", () => {
  it("updates one field and preserves the rest of the grouped form state", () => {
    const { result } = renderHook(() =>
      useFormFields<TestFields>({
        amount: "100",
        title: "Dinner",
        touched: false,
      }),
    );

    act(() => result.current.updateField("title", "Breakfast"));

    expect(result.current.fields).toEqual({
      amount: "100",
      title: "Breakfast",
      touched: false,
    });
  });

  it("merges several fields into the grouped form state", () => {
    const { result } = renderHook(() =>
      useFormFields<TestFields>({
        amount: "100",
        title: "Dinner",
        touched: false,
      }),
    );

    act(() => result.current.updateFields({ amount: "250", touched: true }));

    expect(result.current.fields).toEqual({
      amount: "250",
      title: "Dinner",
      touched: true,
    });
  });
});
