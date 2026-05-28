import type { Member } from "@/src/trip/types";

export function PeoplePanel({ members, currentMemberId, canManagePeople = false }: { members: Member[]; currentMemberId: string; canManagePeople?: boolean }) {
  return (
    <section className="detail-section people-module" aria-label="People and presence">
      <h3>สมาชิกและสถานะ</h3>
      <div className="people-list">
        {members.map((member) => (
          <div className="person-row" key={member.id}>
            <span className="person-avatar" style={{ backgroundColor: member.color }} aria-hidden="true">
              {member.displayName.slice(0, 1)}
            </span>
            <div>
              <strong>{member.displayName}{member.id === currentMemberId ? " (คุณ)" : ""}</strong>
              <span>{roleLabel(member.role)}</span>
            </div>
            <span className={`presence-pill presence-pill--${member.presence}`}>
              {member.presence === "online" ? "ออนไลน์" : member.presence === "away" ? "ออฟไลน์ 1 ชม." : "ออฟไลน์"}
            </span>
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
