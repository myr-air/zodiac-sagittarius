import { type SetStateAction, useState } from "react";
import type { TripRole } from "@/src/trip/types";
import {
  initialMemberCreateFormState,
  setMemberCreatePanelOpenState,
  updateMemberCreateFormState,
  type MemberCreateFormState,
} from "../model/member-page-state";
import { useMemberCreateFormActions } from "./useMemberCreateFormActions";

interface UseMemberCreateFormStateInput {
  canManagePeople: boolean;
  onCreateMember: (input: {
    displayName: string;
    role: Exclude<TripRole, "owner">;
  }) => void;
}

export function useMemberCreateFormState({
  canManagePeople,
  onCreateMember,
}: UseMemberCreateFormStateInput) {
  const [createFormState, setCreateFormState] =
    useState<MemberCreateFormState>(initialMemberCreateFormState);

  function updateCreateFormState<Field extends keyof MemberCreateFormState>(
    field: Field,
    value: MemberCreateFormState[Field],
  ) {
    setCreateFormState((current) =>
      updateMemberCreateFormState(current, field, value),
    );
  }

  function setCreatePanelOpen(nextOpen: SetStateAction<boolean>) {
    setCreateFormState((current) =>
      setMemberCreatePanelOpenState(current, nextOpen),
    );
  }

  const { submitNewMember } = useMemberCreateFormActions({
    canManagePeople,
    createFormState,
    onCreateMember,
    setCreateFormState,
  });

  return {
    createPanelOpen: createFormState.isOpen,
    newMemberName: createFormState.name,
    newMemberRole: createFormState.role,
    setCreatePanelOpen,
    setNewMemberName: (name: string) => updateCreateFormState("name", name),
    setNewMemberRole: (role: Exclude<TripRole, "owner">) =>
      updateCreateFormState("role", role),
    submitNewMember,
  };
}
