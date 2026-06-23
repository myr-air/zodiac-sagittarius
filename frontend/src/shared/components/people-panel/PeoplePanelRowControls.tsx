import { Select } from "@/src/ui";
import {
  memberControlsClassName,
  memberRoleSelectClassName,
  resetClaimButtonClassName,
} from "./people-panel.styles";
import { peoplePanelCopy } from "./people-panel.copy";
import type {
  PeoplePanelManagementHandlers,
  PeoplePanelManagedRole,
  PeoplePanelRowProps,
} from "./people-panel.types";

type PeoplePanelCopy = ReturnType<typeof peoplePanelCopy>;

interface PeoplePanelRowControlsProps extends PeoplePanelManagementHandlers {
  canChangePassword: boolean;
  canTransferOwner: boolean;
  copy: PeoplePanelCopy;
  currentMemberId: string;
  locale: string;
  member: PeoplePanelRowProps["member"];
}

export function PeoplePanelRowControls({
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
          onChange={(event) => onChangeMemberRole?.(member.id, event.target.value as PeoplePanelManagedRole)}
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
