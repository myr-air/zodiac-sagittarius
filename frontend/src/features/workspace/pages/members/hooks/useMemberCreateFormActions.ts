import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { TripRole } from "@/src/trip/types";
import { buildCreateMemberInput } from "../model/member-create-input";
import {
  initialMemberCreateFormState,
  type MemberCreateFormState,
} from "../model/member-page-state";

interface UseMemberCreateFormActionsInput {
  canManagePeople: boolean;
  createFormState: MemberCreateFormState;
  onCreateMember: (input: {
    displayName: string;
    role: Exclude<TripRole, "owner">;
  }) => void;
  setCreateFormState: Dispatch<SetStateAction<MemberCreateFormState>>;
}

export function useMemberCreateFormActions({
  canManagePeople,
  createFormState,
  onCreateMember,
  setCreateFormState,
}: UseMemberCreateFormActionsInput) {
  function submitNewMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = buildCreateMemberInput({
      canManagePeople,
      displayName: createFormState.name,
      role: createFormState.role,
    });
    if (!input) return;
    onCreateMember(input);
    setCreateFormState(initialMemberCreateFormState);
  }

  return {
    submitNewMember,
  };
}
