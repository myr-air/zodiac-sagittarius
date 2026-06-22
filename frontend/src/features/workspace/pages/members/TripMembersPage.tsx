import { useI18n } from "@/src/i18n/I18nProvider";
import { Icon } from "@/src/ui/icons";
import { formatTripRange, PageHeader } from "@/src/shared/components/page-header";
import { PeoplePanel } from "@/src/shared/components/people-panel";
import { TravelMotif } from "@/src/shared/components/travel-motifs";
import { WorkspacePage } from "@/src/ui";
import { MemberManagementControls } from "./components/MemberManagementControls";
import { MemberSummaryStats } from "./components/MemberSummaryStats";
import { MemberTaskDialog } from "./components/MemberTaskDialog";
import * as memberStyles from "./TripMembersPage.styles";
import type { TripMembersPageProps } from "./TripMembersPage.types";
import { useTripMembersPageState } from "./hooks/use-trip-members-page-state";

export type { TripMembersPageProps } from "./TripMembersPage.types";

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
  const {
    confirmChangeAccessStatus,
    confirmResetClaim,
    confirmTransferOwnership,
    copyInviteLink,
    copyState,
    createPanelOpen,
    filteredMembers,
    inviteLink,
    isRotatingInviteToken,
    memberDialog,
    newMemberName,
    newMemberRole,
    passwordError,
    passwordValue,
    promptChangePassword,
    query,
    resetFilters,
    roleFilter,
    rotateInviteToken,
    setCreatePanelOpen,
    setNewMemberName,
    setNewMemberRole,
    setPasswordValue,
    setQuery,
    setRoleFilter,
    setStatusFilter,
    statusFilter,
    submitMemberDialog,
    submitNewMember,
    summaryStats,
    visibleMembers,
    closeMemberDialog,
  } = useTripMembersPageState({
    canManagePeople,
    currentMember,
    joinInviteToken,
    labels: t.members.confirm,
    onChangeMemberAccessStatus,
    onChangeMemberPassword,
    onCreateMember,
    onResetMemberClaim,
    onRotateJoinInviteToken,
    onTransferOwnership,
    trip,
  });

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
