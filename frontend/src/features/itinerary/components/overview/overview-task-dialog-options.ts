import {
  buildSelectOptions,
  buildSelectOptionsFromItems,
  prependSelectOption,
  type SelectOption,
} from "@/src/shared/select-options";
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
    buildSelectOptionsFromItems(
      members,
      (member) => member.id,
      (member) => member.displayName,
    ),
    { value: "", label: noAssigneeLabel },
  );
}
