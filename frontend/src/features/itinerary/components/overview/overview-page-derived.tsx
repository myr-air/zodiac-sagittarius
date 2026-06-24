import { PageUserCard } from "@/src/shared/components/page-header";
import type { Member, Trip } from "@/src/trip/types";
import type { TaskAssigneeLabels } from "./OverviewTaskAssigneeBadge";
import type { OverviewTaskListLabels } from "./OverviewTaskList";

interface OverviewTaskListLabelInput {
  assignee: TaskAssigneeLabels;
  kind: {
    booking: string;
    prep: string;
    planStop: string;
  };
}

export function renderOverviewCurrentMemberCard(
  currentMember: Member | undefined,
  trip: Pick<Trip, "destinationLabel">,
) {
  return currentMember ? (
    <PageUserCard
      color={currentMember.color}
      name={currentMember.displayName}
      label={trip.destinationLabel}
    />
  ) : null;
}

export function buildOverviewTaskListLabels({
  assignee,
  kind,
}: OverviewTaskListLabelInput): OverviewTaskListLabels {
  return {
    assignee,
    kind,
  };
}
