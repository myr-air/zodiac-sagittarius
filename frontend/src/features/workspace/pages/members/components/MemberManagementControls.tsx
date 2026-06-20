import { WorkspaceSurface } from "@/src/ui";
import type { MemberRoleFilter, MemberStatusFilter } from "../member-page-options";
import * as memberStyles from "../TripMembersPage.styles";
import { MemberCreatePanel } from "./MemberCreatePanel";
import { MemberFilterControls } from "./MemberFilterControls";
import { MemberInviteActions } from "./MemberInviteActions";
import type { MemberCopyState, MemberCreatePanelProps, MemberLabels } from "./member-management.types";

interface MemberManagementControlsProps {
  canManagePeople: boolean;
  copyState: MemberCopyState;
  createPanelOpen: boolean;
  inviteLink: string;
  isRotatingInviteToken: boolean;
  labels: MemberLabels;
  newMemberName: string;
  newMemberRole: MemberCreatePanelProps["newMemberRole"];
  onClearFilters: () => void;
  onCopyInviteLink: () => void;
  onNewMemberNameChange: MemberCreatePanelProps["onNewMemberNameChange"];
  onNewMemberRoleChange: MemberCreatePanelProps["onNewMemberRoleChange"];
  onQueryChange: (query: string) => void;
  onRoleFilterChange: (role: MemberRoleFilter) => void;
  onRotateInviteToken?: () => void;
  onStatusFilterChange: (status: MemberStatusFilter) => void;
  onSubmitNewMember: MemberCreatePanelProps["onSubmitNewMember"];
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
              {copyState === "copied"
                ? labels.common.status.copied
                : copyState === "error"
                  ? labels.common.status.copyFailed
                  : labels.members.copy.ready}
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
