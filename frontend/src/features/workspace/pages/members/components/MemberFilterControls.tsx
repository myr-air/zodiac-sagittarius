import { SelectOptions } from "@/src/shared/components/select-options";
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
          className={memberStyles.memberFilterInputClassName}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={labels.members.fields.searchPlaceholder}
        />
      </FieldLabel>
      <FieldLabel>
        <span>{labels.members.fields.role}</span>
        <Select
          className={memberStyles.memberFilterInputClassName}
          value={roleFilter}
          onChange={(event) => onRoleFilterChange(event.target.value as MemberRoleFilter)}
        >
          <SelectOptions options={memberRoleFilterSelectOptions(labels)} />
        </Select>
      </FieldLabel>
      <FieldLabel>
        <span>{labels.members.fields.status}</span>
        <Select
          className={memberStyles.memberFilterInputClassName}
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as MemberStatusFilter)}
        >
          <SelectOptions options={memberStatusFilterSelectOptions(labels)} />
        </Select>
      </FieldLabel>
    </div>
  );
}
