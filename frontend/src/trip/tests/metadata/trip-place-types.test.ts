import { describe, expect, it } from "vitest";
import { placeResolutionStatusValues } from "../../places";

describe("trip place type values", () => {
  it("keeps place resolution statuses in resolver priority order", () => {
    expect(placeResolutionStatusValues).toEqual([
      "resolved",
      "ambiguous",
      "unresolved",
    ]);
  });
});
