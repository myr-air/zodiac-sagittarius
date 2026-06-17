import { type FormEvent, useEffect, useMemo, useState } from "react";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import type { Member, Trip, TripMemberAccessStatus, TripRole } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import { PeoplePanel } from "@/src/shared/components/people-panel";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import { ActionBar, Button, FieldLabel, TextInput, WorkspacePage } from "@/src/ui";
import { MemberManagementControls } from "./components/MemberManagementControls";
import { MemberSummaryStats } from "./components/MemberSummaryStats";
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

type MemberTaskDialogState =
  | { kind: "reset"; member: Member }
  | { kind: "access"; member: Member; accessStatus: TripMemberAccessStatus; actionLabel: string }
  | { kind: "transfer"; member: Member }
  | { kind: "password"; member: Member };

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
  const [roleFilter, setRoleFilter] = useState<"all" | TripRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled" | "claimed" | "pending">("all");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [isRotatingInviteToken, setIsRotatingInviteToken] = useState(false);
  const [createPanelOpen, setCreatePanelOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<Exclude<TripRole, "owner">>("traveler");
  const [memberDialog, setMemberDialog] = useState<MemberTaskDialogState | null>(null);
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const visibleMembers = trip.members.filter((member) => member.id !== "member-viewer");
  const activeMembers = visibleMembers.filter((member) => member.accessStatus !== "disabled").length;
  const joinedMembers = visibleMembers.filter((member) => isMemberJoined(member, currentMember.id)).length;
  const disabledMembers = visibleMembers.length - activeMembers;
  const pendingMembers = visibleMembers.length - joinedMembers;
  const inviteLink = buildInviteLink(trip.joinId, joinInviteToken);
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
        stats={{
          active: activeMembers,
          disabled: disabledMembers,
          joined: joinedMembers,
          pending: pendingMembers,
          total: visibleMembers.length,
        }}
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
        <div className={memberStyles.memberDialogBackdropClassName} role="presentation">
          <form className={memberStyles.memberDialogClassName} role="dialog" aria-modal="true" aria-labelledby="member-task-dialog-title" onSubmit={submitMemberDialog}>
            <h2 className={memberStyles.memberDialogTitleClassName} id="member-task-dialog-title">{memberDialogTitle(memberDialog)}</h2>
            {memberDialog.kind === "password" ? (
              <>
                <p className={memberStyles.memberDialogBodyClassName}>{t.members.confirm.passwordPrompt({ name: memberDialog.member.displayName })}</p>
                <FieldLabel>
                  <span>รหัสผ่านใหม่</span>
                  <TextInput value={passwordValue} onChange={(event) => setPasswordValue(event.target.value)} type="password" autoComplete="new-password" />
                </FieldLabel>
                {passwordError ? <p className={memberStyles.memberDialogErrorClassName} role="alert">{passwordError}</p> : null}
              </>
            ) : (
              <p className={memberStyles.memberDialogBodyClassName}>{memberDialogBody(memberDialog, t.members.confirm)}</p>
            )}
            <ActionBar className={memberStyles.memberDialogActionsClassName}>
              <Button className={cn(memberStyles.memberResetButtonClassName, "w-auto")} variant="ghost" type="button" onClick={closeMemberDialog}>ยกเลิก</Button>
              <Button className={cn(memberStyles.memberCreateButtonClassName, "w-auto")} variant="ghost" type="submit">
                {memberDialogConfirmLabel(memberDialog)}
              </Button>
            </ActionBar>
          </form>
        </div>
      ) : null}
    </WorkspacePage>
  );
}

function memberDialogTitle(dialog: MemberTaskDialogState): string {
  if (dialog.kind === "reset") return `รีเซ็ตตัวตน ${dialog.member.displayName}`;
  if (dialog.kind === "access") return `${dialog.actionLabel} ${dialog.member.displayName}`;
  if (dialog.kind === "transfer") return `โอน owner ให้ ${dialog.member.displayName}`;
  return `เปลี่ยนรหัสผ่าน ${dialog.member.displayName}`;
}

function memberDialogBody(dialog: Exclude<MemberTaskDialogState, { kind: "password" }>, labels: ReturnType<typeof useI18n>["t"]["members"]["confirm"]): string {
  if (dialog.kind === "reset") return labels.resetClaim({ name: dialog.member.displayName });
  if (dialog.kind === "access") return labels.access({ action: dialog.actionLabel, name: dialog.member.displayName });
  return labels.transferOwner({ name: dialog.member.displayName });
}

function memberDialogConfirmLabel(dialog: MemberTaskDialogState): string {
  if (dialog.kind === "reset") return "รีเซ็ตตัวตน";
  if (dialog.kind === "transfer") return "โอน owner";
  if (dialog.kind === "password") return "บันทึกรหัสผ่าน";
  return "ยืนยัน";
}

function isMemberJoined(member: Member, currentMemberId: string): boolean {
  return Boolean(member.claimPasswordHash) || member.id === currentMemberId;
}

function buildInviteLink(joinId: string, token?: string | null): string {
  /* v8 ignore next */
  const baseUrl = typeof window === "undefined" ? "" : window.location.origin;
  if (token) return `${baseUrl}${appRoutes.join()}?token=${encodeURIComponent(token)}`;
  return `${baseUrl}${appRoutes.join(joinId)}`;
}
