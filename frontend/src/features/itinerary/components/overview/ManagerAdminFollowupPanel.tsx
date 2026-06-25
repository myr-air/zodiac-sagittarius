import type { TripTask } from "@/src/trip/types";
import { Icon } from "@/src/ui/icons";
import { OverviewPanelTitle } from "./OverviewPanelTitle";
import {
  overviewAdminFollowupClassName,
  overviewAdminFollowupMetricClassName,
  overviewAdminFollowupTaskClassName,
  overviewTaskAddButtonClassName,
} from "./overview-page.styles";

interface ManagerAdminFollowupPanelProps {
  addChecklistLabel: string;
  ariaLabel: string;
  myChecklistLabel: string;
  myOpenTasks: number;
  onAddTask: () => void;
  onToggleTask: (task: TripTask) => void;
  pendingSuggestions: number;
  pendingSuggestionsLabel: string;
  sharedChecklistLabel: string;
  sharedOpenTasks: number;
  task?: TripTask;
  title: string;
}

export function ManagerAdminFollowupPanel({
  addChecklistLabel,
  ariaLabel,
  myChecklistLabel,
  myOpenTasks,
  onAddTask,
  onToggleTask,
  pendingSuggestions,
  pendingSuggestionsLabel,
  sharedChecklistLabel,
  sharedOpenTasks,
  task,
  title,
}: ManagerAdminFollowupPanelProps) {
  return (
    <section className={overviewAdminFollowupClassName} aria-label={ariaLabel}>
      <div className="flex min-w-0 items-center justify-between gap-3">
        <OverviewPanelTitle icon="check" title={title} />
        <button
          className={overviewTaskAddButtonClassName}
          type="button"
          aria-label={addChecklistLabel}
          title={addChecklistLabel}
          onClick={onAddTask}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
      <div className={overviewAdminFollowupMetricClassName}>
        <span><strong>{myOpenTasks}</strong> {myChecklistLabel}</span>
        <span><strong>{sharedOpenTasks}</strong> {sharedChecklistLabel}</span>
        <span><strong>{pendingSuggestions}</strong> {pendingSuggestionsLabel}</span>
      </div>
      {task ? (
        <label className={overviewAdminFollowupTaskClassName}>
          <input type="checkbox" checked={task.status === "done"} onChange={() => onToggleTask(task)} />
          <span>{task.title}</span>
          <Icon name="chevronRight" className="size-4 text-(--color-text-muted)" />
        </label>
      ) : null}
    </section>
  );
}
