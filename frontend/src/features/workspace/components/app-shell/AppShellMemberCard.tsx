"use client";

import { useState } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { WorkspaceConfirmDialog } from "@/src/shared/components/workspace-dialog";
import { memberInitial, roleLabel } from "@/src/trip/members";
import { Icon } from "@/src/ui/icons";
import type { AppShellMemberCardProps } from "./app-shell.types";
import {
  identityDialogClassName,
  memberAvatarClassName,
  memberCardBaseClassName,
  memberCardColClassName,
  memberCardCopyClassName,
  memberCardGridClassName,
  memberCardNameClassName,
  memberCardRoleClassName,
  memberFallbackIconClassName,
  memberSwitchButtonClassName,
} from "./AppShell.styles";

export function AppShellMemberCard({ collapsed, currentMember, onLeaveParticipantSession }: AppShellMemberCardProps) {
  const { t } = useI18n();
  const [identityDialogOpen, setIdentityDialogOpen] = useState(false);

  function openLeaveParticipantSessionDialog() {
    if (!onLeaveParticipantSession) return;
    setIdentityDialogOpen(true);
  }

  function confirmLeaveParticipantSession() {
    setIdentityDialogOpen(false);
    onLeaveParticipantSession?.();
  }

  return (
    <>
      <div className={cn(memberCardBaseClassName, onLeaveParticipantSession && !collapsed ? memberCardColClassName : memberCardGridClassName)} data-collapsed={collapsed ? "true" : "false"}>
        {onLeaveParticipantSession && !collapsed ? (
          <>
            <div className="flex items-center gap-2.5 min-w-0 w-full">
              <span className={memberAvatarClassName} style={{ backgroundColor: currentMember.color }} aria-hidden="true">
                {memberInitial(currentMember.displayName)}
              </span>
              <div className={memberCardCopyClassName} data-collapsed={collapsed ? "true" : "false"}>
                <strong className={memberCardNameClassName}>{currentMember.displayName}</strong>
                <span className={memberCardRoleClassName}>{roleLabel(currentMember.role, t.appShell.roles)}</span>
              </div>
            </div>
            <button className={memberSwitchButtonClassName} data-collapsed={collapsed ? "true" : "false"} type="button" onClick={openLeaveParticipantSessionDialog}>
              {t.appShell.switchIdentity}
            </button>
          </>
        ) : (
          <>
            <span className={memberAvatarClassName} style={{ backgroundColor: currentMember.color }} aria-hidden="true">
              {memberInitial(currentMember.displayName)}
            </span>
            <div className={memberCardCopyClassName} data-collapsed={collapsed ? "true" : "false"}>
              <strong className={memberCardNameClassName}>{currentMember.displayName}</strong>
              <span className={memberCardRoleClassName}>{roleLabel(currentMember.role, t.appShell.roles)}</span>
            </div>
            {onLeaveParticipantSession ? (
              <button className={memberSwitchButtonClassName} data-collapsed={collapsed ? "true" : "false"} type="button" onClick={openLeaveParticipantSessionDialog}>
                {t.appShell.switchIdentity}
              </button>
            ) : (
              <Icon name="chevronRight" className={memberFallbackIconClassName} data-collapsed={collapsed ? "true" : "false"} />
            )}
          </>
        )}
      </div>

      {identityDialogOpen ? (
        <WorkspaceConfirmDialog
          body={t.appShell.confirmSwitchIdentity({ name: currentMember.displayName })}
          cancelLabel={t.common.actions.cancel}
          className={identityDialogClassName}
          confirmLabel={t.appShell.switchIdentity}
          confirmVariant="primary"
          onCancel={() => setIdentityDialogOpen(false)}
          onConfirm={confirmLeaveParticipantSession}
          title={t.appShell.switchIdentity}
          titleId="identity-switch-title"
        />
      ) : null}
    </>
  );
}
