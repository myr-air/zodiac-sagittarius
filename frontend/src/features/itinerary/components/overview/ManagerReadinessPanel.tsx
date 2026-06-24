import { OverviewPanelTitle } from "./OverviewPanelTitle";
import {
  overviewHealthGridClassName,
  overviewPanelClassName,
  overviewPanelHealthClassName,
} from "./overview-page.styles";

interface ManagerReadinessPanelProps {
  ariaLabel: string;
  myChecklistLabel: string;
  myOpenTasks: number;
  pendingSuggestions: number;
  pendingSuggestionsLabel: string;
  sharedChecklistLabel: string;
  sharedOpenTasks: number;
  title: string;
}

export function ManagerReadinessPanel({
  ariaLabel,
  myChecklistLabel,
  myOpenTasks,
  pendingSuggestions,
  pendingSuggestionsLabel,
  sharedChecklistLabel,
  sharedOpenTasks,
  title,
}: ManagerReadinessPanelProps) {
  return (
    <section className={`${overviewPanelClassName} ${overviewPanelHealthClassName}`} aria-label={ariaLabel}>
      <OverviewPanelTitle icon="check" title={title} />
      <div className={overviewHealthGridClassName}>
        <span><strong>{myOpenTasks}</strong> {myChecklistLabel}</span>
        <span><strong>{sharedOpenTasks}</strong> {sharedChecklistLabel}</span>
        <span><strong>{pendingSuggestions}</strong> {pendingSuggestionsLabel}</span>
      </div>
    </section>
  );
}
