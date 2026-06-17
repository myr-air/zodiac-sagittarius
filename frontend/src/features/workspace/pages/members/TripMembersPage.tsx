import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { Member, Trip, TripMemberAccessStatus, TripRole } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import { PeoplePanel } from "@/src/shared/components/people-panel";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import { WorkspacePage } from "@/src/ui";
import { MemberManagementControls } from "./components/MemberManagementControls";
import { MemberSummaryStats } from "./components/MemberSummaryStats";
import { MemberTaskDialog, type MemberTaskDialogState } from "./components/MemberTaskDialog";
import {
  buildInviteLink,
  filterTripMembers,
  memberSummaryCounts,
  type MemberRoleFilter,
  type MemberStatusFilter,
  visibleTripMembers,
} from "./TripMembersPage.support";
import * as memberStyles from "./TripMembersPage.styles";

interface TripMembersPageProps {
  trip: Trip;
  currentMember: Member;
  canManagePeople: boolean;
  joinInviteToken?: string | null;
  onChangeMemberAccessStatus: (memberId: string, accessStatus: TripMemberAccessStatus) => void;
  onChangeMemberPassword: (memberId: string, password: string) => void;
  onChangeMemberRole: (memberId: string, role: Exclude<TripRole, "owner">) => void;
  onCreateMember: (input: { displayName: string; role: Exclude<TripRole, "owner"> }) => void;
  onRotateJoinInviteToken?: () => Promise<void>;
  onResetMemberClaim: (memberId: string) => void;
  onTransferOwnership?: (targetMemberId: string) => void;
}

export function TripMembersPage({
  trip,
  currentMember,
  canManagePeople,
  joinInviteToken,
  onChangeMemberAccessStatus,
  onChangeMemberPassword,
  onChangeMemberRole,
  onCreateMember,
  onRotateJoinInviteToken,
  onResetMemberClaim,
  onTransferOwnership,
}: TripMembersPageProps) {
  const { locale, t } = useI18n();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>("all");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [isRotatingInviteToken, setIsRotatingInviteToken] = useState(false);
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<Exclude<TripRole, "owner">>("traveler");
  const [memberDialog, setMemberDialog] = useState<MemberTaskDialogState | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const visibleMembers = useMemo(() => visibleTripMembers(trip.members), [trip.members]);
  const summaryStats = useMemo(() => memberSummaryCounts(visibleMembers, currentMember.id), [currentMember.id, visibleMembers]);
  const inviteLink = buildInviteLink(trip.joinId, joinInviteToken);
  const filteredMembers = useMemo(
    () =>
      filterTripMembers({ currentMemberId: currentMember.id, members: visibleMembers, query, roleFilter, statusFilter }),
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

  async function rotateInviteToken() {
    if (!canManagePeople || !onRotateJoinInviteToken) return;
    setIsRotatingInviteToken(true);
    try {
      await onRotateJoinInviteToken();
      setCopyState("idle");
    } catch {
      setCopyState("error");
    } finally {
      setIsRotatingInviteToken(false);
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
    setMemberDialog({ kind: "reset", member });
  }

  function confirmChangeAccessStatus(memberId: string, accessStatus: TripMemberAccessStatus) {
    const member = visibleMembers.find((candidate) => candidate.id === memberId);
    /* v8 ignore next */
    if (!member) return;
    const actionLabel = accessStatus === "disabled" ? t.members.confirm.disable : t.members.confirm.enable;
    setMemberDialog({ kind: "access", member, accessStatus, actionLabel });
  }

  function confirmTransferOwnership(memberId: string) {
    const member = visibleMembers.find((candidate) => candidate.id === memberId);
    /* v8 ignore next */
    if (!member) return;
    setMemberDialog({ kind: "transfer", member });
  }

  function promptChangePassword(memberId: string) {
    const member = visibleMembers.find((candidate) => candidate.id === memberId);
    /* v8 ignore next */
    if (!member) return;
    setPasswordValue("");
    setPasswordError(null);
    setMemberDialog({ kind: "password", member });
  }

  function closeMemberDialog() {
    setMemberDialog(null);
    setPasswordValue("");
    setPasswordError(null);
  }

  function submitMemberDialog(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!memberDialog) return;
    if (memberDialog.kind === "reset") {
      onResetMemberClaim(memberDialog.member.id);
      closeMemberDialog();
      return;
    }
    if (memberDialog.kind === "access") {
      onChangeMemberAccessStatus(memberDialog.member.id, memberDialog.accessStatus);
      closeMemberDialog();
      return;
    }
    if (memberDialog.kind === "transfer") {
      onTransferOwnership?.(memberDialog.member.id);
      closeMemberDialog();
      return;
    }
    const password = passwordValue.trim();
    if (password.length < 4) {
      setPasswordError(t.members.confirm.passwordTooShort);
      return;
    }
    onChangeMemberPassword(memberDialog.member.id, password);
    closeMemberDialog();
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
    <WorkspacePage className={memberStyles.membersPageClassName} kind="workspace" aria-label={t.members.pageLabel}>
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
      />

      <MemberSummaryStats
        labels={t.members.stats}
        stats={summaryStats}
        summaryLabel={t.members.summaryLabel}
      />

      <MemberManagementControls
        canManagePeople={canManagePeople}
        copyState={copyState}
        createPanelOpen={createPanelOpen}
        inviteLink={inviteLink}
        isRotatingInviteToken={isRotatingInviteToken}
        labels={t}
        newMemberName={newMemberName}
        newMemberRole={newMemberRole}
        onClearFilters={resetFilters}
        onCopyInviteLink={copyInviteLink}
        onNewMemberNameChange={setNewMemberName}
        onNewMemberRoleChange={setNewMemberRole}
        onQueryChange={setQuery}
        onRoleFilterChange={setRoleFilter}
        onRotateInviteToken={onRotateJoinInviteToken ? rotateInviteToken : undefined}
        onStatusFilterChange={setStatusFilter}
        onSubmitNewMember={submitNewMember}
        onToggleCreatePanel={() => setCreatePanelOpen((current) => !current)}
        query={query}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
      />

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
      {memberDialog ? (
        <MemberTaskDialog
          dialog={memberDialog}
          labels={t.members.confirm}
          passwordError={passwordError}
          passwordValue={passwordValue}
          onCancel={closeMemberDialog}
          onPasswordChange={setPasswordValue}
          onSubmit={submitMemberDialog}
        />
      ) : null}
    </WorkspacePage>
  );
}
