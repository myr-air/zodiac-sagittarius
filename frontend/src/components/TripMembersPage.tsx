import { type FormEvent, useEffect, useMemo, useState } from "react";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import type { Member, Trip, TripMemberAccessStatus, TripRole } from "@/src/trip/types";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import { PeoplePanel } from "@/src/shared/components/people-panel";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import { ActionBar, Button, FieldLabel, Select, TextInput, WorkspacePage, WorkspaceSurface } from "@/src/ui";

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

const membersPageClassName = "members-page";
const memberStatGridClassName = "member-stat-grid grid w-full grid-cols-5 gap-3 max-[1199px]:grid-cols-3 max-[1199px]:gap-0 max-[767px]:grid-cols-1";
const memberStatClassName = "member-stat grid min-h-[126px] min-w-0 content-start gap-2 rounded-(--radius-md) border border-[color-mix(in_srgb,var(--color-route-border)_58%,var(--color-border))] bg-[linear-gradient(145deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-primary-soft)_46%,var(--color-surface))_100%)] p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:border-t-0 max-[1199px]:shadow-none max-[479px]:min-h-[58px] max-[479px]:grid-cols-[28px_minmax(0,1fr)] [&_.icon]:text-(--color-primary) [&>span]:text-xs [&>span]:font-bold [&>span]:text-(--color-text-muted) [&>strong]:text-2xl [&>strong]:font-extrabold [&>strong]:leading-[30px] [&>strong]:text-(--color-text) [&>strong]:tabular-nums max-[479px]:[&>strong]:col-start-2 max-[479px]:[&>strong]:justify-self-start max-[479px]:[&>strong]:text-xl max-[479px]:[&>strong]:leading-6";
const fieldGroupClassName = "[&_label]:grid [&_label]:min-w-0 [&_label]:gap-[5px] [&_label>span]:text-[11px] [&_label>span]:font-extrabold [&_label>span]:leading-[15px] [&_label>span]:text-(--color-text-muted) [&_input]:min-h-[34px] [&_input]:w-full [&_input]:rounded-(--radius-sm) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-2.5 [&_input]:text-xs [&_input]:font-bold [&_input]:text-(--color-text) [&_select]:min-h-[34px] [&_select]:w-full [&_select]:rounded-(--radius-sm) [&_select]:border [&_select]:border-(--color-border) [&_select]:bg-(--color-surface) [&_select]:px-2.5 [&_select]:text-xs [&_select]:font-bold [&_select]:text-(--color-text) [&_input:disabled]:bg-(--color-surface-muted) [&_select:disabled]:bg-(--color-surface-muted) [&_input:disabled]:text-(--color-text-subtle) [&_select:disabled]:text-(--color-text-subtle)";
const memberCommandBarClassName = "member-command-bar grid min-w-0 gap-3 rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-primary-border)_52%,var(--color-border))] bg-[linear-gradient(135deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-route-soft)_56%,var(--color-surface))_100%)] p-4 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:grid-cols-1 max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:border-t-0 max-[1199px]:p-3 max-[1199px]:shadow-none";
const memberCommandFieldsClassName = cn("member-command-fields grid min-w-0 grid-cols-3 gap-3 max-[1199px]:grid-cols-1", fieldGroupClassName);
const memberCommandActionsClassName = "member-command-actions flex min-w-0 flex-wrap items-center justify-end gap-2 max-[1199px]:justify-start max-[767px]:w-full max-[767px]:[&>*]:flex-[1_1_180px]";
const memberCommandMetaClassName = "member-command-meta grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 max-[1199px]:grid-cols-1 [&_code]:overflow-hidden [&_code]:rounded-(--radius-sm) [&_code]:border [&_code]:border-(--color-border) [&_code]:bg-(--color-surface-muted) [&_code]:px-[9px] [&_code]:py-[7px] [&_code]:text-xs [&_code]:text-(--color-text-muted) [&_code]:text-ellipsis [&_code]:whitespace-nowrap";
const memberResetButtonClassName = "member-filter-reset border-(--color-border) bg-(--color-surface-subtle) text-(--color-text-muted) hover:border-(--color-primary-border) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) max-[767px]:w-full";
const inviteCopyButtonClassName = "invite-copy-button border-(--color-primary) bg-(--color-primary) text-white hover:-translate-y-px hover:shadow-[0_6px_8px_rgb(15_118_110_/_0.18)] disabled:cursor-not-allowed disabled:border-(--color-border) disabled:bg-(--color-surface-muted) disabled:text-(--color-text-muted) disabled:shadow-none";
const memberCreateButtonClassName = "member-create-button border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong) hover:-translate-y-px hover:border-(--color-primary) hover:shadow-[0_6px_8px_rgb(15_118_110_/_0.12)] disabled:cursor-not-allowed disabled:border-(--color-border) disabled:bg-(--color-surface-muted) disabled:text-(--color-text-muted) disabled:shadow-none";
const copyFeedbackClassName = "copy-feedback inline-flex min-h-8 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface-subtle) px-3 text-xs font-extrabold leading-4 text-(--color-text-muted) data-[state=copied]:text-(--color-success) data-[state=error]:text-(--color-danger)";
const memberCreatePanelClassName = "member-create-panel grid min-w-0 gap-3 rounded-(--radius-lg) border border-(--color-primary-border) bg-[linear-gradient(135deg,var(--color-primary-soft)_0%,rgb(255_255_255)_100%)] p-4 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:grid-cols-1 max-[1199px]:rounded-none max-[1199px]:border-x-0 max-[1199px]:p-3 max-[1199px]:shadow-none";
const memberCreateFormClassName = cn("member-create-form grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(180px,240px)_auto] items-end gap-3 max-[1199px]:grid-cols-1", fieldGroupClassName);
const memberDialogBackdropClassName = "modal-backdrop fixed inset-0 z-20 grid place-items-center bg-[rgb(15_23_42_/_0.28)] p-5";
const memberDialogClassName = cn("member-task-dialog grid w-[min(460px,100%)] gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[0_10px_18px_rgb(15_23_42_/_0.14)]", fieldGroupClassName);
const memberDialogTitleClassName = "m-0 text-base font-extrabold leading-[22px] text-(--color-text)";
const memberDialogBodyClassName = "m-0 text-sm font-medium leading-6 text-(--color-text-muted)";
const memberDialogActionsClassName = "mt-1 flex justify-end gap-2";
const memberDialogErrorClassName = "m-0 rounded-(--radius-sm) border border-(--color-danger-border) bg-(--color-danger-soft) px-3 py-2 text-xs font-bold text-(--color-danger)";

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
    <WorkspacePage className={membersPageClassName} kind="workspace" aria-label={t.members.pageLabel}>
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

      <WorkspaceSurface className={memberCommandBarClassName} aria-label={t.members.commandBar}>
        <div className={memberCommandFieldsClassName}>
          <FieldLabel>
            <span>{t.members.fields.search}</span>
            <TextInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.members.fields.searchPlaceholder} />
          </FieldLabel>
          <FieldLabel>
            <span>{t.members.fields.role}</span>
            <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as "all" | TripRole)}>
              <option value="all">{t.members.filters.allRoles}</option>
              <option value="owner">{t.appShell.roles.owner}</option>
              <option value="organizer">{t.appShell.roles.organizer}</option>
              <option value="traveler">{t.appShell.roles.traveler}</option>
              <option value="viewer">{t.appShell.roles.viewer}</option>
            </Select>
          </FieldLabel>
          <FieldLabel>
            <span>{t.members.fields.status}</span>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "disabled" | "claimed" | "pending")}>
              <option value="all">{t.members.filters.allStatuses}</option>
              <option value="active">{t.common.status.active}</option>
              <option value="disabled">{t.common.status.disabled}</option>
              <option value="claimed">{t.join.memberStatus.claimed}</option>
              <option value="pending">{t.common.status.pending}</option>
            </Select>
          </FieldLabel>
        </div>
        <ActionBar className={memberCommandActionsClassName}>
          <Button className={cn(memberResetButtonClassName, "w-auto")} variant="ghost" type="button" onClick={resetFilters}>{t.members.actions.clear}</Button>
          {canManagePeople ? (
            <>
              <Button className={cn(inviteCopyButtonClassName, "w-auto")} type="button" onClick={copyInviteLink}>
                <Icon name="copy" />
                {t.members.actions.copyInvite}
              </Button>
              {onRotateJoinInviteToken ? (
                <Button className={cn(memberCreateButtonClassName, "w-auto")} variant="ghost" type="button" disabled={isRotatingInviteToken} onClick={rotateInviteToken}>
                  <Icon name="key" />
                  {isRotatingInviteToken ? t.members.actions.rotatingInvite : t.members.actions.rotateInvite}
                </Button>
              ) : null}
              <Button
                aria-expanded={createPanelOpen}
                className={cn(memberCreateButtonClassName, "w-auto")}
                variant="ghost"
                type="button"
                onClick={() => setCreatePanelOpen((current) => !current)}
              >
                <Icon name="plus" />
                {createPanelOpen ? t.members.actions.closeCreate : t.members.actions.openCreate}
              </Button>
            </>
          ) : (
            <span className={copyFeedbackClassName} data-state={copyState} role="status">
              {t.members.copy.readOnly}
            </span>
          )}
        </ActionBar>
        {canManagePeople ? (
          <div className={memberCommandMetaClassName}>
            <code>{inviteLink}</code>
            <span className={copyFeedbackClassName} data-state={copyState} role="status">
              {copyState === "copied" ? t.common.status.copied : copyState === "error" ? t.common.status.copyFailed : t.members.copy.ready}
            </span>
          </div>
        ) : null}
      </WorkspaceSurface>

      {createPanelOpen ? (
        <WorkspaceSurface className={memberCreatePanelClassName} aria-label={t.members.createLabel}>
          <form className={memberCreateFormClassName} onSubmit={submitNewMember}>
            <FieldLabel>
              <span>{t.members.fields.newName}</span>
              <TextInput
                disabled={!canManagePeople}
                value={newMemberName}
                onChange={(event) => setNewMemberName(event.target.value)}
                placeholder={t.members.fields.newNamePlaceholder}
              />
            </FieldLabel>
            <FieldLabel>
              <span>{t.members.fields.newRole}</span>
              <Select
                disabled={!canManagePeople}
                value={newMemberRole}
                onChange={(event) => setNewMemberRole(event.target.value as Exclude<TripRole, "owner">)}
              >
                <option value="organizer">{t.appShell.roles.organizer}</option>
                <option value="traveler">{t.appShell.roles.traveler}</option>
                <option value="viewer">{t.appShell.roles.viewer}</option>
              </Select>
            </FieldLabel>
            <Button className={cn(memberCreateButtonClassName, "w-auto")} variant="ghost" type="submit" disabled={!canManagePeople || !newMemberName.trim()}>
              <Icon name="check" />
              {t.members.actions.saveMember}
            </Button>
          </form>
        </WorkspaceSurface>
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
                <FieldLabel>
                  <span>รหัสผ่านใหม่</span>
                  <TextInput value={passwordValue} onChange={(event) => setPasswordValue(event.target.value)} type="password" autoComplete="new-password" />
                </FieldLabel>
                {passwordError ? <p className={memberDialogErrorClassName} role="alert">{passwordError}</p> : null}
              </>
            ) : (
              <p className={memberDialogBodyClassName}>{memberDialogBody(memberDialog, t.members.confirm)}</p>
            )}
            <ActionBar className={memberDialogActionsClassName}>
              <Button className={cn(memberResetButtonClassName, "w-auto")} variant="ghost" type="button" onClick={closeMemberDialog}>ยกเลิก</Button>
              <Button className={cn(memberCreateButtonClassName, "w-auto")} variant="ghost" type="submit">
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
