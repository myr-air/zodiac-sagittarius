import type { Member, TripMemberAccessStatus, TripRole } from "@/src/trip/types";

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
    <section className="detail-section people-module" aria-label="People and presence">
      <h3>สมาชิกและสถานะ</h3>
      <div className="people-list">
        {members.length === 0 ? (
          <div className="members-empty-state">
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
          <div className="person-row" data-access-status={member.accessStatus ?? "active"} key={member.id}>
            <span className="person-avatar" style={{ backgroundColor: member.color }} aria-hidden="true">
              {member.displayName.slice(0, 1)}
            </span>
            <div className="member-identity">
              <strong>{member.displayName}{member.id === currentMemberId ? " (คุณ)" : ""}</strong>
              <span>{roleLabel(member.role)}</span>
              <div className="member-status-stack" aria-label={`Status for ${member.displayName}`}>
                <span className={`member-state-pill member-state-pill--${member.accessStatus === "disabled" ? "disabled" : "active"}`}>
                  {member.accessStatus === "disabled" ? "ปิดสิทธิ์" : "เปิดสิทธิ์"}
                </span>
                <span className={`member-state-pill member-state-pill--${joined ? "claimed" : "pending"}`}>
                  {joined ? "ยืนยันแล้ว" : "รอเข้าร่วม"}
                </span>
              </div>
            </div>
            {canManagePeople && (member.role !== "owner" || member.id === currentMemberId) ? (
              <div className="member-controls">
                {member.role !== "owner" ? (
                  <select
                    aria-label={`Role for ${member.displayName}`}
                    className="member-role-select"
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
                    className="reset-claim-button"
                    type="button"
                    onClick={() => member.id === currentMemberId ? onChangeCurrentMemberPassword?.(member.id) : onResetMemberClaim?.(member.id)}
                  >
                    {member.id === currentMemberId ? "เปลี่ยนรหัสผ่าน" : "รีเซ็ตรหัสผ่าน"}
                  </button>
                ) : null}
                {member.role !== "owner" ? (
                  <button
                    className="reset-claim-button"
                    type="button"
                    onClick={() => onChangeMemberAccessStatus?.(member.id, member.accessStatus === "disabled" ? "active" : "disabled")}
                  >
                    {member.accessStatus === "disabled" ? `เปิดสิทธิ์ ${member.displayName}` : `ปิดสิทธิ์ ${member.displayName}`}
                  </button>
                ) : null}
                {canTransferOwner ? (
                  <button
                    className="reset-claim-button"
                    type="button"
                    onClick={() => onTransferOwnership?.(member.id)}
                  >
                    โอน owner ให้ {member.displayName}
                  </button>
                ) : null}
              </div>
            ) : (
              <span className={`presence-pill presence-pill--${member.presence}`}>
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
  return onResetFilters ? <button type="button" onClick={onResetFilters}>ล้างตัวกรอง</button> : null;
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
