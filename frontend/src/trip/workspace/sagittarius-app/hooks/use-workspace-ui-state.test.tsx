import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { useWorkspaceUiState } from "./use-workspace-ui-state";

describe("useWorkspaceUiState", () => {
  it("initializes workspace shell state from route inputs", () => {
    const { result } = renderHook(() =>
      useWorkspaceUiState({
        initialJoinToken: "join-token",
        initialMemberId: "member-beam",
        initialTrip: seedTrip,
      }),
    );

    expect(result.current.currentMemberId).toBe("member-beam");
    expect(result.current.joinInviteToken).toBe("join-token");
    expect(result.current.isCockpitLoaded).toBe(false);
    expect(result.current.accountClaimState).toEqual({
      status: "idle",
      message: null,
    });
    expect(result.current.selectedItemId).toBe("item-dimdim");
    expect(result.current.dialogState).toBeNull();
    expect(result.current.stopPlaceResolution).toEqual({
      state: "idle",
      candidates: [],
    });
  });

  it("falls back to the first trip member when preview member is not provided", () => {
    const { result } = renderHook(() =>
      useWorkspaceUiState({ initialTrip: seedTrip }),
    );

    expect(result.current.currentMemberId).toBe(seedTrip.members[0].id);
    expect(result.current.joinInviteToken).toBeNull();
  });

  it("exposes setters for shell-level interaction state", () => {
    const { result } = renderHook(() =>
      useWorkspaceUiState({ initialTrip: seedTrip }),
    );

    act(() => {
      result.current.setSelectedItemId("item-hotel");
      result.current.setTripPlanError("Could not save plan");
      result.current.setIsTripPlanBusy(true);
    });

    expect(result.current.selectedItemId).toBe("item-hotel");
    expect(result.current.tripPlanError).toBe("Could not save plan");
    expect(result.current.isTripPlanBusy).toBe(true);
  });
});
