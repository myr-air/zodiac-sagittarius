import { describe, expect, it } from "vitest";
import { generateJoinIdForTrip, generateJoinPassword, randomToken } from "./account-trip-credentials";

describe("account trip credential helpers", () => {
  it("generates route-aware join ids", () => {
    expect(generateJoinIdForTrip("2026-06-21", ["Thailand", "Tokyo"], "ABC")).toBe("0626-TYO-ABC");
    expect(generateJoinIdForTrip("not-a-date", ["Narnia"], "xyz")).toBe("0000-NAR-XYZ");
  });

  it("generates invite passwords and tokens with the expected alphabet", () => {
    expect(generateJoinPassword()).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(randomToken(6)).toMatch(/^[A-Z0-9]{6}$/);
  });
});
