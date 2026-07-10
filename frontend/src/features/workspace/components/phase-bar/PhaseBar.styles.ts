export const phaseBarRootClassName = [
  "phase-bar",
  "flex",
  "items-center",
  "gap-0.5",
  "px-2",
  "h-12",
  "border-b",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "max-[767px]:overflow-x-auto",
  "max-[767px]:overflow-y-hidden",
];

export const phaseBarTabBase = [
  "phase-bar-tab",
  "inline-flex",
  "items-center",
  "gap-2",
  "px-3.5",
  "py-2.5",
  "text-[13px]",
  "font-medium",
  "leading-5",
  "rounded-t-(--radius-sm)",
  "border-b-2",
  "border-transparent",
  "transition-[background,color,border-color]",
  "duration-150",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-[rgb(15_118_110_/_0.16)]",
  "focus-visible:z-10",
];

/** Active tab: teal underline, primary-soft background, bold. */
export const phaseBarTabActive = [
  "text-(--color-primary-strong)",
  "font-bold",
  "bg-(--color-primary-soft)",
  "border-b-(--color-primary)",
];

/** Available but not active: muted, hoverable. */
export const phaseBarTabAvailable = [
  "text-(--color-text-muted)",
  "hover:bg-(--color-surface-subtle)",
  "hover:text-(--color-text)",
  "cursor-pointer",
];

/** Unavailable: subtle, no hover, not-allowed cursor. Icon at 50% opacity. */
export const phaseBarTabUnavailable = [
  "text-(--color-text-subtle)",
  "[&_.icon]:opacity-50",
  "cursor-not-allowed",
];

export const phaseBarIconClassName = [
  "phase-bar-icon",
  "size-[18px]",
  "shrink-0",
];

/** Label hidden below 1280px viewport — shown via Tooltip or aria-label. */
export const phaseBarLabelClassName = [
  "phase-bar-label",
  "hidden",
  "xl:inline",
  "truncate",
  "max-w-[12ch]",
];
