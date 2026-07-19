import { describe, expect, it } from "vitest";
import { landingCopy } from "./landing-copy";

describe("landingCopy", () => {
  it("returns EN header labels", () => {
    const copy = landingCopy("EN");
    expect(copy.logIn).toBe("Log in");
    expect(copy.tripAccess).toBe("Trip access");
    expect(copy.home).toBe("Home");
  });

  it("returns TH header labels", () => {
    const copy = landingCopy("TH");
    expect(copy.logIn).toBe("เข้าสู่ระบบ");
    expect(copy.tripAccess).toBe("เข้าทริป");
    expect(copy.explore).toBe("สำรวจ");
  });
});
