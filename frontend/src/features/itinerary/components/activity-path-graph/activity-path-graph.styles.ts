export const graphClassName = "activity-path-graph relative w-full bg-(--color-surface-subtle)";
export const dotClassName =
  "activity-path-graph-node absolute z-[3] left-1/2 size-9 -translate-x-1/2 rounded-full border-0 bg-transparent p-0 transition-transform hover:scale-105 focus-visible:outline-none before:absolute before:left-1/2 before:top-1/2 before:size-3 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:border-2 before:border-(--color-surface) before:bg-(--activity-path-node-color) before:shadow-[0_1px_4px_rgb(15_23_42_/_0.18)] after:absolute after:left-1/2 after:top-1/2 after:size-4 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:opacity-0 after:ring-2 after:ring-(--color-primary-strong) after:ring-offset-1 after:ring-offset-(--color-surface)";
export const selectedDotClassName = "activity-path-graph-node--selected after:opacity-100";
export const pathSelectClassName = "sr-only";
export const anchorClassName =
  "activity-path-graph-anchor absolute z-[3] left-1/2 size-3 -translate-x-1/2 rounded-full border-2 border-(--color-primary) bg-white shadow-[0_1px_4px_rgb(15_23_42_/_0.12)]";

export const dayRowHeight = 47.5;
export const addStopRowHeight = 36;
export const rowStep = 59;
export const dotLaneGap = 18;
export const dotSize = 12;
export const dotHitTargetSize = 36;

export const laneColors = [
  "var(--color-primary)",
  "var(--color-route)",
  "var(--color-warning)",
  "var(--color-coral)",
  "var(--color-sky)",
  "#64748b",
];
