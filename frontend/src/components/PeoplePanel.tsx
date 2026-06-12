import { cn } from "@/src/lib/cn";
import type { Member, TripMemberAccessStatus, TripRole } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";

const peopleModuleClassName = "detail-section people-module grid w-full min-w-0 gap-3 rounded-(--radius-md) border border-[color-mix(in_srgb,var(--color-route-border)_48%,var(--color-border))] bg-[linear-gradient(180deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-route-soft)_34%,var(--color-surface))_100%)] p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)]";
const peopleHeadingClassName = "m-0 text-[15px] font-extrabold leading-[21px] text-(--color-text)";
const peopleListClassName = "people-list grid min-w-0 gap-2";
const personRowClassName = "person-row grid min-h-[68px] min-w-0 grid-cols-[34px_minmax(220px,1fr)_auto] items-center gap-2.5 rounded-(--radius-sm) border border-[color-mix(in_srgb,var(--color-border)_78%,var(--color-route-border))] bg-[rgb(255_255_255_/_0.82)] p-2.5 text-[11px] leading-4 text-(--color-text-muted) shadow-[0_1px_0_rgb(15_23_42_/_0.035)] data-[access-status=disabled]:bg-(--color-surface-muted) data-[access-status=disabled]:opacity-75 max-[1199px]:grid-cols-[34px_minmax(0,1fr)]";
const personAvatarClassName = "person-avatar grid size-[34px] place-items-center rounded-full text-sm font-extrabold text-white";
const memberIdentityClassName = "member-identity grid min-w-0 gap-1 [&_span]:text-[12px] [&_span]:font-semibold [&_span]:text-(--color-text-muted) [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[13px] [&_strong]:font-extrabold [&_strong]:leading-[18px] [&_strong]:text-(--color-text)";
const memberStatusStackClassName = "member-status-stack flex min-w-0 flex-wrap gap-1.5";
const memberStatePillClassName = "member-state-pill inline-flex min-h-[22px] items-center rounded-full border px-2 py-0.5 text-[11px] font-extrabold leading-4";
const memberStatePillToneClassNames = {
  active: "member-state-pill--active border-(--color-success-border) bg-(--color-success-soft) text-(--color-success)",
  claimed: "member-state-pill--claimed border-(--color-success-border) bg-(--color-success-soft) text-(--color-success)",
  disabled: "member-state-pill--disabled border-(--color-danger-border) bg-(--color-danger-soft) text-(--color-danger)",
  pending: "member-state-pill--pending border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning-strong)",
} satisfies Record<"active" | "claimed" | "disabled" | "pending", string>;
const memberControlsClassName = "member-controls flex min-w-0 flex-wrap justify-end gap-1.5 max-[1199px]:col-start-2 max-[1199px]:justify-start max-[767px]:w-full max-[767px]:[&>*]:flex-[1_1_150px]";
const memberRoleSelectClassName = "member-role-select min-h-8 max-w-32 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) py-[5px] px-2.5 text-[13px] font-bold leading-5 text-(--color-text) cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary-border)";
const resetClaimButtonClassName = "reset-claim-button inline-flex min-h-8 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) py-[5px] px-3 text-[13px] font-bold text-(--color-warning-strong) transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-(--color-primary) hover:shadow-[0_6px_8px_rgb(15_118_110_/_0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary-border)";
const presencePillClassName = "presence-pill col-start-2 inline-flex min-h-[22px] items-center justify-center justify-self-start gap-1.5 whitespace-nowrap rounded-full px-2 text-[11px] font-extrabold leading-4 text-(--color-text-muted) before:size-1.5 before:rounded-full before:bg-(--color-text-subtle) before:content-['']";
const presencePillToneClassNames = {
  away: "presence-pill--away before:bg-(--color-text-subtle)",
  offline: "presence-pill--offline before:bg-(--color-text-subtle)",
  online: "presence-pill--online before:bg-(--color-success)",
} satisfies Record<Member["presence"], string>;
const membersEmptyStateClassName = "members-empty-state grid min-w-0 justify-items-center gap-2 rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-surface-subtle) p-7 text-center text-(--color-text-muted) [&_strong]:text-sm [&_strong]:leading-5 [&_strong]:text-(--color-text)";

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
                  <select
                    aria-label={`Role for ${member.displayName}`}
                    className={memberRoleSelectClassName}
                    value={member.role}
                    onChange={(event) => onChangeMemberRole?.(member.id, event.target.value as Exclude<TripRole, "owner">)}
                  >
                    <option value="organizer">{locale === "th" ? "ผู้จัดทริป" : "Organizer"}</option>
                    <option value="traveler">{locale === "th" ? "ผู้ร่วมเดินทาง" : "Traveler"}</option>
                    <option value="viewer">{locale === "th" ? "ผู้ชม" : "Viewer"}</option>
                  </select>
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
