import type { FormEvent } from "react";
import type { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import type { TripRole } from "@/src/trip/types";
import { Button, FieldLabel, Select, TextInput, WorkspaceSurface } from "@/src/ui";
import { Icon } from "@/src/ui/icons";

import * as memberStyles from "../TripMembersPage.styles";

type MemberLabels = ReturnType<typeof useI18n>["t"];

interface MemberCreatePanelProps {
  canManagePeople: boolean;
  labels: MemberLabels;
  newMemberName: string;
  newMemberRole: Exclude<TripRole, "owner">;
  onNewMemberNameChange: (value: string) => void;
  onNewMemberRoleChange: (role: Exclude<TripRole, "owner">) => void;
  onSubmitNewMember: (event: FormEvent<HTMLFormElement>) => void;
}

export function MemberCreatePanel({
  canManagePeople,
  labels,
  newMemberName,
  newMemberRole,
  onNewMemberNameChange,
  onNewMemberRoleChange,
  onSubmitNewMember,
}: MemberCreatePanelProps) {
  return (
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
  );
}
