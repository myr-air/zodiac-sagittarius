import { type FormEvent, useEffect, useMemo, useState } from "react";
import { appRoutes } from "@/src/routes/app-routes";
import type { Member, Trip, TripMemberAccessStatus, TripRole } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon } from "./icons";
import { TravelMotif } from "./motifs";
import { formatTripRange, PageHeader, PageUserCard } from "./PageHeader";
import { PeoplePanel } from "./PeoplePanel";

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

const membersPageClassName = "members-page grid min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 bg-[var(--color-page)] px-6 py-[22px] pb-7 max-[767px]:px-3 max-[767px]:py-4";
const memberStatGridClassName = "member-stat-grid grid w-full grid-cols-5 gap-3 max-[1199px]:grid-cols-3 max-[767px]:grid-cols-1";
const memberStatClassName = "member-stat grid min-h-[126px] min-w-0 content-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-[0_10px_24px_rgb(15_23_42_/_0.04)] max-[479px]:min-h-[58px] max-[479px]:grid-cols-[28px_minmax(0,1fr)] [&_.icon]:text-[var(--color-primary)] [&>span]:text-xs [&>span]:font-bold [&>span]:text-[var(--color-text-muted)] [&>strong]:text-2xl [&>strong]:font-extrabold [&>strong]:leading-[30px] [&>strong]:text-[var(--color-text)] [&>strong]:tabular-nums max-[479px]:[&>strong]:col-start-2 max-[479px]:[&>strong]:justify-self-start max-[479px]:[&>strong]:text-xl max-[479px]:[&>strong]:leading-6";
const fieldGroupClassName = "[&_label]:grid [&_label]:min-w-0 [&_label]:gap-[5px] [&_label>span]:text-[11px] [&_label>span]:font-extrabold [&_label>span]:leading-[15px] [&_label>span]:text-[var(--color-text-muted)] [&_input]:min-h-[34px] [&_input]:w-full [&_input]:rounded-[var(--radius-sm)] [&_input]:border [&_input]:border-[var(--color-border)] [&_input]:bg-[var(--color-surface)] [&_input]:px-2.5 [&_input]:text-xs [&_input]:font-bold [&_input]:text-[var(--color-text)] [&_select]:min-h-[34px] [&_select]:w-full [&_select]:rounded-[var(--radius-sm)] [&_select]:border [&_select]:border-[var(--color-border)] [&_select]:bg-[var(--color-surface)] [&_select]:px-2.5 [&_select]:text-xs [&_select]:font-bold [&_select]:text-[var(--color-text)] [&_input:disabled]:bg-[var(--color-surface-muted)] [&_select:disabled]:bg-[var(--color-surface-muted)] [&_input:disabled]:text-[var(--color-text-subtle)] [&_select:disabled]:text-[var(--color-text-subtle)]";
const memberCommandBarClassName = "member-command-bar grid min-w-0 gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_12px_28px_rgb(15_23_42_/_0.05)] max-[1199px]:grid-cols-1 max-[767px]:p-3";
const memberCommandFieldsClassName = cn("member-command-fields grid min-w-0 grid-cols-3 gap-3 max-[1199px]:grid-cols-1", fieldGroupClassName);
const memberCommandActionsClassName = "member-command-actions flex min-w-0 flex-wrap items-center justify-end gap-2 max-[1199px]:justify-start max-[767px]:w-full max-[767px]:[&>*]:flex-[1_1_180px]";
const memberCommandMetaClassName = "member-command-meta grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 max-[1199px]:grid-cols-1 [&_code]:overflow-hidden [&_code]:rounded-[var(--radius-sm)] [&_code]:border [&_code]:border-[var(--color-border)] [&_code]:bg-[var(--color-surface-muted)] [&_code]:px-[9px] [&_code]:py-[7px] [&_code]:text-xs [&_code]:text-[var(--color-text-muted)] [&_code]:text-ellipsis [&_code]:whitespace-nowrap";
const memberActionButtonClassName = "inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm font-extrabold leading-5 transition-[border-color,box-shadow,transform,background,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-border)]";
const memberResetButtonClassName = "member-filter-reset border-[var(--color-border)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:border-[var(--color-primary-border)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-strong)] max-[767px]:w-full";
const inviteCopyButtonClassName = "invite-copy-button border-[var(--color-primary)] bg-[var(--color-primary)] text-white hover:-translate-y-px hover:shadow-[0_12px_22px_rgb(15_118_110_/_0.18)] disabled:cursor-not-allowed disabled:border-[var(--color-border)] disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-muted)] disabled:shadow-none";
const memberCreateButtonClassName = "member-create-button border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)] hover:-translate-y-px hover:shadow-[0_12px_22px_rgb(15_118_110_/_0.12)] disabled:cursor-not-allowed disabled:border-[var(--color-border)] disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-muted)] disabled:shadow-none";
const copyFeedbackClassName = "copy-feedback inline-flex min-h-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-3 text-xs font-extrabold leading-4 text-[var(--color-text-muted)] data-[state=copied]:text-[var(--color-success)] data-[state=error]:text-[var(--color-danger)]";
const memberCreatePanelClassName = "member-create-panel grid min-w-0 gap-3 rounded-[var(--radius-lg)] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] p-4 max-[1199px]:grid-cols-1 max-[767px]:p-3";
const memberCreateFormClassName = cn("member-create-form grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(180px,240px)_auto] items-end gap-3 max-[1199px]:grid-cols-1", fieldGroupClassName);
const memberDialogBackdropClassName = "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5";
const memberDialogClassName = cn("member-task-dialog grid w-[min(460px,100%)] gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_24px_70px_rgb(15_23_42_/_0.22)]", fieldGroupClassName);
const memberDialogTitleClassName = "m-0 text-base font-extrabold leading-[22px] text-[var(--color-text)]";
const memberDialogBodyClassName = "m-0 text-sm font-medium leading-6 text-[var(--color-text-muted)]";
const memberDialogActionsClassName = "mt-1 flex justify-end gap-2";
const memberDialogErrorClassName = "m-0 rounded-[var(--radius-sm)] border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] px-3 py-2 text-xs font-bold text-[var(--color-danger)]";

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
    <section className={membersPageClassName} aria-label={t.members.pageLabel}>
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

      <section className={memberStatGridClassName} aria-label={t.members.summaryLabel}>
        <div className={memberStatClassName}>
          <Icon name="users" />
          <span>{t.members.stats.total}</span>
          <strong>{visibleMembers.length}</strong>
        </div>
        <div className={memberStatClassName}>
          <Icon name="check" />
          <span>{t.members.stats.active}</span>
          <strong>{activeMembers}</strong>
        </div>
        <div className={memberStatClassName}>
          <Icon name="warning" />
          <span>{t.members.stats.pending}</span>
          <strong>{pendingMembers}</strong>
        </div>
        <div className={memberStatClassName}>
          <Icon name="check" />
          <span>{t.members.stats.joined}</span>
          <strong>{joinedMembers}</strong>
        </div>
        <div className={memberStatClassName}>
          <Icon name="alertCircle" />
          <span>{t.members.stats.disabled}</span>
          <strong>{disabledMembers}</strong>
        </div>
      </section>

      <section className={memberCommandBarClassName} aria-label={t.members.commandBar}>
        <div className={memberCommandFieldsClassName}>
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
        <div className={memberCommandActionsClassName}>
          <button className={cn(memberActionButtonClassName, memberResetButtonClassName)} type="button" onClick={resetFilters}>{t.members.actions.clear}</button>
          <button className={cn(memberActionButtonClassName, inviteCopyButtonClassName)} type="button" disabled={!canManagePeople} onClick={copyInviteLink}>
            <Icon name="copy" />
            {t.members.actions.copyInvite}
          </button>
          {onRotateJoinInviteToken ? (
            <button className={cn(memberActionButtonClassName, memberCreateButtonClassName)} type="button" disabled={!canManagePeople || isRotatingInviteToken} onClick={rotateInviteToken}>
              <Icon name="key" />
              {isRotatingInviteToken ? t.members.actions.rotatingInvite : t.members.actions.rotateInvite}
            </button>
          ) : null}
          <button
            aria-expanded={createPanelOpen}
            className={cn(memberActionButtonClassName, memberCreateButtonClassName)}
            type="button"
            disabled={!canManagePeople}
            onClick={() => setCreatePanelOpen((current) => !current)}
          >
            <Icon name="plus" />
            {createPanelOpen ? t.members.actions.closeCreate : t.members.actions.openCreate}
          </button>
        </div>
        <div className={memberCommandMetaClassName}>
          <code>{inviteLink}</code>
          <span className={copyFeedbackClassName} data-state={copyState} role="status">
            {copyState === "copied" ? t.common.status.copied : copyState === "error" ? t.common.status.copyFailed : canManagePeople ? t.members.copy.ready : t.members.copy.readOnly}
          </span>
        </div>
      </section>

      {createPanelOpen ? (
        <section className={memberCreatePanelClassName} aria-label={t.members.createLabel}>
          <form className={memberCreateFormClassName} onSubmit={submitNewMember}>
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
            <button className={cn(memberActionButtonClassName, memberCreateButtonClassName)} type="submit" disabled={!canManagePeople || !newMemberName.trim()}>
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
      {memberDialog ? (
        <div className={memberDialogBackdropClassName} role="presentation">
          <form className={memberDialogClassName} role="dialog" aria-modal="true" aria-labelledby="member-task-dialog-title" onSubmit={submitMemberDialog}>
            <h2 className={memberDialogTitleClassName} id="member-task-dialog-title">{memberDialogTitle(memberDialog)}</h2>
            {memberDialog.kind === "password" ? (
              <>
                <p className={memberDialogBodyClassName}>{t.members.confirm.passwordPrompt({ name: memberDialog.member.displayName })}</p>
                <label>
                  <span>รหัสผ่านใหม่</span>
                  <input value={passwordValue} onChange={(event) => setPasswordValue(event.target.value)} type="password" autoComplete="new-password" />
                </label>
                {passwordError ? <p className={memberDialogErrorClassName} role="alert">{passwordError}</p> : null}
              </>
            ) : (
              <p className={memberDialogBodyClassName}>{memberDialogBody(memberDialog, t.members.confirm)}</p>
            )}
            <div className={memberDialogActionsClassName}>
              <button className={cn(memberActionButtonClassName, memberResetButtonClassName)} type="button" onClick={closeMemberDialog}>ยกเลิก</button>
              <button className={cn(memberActionButtonClassName, memberCreateButtonClassName)} type="submit">
                {memberDialogConfirmLabel(memberDialog)}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
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
