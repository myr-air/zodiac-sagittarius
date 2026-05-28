import type { Member, TripMemberAccessStatus, TripRole } from "@/src/trip/types";

export function PeoplePanel({
  members,
  currentMemberId,
  canManagePeople = false,
  onChangeMemberAccessStatus,
  onChangeMemberRole,
  onResetMemberClaim,
}: {
  members: Member[];
  currentMemberId: string;
  canManagePeople?: boolean;
  onChangeMemberAccessStatus?: (memberId: string, accessStatus: TripMemberAccessStatus) => void;
  onChangeMemberRole?: (memberId: string, role: Exclude<TripRole, "owner">) => void;
  onResetMemberClaim?: (memberId: string) => void;
}) {
  return (
    <section className="detail-section people-module" aria-label="People and presence">
      <h3>สมาชิกและสถานะ</h3>
      <div className="people-list">
        {members.map((member) => (
          <div className="person-row" data-access-status={member.accessStatus ?? "active"} key={member.id}>
            <span className="person-avatar" style={{ backgroundColor: member.color }} aria-hidden="true">
              {member.displayName.slice(0, 1)}
            </span>
            <div>
              <strong>{member.displayName}{member.id === currentMemberId ? " (คุณ)" : ""}</strong>
              <span>
                {roleLabel(member.role)}
                {member.accessStatus === "disabled" ? " · ปิดสิทธิ์" : ""}
                {member.claimPasswordHash ? " · Claim แล้ว" : " · ยังไม่ claim"}
              </span>
            </div>
            {canManagePeople && member.role !== "owner" ? (
              <div className="member-controls">
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
                {member.claimPasswordHash ? (
                  <button className="reset-claim-button" type="button" onClick={() => onResetMemberClaim?.(member.id)}>
                    รีเซ็ตรหัส
                  </button>
                ) : null}
                <button
                  className="reset-claim-button"
                  type="button"
                  onClick={() => onChangeMemberAccessStatus?.(member.id, member.accessStatus === "disabled" ? "active" : "disabled")}
                >
                  {member.accessStatus === "disabled" ? `เปิดสิทธิ์ ${member.displayName}` : `ปิดสิทธิ์ ${member.displayName}`}
                </button>
              </div>
            ) : (
              <span className={`presence-pill presence-pill--${member.presence}`}>
                {member.presence === "online" ? "ออนไลน์" : member.presence === "away" ? "ออฟไลน์ 1 ชม." : "ออฟไลน์"}
              </span>
            )}
          </div>
        ))}
      </div>
      <button className="invite-button" type="button" disabled={!canManagePeople}>เชิญสมาชิก</button>
    </section>
  );
}

function roleLabel(role: Member["role"]): string {
  if (role === "owner") return "เจ้าของแผน";
  if (role === "organizer") return "ผู้จัดทริป";
  if (role === "traveler") return "ผู้ร่วมเดินทาง";
  return "ดูได้";
}
