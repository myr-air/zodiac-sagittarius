import { type FormEvent, useEffect, useMemo, useState } from "react";
import { appRoutes } from "@/src/routes/app-routes";
import type { Member, Trip, TripMemberAccessStatus, TripRole } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
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
  onTransferOwnership?: (targetMemberId: string) => void;
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
  onTransferOwnership,
}: TripMembersPageProps) {
  const { locale, t } = useI18n();
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
        /* v8 ignore next */
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

  useEffect(() => {
    if (copyState === "idle") return undefined;
    const timeout = window.setTimeout(() => setCopyState("idle"), 2500);
    return () => window.clearTimeout(timeout);
  }, [copyState]);

  async function copyInviteLink() {
    /* v8 ignore next */
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
    /* v8 ignore next */
    if (!member) return;
    /* v8 ignore next */
    if (window.confirm(t.members.confirm.resetClaim({ name: member.displayName }))) {
      onResetMemberClaim(memberId);
    }
  }

  function confirmChangeAccessStatus(memberId: string, accessStatus: TripMemberAccessStatus) {
    const member = visibleMembers.find((candidate) => candidate.id === memberId);
    /* v8 ignore next */
    if (!member) return;
    const actionLabel = accessStatus === "disabled" ? t.members.confirm.disable : t.members.confirm.enable;
    if (window.confirm(t.members.confirm.access({ action: actionLabel, name: member.displayName }))) {
      onChangeMemberAccessStatus(memberId, accessStatus);
    }
  }

  function confirmTransferOwnership(memberId: string) {
    const member = visibleMembers.find((candidate) => candidate.id === memberId);
    /* v8 ignore next */
    if (!member) return;
    if (window.confirm(t.members.confirm.transferOwner({ name: member.displayName }))) {
      onTransferOwnership?.(memberId);
    }
  }

  function promptChangePassword(memberId: string) {
    const member = visibleMembers.find((candidate) => candidate.id === memberId);
    /* v8 ignore next */
    if (!member) return;
    const password = window.prompt(t.members.confirm.passwordPrompt({ name: member.displayName }));
    if (password === null) return;
    if (password.trim().length < 4) {
      window.alert(t.members.confirm.passwordTooShort);
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
    <section className="members-page" aria-label={t.members.pageLabel}>
      <PageHeader
        title={t.members.title}
        subtitle={trip.name}
        meta={(
          <>
            <span><Icon name="calendar" /> {formatTripRange(trip.startDate, trip.endDate, locale)}</span>
            <span><Icon name="users" /> {t.dates.memberCount({ count: visibleMembers.length })}</span>
          </>
        )}
        motif={<TravelMotif tone="sunshine" />}
        aside={<PageUserCard color={currentMember.color} name={currentMember.displayName} label={canManagePeople ? t.members.canManage : t.members.readOnly} />}
      />

      <section className="member-stat-grid" aria-label={t.members.summaryLabel}>
        <div className="member-stat">
          <Icon name="users" />
          <span>{t.members.stats.total}</span>
          <strong>{visibleMembers.length}</strong>
        </div>
        <div className="member-stat">
          <Icon name="check" />
          <span>{t.members.stats.active}</span>
          <strong>{activeMembers}</strong>
        </div>
        <div className="member-stat">
          <Icon name="warning" />
          <span>{t.members.stats.pending}</span>
          <strong>{pendingMembers}</strong>
        </div>
        <div className="member-stat">
          <Icon name="check" />
          <span>{t.members.stats.joined}</span>
          <strong>{joinedMembers}</strong>
        </div>
        <div className="member-stat">
          <Icon name="alertCircle" />
          <span>{t.members.stats.disabled}</span>
          <strong>{disabledMembers}</strong>
        </div>
      </section>

      <section className="member-command-bar" aria-label={t.members.commandBar}>
        <div className="member-command-fields">
          <label>
            <span>{t.members.fields.search}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.members.fields.searchPlaceholder} />
          </label>
          <label>
            <span>{t.members.fields.role}</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | TripRole)}>
              <option value="all">{t.members.filters.allRoles}</option>
              <option value="owner">{t.appShell.roles.owner}</option>
              <option value="organizer">{t.appShell.roles.organizer}</option>
              <option value="traveler">{t.appShell.roles.traveler}</option>
              <option value="viewer">{t.appShell.roles.viewer}</option>
            </select>
          </label>
          <label>
            <span>{t.members.fields.status}</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "disabled" | "claimed" | "pending")}>
              <option value="all">{t.members.filters.allStatuses}</option>
              <option value="active">{t.common.status.active}</option>
              <option value="disabled">{t.common.status.disabled}</option>
              <option value="claimed">{t.join.memberStatus.claimed}</option>
              <option value="pending">{t.common.status.pending}</option>
            </select>
          </label>
        </div>
        <div className="member-command-actions">
          <button className="member-filter-reset" type="button" onClick={resetFilters}>{t.members.actions.clear}</button>
          <button className="invite-copy-button" type="button" disabled={!canManagePeople} onClick={copyInviteLink}>
            <Icon name="copy" />
            {t.members.actions.copyInvite}
          </button>
          <button
            aria-expanded={createPanelOpen}
            className="member-create-button"
            type="button"
            disabled={!canManagePeople}
            onClick={() => setCreatePanelOpen((current) => !current)}
          >
            <Icon name="plus" />
            {createPanelOpen ? t.members.actions.closeCreate : t.members.actions.openCreate}
          </button>
        </div>
        <div className="member-command-meta">
          <code>{inviteLink}</code>
          <span className={`copy-feedback copy-feedback--${copyState}`} role="status">
            {copyState === "copied" ? t.common.status.copied : copyState === "error" ? t.common.status.copyFailed : canManagePeople ? t.members.copy.ready : t.members.copy.readOnly}
          </span>
        </div>
      </section>

      {createPanelOpen ? (
        <section className="member-create-panel" aria-label={t.members.createLabel}>
          <form className="member-create-form" onSubmit={submitNewMember}>
            <label>
              <span>{t.members.fields.newName}</span>
              <input
                disabled={!canManagePeople}
                value={newMemberName}
                onChange={(event) => setNewMemberName(event.target.value)}
                placeholder={t.members.fields.newNamePlaceholder}
              />
            </label>
            <label>
              <span>{t.members.fields.newRole}</span>
              <select
                disabled={!canManagePeople}
                value={newMemberRole}
                onChange={(event) => setNewMemberRole(event.target.value as Exclude<TripRole, "owner">)}
              >
                <option value="organizer">{t.appShell.roles.organizer}</option>
                <option value="traveler">{t.appShell.roles.traveler}</option>
                <option value="viewer">{t.appShell.roles.viewer}</option>
              </select>
            </label>
            <button className="member-create-button" type="submit" disabled={!canManagePeople || !newMemberName.trim()}>
              <Icon name="check" />
              {t.members.actions.saveMember}
            </button>
          </form>
        </section>
      ) : null}

      <PeoplePanel
        members={filteredMembers}
        currentMemberId={currentMember.id}
        canManagePeople={canManagePeople}
        emptyMessage={t.members.empty}
        onChangeMemberAccessStatus={confirmChangeAccessStatus}
        onChangeCurrentMemberPassword={promptChangePassword}
        onChangeMemberRole={onChangeMemberRole}
        onResetFilters={resetFilters}
        onResetMemberClaim={confirmResetClaim}
        onTransferOwnership={onTransferOwnership ? confirmTransferOwnership : undefined}
      />
    </section>
  );
}

function isMemberJoined(member: Member, currentMemberId: string): boolean {
  return Boolean(member.claimPasswordHash) || member.id === currentMemberId;
}

function buildInviteLink(joinId: string): string {
  /* v8 ignore next */
  const baseUrl = typeof window === "undefined" ? "" : window.location.origin;
  return `${baseUrl}${appRoutes.join(joinId)}`;
}
