import { describe, expect, it } from "vitest";
import { resolveWorkspaceAccessState } from "./workspace-access-state";

const baseOptions = {
  accessMode: "combined" as const,
  accountSessionLoaded: true,
  accountSessionPresent: false,
  accountTripAccessDeniedRouteId: null,
  accessError: null,
  currentPathname: "/trips/trip-1",
  isApiMode: true,
  isTripLoading: false,
  participantSessionTripId: null,
  requireJoin: true,
  routeTripId: "trip-1",
  sessionMember: false,
  sessionRestored: true,
};

describe("resolveWorkspaceAccessState", () => {
  it("allows explicit account and trip access panels", () => {
    expect(
      resolveWorkspaceAccessState({
        ...baseOptions,
        accessMode: "account-portal",
        requireJoin: false,
      }).canAccessPanel,
    ).toBe(true);

    expect(
      resolveWorkspaceAccessState({
        ...baseOptions,
        accessMode: "trip-access",
      }).canAccessPanel,
    ).toBe(true);
  });

  it("marks account trip access pending while account state or denied route is unresolved", () => {
    expect(
      resolveWorkspaceAccessState({
        ...baseOptions,
        accountSessionLoaded: false,
      }).isAccountTripAccessPending,
    ).toBe(true);

    expect(
      resolveWorkspaceAccessState({
        ...baseOptions,
        accountSessionPresent: true,
        accountTripAccessDeniedRouteId: "other-trip",
      }).isAccountTripAccessPending,
    ).toBe(true);
  });

  it("redirects unauthenticated trip routes only after pending access resolves", () => {
    expect(
      resolveWorkspaceAccessState(baseOptions)
        .shouldRedirectUnauthenticatedTripRoute,
    ).toBe(true);

    expect(
      resolveWorkspaceAccessState({
        ...baseOptions,
        participantSessionTripId: "trip-1",
      }).shouldRedirectUnauthenticatedTripRoute,
    ).toBe(false);

    expect(
      resolveWorkspaceAccessState({
        ...baseOptions,
        accountSessionLoaded: false,
      }).shouldRedirectUnauthenticatedTripRoute,
    ).toBe(false);

    expect(
      resolveWorkspaceAccessState({
        ...baseOptions,
        currentPathname: "/iframe.html",
      }).shouldRedirectUnauthenticatedTripRoute,
    ).toBe(false);
  });
});
