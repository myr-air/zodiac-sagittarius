import { cn } from "@/src/lib/cn";
import { ActionBar, Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as memberStyles from "../TripMembersPage.styles";
import { MemberCopyFeedback } from "./MemberCopyFeedback";
import type { MemberInviteActionsProps } from "./member-management.types";

export function MemberInviteActions({
  canManagePeople,
  copyState,
  createPanelOpen,
  isRotatingInviteToken,
  labels,
  onClearFilters,
  onCopyInviteLink,
  onRotateInviteToken,
  onToggleCreatePanel,
}: MemberInviteActionsProps) {
  return (
    <ActionBar className={memberStyles.memberCommandActionsClassName}>
      <Button
        className={cn(memberStyles.memberResetButtonClassName, "w-auto")}
        variant="ghost"
        type="button"
        onClick={onClearFilters}
      >
        {labels.members.actions.clear}
      </Button>
      {canManagePeople ? (
        <>
          <Button
            className={cn(memberStyles.inviteCopyButtonClassName, "w-auto")}
            type="button"
            onClick={onCopyInviteLink}
          >
            <Icon name="copy" />
            {labels.members.actions.copyInvite}
          </Button>
          {onRotateInviteToken ? (
            <Button
              className={cn(memberStyles.memberCreateButtonClassName, "w-auto")}
              variant="ghost"
              type="button"
              disabled={isRotatingInviteToken}
              onClick={onRotateInviteToken}
            >
              <Icon name="key" />
              {isRotatingInviteToken ? labels.members.actions.rotatingInvite : labels.members.actions.rotateInvite}
            </Button>
          ) : null}
          <Button
            aria-expanded={createPanelOpen}
            className={cn(memberStyles.memberCreateButtonClassName, "w-auto")}
            variant="ghost"
            type="button"
            onClick={onToggleCreatePanel}
          >
            <Icon name="plus" />
            {createPanelOpen ? labels.members.actions.closeCreate : labels.members.actions.openCreate}
          </Button>
        </>
      ) : (
        <MemberCopyFeedback copyState={copyState} labels={labels} readOnly />
      )}
    </ActionBar>
  );
}
