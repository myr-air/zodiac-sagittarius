import { useEffect, useState } from "react";
import { buildInviteLink } from "./TripMembersPage.support";

export type MemberInviteCopyState = "idle" | "copied" | "error";

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
  const [copyState, setCopyState] = useState<MemberInviteCopyState>("idle");
  const [isRotatingInviteToken, setIsRotatingInviteToken] = useState(false);
  const inviteLink = buildInviteLink(joinId, joinInviteToken);

  useEffect(() => {
    if (copyState === "idle") return undefined;
    const timeout = window.setTimeout(() => setCopyState("idle"), 2500);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  async function copyInviteLink() {
    /* v8 ignore next */
    if (!canManagePeople) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  async function rotateInviteToken() {
    if (!canManagePeople || !onRotateJoinInviteToken) return;
    setIsRotatingInviteToken(true);
    try {
      await onRotateJoinInviteToken();
      setCopyState("idle");
    } catch {
      setCopyState("error");
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
