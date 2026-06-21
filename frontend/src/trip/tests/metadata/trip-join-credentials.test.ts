import { describe, expect, it } from "vitest";
import {
  generateJoinPassword,
  generateTripJoinId,
  randomToken,
} from "../../trip-join-credentials";

describe("trip join credentials", () => {
  it("formats join ids from trip dates, route codes, and suffixes", () => {
    expect(generateTripJoinId({ startDate: "2026-06-21", routeCode: "TYO", suffix: "ABC" })).toBe("0626-TYO-ABC");
    expect(generateTripJoinId({ startDate: "not-a-date", routeCode: "NAR", suffix: "xyz" })).toBe("0000-NAR-XYZ");
  });

  it("generates invite passwords and tokens with the expected alphabet", () => {
    expect(generateJoinPassword()).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(randomToken(6)).toMatch(/^[A-Z0-9]{6}$/);
  });
});
