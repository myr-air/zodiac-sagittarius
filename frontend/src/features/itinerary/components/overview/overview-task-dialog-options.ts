import {
  buildSelectOptions,
  prependSelectOption,
  type SelectOption,
} from "@/src/shared/select-options";
import { buildMemberSelectOptions } from "@/src/trip/members";
import type { Member, TripTask } from "@/src/trip/types";

export function overviewTaskVisibilitySelectOptions(labels: {
  private: string;
  shared: string;
}): Array<SelectOption<TripTask["visibility"]>> {
  return buildSelectOptions(["private", "shared"] as const, (value) => labels[value]);
}

export function overviewTaskAssigneeSelectOptions(
  members: readonly Pick<Member, "id" | "displayName">[],
  noAssigneeLabel: string,
): SelectOption[] {
  return prependSelectOption(
    buildMemberSelectOptions(members),
    { value: "", label: noAssigneeLabel },
  );
}
