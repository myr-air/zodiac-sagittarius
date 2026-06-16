import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { type TripApiClient, type TripCockpit } from "@/src/trip/api-client";
import type { AccountApiClient, AccountSession } from "@/src/account/api-client";
import {
  appendTripParticipant,
  buildCreateMemberRequest,
  buildPatchMemberAccessStatusRequest,
  buildPatchMemberPasswordRequest,
  buildPatchMemberRoleRequest,
  createTripParticipant,
  resetTripParticipantClaim,
  replaceTripParticipant,
  setTripParticipantAccessStatus,
  setTripParticipantPassword,
  updateTripParticipantRole,
} from "@/src/trip/auth";
import { deriveTripCountriesFromDestination } from "@/src/trip/trip-countries";
import { shiftItineraryItemsToStartDate } from "@/src/trip/itinerary-time";
import {
  applyTripSettingsToTrip,
  buildPatchTripSettingsRequest,
  mergePatchedTripSettings,
} from "@/src/trip/trip-settings";
import { buildShiftItineraryItemDayRequest } from "@/src/trip/itinerary-api-requests";
import { nextClientMutationId } from "@/src/trip/local-ids";
import type {
  Trip,
  TripMemberAccessStatus,
  TripParticipantSession,
  TripRole,
} from "@/src/trip/types";
import type { TripSettingsFormValues } from "@/src/components/TripSettingsPage";

interface UseWorkspaceAdministrationOptions {
  accountClient: AccountApiClient;
  accountSession: AccountSession | null;
  canManagePeople: boolean;
  commitTrip: (updater: (current: Trip) => Trip) => void;
  currentMemberId: string;
  isApiMode: boolean;
  participantSession: TripParticipantSession | null;
  resolvedApiClient?: TripApiClient;
  setAccountClaimState: Dispatch<
    SetStateAction<{
      status: "idle" | "saving";
      message: string | null;
    }>
  >;
  setJoinInviteToken: Dispatch<SetStateAction<string | null>>;
  trip: Trip;
  replaceCockpitFromApi: (cockpit: TripCockpit) => void;
  updateApiTrip: (updater: (current: Trip) => Trip) => void;
}

export function useWorkspaceAdministration({
  accountClient,
  accountSession,
  canManagePeople,
  commitTrip,
  currentMemberId,
  isApiMode,
  participantSession,
  resolvedApiClient,
  setAccountClaimState,
  setJoinInviteToken,
  trip,
  replaceCockpitFromApi,
  updateApiTrip,
}: UseWorkspaceAdministrationOptions) {
  const claimCurrentMemberToAccount = useCallback(async () => {
    if (!accountSession || !participantSession || !resolvedApiClient) return;
    setAccountClaimState({ status: "saving", message: null });
    try {
      await accountClient.claimMember(
        accountSession.sessionToken,
        participantSession.tripId,
        participantSession.memberId,
        participantSession.sessionToken,
      );
      const cockpit = await resolvedApiClient.loadTrip(
        participantSession.tripId,
        participantSession.sessionToken,
      );
      replaceCockpitFromApi(cockpit);
      setAccountClaimState({
        status: "idle",
        message: "ผูก temp identity เข้ากับ account แล้ว",
      });
    } catch (caught) {
      setAccountClaimState({
        status: "idle",
        message:
          caught instanceof Error ? caught.message : "Claim account ไม่สำเร็จ",
      });
    }
  }, [
    accountClient,
    accountSession,
    participantSession,
    resolvedApiClient,
    replaceCockpitFromApi,
    setAccountClaimState,
  ]);

  const transferOwnerToAccountMember = useCallback(
    async (targetMemberId: string) => {
      if (!accountSession || !participantSession || !resolvedApiClient) return;
      setAccountClaimState({ status: "saving", message: null });
      try {
        await accountClient.transferOwner(
          accountSession.sessionToken,
          participantSession.tripId,
          targetMemberId,
        );
        const cockpit = await resolvedApiClient.loadTrip(
          participantSession.tripId,
          participantSession.sessionToken,
        );
        replaceCockpitFromApi(cockpit);
        setAccountClaimState({
          status: "idle",
          message: "โอนสิทธิ owner แล้ว trip ยังมี owner 1 คนเสมอ",
        });
      } catch (caught) {
        setAccountClaimState({
          status: "idle",
          message:
            caught instanceof Error ? caught.message : "โอน owner ไม่สำเร็จ",
        });
      }
    },
    [
      accountClient,
      accountSession,
      participantSession,
      resolvedApiClient,
      replaceCockpitFromApi,
      setAccountClaimState,
    ],
  );

  const resetMemberClaim = useCallback(async (memberId: string) => {
    if (!canManagePeople) return;
    if (isApiMode && resolvedApiClient && participantSession) {
      const member = await resolvedApiClient.resetMemberClaim(
        trip.id,
        memberId,
        participantSession.sessionToken,
      );
      commitTrip((current) => replaceTripParticipant(current, member));
      return;
    }
    commitTrip((current) => resetTripParticipantClaim(current, memberId));
  }, [
    canManagePeople,
    commitTrip,
    isApiMode,
    participantSession,
    resolvedApiClient,
    trip,
  ]);

  const changeMemberRole = useCallback(
    async (memberId: string, role: Exclude<TripRole, "owner">) => {
      /* v8 ignore next */
      if (!canManagePeople) return;
      if (isApiMode && resolvedApiClient && participantSession) {
        const member = await resolvedApiClient.patchMember(
          trip.id,
          memberId,
          participantSession.sessionToken,
          buildPatchMemberRoleRequest(role),
        );
        commitTrip((current) => replaceTripParticipant(current, member));
        return;
      }
      commitTrip((current) => updateTripParticipantRole(current, memberId, role));
    },
    [
      canManagePeople,
      commitTrip,
      isApiMode,
      participantSession,
      resolvedApiClient,
      trip,
    ],
  );

  const changeMemberAccessStatus = useCallback(
    async (memberId: string, accessStatus: TripMemberAccessStatus) => {
      /* v8 ignore next */
      if (!canManagePeople) return;
      if (isApiMode && resolvedApiClient && participantSession) {
        const member = await resolvedApiClient.patchMember(
          trip.id,
          memberId,
          participantSession.sessionToken,
          buildPatchMemberAccessStatusRequest(accessStatus),
        );
        commitTrip((current) => replaceTripParticipant(current, member));
        return;
      }
      commitTrip((current) =>
        setTripParticipantAccessStatus(current, memberId, accessStatus),
      );
    },
    [
      canManagePeople,
      commitTrip,
      isApiMode,
      participantSession,
      resolvedApiClient,
      trip,
    ],
  );

  const changeMemberPassword = useCallback(
    async (memberId: string, password: string) => {
      /* v8 ignore next */
      if (!canManagePeople || memberId !== currentMemberId) return;
      if (isApiMode && resolvedApiClient && participantSession) {
        const member = await resolvedApiClient.patchMember(
          trip.id,
          memberId,
          participantSession.sessionToken,
          buildPatchMemberPasswordRequest(password),
        );
        commitTrip((current) => replaceTripParticipant(current, member));
        return;
      }
      commitTrip((current) =>
        setTripParticipantPassword(current, memberId, password),
      );
    },
    [
      canManagePeople,
      commitTrip,
      currentMemberId,
      isApiMode,
      participantSession,
      resolvedApiClient,
      trip,
    ],
  );

  const createMember = useCallback(
    async (input: {
      displayName: string;
      role: Exclude<TripRole, "owner">;
    }) => {
      /* v8 ignore next */
      if (!canManagePeople) return;
      if (isApiMode && resolvedApiClient && participantSession) {
        const member = await resolvedApiClient.createMember(
          trip.id,
          participantSession.sessionToken,
          buildCreateMemberRequest(input, { memberCount: trip.members.length }),
        );
        commitTrip((current) => appendTripParticipant(current, member));
        return;
      }
      commitTrip((current) => createTripParticipant(current, input));
    },
    [
      canManagePeople,
      commitTrip,
      isApiMode,
      participantSession,
      resolvedApiClient,
      trip,
    ],
  );

  const rotateJoinInviteToken = useCallback(async () => {
    if (
      !canManagePeople ||
      !isApiMode ||
      !resolvedApiClient ||
      !participantSession?.sessionToken
    )
      return;
    const response = await resolvedApiClient.rotateJoinInviteToken?.(
      trip.id,
      participantSession.sessionToken,
    );
    if (!response) return;
    setJoinInviteToken(response.token);
  }, [
    canManagePeople,
    isApiMode,
    participantSession,
    resolvedApiClient,
    setJoinInviteToken,
    trip,
  ]);

  const saveTripSettings = useCallback(
    async (values: TripSettingsFormValues) => {
      if (!canManagePeople) return;
      const shiftedItems = shiftItineraryItemsToStartDate(
        trip.itineraryItems,
        trip.startDate,
        values.startDate,
      );
      const nextCountries = deriveTripCountriesFromDestination(
        values.destinationLabel,
        trip.countries ?? [],
      );

      if (isApiMode && resolvedApiClient && participantSession) {
        const patchedTrip = await resolvedApiClient.patchTrip(
          trip.id,
          participantSession.sessionToken,
          buildPatchTripSettingsRequest(
            { ...values, countries: nextCountries },
            {
              clientMutationId: nextClientMutationId("trip-settings"),
              expectedVersion: trip.version ?? 0,
            },
          ),
        );
        const changedItems = shiftedItems.filter((shiftedItem) => {
          const currentItem = trip.itineraryItems.find(
            (item) => item.id === shiftedItem.id,
          );
          return currentItem && currentItem.day !== shiftedItem.day;
        });
        const patchedItems = await Promise.all(
          changedItems.map((item) =>
            resolvedApiClient.patchItineraryItem(
              trip.id,
              item.id,
              participantSession.sessionToken,
              buildShiftItineraryItemDayRequest({
                clientMutationId: nextClientMutationId("itinerary-day-shift"),
                expectedVersion: item.version,
                shiftedDay: item.day,
              }),
            ),
          ),
        );
        const patchedItemsById = new Map(
          patchedItems.map((item) => [item.id, item]),
        );
        updateApiTrip((current) =>
          mergePatchedTripSettings(current, patchedTrip, patchedItemsById),
        );
        return;
      }

      commitTrip((current) =>
        applyTripSettingsToTrip(current, { ...values, countries: nextCountries }),
      );
    },
    [
      canManagePeople,
      commitTrip,
      isApiMode,
      participantSession,
      resolvedApiClient,
      trip,
      updateApiTrip,
    ],
  );

  return {
    changeMemberAccessStatus,
    changeMemberPassword,
    changeMemberRole,
    claimCurrentMemberToAccount,
    createMember,
    rotateJoinInviteToken,
    resetMemberClaim,
    saveTripSettings,
    transferOwnerToAccountMember,
  };
}
