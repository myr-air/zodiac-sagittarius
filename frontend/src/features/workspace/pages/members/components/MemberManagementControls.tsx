import { type FormEvent } from "react";
import type { useI18n } from "@/src/i18n/I18nProvider";
import type { TripRole } from "@/src/trip/types";
import { WorkspaceSurface } from "@/src/ui";
import type { MemberRoleFilter, MemberStatusFilter } from "../TripMembersPage.support";
import * as memberStyles from "../TripMembersPage.styles";
import { MemberCreatePanel } from "./MemberCreatePanel";
import { MemberFilterControls } from "./MemberFilterControls";
import { MemberInviteActions } from "./MemberInviteActions";

type MemberLabels = ReturnType<typeof useI18n>["t"];

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
        <MemberFilterControls
          labels={labels}
          onQueryChange={onQueryChange}
          onRoleFilterChange={onRoleFilterChange}
          onStatusFilterChange={onStatusFilterChange}
          query={query}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
        />
        <MemberInviteActions
          canManagePeople={canManagePeople}
          copyState={copyState}
          createPanelOpen={createPanelOpen}
          isRotatingInviteToken={isRotatingInviteToken}
          labels={labels}
          onClearFilters={onClearFilters}
          onCopyInviteLink={onCopyInviteLink}
          onRotateInviteToken={onRotateInviteToken}
          onToggleCreatePanel={onToggleCreatePanel}
        />
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
        <MemberCreatePanel
          canManagePeople={canManagePeople}
          labels={labels}
          newMemberName={newMemberName}
          newMemberRole={newMemberRole}
          onNewMemberNameChange={onNewMemberNameChange}
          onNewMemberRoleChange={onNewMemberRoleChange}
          onSubmitNewMember={onSubmitNewMember}
        />
      ) : null}
    </>
  );
}
