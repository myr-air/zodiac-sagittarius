import { describe, expect, it } from "vitest";
import {
  advisorySeverityValues,
  itineraryPathScopeValues,
} from "./trip-itinerary-types";

describe("trip itinerary type values", () => {
  it("keeps advisory severities in escalation order", () => {
    expect(advisorySeverityValues).toEqual(["info", "warning", "critical"]);
  });

  it("keeps itinerary path scopes explicit for import and filtering rules", () => {
    expect(itineraryPathScopeValues).toEqual(["day", "trip"]);
  });
});
