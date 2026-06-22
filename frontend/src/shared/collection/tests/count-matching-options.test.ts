import { describe, expect, it } from "vitest";

import { countMatchingOptions } from "../count-matching-options";

describe("countMatchingOptions", () => {
  it("counts items for every option and keeps zero-count options", () => {
    const counts = countMatchingOptions(
      ["all", "fruit", "vegetable", "grain"] as const,
      [
        { kind: "fruit" },
        { kind: "fruit" },
        { kind: "vegetable" },
      ],
      (item, option) => option === "all" || item.kind === option,
    );

    expect(counts).toEqual({
      all: 3,
      fruit: 2,
      vegetable: 1,
      grain: 0,
    });
  });
});
