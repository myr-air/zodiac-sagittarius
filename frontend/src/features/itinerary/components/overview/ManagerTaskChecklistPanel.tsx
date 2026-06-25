import { SegmentedControl } from "@/src/ui";
import type { ItineraryItem, Trip, TripTask } from "@/src/trip/types";
import { OverviewPanelTitle } from "./OverviewPanelTitle";
import { OverviewTaskList, type OverviewTaskListLabels } from "./OverviewTaskList";
import { OverviewTaskStatusFilterControl } from "./OverviewTaskStatusFilterControl";
import {
  overviewPanelClassName,
  overviewTaskAddButtonClassName,
  overviewTaskFilterActiveClassName,
  overviewTaskFiltersClassName,
  overviewTaskPanelClassName,
  overviewTaskToolbarClassName,
} from "./overview-page.styles";
import {
  taskScopeFilterValues,
  type TaskScopeFilter,
  type TaskStatusFilter,
} from "./overview-role-panels.types";

interface ManagerTaskChecklistPanelProps {
  addChecklistLabel: string;
  allLabel: string;
  allStatusesLabel: string;
  ariaLabel: string;
  doneLabel: string;
  emptyMessage: string;
  includeStopMeta?: boolean;
  includeTripKindMeta?: boolean;
  items: ItineraryItem[];
  mineLabel: string;
  onAddTask: () => void;
  onScopeFilterChange: (filter: TaskScopeFilter) => void;
  onStatusFilterChange: (filter: TaskStatusFilter) => void;
  onToggleTask: (task: TripTask) => void;
  openLabel: string;
  pinPanel?: boolean;
  scopeFilter: TaskScopeFilter;
  scopeFilterLabel: string;
  statusFilter: TaskStatusFilter;
  statusFilterLabel: string;
  taskListLabels: OverviewTaskListLabels;
  tasks: TripTask[];
  title: string;
  trip: Trip;
  tripLabel: string;
}

export function ManagerTaskChecklistPanel({
  addChecklistLabel,
  allLabel,
  allStatusesLabel,
  ariaLabel,
  doneLabel,
  emptyMessage,
  includeStopMeta,
  includeTripKindMeta,
  items,
  mineLabel,
  onAddTask,
  onScopeFilterChange,
  onStatusFilterChange,
  onToggleTask,
  openLabel,
  pinPanel = true,
  scopeFilter,
  scopeFilterLabel,
  statusFilter,
  statusFilterLabel,
  taskListLabels,
  tasks,
  title,
  trip,
  tripLabel,
}: ManagerTaskChecklistPanelProps) {
  const scopeFilterLabels: Record<TaskScopeFilter, string> = {
    all: allLabel,
    mine: mineLabel,
    trip: tripLabel,
  };
  const panelClassName = pinPanel
    ? `${overviewPanelClassName} ${overviewTaskPanelClassName}`
    : overviewPanelClassName;

  return (
    <section className={panelClassName} aria-label={ariaLabel}>
      <OverviewPanelTitle icon="check" title={title} />
      <div className={overviewTaskToolbarClassName}>
        <SegmentedControl
          aria-label={scopeFilterLabel}
          className={overviewTaskFiltersClassName}
          selectedItemClassName={overviewTaskFilterActiveClassName}
          value={scopeFilter}
          options={taskScopeFilterValues.map((value) => ({
            label: scopeFilterLabels[value],
            value,
          }))}
          onChange={onScopeFilterChange}
        />
        <OverviewTaskStatusFilterControl
          allLabel={allStatusesLabel}
          doneLabel={doneLabel}
          label={statusFilterLabel}
          openLabel={openLabel}
          value={statusFilter}
          onChange={onStatusFilterChange}
        />
        <button className={overviewTaskAddButtonClassName} type="button" aria-label={addChecklistLabel} title={addChecklistLabel} onClick={onAddTask}>
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <OverviewTaskList
        tasks={tasks}
        trip={trip}
        items={items}
        labels={taskListLabels}
        emptyMessage={emptyMessage}
        includeTripKindMeta={includeTripKindMeta}
        includeStopMeta={includeStopMeta}
        onToggleTask={onToggleTask}
      />
    </section>
  );
}
