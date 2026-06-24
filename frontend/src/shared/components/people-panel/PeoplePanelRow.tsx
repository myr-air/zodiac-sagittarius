import { personRowClassName } from "./people-panel.styles";
import { peoplePanelCopy } from "./people-panel.copy";
import { PeoplePanelRowControls } from "./PeoplePanelRowControls";
import { PeoplePanelPresencePill, PeoplePanelRowIdentity } from "./PeoplePanelRowStatus";
import type { PeoplePanelRowProps } from "./people-panel.types";

export function PeoplePanelRow({
  canManagePeople,
  currentMemberId,
  locale,
  member,
  onChangeCurrentMemberPassword,
  onChangeMemberAccessStatus,
  onChangeMemberRole,
  onResetMemberClaim,
  onTransferOwnership,
  roleLabels,
}: PeoplePanelRowProps) {
  const copy = peoplePanelCopy(locale);
  const joined = Boolean(member.claimPasswordHash || member.claimedAt) || member.id === currentMemberId;
  const canChangePassword = member.id === currentMemberId || Boolean(member.claimPasswordHash);
  const canTransferOwner = Boolean(
    onTransferOwnership &&
    member.id !== currentMemberId &&
    member.role !== "owner" &&
    member.accessStatus !== "disabled" &&
    member.userId,
  );

  return (
    <div className={personRowClassName} data-access-status={member.accessStatus ?? "active"}>
      <PeoplePanelRowIdentity
        copy={copy}
        currentMemberId={currentMemberId}
        joined={joined}
        locale={locale}
        member={member}
        roleLabels={roleLabels}
      />
      {canManagePeople && (member.role !== "owner" || member.id === currentMemberId) ? (
        <PeoplePanelRowControls
          canChangePassword={canChangePassword}
          canTransferOwner={canTransferOwner}
          copy={copy}
          currentMemberId={currentMemberId}
          member={member}
          onChangeCurrentMemberPassword={onChangeCurrentMemberPassword}
          onChangeMemberAccessStatus={onChangeMemberAccessStatus}
          onChangeMemberRole={onChangeMemberRole}
          onResetMemberClaim={onResetMemberClaim}
          onTransferOwnership={onTransferOwnership}
          roleLabels={roleLabels}
        />
      ) : (
        <PeoplePanelPresencePill member={member} />
      )}
    </div>
  );
}
