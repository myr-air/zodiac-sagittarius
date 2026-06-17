import { describe, expect, it } from "vitest";
import { TripApiError } from "./api-client";
import {
  isAuthFailure,
  isForbidden,
  isUnauthenticated,
  isVersionConflict,
} from "./api-errors";

describe("trip API error helpers", () => {
  it("classifies unauthenticated and forbidden API errors", () => {
    const unauthenticated = new TripApiError({
      code: "unauthenticated",
      message: "Session expired",
      status: 401,
    });
    const forbidden = new TripApiError({
      code: "forbidden",
      message: "No access",
      status: 403,
    });

    expect(isUnauthenticated(unauthenticated)).toBe(true);
    expect(isForbidden(forbidden)).toBe(true);
    expect(isAuthFailure(unauthenticated)).toBe(true);
    expect(isAuthFailure(forbidden)).toBe(true);
  });

  it("does not classify other errors as auth failures", () => {
    expect(isAuthFailure(new Error("network"))).toBe(false);
    expect(
      isAuthFailure(
        new TripApiError({
          code: "version_conflict",
          message: "Reload latest trip",
          status: 409,
        }),
      ),
    ).toBe(false);
  });

  it("classifies API version conflicts", () => {
    const versionConflict = new TripApiError({
      code: "version_conflict",
      message: "Reload latest trip",
      status: 409,
    });

    expect(isVersionConflict(versionConflict)).toBe(true);
    expect(isVersionConflict(new Error("network"))).toBe(false);
    expect(
      isVersionConflict(
        new TripApiError({
          code: "forbidden",
          message: "No access",
          status: 403,
        }),
      ),
    ).toBe(false);
  });
});
