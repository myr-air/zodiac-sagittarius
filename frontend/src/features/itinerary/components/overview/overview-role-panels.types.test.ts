import { describe, expect, it } from "vitest";
import {
  taskScopeFilterValues,
  taskStatusFilterValues,
} from "./overview-role-panels.types";

describe("overview role panel filter values", () => {
  it("keeps task filter values in shared control order", () => {
    expect(taskScopeFilterValues).toEqual(["mine", "trip", "all"]);
    expect(taskStatusFilterValues).toEqual(["all", "open", "done"]);
  });
});
