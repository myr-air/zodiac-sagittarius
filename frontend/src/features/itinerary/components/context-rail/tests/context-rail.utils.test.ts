import { describe, expect, it } from "vitest";

import { contextRailTabValues } from "../context-rail.utils";

describe("context rail utils", () => {
  it("keeps context rail tabs in display order", () => {
    expect(contextRailTabValues).toEqual(["notes", "booking", "suggestions"]);
  });
});
