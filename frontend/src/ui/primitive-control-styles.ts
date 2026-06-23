export const actionBarBaseClassName = [
  "action-bar",
  "flex",
  "min-w-0",
  "flex-wrap",
  "items-center",
  "gap-2",
];

export const actionBarAlignClassNames = {
  start: ["justify-start"],
  end: ["justify-end"],
  between: ["justify-between"],
} satisfies Record<string, string[]>;
export type ActionBarAlign = keyof typeof actionBarAlignClassNames;

export const segmentedControlClassName = [
  "segmented-control",
  "inline-flex",
  "w-fit",
  "max-w-full",
  "items-center",
  "rounded-(--radius-sm)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface-muted)",
  "p-0.5",
];

export const segmentedButtonClassName = [
  "segmented-control__item",
  "min-h-8",
  "rounded-[calc(var(--radius-sm)-2px)]",
  "border-0",
  "bg-transparent",
  "px-2.5",
  "text-xs",
  "font-extrabold",
  "text-(--color-text-muted)",
  "transition-[background,color,box-shadow]",
  "duration-150",
  "hover:text-(--color-primary-strong)",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-(--color-primary)",
  "data-[selected=true]:bg-(--color-surface)",
  "data-[selected=true]:text-(--color-primary-strong)",
  "data-[selected=true]:shadow-[0_1px_4px_rgb(15_23_42_/_0.06)]",
];
