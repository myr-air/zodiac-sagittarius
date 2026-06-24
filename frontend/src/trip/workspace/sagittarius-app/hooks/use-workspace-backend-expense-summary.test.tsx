import { renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TripApiError, type TripApiClient } from "@/src/trip/api-client";
import { tripParticipantSessionStorageKey } from "@/src/trip/auth";
import { useWorkspaceBackendExpenseSummary } from "./use-workspace-backend-expense-summary";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";
import type {
  ExpenseSummary,
  Trip,
  TripParticipantSession,
} from "@/src/trip/types";

const summary: ExpenseSummary = {
  currentUserNetLabel: "settled",
  groupSpend: 120,
  netByMember: {},
  settlementCurrency: "USD",
  settlementSuggestions: [],
};

const participantSession: TripParticipantSession = {
  tripId: tripFixture.trip.id,
  memberId: tripFixture.trip.members[0].id,
  sessionToken: "api-session-token",
  createdAt: "2026-06-01T00:00:00.000Z",
  expiresAt: "2027-01-02T00:00:00.000Z",
};

function tripWithPlan(): Trip {
  return {
    ...tripFixture.trip,
    mainTripPlanId: "plan-main",
    activePlanVariantId: "plan-main",
    planVariants: [{ ...tripFixture.trip.planVariants[0], id: "plan-main" }],
    tripPlans: [{ ...tripFixture.trip.planVariants[0], id: "plan-main" }],
  };
}

function apiClient(getExpenseSummary: TripApiClient["getExpenseSummary"]) {
  return { getExpenseSummary } as TripApiClient;
}

describe("useWorkspaceBackendExpenseSummary", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage?.clear();
  });

  it("fetches backend expense summary only for an API workspace view with a valid selected plan", async () => {
    const getExpenseSummary = vi.fn<TripApiClient["getExpenseSummary"]>(
      async () => summary,
    );
    const trip = tripWithPlan();

    const { result } = renderHook(() =>
      useWorkspaceBackendExpenseSummary({
        apiClient: apiClient(getExpenseSummary),
        canViewExpenses: true,
        currentView: "expenses",
        isApiMode: true,
        isCockpitLoaded: true,
        participantSession,
        selectedTripPlanId: "plan-main",
        setAccessError: vi.fn(),
        setParticipantSession: vi.fn(),
        trip,
      }),
    );

    await waitFor(() =>
      expect(result.current.backendExpenseSummary?.summary).toBe(summary),
    );
    expect(getExpenseSummary).toHaveBeenCalledWith(
      trip.id,
      "api-session-token",
      "plan-main",
    );
  });

  it("does not fetch when the selected plan is not part of the trip", async () => {
    const getExpenseSummary = vi.fn<TripApiClient["getExpenseSummary"]>(
      async () => summary,
    );

    renderHook(() =>
      useWorkspaceBackendExpenseSummary({
        apiClient: apiClient(getExpenseSummary),
        canViewExpenses: true,
        currentView: "expenses",
        isApiMode: true,
        isCockpitLoaded: true,
        participantSession,
        selectedTripPlanId: "missing-plan",
        setAccessError: vi.fn(),
        setParticipantSession: vi.fn(),
        trip: tripWithPlan(),
      }),
    );

    await Promise.resolve();
    expect(getExpenseSummary).not.toHaveBeenCalled();
  });

  it("clears participant session and marks access unauthenticated after backend auth failure", async () => {
    const setAccessError = vi.fn();
    const getExpenseSummary = vi.fn<TripApiClient["getExpenseSummary"]>(
      async () => {
        throw new TripApiError({
          code: "unauthenticated",
          message: "Session expired",
          status: 401,
        });
      },
    );
    window.sessionStorage.setItem(
      tripParticipantSessionStorageKey,
      JSON.stringify(participantSession),
    );

    const { result } = renderHook(() => {
      const [session, setSession] = useState<TripParticipantSession | null>(
        participantSession,
      );
      useWorkspaceBackendExpenseSummary({
        apiClient: apiClient(getExpenseSummary),
        canViewExpenses: true,
        currentView: "expenses",
        isApiMode: true,
        isCockpitLoaded: true,
        participantSession: session,
        selectedTripPlanId: "plan-main",
        setAccessError,
        setParticipantSession: setSession,
        trip: tripWithPlan(),
      });
      return session;
    });

    await waitFor(() => expect(setAccessError).toHaveBeenCalledWith("unauthenticated"));
    expect(result.current).toBeNull();
    expect(window.sessionStorage.getItem(tripParticipantSessionStorageKey)).toBeNull();
  });
});
