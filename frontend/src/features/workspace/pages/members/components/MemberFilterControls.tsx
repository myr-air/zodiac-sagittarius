import { FieldLabel, Select, TextInput } from "@/src/ui";
import {
  memberRoleFilterSelectOptions,
  memberStatusFilterSelectOptions,
  type MemberRoleFilter,
  type MemberStatusFilter,
} from "../model/member-page-options";
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
          {memberRoleFilterSelectOptions(labels).map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </Select>
      </FieldLabel>
      <FieldLabel>
        <span>{labels.members.fields.status}</span>
        <Select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as MemberStatusFilter)}
        >
          {memberStatusFilterSelectOptions(labels).map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </Select>
      </FieldLabel>
    </div>
  );
}
