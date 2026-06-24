import { describe, expect, it } from "vitest";

import { toggleId, uniqueIds, uniqueStrings } from "..";

describe("id list helpers", () => {
  it("deduplicates non-empty strings while preserving first-seen order", () => {
    expect(uniqueStrings(["Japan", "China", "Japan", "", "Thailand"])).toEqual([
      "Japan",
      "China",
      "Thailand",
    ]);
  });

  it("deduplicates non-empty ids while preserving first-seen order", () => {
    expect(uniqueIds(["a", "b", "a", "", "c"])).toEqual(["a", "b", "c"]);
  });

  it("toggles an id in an ordered id list", () => {
    expect(toggleId(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });
});
