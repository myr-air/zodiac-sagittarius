import type { TripRole } from "@/src/trip/types";
import { defaultCreatedMemberRole } from "./member-create-input";
import type { MemberRoleFilter, MemberStatusFilter } from "./member-page-options";

export interface MemberFilterState {
  query: string;
  roleFilter: MemberRoleFilter;
  statusFilter: MemberStatusFilter;
}

export interface MemberCreateFormState {
  isOpen: boolean;
  name: string;
  role: Exclude<TripRole, "owner">;
}

type BooleanStateAction = boolean | ((current: boolean) => boolean);

export const initialMemberFilterState: MemberFilterState = {
  query: "",
  roleFilter: "all",
  statusFilter: "all",
};

export const initialMemberCreateFormState: MemberCreateFormState = {
  isOpen: false,
  name: "",
  role: defaultCreatedMemberRole,
};

export function updateMemberFilterState<Field extends keyof MemberFilterState>(
  state: MemberFilterState,
  field: Field,
  value: MemberFilterState[Field],
): MemberFilterState {
  return { ...state, [field]: value };
}

export function updateMemberCreateFormState<
  Field extends keyof MemberCreateFormState,
>(
  state: MemberCreateFormState,
  field: Field,
  value: MemberCreateFormState[Field],
): MemberCreateFormState {
  return { ...state, [field]: value };
}

export function setMemberCreatePanelOpenState(
  state: MemberCreateFormState,
  nextOpen: BooleanStateAction,
): MemberCreateFormState {
  return {
    ...state,
    isOpen: typeof nextOpen === "function" ? nextOpen(state.isOpen) : nextOpen,
  };
}
