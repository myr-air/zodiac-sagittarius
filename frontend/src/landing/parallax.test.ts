import { describe, expect, it } from "vitest";
import { parallaxOffset } from "./parallax";

describe("parallaxOffset", () => {
  it("returns 0 at scrollY 0", () => {
    expect(parallaxOffset(0)).toBe(0);
  });

  it("applies 0.35 factor within range", () => {
    expect(parallaxOffset(100)).toBe(35);
    expect(parallaxOffset(200)).toBe(70);
  });

  it("clamps negative scroll to 0", () => {
    expect(parallaxOffset(-50)).toBe(0);
  });

  it("clamps scroll above 720", () => {
    expect(parallaxOffset(720)).toBe(Math.round(720 * 0.35));
    expect(parallaxOffset(1000)).toBe(Math.round(720 * 0.35));
  });
});
