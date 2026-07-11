import { describe, it, expect } from "vitest";
import { PHASES, PHASE_ORDER, PHASE_LABELS, PHASE_ICONS, type Phase } from "../phase";

describe("Phase type definitions", () => {
  it("exports 6 phases as a readonly tuple", () => {
    expect(PHASES).toHaveLength(6);
    expect(PHASES).toEqual([
      "dreamer",
      "flexible-hunter",
      "route-builder",
      "detail-planner",
      "group-wrangler",
      "on-trip-companion",
    ]);
  });

  it("PHASE_ORDER lists all 6 phases in journey order", () => {
    expect(PHASE_ORDER).toHaveLength(6);
    expect(PHASE_ORDER[0]).toBe("dreamer");
    expect(PHASE_ORDER[1]).toBe("flexible-hunter");
    expect(PHASE_ORDER[2]).toBe("route-builder");
    expect(PHASE_ORDER[3]).toBe("detail-planner");
    expect(PHASE_ORDER[4]).toBe("group-wrangler");
    expect(PHASE_ORDER[5]).toBe("on-trip-companion");
  });
});

describe("PHASE_LABELS", () => {
  it("has an i18n key for every phase", () => {
    for (const phase of PHASES) {
      expect(PHASE_LABELS).toHaveProperty(phase);
    }
    expect(Object.keys(PHASE_LABELS)).toHaveLength(6);
  });

  it("uses nested i18n key paths matching the messages file structure", () => {
    expect(PHASE_LABELS.dreamer).toBe("phases.dreamer");
    expect(PHASE_LABELS["flexible-hunter"]).toBe("phases.flexibleHunter");
    expect(PHASE_LABELS["route-builder"]).toBe("phases.routeBuilder");
    expect(PHASE_LABELS["detail-planner"]).toBe("phases.detailPlanner");
    expect(PHASE_LABELS["group-wrangler"]).toBe("phases.groupWrangler");
    expect(PHASE_LABELS["on-trip-companion"]).toBe("phases.onTripCompanion");
  });
});

describe("PHASE_ICONS", () => {
  it("has a valid Lucide icon for every phase", () => {
    const validIcons = ["sun", "calendar", "route", "table", "users", "clock"];
    for (const phase of PHASES) {
      expect(PHASE_ICONS).toHaveProperty(phase);
      expect(validIcons).toContain(PHASE_ICONS[phase]);
    }
    expect(Object.keys(PHASE_ICONS)).toHaveLength(6);
  });

  it("maps each phase to the correct icon", () => {
    expect(PHASE_ICONS.dreamer).toBe("sun");
    expect(PHASE_ICONS["flexible-hunter"]).toBe("calendar");
    expect(PHASE_ICONS["route-builder"]).toBe("route");
    expect(PHASE_ICONS["detail-planner"]).toBe("table");
    expect(PHASE_ICONS["group-wrangler"]).toBe("users");
    expect(PHASE_ICONS["on-trip-companion"]).toBe("clock");
  });
});

describe("Phase type narrowing", () => {
  it("accepts valid phase strings", () => {
    const phase: Phase = "dreamer";
    expect(PHASES).toContain(phase);
  });

  it("PHASES readonly tuple is the canonical source", () => {
    // Verify PHASES and PHASE_ORDER contain the same set
    expect(new Set(PHASES)).toEqual(new Set(PHASE_ORDER));
  });
});
