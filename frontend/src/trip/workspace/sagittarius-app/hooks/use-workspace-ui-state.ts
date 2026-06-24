import { useState } from "react";
import type { StopPlaceResolutionState } from "@/src/trip/places";
import type { ItineraryItem, Trip } from "@/src/trip/types";
import type { ItineraryDialogState } from "./itinerary/itinerary-dialog-state";

export interface WorkspaceAccountClaimState {
  status: "idle" | "saving";
  message: string | null;
}

interface WorkspaceUiStateInput {
  initialJoinToken?: string | null;
  initialMemberId?: string;
  initialTrip: Pick<Trip, "members">;
}

export function useWorkspaceUiState({
  initialJoinToken,
  initialMemberId,
  initialTrip,
}: WorkspaceUiStateInput) {
  const [isCockpitLoaded, setIsCockpitLoaded] = useState(false);
  const [accountClaimState, setAccountClaimState] =
    useState<WorkspaceAccountClaimState>({ status: "idle", message: null });
  const [joinInviteToken, setJoinInviteToken] = useState<string | null>(
    initialJoinToken ?? null,
  );
  const [currentMemberId, setCurrentMemberId] = useState(
    initialMemberId ?? initialTrip.members[0].id,
  );
  const [selectedItemId, setSelectedItemId] = useState("item-dimdim");
  const [dialogState, setDialogState] = useState<ItineraryDialogState>(null);
  const [stopPlaceResolution, setStopPlaceResolution] =
    useState<StopPlaceResolutionState>({ state: "idle", candidates: [] });
  const [dialogDeleteItem, setDialogDeleteItem] =
    useState<ItineraryItem | null>(null);
  const [tripPlanError, setTripPlanError] = useState<string | null>(null);
  const [isTripPlanBusy, setIsTripPlanBusy] = useState(false);

  return {
    accountClaimState,
    currentMemberId,
    dialogDeleteItem,
    dialogState,
    isCockpitLoaded,
    isTripPlanBusy,
    joinInviteToken,
    selectedItemId,
    setAccountClaimState,
    setCurrentMemberId,
    setDialogDeleteItem,
    setDialogState,
    setIsCockpitLoaded,
    setIsTripPlanBusy,
    setJoinInviteToken,
    setSelectedItemId,
    setStopPlaceResolution,
    setTripPlanError,
    stopPlaceResolution,
    tripPlanError,
  };
}
