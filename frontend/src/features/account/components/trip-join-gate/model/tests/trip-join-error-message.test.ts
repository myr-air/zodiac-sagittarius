import { describe, expect, it } from "vitest";
import { TripApiError } from "@/src/trip/api-client";
import { errorMessage } from "../trip-join-error-message";

describe("trip join error message", () => {
  it("returns distinct message for 404 not found vs 401/403 fallback", () => {
    const fallback = "Trip ID or password is incorrect.";

    // Status 404 (invite link expired/invalid) → specific message, NOT fallback
    expect(
      errorMessage(
        new TripApiError({ code: "not_found", message: "No trip", status: 404 }),
        fallback,
      ),
    ).toBe("This invite link is invalid or has expired.");

    // Status 401 (wrong password) → generic fallback
    expect(
      errorMessage(
        new TripApiError({ code: "unauthorized", message: "Bad password", status: 401 }),
        fallback,
      ),
    ).toBe(fallback);

    // Status 403 (access denied) → generic fallback
    expect(
      errorMessage(
        new TripApiError({ code: "forbidden", message: "Access denied", status: 403 }),
        fallback,
      ),
    ).toBe(fallback);
  });
});
