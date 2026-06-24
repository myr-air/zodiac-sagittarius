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
  primary: [
    "badge--primary",
    "border-(--color-primary-border)",
    "bg-(--color-primary-soft)",
    "text-(--color-primary-strong)",
  ],
  route: [
    "badge--route",
    "border-(--color-route-border)",
    "bg-(--color-route-soft)",
    "text-[#1d4ed8]",
  ],
  warning: [
    "badge--warning",
    "border-(--color-warning-border)",
    "bg-(--color-warning-soft)",
    "text-(--color-warning-strong)",
  ],
  success: [
    "badge--success",
    "border-(--color-success-border)",
    "bg-(--color-success-soft)",
    "text-[#15803d]",
  ],
  danger: [
    "badge--danger",
    "border-(--color-danger-border)",
    "bg-(--color-danger-soft)",
    "text-[#b91c1c]",
  ],
} satisfies Record<string, string[]>;
export type BadgeTone = keyof typeof badgeToneClassNames;
