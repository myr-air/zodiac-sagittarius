/** Root container — compact horizontal bar at 48px height. */
export const commandBarRootClassName = [
  "command-bar",
  "flex",
  "items-center",
  "justify-between",
  "h-12",
  "px-4",
  "border-b",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "shrink-0",
];

/** Inner content row: trip name, date, save badge. */
export const commandBarContentClassName = [
  "command-bar-content",
  "flex",
  "items-center",
  "gap-3",
  "min-w-0",
];

/** Trip name — truncated at 40 chars, tabular feel. */
export const commandBarTripNameClassName = [
  "command-bar-trip-name",
  "text-sm",
  "font-bold",
  "text-(--color-text)",
  "truncate",
  "max-w-[40ch]",
];

/** Date window label — muted secondary text. */
export const commandBarDateLabelClassName = [
  "command-bar-date",
  "text-[13px]",
  "text-(--color-text-muted)",
  "whitespace-nowrap",
];

/** Base badge styles shared between saved and draft states. */
export const commandBarBadgeBaseClassName = [
  "command-bar-badge",
  "inline-flex",
  "items-center",
  "px-2.5",
  "py-0.5",
  "rounded-(--radius-sm)",
  "text-[11px]",
  "font-extrabold",
  "leading-5",
  "whitespace-nowrap",
];

/** Green "saved" badge — synced state. */
export const commandBarBadgeSavedClassName = [
  "bg-(--color-success-soft)",
  "text-(--color-success)",
];

/** Orange "draft" badge — unsaved changes. */
export const commandBarBadgeDraftClassName = [
  "bg-(--color-warning-soft)",
  "text-(--color-warning)",
];
