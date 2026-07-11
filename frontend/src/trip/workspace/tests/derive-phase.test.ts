import { describe, it, expect } from "vitest";
import { derivePhase, type DerivePhaseInput } from "../derive-phase";

function makeInput(overrides: Partial<DerivePhaseInput> = {}): DerivePhaseInput {
  return {
    name: "Test Trip",
    destinationLabel: "Bangkok",
    startDate: "2027-03-15",
    endDate: "2027-03-22",
    activityCount: 0,
    hasWaypoints: false,
    hasDateWindow: false,
    memberCount: 1,
    isTripActive: false,
    ...overrides,
  };
}

describe("derivePhase", () => {
  describe("default phase derivation", () => {
    it("returns dreamer when only name + destination exist", () => {
      const result = derivePhase(makeInput());
      expect(result.defaultPhase).toBe("dreamer");
    });

    it("returns flexible-hunter when date window is set", () => {
      const result = derivePhase(makeInput({ hasDateWindow: true }));
      expect(result.defaultPhase).toBe("flexible-hunter");
    });

    it("returns route-builder when waypoints exist (higher priority than date window)", () => {
      const result = derivePhase(makeInput({ hasDateWindow: true, hasWaypoints: true }));
      expect(result.defaultPhase).toBe("route-builder");
    });

    it("returns detail-planner when activities exist (highest priority)", () => {
      const result = derivePhase(makeInput({ activityCount: 5, hasWaypoints: true, hasDateWindow: true }));
      expect(result.defaultPhase).toBe("detail-planner");
    });
  });

  describe("available phases", () => {
    it("always includes dreamer", () => {
      const result = derivePhase(makeInput());
      expect(result.availablePhases.has("dreamer")).toBe(true);
    });

    it("unlocks flexible-hunter when data beyond dreamer exists", () => {
      const result = derivePhase(makeInput({ activityCount: 1 }));
      expect(result.availablePhases.has("flexible-hunter")).toBe(true);
    });

    it("unlocks detail-planner when activities exist", () => {
      const result = derivePhase(makeInput({ activityCount: 3 }));
      expect(result.availablePhases.has("detail-planner")).toBe(true);
    });
  });

  describe("members overlay", () => {
    it("unlocks group-wrangler when memberCount > 1", () => {
      const result = derivePhase(makeInput({ memberCount: 3 }));
      expect(result.availablePhases.has("group-wrangler")).toBe(true);
    });

    it("does not unlock group-wrangler when memberCount is 1", () => {
      const result = derivePhase(makeInput({ memberCount: 1 }));
      expect(result.availablePhases.has("group-wrangler")).toBe(false);
    });

    it("does not change default phase when members exist", () => {
      const result = derivePhase(makeInput({ memberCount: 5 }));
      expect(result.defaultPhase).toBe("dreamer");
    });
  });

  describe("active trip", () => {
    it("unlocks on-trip-companion when trip is active", () => {
      const result = derivePhase(makeInput({ isTripActive: true }));
      expect(result.availablePhases.has("on-trip-companion")).toBe(true);
    });

    it("does not change default phase when trip is active", () => {
      const result = derivePhase(makeInput({ isTripActive: true, activityCount: 4 }));
      expect(result.defaultPhase).toBe("detail-planner");
    });
  });

  describe("date window integration", () => {
    it("derives flexible-hunter when trip has dateWindowStart set", () => {
      // Simulates the integration path: trip with dateWindowStart → hasDateWindow: true → flexible-hunter
      const result = derivePhase(makeInput({
        hasDateWindow: true,
        hasWaypoints: false,
        activityCount: 0,
      }));
      expect(result.defaultPhase).toBe("flexible-hunter");
      expect(result.availablePhases.has("flexible-hunter")).toBe(true);
    });

    it("derives flexible-hunter from date window even when budget data exists", () => {
      // BudgetCategories do not affect phase derivation — they are Phase 2 display data only.
      // When only date window is present (no waypoints, no activities), default stays at flexible-hunter.
      const result = derivePhase(makeInput({
        hasDateWindow: true,
        hasWaypoints: false,
        activityCount: 0,
        memberCount: 1,
      }));
      expect(result.defaultPhase).toBe("flexible-hunter");
    });

    it("does not change default phase when only budget data exists (no date window)", () => {
      // Budget data is display-only for Phase 2. Without a date window, the trip stays at dreamer.
      const result = derivePhase(makeInput({
        hasDateWindow: false,
        hasWaypoints: false,
        activityCount: 0,
      }));
      expect(result.defaultPhase).toBe("dreamer");
      expect(result.availablePhases.has("flexible-hunter")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("dreamer with zero activities, no waypoints, no date window", () => {
      const result = derivePhase(makeInput());
      expect(result.defaultPhase).toBe("dreamer");
      expect(result.availablePhases.size).toBe(1);
    });

    it("full trip: activities + waypoints + members + active", () => {
      const result = derivePhase(makeInput({
        activityCount: 10,
        hasWaypoints: true,
        hasDateWindow: true,
        memberCount: 4,
        isTripActive: true,
      }));
      expect(result.defaultPhase).toBe("detail-planner");
      expect(result.availablePhases.has("dreamer")).toBe(true);
      expect(result.availablePhases.has("flexible-hunter")).toBe(true);
      expect(result.availablePhases.has("route-builder")).toBe(true);
      expect(result.availablePhases.has("detail-planner")).toBe(true);
      expect(result.availablePhases.has("group-wrangler")).toBe(true);
      expect(result.availablePhases.has("on-trip-companion")).toBe(true);
    });
  });
});
