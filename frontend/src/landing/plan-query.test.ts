import { describe, expect, it } from "vitest";
import { canStartPlanning } from "./plan-query";

describe("canStartPlanning", () => {
  it("rejects empty and whitespace-only queries", () => {
    expect(canStartPlanning("")).toBe(false);
    expect(canStartPlanning("   ")).toBe(false);
    expect(canStartPlanning("\t\n")).toBe(false);
  });

  it("accepts trimmed non-empty queries", () => {
    expect(canStartPlanning("Vietnam")).toBe(true);
    expect(canStartPlanning("  Tokyo  ")).toBe(true);
  });
});
