import { cn } from "@/src/lib/cn";
import { memberInitial } from "@/src/trip/member-labels";
import type { Member, TripMemberAccessStatus, TripRole } from "@/src/trip/types";
import { Select } from "@/src/ui";
import {
  memberControlsClassName,
  memberIdentityClassName,
  memberRoleSelectClassName,
  memberStatePillClassName,
  memberStatePillToneClassNames,
  memberStatusStackClassName,
  personAvatarClassName,
  personRowClassName,
  presencePillClassName,
  presencePillToneClassNames,
  resetClaimButtonClassName,
} from "./people-panel.styles";
import { peoplePanelCopy, presenceLabel, roleLabel } from "./people-panel.copy";

interface PeoplePanelRowProps {
  canManagePeople: boolean;
  currentMemberId: string;
  locale: string;
  member: Member;
  onChangeCurrentMemberPassword?: (memberId: string) => void;
  onChangeMemberAccessStatus?: (memberId: string, accessStatus: TripMemberAccessStatus) => void;
  onChangeMemberRole?: (memberId: string, role: Exclude<TripRole, "owner">) => void;
  onResetMemberClaim?: (memberId: string) => void;
  onTransferOwnership?: (targetMemberId: string) => void;
}

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
      <span className={personAvatarClassName} style={{ backgroundColor: member.color }} aria-hidden="true">
        {memberInitial(member.displayName)}
      </span>
      <div className={memberIdentityClassName}>
        <strong>{member.displayName}{member.id === currentMemberId ? (locale === "th" ? " (คุณ)" : " (You)") : ""}</strong>
        <span>{roleLabel(member.role, locale)}</span>
        <div className={memberStatusStackClassName} aria-label={`Status for ${member.displayName}`}>
          <span className={cn(memberStatePillClassName, memberStatePillToneClassNames[member.accessStatus === "disabled" ? "disabled" : "active"])}>
            {member.accessStatus === "disabled" ? copy.disabled : copy.active}
          </span>
          <span className={cn(memberStatePillClassName, memberStatePillToneClassNames[joined ? "claimed" : "pending"])}>
            {joined ? copy.claimed : copy.pending}
          </span>
        </div>
      </div>
      {canManagePeople && (member.role !== "owner" || member.id === currentMemberId) ? (
        <PeoplePanelRowControls
          canChangePassword={canChangePassword}
          canTransferOwner={canTransferOwner}
          copy={copy}
          currentMemberId={currentMemberId}
          locale={locale}
          member={member}
          onChangeCurrentMemberPassword={onChangeCurrentMemberPassword}
          onChangeMemberAccessStatus={onChangeMemberAccessStatus}
          onChangeMemberRole={onChangeMemberRole}
          onResetMemberClaim={onResetMemberClaim}
          onTransferOwnership={onTransferOwnership}
        />
      ) : (
        <span className={cn(presencePillClassName, presencePillToneClassNames[member.presence])}>
          {presenceLabel(member.presence)}
        </span>
      )}
    </div>
  );
}

type PeoplePanelCopy = ReturnType<typeof peoplePanelCopy>;

interface PeoplePanelRowControlsProps {
  canChangePassword: boolean;
  canTransferOwner: boolean;
  copy: PeoplePanelCopy;
  currentMemberId: string;
  locale: string;
  member: Member;
  onChangeCurrentMemberPassword?: (memberId: string) => void;
  onChangeMemberAccessStatus?: (memberId: string, accessStatus: TripMemberAccessStatus) => void;
  onChangeMemberRole?: (memberId: string, role: Exclude<TripRole, "owner">) => void;
  onResetMemberClaim?: (memberId: string) => void;
  onTransferOwnership?: (targetMemberId: string) => void;
}

function PeoplePanelRowControls({
  canChangePassword,
  canTransferOwner,
  copy,
  currentMemberId,
  locale,
  member,
  onChangeCurrentMemberPassword,
  onChangeMemberAccessStatus,
  onChangeMemberRole,
  onResetMemberClaim,
  onTransferOwnership,
}: PeoplePanelRowControlsProps) {
  return (
    <div className={memberControlsClassName}>
      {member.role !== "owner" ? (
        <Select
          aria-label={`Role for ${member.displayName}`}
          className={memberRoleSelectClassName}
          value={member.role}
          onChange={(event) => onChangeMemberRole?.(member.id, event.target.value as Exclude<TripRole, "owner">)}
        >
          <option value="organizer">{locale === "th" ? "ผู้จัดทริป" : "Organizer"}</option>
          <option value="traveler">{locale === "th" ? "ผู้ร่วมเดินทาง" : "Traveler"}</option>
          <option value="viewer">{locale === "th" ? "ผู้ชม" : "Viewer"}</option>
        </Select>
      ) : null}
      {canChangePassword ? (
        <button
          aria-label={member.id === currentMemberId ? copy.changePasswordFor(member.displayName) : copy.resetPasswordFor(member.displayName)}
          className={resetClaimButtonClassName}
          type="button"
          onClick={() => member.id === currentMemberId ? onChangeCurrentMemberPassword?.(member.id) : onResetMemberClaim?.(member.id)}
        >
          {member.id === currentMemberId ? copy.changePassword : copy.resetPassword}
        </button>
      ) : null}
      {member.role !== "owner" ? (
        <button
          className={resetClaimButtonClassName}
          type="button"
          onClick={() => onChangeMemberAccessStatus?.(member.id, member.accessStatus === "disabled" ? "active" : "disabled")}
        >
          {member.accessStatus === "disabled" ? copy.enableFor(member.displayName) : copy.disableFor(member.displayName)}
        </button>
      ) : null}
      {canTransferOwner ? (
        <button
          className={resetClaimButtonClassName}
          type="button"
          onClick={() => onTransferOwnership?.(member.id)}
        >
          {copy.transferOwnerFor(member.displayName)}
        </button>
      ) : null}
    </div>
  );
}
