import { cn } from "@/src/lib/cn";
import type { Member, TripMemberAccessStatus, TripRole } from "@/src/trip/types";

const peopleModuleClassName = ["detail-section", "people-module", "grid", "min-w-0", "gap-3", "rounded-[var(--radius-md)]", "border", "border-[var(--color-border)]", "bg-[var(--color-surface)]", "p-3.5"];
const peopleListClassName = ["people-list", "grid", "min-w-0", "gap-2"];
const personRowClassName = ["person-row", "grid", "min-w-0", "grid-cols-[34px_minmax(0,1fr)_auto]", "items-center", "gap-2.5", "rounded-[var(--radius-sm)]", "border", "border-[var(--color-border)]", "bg-[var(--color-surface-subtle)]", "p-2.5"];
const personAvatarClassName = ["person-avatar", "grid", "size-[34px]", "place-items-center", "rounded-full", "text-sm", "font-extrabold", "text-white"];
const memberIdentityClassName = ["member-identity", "grid", "min-w-0", "gap-1"];
const memberStatusStackClassName = ["member-status-stack", "flex", "min-w-0", "flex-wrap", "gap-1.5"];
const memberStatePillClassName = ["member-state-pill", "inline-flex", "min-h-[22px]", "items-center", "rounded-full", "border", "px-2", "py-0.5", "text-[11px]", "font-extrabold", "leading-4"];
const memberControlsClassName = ["member-controls", "flex", "min-w-0", "flex-wrap", "justify-end", "gap-1.5"];
const memberRoleSelectClassName = ["member-role-select", "min-h-8", "max-w-32", "rounded-[var(--radius-sm)]", "border", "border-[var(--color-border)]", "bg-[var(--color-surface)]", "px-2", "text-xs", "font-extrabold", "text-[var(--color-text)]"];
const resetClaimButtonClassName = [
  "reset-claim-button",
  "inline-flex",
  "min-h-8",
  "items-center",
  "justify-center",
  "rounded-[var(--radius-sm)]",
  "border",
  "border-[var(--color-border)]",
  "bg-[var(--color-surface)]",
  "px-2.5",
  "text-xs",
  "font-extrabold",
  "text-[var(--color-primary-strong)]",
  "transition-[border-color,box-shadow,transform]",
  "duration-150",
  "hover:-translate-y-px",
  "hover:border-[var(--color-primary)]",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-[var(--color-primary-border)]",
];
const presencePillClassName = ["presence-pill", "col-start-2", "inline-flex", "min-h-[22px]", "items-center", "justify-center", "justify-self-start", "whitespace-nowrap", "rounded-full", "px-2", "text-[11px]", "font-extrabold", "leading-4"];
const membersEmptyStateClassName = ["members-empty-state", "grid", "min-w-0", "justify-items-center", "gap-2", "rounded-[var(--radius-md)]", "border", "border-dashed", "border-[var(--color-border-strong)]", "p-7", "text-center", "text-[var(--color-text-muted)]"];

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
  return (
    <section className={cn(peopleModuleClassName)} aria-label="People and presence">
      <h3>สมาชิกและสถานะ</h3>
      <div className={cn(peopleListClassName)}>
        {members.length === 0 ? (
          <div className={cn(membersEmptyStateClassName)}>
            <strong>{emptyMessage}</strong>
            <span>ลองปรับคำค้นหาหรือล้างตัวกรองเพื่อดูสมาชิกทั้งหมด</span>
            {resetFiltersButton(onResetFilters)}
          </div>
        ) : members.map((member) => {
          const joined = Boolean(member.claimPasswordHash) || member.id === currentMemberId;
          const canChangePassword = member.id === currentMemberId || Boolean(member.claimPasswordHash);
          const canTransferOwner = Boolean(
            onTransferOwnership &&
            member.id !== currentMemberId &&
            member.role !== "owner" &&
            member.accessStatus !== "disabled" &&
            member.userId,
          );

          return (
          <div className={cn(personRowClassName)} data-access-status={member.accessStatus ?? "active"} key={member.id}>
            <span className={cn(personAvatarClassName)} style={{ backgroundColor: member.color }} aria-hidden="true">
              {member.displayName.slice(0, 1)}
            </span>
            <div className={cn(memberIdentityClassName)}>
              <strong>{member.displayName}{member.id === currentMemberId ? " (คุณ)" : ""}</strong>
              <span>{roleLabel(member.role)}</span>
              <div className={cn(memberStatusStackClassName)} aria-label={`Status for ${member.displayName}`}>
                <span className={cn(memberStatePillClassName, `member-state-pill--${member.accessStatus === "disabled" ? "disabled" : "active"}`)}>
                  {member.accessStatus === "disabled" ? "ปิดสิทธิ์" : "เปิดสิทธิ์"}
                </span>
                <span className={cn(memberStatePillClassName, `member-state-pill--${joined ? "claimed" : "pending"}`)}>
                  {joined ? "ยืนยันแล้ว" : "รอเข้าร่วม"}
                </span>
              </div>
            </div>
            {canManagePeople && (member.role !== "owner" || member.id === currentMemberId) ? (
              <div className={cn(memberControlsClassName)}>
                {member.role !== "owner" ? (
                  <select
                    aria-label={`Role for ${member.displayName}`}
                    className={cn(memberRoleSelectClassName)}
                    value={member.role}
                    onChange={(event) => onChangeMemberRole?.(member.id, event.target.value as Exclude<TripRole, "owner">)}
                  >
                    <option value="organizer">Organizer</option>
                    <option value="traveler">Traveller</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : null}
                {canChangePassword ? (
                  <button
                    aria-label={`${member.id === currentMemberId ? "เปลี่ยน" : "รีเซ็ต"}รหัสผ่าน ${member.displayName}`}
                    className={cn(resetClaimButtonClassName)}
                    type="button"
                    onClick={() => member.id === currentMemberId ? onChangeCurrentMemberPassword?.(member.id) : onResetMemberClaim?.(member.id)}
                  >
                    {member.id === currentMemberId ? "เปลี่ยนรหัสผ่าน" : "รีเซ็ตรหัสผ่าน"}
                  </button>
                ) : null}
                {member.role !== "owner" ? (
                  <button
                    className={cn(resetClaimButtonClassName)}
                    type="button"
                    onClick={() => onChangeMemberAccessStatus?.(member.id, member.accessStatus === "disabled" ? "active" : "disabled")}
                  >
                    {member.accessStatus === "disabled" ? `เปิดสิทธิ์ ${member.displayName}` : `ปิดสิทธิ์ ${member.displayName}`}
                  </button>
                ) : null}
                {canTransferOwner ? (
                  <button
                    className={cn(resetClaimButtonClassName)}
                    type="button"
                    onClick={() => onTransferOwnership?.(member.id)}
                  >
                    โอน owner ให้ {member.displayName}
                  </button>
                ) : null}
              </div>
            ) : (
              <span className={cn(presencePillClassName, `presence-pill--${member.presence}`)}>
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

function resetFiltersButton(onResetFilters?: () => void) {
  /* v8 ignore next */
  return onResetFilters ? <button className={cn(resetClaimButtonClassName)} type="button" onClick={onResetFilters}>ล้างตัวกรอง</button> : null;
}

function presenceLabel(presence: Member["presence"]): string {
  /* v8 ignore next */
  return presence === "online" ? "ออนไลน์" : presence === "away" ? "ออฟไลน์ 1 ชม." : "ออฟไลน์";
}

function roleLabel(role: Member["role"]): string {
  if (role === "owner") return "เจ้าของแผน";
  if (role === "organizer") return "ผู้จัดทริป";
  if (role === "traveler") return "ผู้ร่วมเดินทาง";
  return "ดูได้";
}
