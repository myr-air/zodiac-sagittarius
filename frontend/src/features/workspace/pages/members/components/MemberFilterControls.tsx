import { FieldLabel, Select, TextInput } from "@/src/ui";
import {
  memberRoleFilterValues,
  memberStatusFilterValues,
  type MemberRoleFilter,
  type MemberStatusFilter,
} from "../TripMembersPage.support";
import * as memberStyles from "../TripMembersPage.styles";
import type { MemberFilterControlProps } from "./member-management.types";

export function MemberFilterControls({
  labels,
  onQueryChange,
  onRoleFilterChange,
  onStatusFilterChange,
  query,
  roleFilter,
  statusFilter,
}: MemberFilterControlProps) {
  const roleFilterLabels: Record<MemberRoleFilter, string> = {
    all: labels.members.filters.allRoles,
    organizer: labels.appShell.roles.organizer,
    owner: labels.appShell.roles.owner,
    traveler: labels.appShell.roles.traveler,
    viewer: labels.appShell.roles.viewer,
  };
  const statusFilterLabels: Record<MemberStatusFilter, string> = {
    active: labels.common.status.active,
    all: labels.members.filters.allStatuses,
    claimed: labels.join.memberStatus.claimed,
    disabled: labels.common.status.disabled,
    pending: labels.common.status.pending,
  };

  return (
    <div className={memberStyles.memberCommandFieldsClassName}>
      <FieldLabel>
        <span>{labels.members.fields.search}</span>
        <TextInput
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={labels.members.fields.searchPlaceholder}
        />
      </FieldLabel>
      <FieldLabel>
        <span>{labels.members.fields.role}</span>
        <Select
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value as MemberRoleFilter)}
        >
          {memberRoleFilterValues.map((role) => (
            <option key={role} value={role}>{roleFilterLabels[role]}</option>
          ))}
        </Select>
      </FieldLabel>
      <FieldLabel>
        <span>{labels.members.fields.status}</span>
        <Select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as MemberStatusFilter)}
        >
          {memberStatusFilterValues.map((status) => (
            <option key={status} value={status}>{statusFilterLabels[status]}</option>
          ))}
        </Select>
      </FieldLabel>
    </div>
  );
}
