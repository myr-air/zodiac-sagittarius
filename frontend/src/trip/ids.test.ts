import { describe, expect, it } from "vitest";
import { decodeTripId, encodeTripId, shortTripId } from "@/src/trip/ids";

describe("shortTripId", () => {
  it("cuts from front by default", () => {
    expect(shortTripId("018f4e80-5788-7de0-a45c-8a555d17fc2d")).toBe("018f4e80");
  });

  it("cuts from back when requested", () => {
    expect(shortTripId("018f4e80-5788-7de0-a45c-8a555d17fc2d", { mode: "back", length: 6 })).toBe("17fc2d");
  });

  it("encodes a UUID into a short path-safe trip id", () => {
    expect(encodeTripId("018f4e80-5788-7de0-a45c-8a555d17fc2d")).toBe("AY9OgFeIfeCkXIpVXRf8LQ");
  });

  it("decodes a short path-safe trip id back to UUID", () => {
    expect(decodeTripId("AY9OgFeIfeCkXIpVXRf8LQ")).toBe("018f4e80-5788-7de0-a45c-8a555d17fc2d");
  });

  it("keeps plain ids unchanged", () => {
    expect(encodeTripId("trip-1")).toBe("trip-1");
    expect(decodeTripId("trip-1")).toBe("trip-1");
    expect(decodeTripId("trip%201")).toBe("trip 1");
  });
});
