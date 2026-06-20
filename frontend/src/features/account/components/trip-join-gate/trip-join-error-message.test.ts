import { describe, expect, it } from "vitest";
import { TripApiError } from "@/src/trip/api-client";
import { errorMessage } from "./trip-join-error-message";

describe("trip join error message", () => {
  it("keeps user-safe fallback copy for expected API errors", () => {
    expect(errorMessage(new TripApiError({ code: "not_found", message: "No trip", status: 404 }), "Try again")).toBe("Try again");
    expect(errorMessage(new TripApiError({ code: "custom_join_error", message: "Custom", status: 409 }), "Try again")).toBe("custom_join_error");
  });
});
