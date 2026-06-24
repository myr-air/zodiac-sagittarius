import { useState } from "react";
import type { AppShellMemberCardProps } from "./app-shell.types";

type AppShellMemberCardActionsInput = Pick<
  AppShellMemberCardProps,
  "onLeaveParticipantSession"
>;

export function useAppShellMemberCardActions({
  onLeaveParticipantSession,
}: AppShellMemberCardActionsInput) {
  const [identityDialogOpen, setIdentityDialogOpen] = useState(false);

  function openLeaveParticipantSessionDialog() {
    if (!onLeaveParticipantSession) return;
    setIdentityDialogOpen(true);
  }

  function closeLeaveParticipantSessionDialog() {
    setIdentityDialogOpen(false);
  }

  function confirmLeaveParticipantSession() {
    setIdentityDialogOpen(false);
    onLeaveParticipantSession?.();
  }

  return {
    closeLeaveParticipantSessionDialog,
    confirmLeaveParticipantSession,
    identityDialogOpen,
    openLeaveParticipantSessionDialog,
  };
}
