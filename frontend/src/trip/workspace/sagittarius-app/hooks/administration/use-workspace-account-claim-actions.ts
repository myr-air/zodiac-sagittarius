import { useCallback } from "react";
import type { UseWorkspaceAccountClaimActionsOptions } from "./workspace-administration-command-types";

export function useWorkspaceAccountClaimActions({
  accountClient,
  accountSession,
  participantSession,
  resolvedApiClient,
  replaceCockpitFromApi,
  setAccountClaimState,
}: UseWorkspaceAccountClaimActionsOptions) {
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

  return {
    claimCurrentMemberToAccount,
    transferOwnerToAccountMember,
  };
}
