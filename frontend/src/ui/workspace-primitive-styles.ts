export type WorkspaceSurfaceDensity = "normal" | "compact";
export type WorkspacePageKind = "standard" | "workspace";

export const workspacePageBaseClassName = [
  "min-h-full",
  "min-w-0",
  "bg-transparent",
  "px-6",
  "py-[22px]",
  "pb-7",
  "max-[1199px]:px-0",
  "max-[1199px]:py-0",
  "max-[1199px]:pb-0",
];

export const workspacePageKindClassNames = {
  standard: ["max-[1199px]:min-h-[calc(100dvh-48px)]"],
  workspace: [
    "grid",
    "grid-rows-[auto_minmax(0,1fr)]",
    "gap-3",
    "max-[1199px]:gap-0",
  ],
} satisfies Record<WorkspacePageKind, string[]>;

export const workspaceSurfaceClassName = [
  "rounded-(--radius-lg)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]",
  "max-[1199px]:rounded-none",
  "max-[1199px]:border-x-0",
  "max-[1199px]:border-t-0",
  "max-[1199px]:shadow-none",
];

export const workspaceSurfaceDensityClassNames = {
  normal: ["p-4"],
  compact: ["p-3.5"],
} satisfies Record<WorkspaceSurfaceDensity, string[]>;

export const fieldControlClassName = [
  "min-h-10",
  "w-full",
  "rounded-(--radius-sm)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "px-3",
  "text-[13px]",
  "text-(--color-text)",
  "outline-none",
  "transition-[border-color,box-shadow]",
  "focus:border-(--color-route-border)",
  "focus:shadow-[0_0_0_3px_rgb(191_219_254_/_0.55)]",
  "disabled:bg-(--color-surface-muted)",
  "disabled:text-(--color-text-muted)",
];

export const textAreaControlClassName = [
  ...fieldControlClassName,
  "min-h-[88px]",
  "resize-y",
  "py-2",
  "leading-5",
];

export const fieldStackClassName = [
  "grid",
  "gap-1.5",
  "text-[12px]",
  "font-extrabold",
  "text-(--color-text)",
];
