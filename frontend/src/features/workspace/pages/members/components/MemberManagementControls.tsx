import { type FormEvent } from "react";
import type { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import type { TripRole } from "@/src/trip/types";
import { ActionBar, Button, FieldLabel, Select, TextInput, WorkspaceSurface } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as memberStyles from "../TripMembersPage.styles";

type MemberLabels = ReturnType<typeof useI18n>["t"];
type MemberRoleFilter = "all" | TripRole;
type MemberStatusFilter = "all" | "active" | "disabled" | "claimed" | "pending";

interface MemberManagementControlsProps {
  canManagePeople: boolean;
  copyState: "idle" | "copied" | "error";
  createPanelOpen: boolean;
  inviteLink: string;
  isRotatingInviteToken: boolean;
  labels: MemberLabels;
  newMemberName: string;
  newMemberRole: Exclude<TripRole, "owner">;
  onClearFilters: () => void;
  onCopyInviteLink: () => void;
  onNewMemberNameChange: (value: string) => void;
  onNewMemberRoleChange: (role: Exclude<TripRole, "owner">) => void;
  onQueryChange: (query: string) => void;
  onRoleFilterChange: (role: MemberRoleFilter) => void;
  onRotateInviteToken?: () => void;
  onStatusFilterChange: (status: MemberStatusFilter) => void;
  onSubmitNewMember: (event: FormEvent<HTMLFormElement>) => void;
  onToggleCreatePanel: () => void;
  query: string;
  roleFilter: MemberRoleFilter;
  statusFilter: MemberStatusFilter;
}

export function MemberManagementControls({
  canManagePeople,
  copyState,
  createPanelOpen,
  inviteLink,
  isRotatingInviteToken,
  labels,
  newMemberName,
  newMemberRole,
  onClearFilters,
  onCopyInviteLink,
  onNewMemberNameChange,
  onNewMemberRoleChange,
  onQueryChange,
  onRoleFilterChange,
  onRotateInviteToken,
  onStatusFilterChange,
  onSubmitNewMember,
  onToggleCreatePanel,
  query,
  roleFilter,
  statusFilter,
}: MemberManagementControlsProps) {
  return (
    <>
      <WorkspaceSurface className={memberStyles.memberCommandBarClassName} aria-label={labels.members.commandBar}>
        <div className={memberStyles.memberCommandFieldsClassName}>
          <FieldLabel>
            <span>{labels.members.fields.search}</span>
            <TextInput value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={labels.members.fields.searchPlaceholder} />
          </FieldLabel>
          <FieldLabel>
            <span>{labels.members.fields.role}</span>
            <Select value={roleFilter} onChange={(event) => onRoleFilterChange(event.target.value as MemberRoleFilter)}>
              <option value="all">{labels.members.filters.allRoles}</option>
              <option value="owner">{labels.appShell.roles.owner}</option>
              <option value="organizer">{labels.appShell.roles.organizer}</option>
              <option value="traveler">{labels.appShell.roles.traveler}</option>
              <option value="viewer">{labels.appShell.roles.viewer}</option>
            </Select>
          </FieldLabel>
          <FieldLabel>
            <span>{labels.members.fields.status}</span>
            <Select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as MemberStatusFilter)}>
              <option value="all">{labels.members.filters.allStatuses}</option>
              <option value="active">{labels.common.status.active}</option>
              <option value="disabled">{labels.common.status.disabled}</option>
              <option value="claimed">{labels.join.memberStatus.claimed}</option>
              <option value="pending">{labels.common.status.pending}</option>
            </Select>
          </FieldLabel>
        </div>
        <ActionBar className={memberStyles.memberCommandActionsClassName}>
          <Button className={cn(memberStyles.memberResetButtonClassName, "w-auto")} variant="ghost" type="button" onClick={onClearFilters}>{labels.members.actions.clear}</Button>
          {canManagePeople ? (
            <>
              <Button className={cn(memberStyles.inviteCopyButtonClassName, "w-auto")} type="button" onClick={onCopyInviteLink}>
                <Icon name="copy" />
                {labels.members.actions.copyInvite}
              </Button>
              {onRotateInviteToken ? (
                <Button className={cn(memberStyles.memberCreateButtonClassName, "w-auto")} variant="ghost" type="button" disabled={isRotatingInviteToken} onClick={onRotateInviteToken}>
                  <Icon name="key" />
                  {isRotatingInviteToken ? labels.members.actions.rotatingInvite : labels.members.actions.rotateInvite}
                </Button>
              ) : null}
              <Button
                aria-expanded={createPanelOpen}
                className={cn(memberStyles.memberCreateButtonClassName, "w-auto")}
                variant="ghost"
                type="button"
                onClick={onToggleCreatePanel}
              >
                <Icon name="plus" />
                {createPanelOpen ? labels.members.actions.closeCreate : labels.members.actions.openCreate}
              </Button>
            </>
          ) : (
            <span className={memberStyles.copyFeedbackClassName} data-state={copyState} role="status">
              {labels.members.copy.readOnly}
            </span>
          )}
        </ActionBar>
        {canManagePeople ? (
          <div className={memberStyles.memberCommandMetaClassName}>
            <code>{inviteLink}</code>
            <span className={memberStyles.copyFeedbackClassName} data-state={copyState} role="status">
              {copyState === "copied" ? labels.common.status.copied : copyState === "error" ? labels.common.status.copyFailed : labels.members.copy.ready}
            </span>
          </div>
        ) : null}
      </WorkspaceSurface>

      {createPanelOpen ? (
        <WorkspaceSurface className={memberStyles.memberCreatePanelClassName} aria-label={labels.members.createLabel}>
          <form className={memberStyles.memberCreateFormClassName} onSubmit={onSubmitNewMember}>
            <FieldLabel>
              <span>{labels.members.fields.newName}</span>
              <TextInput
                disabled={!canManagePeople}
                value={newMemberName}
                onChange={(event) => onNewMemberNameChange(event.target.value)}
                placeholder={labels.members.fields.newNamePlaceholder}
              />
            </FieldLabel>
            <FieldLabel>
              <span>{labels.members.fields.newRole}</span>
              <Select
                disabled={!canManagePeople}
                value={newMemberRole}
                onChange={(event) => onNewMemberRoleChange(event.target.value as Exclude<TripRole, "owner">)}
              >
                <option value="organizer">{labels.appShell.roles.organizer}</option>
                <option value="traveler">{labels.appShell.roles.traveler}</option>
                <option value="viewer">{labels.appShell.roles.viewer}</option>
              </Select>
            </FieldLabel>
            <Button className={cn(memberStyles.memberCreateButtonClassName, "w-auto")} variant="ghost" type="submit" disabled={!canManagePeople || !newMemberName.trim()}>
              <Icon name="check" />
              {labels.members.actions.saveMember}
            </Button>
          </form>
        </WorkspaceSurface>
      ) : null}
    </>
  );
}
