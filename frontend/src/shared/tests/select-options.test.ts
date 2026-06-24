import { describe, expect, it } from "vitest";

import {
  buildSelectOptions,
  buildSelectOptionsFromItems,
  prependSelectOption,
} from "../select-options";

describe("buildSelectOptions", () => {
  it("builds value-label options in source order", () => {
    const options = buildSelectOptions(["flight", "hotel"] as const, (value) => value.toUpperCase());

    expect(options).toEqual([
      { value: "flight", label: "FLIGHT" },
      { value: "hotel", label: "HOTEL" },
    ]);
  });

  it("builds value-label options from item records", () => {
    const options = buildSelectOptionsFromItems(
      [
        { id: "plan-main", name: "Main" },
        { id: "plan-rain", name: "Rain plan" },
      ],
      (item) => item.id,
      (item) => item.name,
    );

    expect(options).toEqual([
      { value: "plan-main", label: "Main" },
      { value: "plan-rain", label: "Rain plan" },
    ]);
  });

  it("prepends an optional caller-owned select option", () => {
    expect(
      prependSelectOption(
        [{ value: "member-aom", label: "Aom" }],
        { value: "", label: "No owner" },
      ),
    ).toEqual([
      { value: "", label: "No owner" },
      { value: "member-aom", label: "Aom" },
    ]);

    expect(prependSelectOption([{ value: "member-aom", label: "Aom" }])).toEqual([
      { value: "member-aom", label: "Aom" },
    ]);
  });
});
