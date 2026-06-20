import { describe, expect, it } from "vitest";

import { liveMapStatusText } from "./route-map.live-status";

describe("route map live status", () => {
  it("uses loading copy for non-error live map states", () => {
    expect(liveMapStatusText("idle", "Loading", "Failed")).toBe("Loading");
    expect(liveMapStatusText("loading", "Loading", "Failed")).toBe("Loading");
    expect(liveMapStatusText("ready", "Loading", "Failed")).toBe("Loading");
  });

  it("uses error copy when the live map fails", () => {
    expect(liveMapStatusText("error", "Loading", "Failed")).toBe("Failed");
  });
});
