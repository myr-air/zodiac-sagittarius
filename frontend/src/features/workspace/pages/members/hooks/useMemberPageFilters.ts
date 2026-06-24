import { useState } from "react";
import type {
  MemberRoleFilter,
  MemberStatusFilter,
} from "../model/member-page-options";
import {
  initialMemberFilterState,
  updateMemberFilterState,
  type MemberFilterState,
} from "../model/member-page-state";

export function useMemberPageFilters() {
  const [filterState, setFilterState] = useState<MemberFilterState>(
    initialMemberFilterState,
  );

  function updateFilterState<Field extends keyof MemberFilterState>(
    field: Field,
    value: MemberFilterState[Field],
  ) {
    setFilterState((current) => updateMemberFilterState(current, field, value));
  }

  function resetFilters() {
    setFilterState(initialMemberFilterState);
  }

  return {
    query: filterState.query,
    resetFilters,
    roleFilter: filterState.roleFilter,
    setQuery: (query: string) => updateFilterState("query", query),
    setRoleFilter: (roleFilter: MemberRoleFilter) =>
      updateFilterState("roleFilter", roleFilter),
    setStatusFilter: (statusFilter: MemberStatusFilter) =>
      updateFilterState("statusFilter", statusFilter),
    statusFilter: filterState.statusFilter,
  };
}
