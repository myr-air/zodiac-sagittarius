import { type FormEvent, useMemo, useState } from "react";
import type { Member, Trip, TripMemberAccessStatus, TripRole } from "@/src/trip/types";
import { Icon } from "./icons";
import { TravelMotif } from "./motifs";
import { formatTripRange, PageHeader, PageUserCard } from "./PageHeader";
import { PeoplePanel } from "./PeoplePanel";

interface TripMembersPageProps {
  trip: Trip;
  currentMember: Member;
  canManagePeople: boolean;
  onChangeMemberAccessStatus: (memberId: string, accessStatus: TripMemberAccessStatus) => void;
  onChangeMemberPassword: (memberId: string, password: string) => void;
  onChangeMemberRole: (memberId: string, role: Exclude<TripRole, "owner">) => void;
  onCreateMember: (input: { displayName: string; role: Exclude<TripRole, "owner"> }) => void;
  onResetMemberClaim: (memberId: string) => void;
}

export function TripMembersPage({
  trip,
  currentMember,
  canManagePeople,
  onChangeMemberAccessStatus,
  onChangeMemberPassword,
  onChangeMemberRole,
  onCreateMember,
  onResetMemberClaim,
}: TripMembersPageProps) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | TripRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled" | "claimed" | "pending">("all");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<Exclude<TripRole, "owner">>("traveler");
  const visibleMembers = trip.members.filter((member) => member.id !== "member-viewer");
  const activeMembers = visibleMembers.filter((member) => member.accessStatus !== "disabled").length;
  const joinedMembers = visibleMembers.filter((member) => isMemberJoined(member, currentMember.id)).length;
  const disabledMembers = visibleMembers.length - activeMembers;
  const pendingMembers = visibleMembers.length - joinedMembers;
  const inviteLink = buildInviteLink(trip.joinId);
  const filteredMembers = useMemo(
    () =>
      visibleMembers.filter((member) => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        const matchesQuery = normalizedQuery.length === 0 || member.displayName.toLocaleLowerCase().includes(normalizedQuery);
        const matchesRole = roleFilter === "all" || member.role === roleFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && member.accessStatus !== "disabled") ||
          (statusFilter === "disabled" && member.accessStatus === "disabled") ||
          (statusFilter === "claimed" && isMemberJoined(member, currentMember.id)) ||
          (statusFilter === "pending" && !isMemberJoined(member, currentMember.id));

        return matchesQuery && matchesRole && matchesStatus;
      }),
    [currentMember.id, query, roleFilter, statusFilter, visibleMembers],
  );

  async function copyInviteLink() {
    if (!canManagePeople) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  function resetFilters() {
    setQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
  }

  function confirmResetClaim(memberId: string) {
    const member = visibleMembers.find((candidate) => candidate.id === memberId);
    if (!member) return;
    if (window.confirm(`รีเซ็ตรหัสของ ${member.displayName}? สมาชิกคนนี้จะต้องตั้งรหัสใหม่อีกครั้ง`)) {
      onResetMemberClaim(memberId);
    }
  }

  function confirmChangeAccessStatus(memberId: string, accessStatus: TripMemberAccessStatus) {
    const member = visibleMembers.find((candidate) => candidate.id === memberId);
    if (!member) return;
    const actionLabel = accessStatus === "disabled" ? "ปิดสิทธิ์" : "เปิดสิทธิ์";
    if (window.confirm(`${actionLabel} ${member.displayName}?`)) {
      onChangeMemberAccessStatus(memberId, accessStatus);
    }
  }

  function promptChangePassword(memberId: string) {
    const member = visibleMembers.find((candidate) => candidate.id === memberId);
    if (!member) return;
    const password = window.prompt(`ตั้งรหัสผ่านใหม่ของ ${member.displayName} (อย่างน้อย 4 ตัวอักษร)`);
    if (password === null) return;
    if (password.trim().length < 4) {
      window.alert("รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
      return;
    }
    onChangeMemberPassword(memberId, password);
  }

  function submitNewMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = newMemberName.trim();
    if (!canManagePeople || !displayName) return;
    onCreateMember({ displayName, role: newMemberRole });
    setNewMemberName("");
    setNewMemberRole("traveler");
    setCreatePanelOpen(false);
  }

  return (
    <section className="members-page" aria-label="Trip members">
      <PageHeader
        title="สมาชิกในทริป"
        subtitle={trip.name}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate)}</span>
            <span><Icon name="users" /> {visibleMembers.length} สมาชิก</span>
          </>
        )}
        motif={<TravelMotif tone="sunshine" />}
        aside={<PageUserCard color={currentMember.color} name={currentMember.displayName} label={canManagePeople ? "จัดการสมาชิกได้" : "ดูรายชื่อสมาชิก"} />}
      />

      <section className="member-stat-grid" aria-label="Member summary">
        <div className="member-stat">
          <Icon name="users" />
          <span>สมาชิกทั้งหมด</span>
          <strong>{visibleMembers.length}</strong>
        </div>
        <div className="member-stat">
          <Icon name="check" />
          <span>เปิดสิทธิ์</span>
          <strong>{activeMembers}</strong>
        </div>
        <div className="member-stat">
          <Icon name="warning" />
          <span>รอเข้าร่วม</span>
          <strong>{pendingMembers}</strong>
        </div>
        <div className="member-stat">
          <Icon name="check" />
          <span>ยืนยันแล้ว</span>
          <strong>{joinedMembers}</strong>
        </div>
        <div className="member-stat">
          <Icon name="alertCircle" />
          <span>ปิดสิทธิ์</span>
          <strong>{disabledMembers}</strong>
        </div>
      </section>

      <section className="member-command-bar" aria-label="Member command bar">
        <div className="member-command-fields">
          <label>
            <span>ค้นหาสมาชิก</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่อสมาชิก" />
          </label>
          <label>
            <span>สิทธิ์</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | TripRole)}>
              <option value="all">ทุกสิทธิ์</option>
              <option value="owner">Owner</option>
              <option value="organizer">Organizer</option>
              <option value="traveler">Traveller</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
          <label>
            <span>สถานะ</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "disabled" | "claimed" | "pending")}>
              <option value="all">ทุกสถานะ</option>
              <option value="active">เปิดสิทธิ์</option>
              <option value="disabled">ปิดสิทธิ์</option>
              <option value="claimed">ยืนยันแล้ว</option>
              <option value="pending">รอเข้าร่วม</option>
            </select>
          </label>
        </div>
        <div className="member-command-actions">
          <button className="member-filter-reset" type="button" onClick={resetFilters}>ล้างตัวกรอง</button>
          <button className="invite-copy-button" type="button" disabled={!canManagePeople} onClick={copyInviteLink}>
            <Icon name="copy" />
            คัดลอกลิงก์เชิญ
          </button>
          <button
            aria-expanded={createPanelOpen}
            className="member-create-button"
            type="button"
            disabled={!canManagePeople}
            onClick={() => setCreatePanelOpen((current) => !current)}
          >
            <Icon name="plus" />
            {createPanelOpen ? "ปิดฟอร์มเพิ่มสมาชิก" : "เปิดฟอร์มเพิ่มสมาชิก"}
          </button>
        </div>
        <div className="member-command-meta">
          <code>{inviteLink}</code>
          <span className={`copy-feedback copy-feedback--${copyState}`} role="status">
            {copyState === "copied" ? "คัดลอกแล้ว" : copyState === "error" ? "คัดลอกไม่สำเร็จ" : canManagePeople ? "พร้อมเชิญสมาชิก" : "อ่านอย่างเดียว"}
          </span>
        </div>
      </section>

      {createPanelOpen ? (
        <section className="member-create-panel" aria-label="Create trip member">
          <form className="member-create-form" onSubmit={submitNewMember}>
            <label>
              <span>ชื่อสมาชิกใหม่</span>
              <input
                disabled={!canManagePeople}
                value={newMemberName}
                onChange={(event) => setNewMemberName(event.target.value)}
                placeholder="เช่น New Cousin"
              />
            </label>
            <label>
              <span>สิทธิ์สมาชิกใหม่</span>
              <select
                disabled={!canManagePeople}
                value={newMemberRole}
                onChange={(event) => setNewMemberRole(event.target.value as Exclude<TripRole, "owner">)}
              >
                <option value="organizer">Organizer</option>
                <option value="traveler">Traveller</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>
            <button className="member-create-button" type="submit" disabled={!canManagePeople || !newMemberName.trim()}>
              <Icon name="check" />
              บันทึกสมาชิก
            </button>
          </form>
        </section>
      ) : null}

      <PeoplePanel
        members={filteredMembers}
        currentMemberId={currentMember.id}
        canManagePeople={canManagePeople}
        emptyMessage="ไม่พบสมาชิกที่ตรงกับตัวกรอง"
        onChangeMemberAccessStatus={confirmChangeAccessStatus}
        onChangeCurrentMemberPassword={promptChangePassword}
        onChangeMemberRole={onChangeMemberRole}
        onResetFilters={resetFilters}
        onResetMemberClaim={confirmResetClaim}
      />
    </section>
  );
}

function isMemberJoined(member: Member, currentMemberId: string): boolean {
  return Boolean(member.claimPasswordHash) || member.id === currentMemberId;
}

function buildInviteLink(joinId: string): string {
  const baseUrl = typeof window === "undefined" ? "" : window.location.origin;
  return `${baseUrl}/members?trip=${encodeURIComponent(joinId)}`;
}
