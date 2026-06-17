import type { ReactNode } from "react";
import type { ItineraryItem, Trip, TripTask } from "@/src/trip/types";
import { taskKindLabel, stopLabel } from "@/src/features/itinerary/domain";
import { TaskAssigneeBadge } from "./OverviewSections";
import {
  overviewTaskMetaClassName,
  overviewTaskKindChipClassName,
  overviewMutedClassName,
  overviewTaskTitleDoneClassName,
  overviewTaskTitleTodoClassName,
  overviewTaskItemClassName,
  overviewTaskItemInteractiveClassName,
  overviewTaskListClassName,
} from "./overview.styles";

interface TaskAssigneeBadgeLabels {
  private: string;
  shared: string;
  tripMember: string;
  unassigned: string;
}

interface TaskKindLabels {
  booking: string;
  prep: string;
  planStop: string;
}

export interface OverviewTaskListLabels {
  assignee: TaskAssigneeBadgeLabels;
  kind: TaskKindLabels;
}

export interface OverviewTaskListProps {
  tasks: TripTask[];
  trip: Trip;
  items: ItineraryItem[];
  labels: OverviewTaskListLabels;
  emptyMessage: string;
  includeTripKindMeta?: boolean;
  includeStopMeta?: boolean;
  onToggleTask: (task: TripTask) => void;
  children?: ReactNode;
}

export function OverviewTaskList({
  tasks,
  trip,
  items,
  labels,
  emptyMessage,
  includeTripKindMeta,
  includeStopMeta,
  onToggleTask,
  children,
}: OverviewTaskListProps) {
  if (!tasks.length) {
    return <p className={overviewMutedClassName}>{emptyMessage}</p>;
  }

  return (
    <>
      <ul className={overviewTaskListClassName}>
        {tasks.map((task) => (
          <OverviewTaskListItem
            key={task.id}
            task={task}
            trip={trip}
            items={items}
            labels={labels}
            includeTripKindMeta={includeTripKindMeta}
            includeStopMeta={includeStopMeta}
            onToggleTask={onToggleTask}
          />
        ))}
      </ul>
      {children}
    </>
  );
}

function OverviewTaskListItem({
  task,
  trip,
  items,
  labels,
  includeTripKindMeta,
  includeStopMeta,
  onToggleTask,
}: {
  task: TripTask;
  trip: Trip;
  items: ItineraryItem[];
  labels: OverviewTaskListLabels;
  includeTripKindMeta?: boolean;
  includeStopMeta?: boolean;
  onToggleTask: (task: TripTask) => void;
}) {
  return (
    <li
      className={`${overviewTaskItemClassName} ${overviewTaskItemInteractiveClassName}`}
      aria-label={task.title}
      data-status={task.status}
    >
      <label>
        <input type="checkbox" checked={task.status === "done"} onChange={() => onToggleTask(task)} />
        <span className={task.status === "done" ? overviewTaskTitleDoneClassName : overviewTaskTitleTodoClassName}>
          {task.title}
        </span>
      </label>
      <div className={overviewTaskMetaClassName}>
        <TaskAssigneeBadge task={task} trip={trip} labels={labels.assignee} />
        {includeTripKindMeta && <small className={overviewTaskKindChipClassName}>{taskKindLabel(task, labels.kind)}</small>}
        {includeStopMeta && task.relatedItemId ? (
          <small className={overviewTaskKindChipClassName}>{stopLabel(task.relatedItemId, items, labels.kind.planStop)}</small>
        ) : null}
      </div>
    </li>
  );
}
