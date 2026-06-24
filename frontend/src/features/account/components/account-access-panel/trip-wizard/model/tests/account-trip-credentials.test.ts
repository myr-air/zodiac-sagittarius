import { describe, expect, it } from "vitest";
import { generateJoinId, generateJoinIdForTrip, generateJoinPassword, randomToken } from "../account-trip-credentials";

describe("account trip credential helpers", () => {
  it("generates route-aware join ids", () => {
    expect(generateJoinId("2026-06-21")).toMatch(/^0626-TRP-[A-Z0-9]{3}$/);
    expect(generateJoinIdForTrip("2026-06-21", ["Thailand", "Tokyo"], "ABC")).toBe("0626-TYO-ABC");
    expect(generateJoinIdForTrip("not-a-date", ["Narnia"], "xyz")).toBe("0000-NAR-XYZ");
  });

  it("generates invite passwords and tokens with the expected alphabet", () => {
    expect(generateJoinPassword()).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(randomToken(6)).toMatch(/^[A-Z0-9]{6}$/);
  });
});
