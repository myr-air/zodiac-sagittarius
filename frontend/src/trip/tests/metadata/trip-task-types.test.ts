import { describe, expect, it } from "vitest";
import {
  tripTaskKindValues,
  tripTaskStatusValues,
  tripTaskVisibilityValues,
} from "../../records";

describe("trip task type values", () => {
  it("keeps task enum values in canonical display order", () => {
    expect(tripTaskStatusValues).toEqual(["open", "done"]);
    expect(tripTaskVisibilityValues).toEqual(["private", "shared"]);
    expect(tripTaskKindValues).toEqual(["prep", "booking"]);
  });
});
