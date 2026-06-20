import type { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { ActionBar, Button } from "@/src/ui";
import { Icon } from "@/src/ui/icons";

import * as memberStyles from "../TripMembersPage.styles";

type MemberLabels = ReturnType<typeof useI18n>["t"];

interface MemberInviteActionsProps {
  canManagePeople: boolean;
  copyState: "idle" | "copied" | "error";
  createPanelOpen: boolean;
  isRotatingInviteToken: boolean;
  labels: MemberLabels;
  onClearFilters: () => void;
  onCopyInviteLink: () => void;
  onRotateInviteToken?: () => void;
  onToggleCreatePanel: () => void;
}

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
      <Button className={cn(memberStyles.memberResetButtonClassName, "w-auto")} variant="ghost" type="button" onClick={onClearFilters}>{labels.members.actions.clear}</Button>
      {canManagePeople ? (
        <>
          <Button className={cn(memberStyles.inviteCopyButtonClassName, "w-auto")} type="button" onClick={onCopyInviteLink}>
            <Icon name="copy" />
            {labels.members.actions.copyInvite}
          </Button>
          {onRotateInviteToken ? (
            <Button className={cn(memberStyles.memberCreateButtonClassName, "w-auto")} variant="ghost" type="button" disabled={isRotatingInviteToken} onClick={onRotateInviteToken}>
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
        <span className={memberStyles.copyFeedbackClassName} data-state={copyState} role="status">
          {labels.members.copy.readOnly}
        </span>
      )}
    </ActionBar>
  );
}
