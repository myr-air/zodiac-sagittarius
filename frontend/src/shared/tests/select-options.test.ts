import { describe, expect, it } from "vitest";

import { buildSelectOptions } from "../select-options";

describe("buildSelectOptions", () => {
  it("builds value-label options in source order", () => {
    const options = buildSelectOptions(["flight", "hotel"] as const, (value) => value.toUpperCase());

    expect(options).toEqual([
      { value: "flight", label: "FLIGHT" },
      { value: "hotel", label: "HOTEL" },
    ]);
  });
});
