export const iconButtonBaseClassName = [
  "icon-button",
  "inline-flex",
  "min-h-9",
  "w-9",
  "items-center",
  "justify-center",
  "rounded-(--radius-sm)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "text-[#334155]",
];

export const buttonBaseClassName = [
  "button",
  "inline-flex",
  "min-h-9",
  "items-center",
  "justify-center",
  "gap-2",
  "rounded-(--radius-sm)",
  "border",
  "border-transparent",
  "px-3",
  "py-[7px]",
  "text-[13px]",
  "font-extrabold",
  "no-underline",
  "transition-[background,border-color,color,box-shadow]",
  "duration-150",
  "disabled:text-(--color-text-subtle)",
  "disabled:bg-(--color-surface-muted)",
  "disabled:shadow-none",
];

export const buttonVariantClassNames = {
  primary: [
    "button--primary",
    "bg-(--color-primary)",
    "text-white",
    "shadow-[0_10px_20px_rgb(194_79_22_/_0.18)]",
    "hover:enabled:bg-(--color-primary-strong)",
  ],
  secondary: [
    "button--secondary",
    "w-full",
    "border-(--color-border)",
    "bg-(--color-surface)",
    "text-(--color-primary-strong)",
  ],
  ghost: [
    "button--ghost",
    "border-(--color-border)",
    "bg-(--color-surface)",
    "text-(--color-text-muted)",
  ],
  danger: [
    "button--danger",
    "border-(--color-danger-border)",
    "bg-(--color-danger-soft)",
    "text-[#b91c1c]",
  ],
} satisfies Record<string, string[]>;
export type ButtonVariant = keyof typeof buttonVariantClassNames;

export const badgeBaseClassName = [
  "badge",
  "inline-flex",
  "min-h-6",
  "items-center",
  "justify-center",
  "rounded-full",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "px-[9px]",
  "py-0.5",
  "text-[11px]",
  "font-extrabold",
  "leading-4",
  "text-(--color-text-muted)",
  "whitespace-nowrap",
];

export const badgeToneClassNames = {
  neutral: ["badge--neutral"],
  primary: ["badge--primary", "border-(--color-primary-border)", "bg-(--color-primary-soft)", "text-(--color-primary-strong)"],
  route: ["badge--route", "border-(--color-route-border)", "bg-(--color-route-soft)", "text-[#1d4ed8]"],
  warning: ["badge--warning", "border-(--color-warning-border)", "bg-(--color-warning-soft)", "text-(--color-warning-strong)"],
  success: ["badge--success", "border-(--color-success-border)", "bg-(--color-success-soft)", "text-[#15803d]"],
  danger: ["badge--danger", "border-(--color-danger-border)", "bg-(--color-danger-soft)", "text-[#b91c1c]"],
} satisfies Record<string, string[]>;
export type BadgeTone = keyof typeof badgeToneClassNames;

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

export const floatingActionButtonClassName = [
  "floating-action-button",
  "fixed",
  "right-4",
  "bottom-4",
  "z-[30]",
  "inline-flex",
  "min-h-12",
  "min-w-12",
  "items-center",
  "justify-center",
  "gap-2",
  "rounded-full",
  "border",
  "border-(--color-primary)",
  "bg-(--color-primary)",
  "px-4",
  "text-sm",
  "font-extrabold",
  "text-white",
  "shadow-[0_10px_18px_rgb(15_118_110_/_0.22)]",
  "transition-[background,border-color,box-shadow,transform]",
  "duration-150",
  "hover:bg-(--color-primary-strong)",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-(--color-primary)",
  "disabled:border-(--color-border)",
  "disabled:bg-(--color-surface-muted)",
  "disabled:text-(--color-text-muted)",
  "disabled:shadow-none",
];
