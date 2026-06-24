import {
  buildSelectOptionsFromItems,
  type SelectOption,
} from "@/src/shared/select-options";
import type { Member } from "../types";

type MemberOptionSource = Pick<Member, "id" | "displayName">;

export type MemberSelectOption = SelectOption<Member["id"]>;

export function buildMemberSelectOptions(
  members: readonly MemberOptionSource[],
): MemberSelectOption[] {
  return buildSelectOptionsFromItems(
    members,
    (member) => member.id,
    (member) => member.displayName,
  );
}
