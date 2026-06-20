import { cn } from "@/src/lib/cn";
import type { Member, TripMemberAccessStatus, TripRole } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Select } from "@/src/ui";
import {
  memberControlsClassName,
  memberIdentityClassName,
  memberRoleSelectClassName,
  memberStatePillClassName,
  memberStatePillToneClassNames,
  memberStatusStackClassName,
  membersEmptyStateClassName,
  peopleHeadingClassName,
  peopleListClassName,
  peopleModuleClassName,
  personAvatarClassName,
  personRowClassName,
  presencePillClassName,
  presencePillToneClassNames,
  resetClaimButtonClassName,
} from "./people-panel.styles";

export function PeoplePanel({
  members,
  currentMemberId,
  canManagePeople = false,
  emptyMessage = "ยังไม่มีสมาชิก",
  onChangeMemberAccessStatus,
  onChangeCurrentMemberPassword,
  onChangeMemberRole,
  onResetFilters,
  onResetMemberClaim,
  onTransferOwnership,
}: {
  members: Member[];
  currentMemberId: string;
  canManagePeople?: boolean;
  emptyMessage?: string;
  onChangeMemberAccessStatus?: (memberId: string, accessStatus: TripMemberAccessStatus) => void;
  onChangeCurrentMemberPassword?: (memberId: string) => void;
  onChangeMemberRole?: (memberId: string, role: Exclude<TripRole, "owner">) => void;
  onResetFilters?: () => void;
  onResetMemberClaim?: (memberId: string) => void;
  onTransferOwnership?: (targetMemberId: string) => void;
}) {
  const { locale } = useI18n();
  const copy = peoplePanelCopy(locale);
  return (
    <section className={peopleModuleClassName} aria-label="People and presence">
      <h3 className={peopleHeadingClassName}>{copy.heading}</h3>
      <div className={peopleListClassName}>
        {members.length === 0 ? (
          <div className={membersEmptyStateClassName}>
            <strong>{emptyMessage}</strong>
            <span>{copy.emptyHint}</span>
            {resetFiltersButton(onResetFilters, locale)}
          </div>
        ) : members.map((member) => {
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
          <div className={personRowClassName} data-access-status={member.accessStatus ?? "active"} key={member.id}>
            <span className={personAvatarClassName} style={{ backgroundColor: member.color }} aria-hidden="true">
              {member.displayName.slice(0, 1)}
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
            ) : (
              <span className={cn(presencePillClassName, presencePillToneClassNames[member.presence])}>
                {presenceLabel(member.presence)}
              </span>
            )}
          </div>
          );
        })}
      </div>
    </section>
  );
}

function resetFiltersButton(onResetFilters: (() => void) | undefined, locale: string) {
  /* v8 ignore next */
  return onResetFilters ? <button className={resetClaimButtonClassName} type="button" onClick={onResetFilters}>{peoplePanelCopy(locale).resetFilters}</button> : null;
}

function presenceLabel(presence: Member["presence"]): string {
  /* v8 ignore next */
  return presence === "online" ? "ออนไลน์" : presence === "away" ? "ออฟไลน์ 1 ชม." : "ออฟไลน์";
}

function roleLabel(role: Member["role"], locale: string): string {
  if (locale === "th") {
    if (role === "owner") return "เจ้าของแผน";
    if (role === "organizer") return "ผู้จัดทริป";
    if (role === "traveler") return "ผู้ร่วมเดินทาง";
    return "ดูได้";
  }
  if (role === "owner") return "Owner";
  if (role === "organizer") return "Organizer";
  if (role === "traveler") return "Traveler";
  return "Viewer";
}

function peoplePanelCopy(locale: string) {
  return locale === "th"
    ? {
        heading: "สมาชิกและสถานะ",
        emptyHint: "ลองปรับคำค้นหาหรือล้างตัวกรองเพื่อดูสมาชิกทั้งหมด",
        active: "เปิดสิทธิ์",
        disabled: "ปิดสิทธิ์",
        claimed: "ยืนยันแล้ว",
        pending: "รอเข้าร่วม",
        changePassword: "เปลี่ยนรหัสผ่าน",
        resetPassword: "รีเซ็ตรหัสผ่าน",
        changePasswordFor: (name: string) => `เปลี่ยนรหัสผ่าน ${name}`,
        resetPasswordFor: (name: string) => `รีเซ็ตรหัสผ่าน ${name}`,
        enableFor: (name: string) => `เปิดสิทธิ์ ${name}`,
        disableFor: (name: string) => `ปิดสิทธิ์ ${name}`,
        transferOwnerFor: (name: string) => `โอน owner ให้ ${name}`,
        resetFilters: "ล้างตัวกรอง",
      }
    : {
        heading: "Members and status",
        emptyHint: "Try a different search or clear filters to see every member.",
        active: "Active",
        disabled: "Disabled",
        claimed: "Verified",
        pending: "Pending",
        changePassword: "Change password",
        resetPassword: "Reset password",
        changePasswordFor: (name: string) => `Change password ${name}`,
        resetPasswordFor: (name: string) => `Reset password ${name}`,
        enableFor: (name: string) => `Enable ${name}`,
        disableFor: (name: string) => `Disable ${name}`,
        transferOwnerFor: (name: string) => `Transfer owner to ${name}`,
        resetFilters: "Clear filters",
      };
}
