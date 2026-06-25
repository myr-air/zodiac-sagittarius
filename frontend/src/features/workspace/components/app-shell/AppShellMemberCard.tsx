"use client";

import Link from "next/link";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { PersonAvatar } from "@/src/shared/components/person-avatar";
import { WorkspaceConfirmDialog } from "@/src/shared/components/workspace-dialog";
import { roleLabel } from "@/src/trip/members";
import { Icon } from "@/src/ui/icons";
import type { AppShellMemberCardProps } from "./app-shell.types";
import {
  identityDialogClassName,
  memberAvatarClassName,
  memberActionsClassName,
  memberCardBaseClassName,
  memberCardColClassName,
  memberCardCopyClassName,
  memberCardGridClassName,
  memberCardNameClassName,
  memberCardRoleClassName,
  memberFallbackIconClassName,
  memberPortalLinkClassName,
  memberSwitchButtonClassName,
} from "./AppShell.styles";
import { useAppShellMemberCardActions } from "./useAppShellMemberCardActions";

export function AppShellMemberCard({ accountPortalHref, collapsed, currentMember, onLeaveParticipantSession }: AppShellMemberCardProps) {
  const { t } = useI18n();
  const actions = useAppShellMemberCardActions({
    onLeaveParticipantSession,
  });
  const hasMemberActions = Boolean((accountPortalHref || onLeaveParticipantSession) && !collapsed);

  return (
    <>
      <div className={cn(memberCardBaseClassName, hasMemberActions ? memberCardColClassName : memberCardGridClassName)} data-collapsed={collapsed ? "true" : "false"}>
        {hasMemberActions ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0 w-full">
              <PersonAvatar
                className={memberAvatarClassName}
                color={currentMember.color}
                name={currentMember.displayName}
              />
              <div className={memberCardCopyClassName} data-collapsed={collapsed ? "true" : "false"}>
                <strong className={memberCardNameClassName}>{currentMember.displayName}</strong>
                <span className={memberCardRoleClassName}>{roleLabel(currentMember.role, t.appShell.roles)}</span>
              </div>
            </div>
            <div className={memberActionsClassName}>
              {accountPortalHref ? (
                <Link className={memberPortalLinkClassName} data-collapsed={collapsed ? "true" : "false"} href={accountPortalHref}>
                  <Icon name="calendar" />
                  {t.appShell.myTrips}
                </Link>
              ) : null}
              {onLeaveParticipantSession ? (
                <button className={memberSwitchButtonClassName} data-collapsed={collapsed ? "true" : "false"} type="button" onClick={actions.openLeaveParticipantSessionDialog}>
                  {t.appShell.switchIdentity}
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <>
            <PersonAvatar
              className={memberAvatarClassName}
              color={currentMember.color}
              name={currentMember.displayName}
            />
            <div className={memberCardCopyClassName} data-collapsed={collapsed ? "true" : "false"}>
              <strong className={memberCardNameClassName}>{currentMember.displayName}</strong>
              <span className={memberCardRoleClassName}>{roleLabel(currentMember.role, t.appShell.roles)}</span>
            </div>
            {onLeaveParticipantSession ? (
              <button className={memberSwitchButtonClassName} data-collapsed={collapsed ? "true" : "false"} type="button" onClick={actions.openLeaveParticipantSessionDialog}>
                {t.appShell.switchIdentity}
              </button>
            ) : (
              <Icon name="chevronRight" className={memberFallbackIconClassName} data-collapsed={collapsed ? "true" : "false"} />
            )}
          </>
        )}
      </div>

      {actions.identityDialogOpen ? (
        <WorkspaceConfirmDialog
          body={t.appShell.confirmSwitchIdentity({ name: currentMember.displayName })}
          cancelLabel={t.common.actions.cancel}
          className={identityDialogClassName}
          confirmLabel={t.appShell.switchIdentity}
          confirmVariant="primary"
          onCancel={actions.closeLeaveParticipantSessionDialog}
          onConfirm={actions.confirmLeaveParticipantSession}
          title={t.appShell.switchIdentity}
          titleId="identity-switch-title"
        />
      ) : null}
    </>
  );
}
