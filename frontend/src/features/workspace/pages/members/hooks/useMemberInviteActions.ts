import { useState } from "react";
import { buildInviteLink } from "@/src/routes/invite-links";
import type { CopyFeedbackState } from "@/src/shared/components/copy-feedback";
import { useCopyFeedbackState } from "@/src/shared/components/copy-feedback";

export type MemberInviteCopyState = CopyFeedbackState;

interface UseMemberInviteActionsInput {
  canManagePeople: boolean;
  joinId: string;
  joinInviteToken?: string | null;
  onRotateJoinInviteToken?: () => Promise<void>;
}

export function useMemberInviteActions({
  canManagePeople,
  joinId,
  joinInviteToken,
  onRotateJoinInviteToken,
}: UseMemberInviteActionsInput) {
  const {
    copyState,
    copyText,
    markCopyError,
    resetCopyState,
  } = useCopyFeedbackState();
  const [isRotatingInviteToken, setIsRotatingInviteToken] = useState(false);
  const inviteLink = buildInviteLink(joinId, joinInviteToken);

  async function copyInviteLink() {
    /* v8 ignore next */
    if (!canManagePeople) return;
    await copyText(inviteLink);
  }

  async function rotateInviteToken() {
    if (!canManagePeople || !onRotateJoinInviteToken) return;
    setIsRotatingInviteToken(true);
    try {
      await onRotateJoinInviteToken();
      resetCopyState();
    } catch {
      markCopyError();
    } finally {
      setIsRotatingInviteToken(false);
    }
  }

  return {
    copyInviteLink,
    copyState,
    inviteLink,
    isRotatingInviteToken,
    rotateInviteToken,
  };
}
