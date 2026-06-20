import type { useI18n } from "@/src/i18n/I18nProvider";
import { FieldLabel, Select, TextInput } from "@/src/ui";

import type { MemberRoleFilter, MemberStatusFilter } from "../TripMembersPage.support";
import * as memberStyles from "../TripMembersPage.styles";

type MemberLabels = ReturnType<typeof useI18n>["t"];

interface MemberFilterControlsProps {
  labels: MemberLabels;
  onQueryChange: (query: string) => void;
  onRoleFilterChange: (role: MemberRoleFilter) => void;
  onStatusFilterChange: (status: MemberStatusFilter) => void;
  query: string;
  roleFilter: MemberRoleFilter;
  statusFilter: MemberStatusFilter;
}

export function MemberFilterControls({
  labels,
  onQueryChange,
  onRoleFilterChange,
  onStatusFilterChange,
  query,
  roleFilter,
  statusFilter,
}: MemberFilterControlsProps) {
  return (
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
  );
}
