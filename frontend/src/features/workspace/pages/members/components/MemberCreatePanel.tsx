import { cn } from "@/src/lib/cn";
import { tripInvitableRoleValues } from "@/src/trip/members";
import { Button, FieldLabel, Select, TextInput, WorkspaceSurface } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as memberStyles from "../TripMembersPage.styles";
import { canBuildCreateMemberInput } from "../model/member-create-input";
import type { MemberCreatePanelProps, NewMemberRole } from "./member-management.types";

export function MemberCreatePanel({
  canManagePeople,
  labels,
  newMemberName,
  newMemberRole,
  onNewMemberNameChange,
  onNewMemberRoleChange,
  onSubmitNewMember,
}: MemberCreatePanelProps) {
  const newMemberRoleLabels: Record<NewMemberRole, string> = {
    organizer: labels.appShell.roles.organizer,
    traveler: labels.appShell.roles.traveler,
    viewer: labels.appShell.roles.viewer,
  };
  const canCreateMember = canBuildCreateMemberInput({
    canManagePeople,
    displayName: newMemberName,
    role: newMemberRole,
  });

  return (
    <WorkspaceSurface
      className={memberStyles.memberCreatePanelClassName}
      aria-label={labels.members.createLabel}
    >
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
            onChange={(event) => onNewMemberRoleChange(event.target.value as NewMemberRole)}
          >
            {tripInvitableRoleValues.map((role) => (
              <option key={role} value={role}>{newMemberRoleLabels[role]}</option>
            ))}
          </Select>
        </FieldLabel>
        <Button
          className={cn(memberStyles.memberCreateButtonClassName, "w-auto")}
          variant="ghost"
          type="submit"
          disabled={!canCreateMember}
        >
          <Icon name="check" />
          {labels.members.actions.saveMember}
        </Button>
      </form>
    </WorkspaceSurface>
  );
}
