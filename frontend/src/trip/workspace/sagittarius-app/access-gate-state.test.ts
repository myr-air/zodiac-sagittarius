import { describe, expect, it } from "vitest";
import {
  shouldRenderWorkspaceAccessLoadingFrame,
  type WorkspaceAccessLoadingFrameInput,
} from "./access-gate-state";

const baseInput: WorkspaceAccessLoadingFrameInput = {
  accessMode: "combined",
  canAccessPanel: false,
  isAccountTripAccessPending: false,
  isTripLoading: false,
  requireJoin: false,
  routeTripId: undefined,
  sessionMember: true,
  sessionRestored: true,
  shouldRedirectUnauthenticatedTripRoute: false,
};

describe("workspace access gate state", () => {
  it("shows the loading frame for global pending access states", () => {
    expect(shouldRenderWorkspaceAccessLoadingFrame({
      ...baseInput,
      isTripLoading: true,
    })).toBe(true);
    expect(shouldRenderWorkspaceAccessLoadingFrame({
      ...baseInput,
      isAccountTripAccessPending: true,
    })).toBe(true);
    expect(shouldRenderWorkspaceAccessLoadingFrame({
      ...baseInput,
      shouldRedirectUnauthenticatedTripRoute: true,
    })).toBe(true);
  });

  it("waits for restored trip access before rendering the account access panel", () => {
    expect(shouldRenderWorkspaceAccessLoadingFrame({
      ...baseInput,
      accessMode: "trip-access",
      canAccessPanel: true,
      routeTripId: "trip-1",
      sessionRestored: false,
    })).toBe(true);
    expect(shouldRenderWorkspaceAccessLoadingFrame({
      ...baseInput,
      accessMode: "trip-access",
      canAccessPanel: true,
      routeTripId: "trip-1",
      sessionRestored: true,
    })).toBe(false);
  });

  it("blocks joined trip routes until a participant session exists", () => {
    expect(shouldRenderWorkspaceAccessLoadingFrame({
      ...baseInput,
      requireJoin: true,
      routeTripId: "trip-1",
      sessionMember: false,
    })).toBe(true);
    expect(shouldRenderWorkspaceAccessLoadingFrame({
      ...baseInput,
      requireJoin: true,
      routeTripId: "trip-1",
      sessionMember: true,
    })).toBe(false);
  });
});
