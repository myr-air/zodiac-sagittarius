"use client";

import { useState } from "react";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { memberInitial, roleLabel } from "@/src/trip/member-labels";
import type { Member } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import {
  identityDialogActionsClassName,
  identityDialogBackdropClassName,
  identityDialogBodyClassName,
  identityDialogButtonClassName,
  identityDialogClassName,
  identityDialogPrimaryButtonClassName,
  identityDialogTitleClassName,
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

interface AppShellMemberCardProps {
  collapsed: boolean;
  currentMember: Member;
  onLeaveParticipantSession?: () => void;
}

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
        <div className={identityDialogBackdropClassName} role="presentation">
          <section className={identityDialogClassName} role="dialog" aria-modal="true" aria-labelledby="identity-switch-title">
            <h2 className={identityDialogTitleClassName} id="identity-switch-title">{t.appShell.switchIdentity}</h2>
            <p className={identityDialogBodyClassName}>{t.appShell.confirmSwitchIdentity({ name: currentMember.displayName })}</p>
            <div className={identityDialogActionsClassName}>
              <button className={identityDialogButtonClassName} type="button" onClick={() => setIdentityDialogOpen(false)}>
                {t.common.actions.cancel}
              </button>
              <button className={identityDialogPrimaryButtonClassName} type="button" onClick={confirmLeaveParticipantSession}>
                {t.appShell.switchIdentity}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
