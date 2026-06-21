import { describe, expect, it } from "vitest";
import { mapLoadStateValues } from "../map-load-state";

describe("map load state values", () => {
  it("keeps live map lifecycle states in transition order", () => {
    expect(mapLoadStateValues).toEqual(["idle", "loading", "ready", "error"]);
  });
});
