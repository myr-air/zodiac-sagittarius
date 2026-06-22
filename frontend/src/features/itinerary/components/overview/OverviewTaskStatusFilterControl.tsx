import { SegmentedControl } from "@/src/ui";
import {
  overviewTaskFilterActiveClassName,
  overviewTaskFiltersClassName,
} from "./overview-page.styles";
import {
  taskStatusFilterValues,
  type TaskStatusFilter,
} from "./overview-role-panels.types";

interface OverviewTaskStatusFilterControlProps {
  allLabel: string;
  doneLabel: string;
  label: string;
  onChange: (filter: TaskStatusFilter) => void;
  openLabel: string;
  value: TaskStatusFilter;
}

export function OverviewTaskStatusFilterControl({
  allLabel,
  doneLabel,
  label,
  onChange,
  openLabel,
  value,
}: OverviewTaskStatusFilterControlProps) {
  const statusFilterLabels: Record<TaskStatusFilter, string> = {
    all: allLabel,
    done: doneLabel,
    open: openLabel,
  };

  return (
    <SegmentedControl
      aria-label={label}
      className={overviewTaskFiltersClassName}
      selectedItemClassName={overviewTaskFilterActiveClassName}
      value={value}
      options={taskStatusFilterValues.map((filter) => ({
        label: statusFilterLabels[filter],
        value: filter,
      }))}
      onChange={onChange}
    />
  );
}
