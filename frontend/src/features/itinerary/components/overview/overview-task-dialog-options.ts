import type { SelectOptionItem } from "@/src/shared/components/select-options";
import type { Member, TripTask } from "@/src/trip/types";

export function overviewTaskVisibilitySelectOptions(labels: {
  private: string;
  shared: string;
}): Array<SelectOptionItem<TripTask["visibility"]>> {
  return [
    { value: "private", label: labels.private },
    { value: "shared", label: labels.shared },
  ];
}

export function overviewTaskAssigneeSelectOptions(
  members: readonly Pick<Member, "id" | "displayName">[],
  noAssigneeLabel: string,
): SelectOptionItem[] {
  return [
    { value: "", label: noAssigneeLabel },
    ...members.map((member) => ({
      value: member.id,
      label: member.displayName,
    })),
  ];
}
