import type { FormEvent } from "react";
import { Icon } from "@/src/ui/icons";
import type { ItineraryItem, Trip, TripTask } from "@/src/trip/types";
import { OverviewTaskList, type OverviewTaskListLabels } from "./OverviewTaskList";
import { OverviewTaskStatusFilterControl } from "./OverviewTaskStatusFilterControl";
import {
  overviewPanelClassName,
  overviewPanelTitleClassName,
  overviewTaskPanelClassName,
  overviewTaskToolbarClassName,
  personalTaskFormClassName,
} from "./overview-page.styles";
import {
  type TaskStatusFilter,
} from "./overview-role-panels.types";

export function TravelerChecklistPanel({
  addPersonalTaskLabel,
  addTaskLabel,
  allLabel,
  ariaLabel,
  emptyMessage,
  items,
  newTaskTitle,
  onSubmitTask,
  onTaskTitleChange,
  onToggleTask,
  openLabel,
  placeholder,
  statusFilterLabel,
  taskListLabels,
  taskStatusFilter,
  title,
  trip,
  doneLabel,
  visibleTasks,
  onTaskStatusFilterChange,
}: {
  addPersonalTaskLabel: string;
  addTaskLabel: string;
  allLabel: string;
  ariaLabel: string;
  doneLabel: string;
  emptyMessage: string;
  items: ItineraryItem[];
  newTaskTitle: string;
  onSubmitTask: (event: FormEvent<HTMLFormElement>) => void;
  onTaskTitleChange: (title: string) => void;
  onToggleTask: (task: TripTask) => void;
  openLabel: string;
  placeholder: string;
  statusFilterLabel: string;
  taskListLabels: OverviewTaskListLabels;
  taskStatusFilter: TaskStatusFilter;
  title: string;
  trip: Trip;
  visibleTasks: TripTask[];
  onTaskStatusFilterChange: (filter: TaskStatusFilter) => void;
}) {
  return (
    <section className={`${overviewPanelClassName} ${overviewTaskPanelClassName}`} aria-label={ariaLabel}>
      <div className={overviewPanelTitleClassName}>
        <Icon name="check" />
        <h2>{title}</h2>
      </div>
      <div className={overviewTaskToolbarClassName}>
        <OverviewTaskStatusFilterControl
          allLabel={allLabel}
          doneLabel={doneLabel}
          label={statusFilterLabel}
          openLabel={openLabel}
          value={taskStatusFilter}
          onChange={onTaskStatusFilterChange}
        />
      </div>
      <form className={personalTaskFormClassName} onSubmit={onSubmitTask}>
        <label>
          <span>{addPersonalTaskLabel}</span>
          <input
            value={newTaskTitle}
            onChange={(event) => onTaskTitleChange(event.target.value)}
            placeholder={placeholder}
          />
        </label>
        <button type="submit" disabled={!newTaskTitle.trim()}>{addTaskLabel}</button>
      </form>

      <OverviewTaskList
        tasks={visibleTasks}
        trip={trip}
        items={items}
        labels={taskListLabels}
        emptyMessage={emptyMessage}
        onToggleTask={onToggleTask}
      />
    </section>
  );
}
