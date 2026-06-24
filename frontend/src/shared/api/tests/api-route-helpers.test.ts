import { describe, expect, it } from "vitest";
import {
  apiQueryString,
  encodeApiPathSegment,
} from "../api-route-helpers";

describe("API route helpers", () => {
  it("encodes route path segments with URL path semantics", () => {
    expect(encodeApiPathSegment("trip 1")).toBe("trip%201");
    expect(encodeApiPathSegment("plan / rain")).toBe("plan%20%2F%20rain");
  });

  it("builds optional query strings with URLSearchParams semantics", () => {
    expect(apiQueryString({ tripPlanId: "plan / rain" })).toBe("?tripPlanId=plan+%2F+rain");
    expect(apiQueryString({ tripPlanId: null, token: undefined })).toBe("");
  });
});
