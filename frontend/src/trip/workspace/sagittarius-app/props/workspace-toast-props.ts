import type {
  BuildWorkspaceShellPropsInput,
  WorkspaceShellProps,
} from "./workspace-shell-props";

type BuildWorkspaceToastPropsInput = Pick<
  BuildWorkspaceShellPropsInput,
  | "accountClaimState"
  | "accountSession"
  | "canClaimMember"
  | "currentMember"
  | "dismissWorkspaceToast"
  | "isToastDismissing"
  | "onClaimMember"
>;

export function buildWorkspaceToastProps({
  accountClaimState,
  accountSession,
  canClaimMember,
  currentMember,
  dismissWorkspaceToast,
  isToastDismissing,
  onClaimMember,
}: BuildWorkspaceToastPropsInput): WorkspaceShellProps["toastProps"] {
  return {
    accountSession,
    memberUserId: currentMember.userId,
    claimState: accountClaimState,
    canClaim: canClaimMember,
    dismissing: isToastDismissing,
    onClaim: onClaimMember,
    onDismiss: dismissWorkspaceToast,
  };
}
