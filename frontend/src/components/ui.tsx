import { cloneElement, isValidElement } from "react";
import type { ButtonHTMLAttributes, FormHTMLAttributes, HTMLAttributes, LabelHTMLAttributes, ReactElement, ReactNode } from "react";
import { cn } from "@/src/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type BadgeTone = "neutral" | "primary" | "route" | "warning" | "success" | "danger";
type WorkspaceSurfaceElement = "section" | "form" | "nav" | "aside" | "div";
type WorkspaceSurfaceDensity = "normal" | "compact";
type WorkspacePageKind = "standard" | "workspace";

const iconButtonBaseClassName = [
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

const buttonBaseClassName = [
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

const buttonVariantClassNames = {
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
} satisfies Record<ButtonVariant, string[]>;

const badgeBaseClassName = [
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

const badgeToneClassNames = {
  neutral: ["badge--neutral"],
  primary: ["badge--primary", "border-(--color-primary-border)", "bg-(--color-primary-soft)", "text-(--color-primary-strong)"],
  route: ["badge--route", "border-(--color-route-border)", "bg-(--color-route-soft)", "text-[#1d4ed8]"],
  warning: ["badge--warning", "border-(--color-warning-border)", "bg-(--color-warning-soft)", "text-(--color-warning-strong)"],
  success: ["badge--success", "border-(--color-success-border)", "bg-(--color-success-soft)", "text-[#15803d]"],
  danger: ["badge--danger", "border-(--color-danger-border)", "bg-(--color-danger-soft)", "text-[#b91c1c]"],
} satisfies Record<BadgeTone, string[]>;

const workspacePageBaseClassName = [
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

const workspacePageKindClassNames = {
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

const workspaceSurfaceDensityClassNames = {
  normal: ["p-4"],
  compact: ["p-3.5"],
} satisfies Record<WorkspaceSurfaceDensity, string[]>;

export const fieldControlClassName = [
  "min-h-10",
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

export const fieldStackClassName = [
  "grid",
  "gap-1.5",
  "text-[12px]",
  "font-extrabold",
  "text-(--color-text)",
];

export function workspacePageClassName(kind: WorkspacePageKind = "standard", className = ""): string {
  return cn(workspacePageBaseClassName, workspacePageKindClassNames[kind], className);
}

export function WorkspacePage({
  children,
  className = "",
  kind = "standard",
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode; kind?: WorkspacePageKind }) {
  return (
    <section className={workspacePageClassName(kind, className)} {...props}>
      {children}
    </section>
  );
}

type WorkspaceSurfaceBaseProps = {
  as?: WorkspaceSurfaceElement;
  children: ReactNode;
  className?: string;
  density?: WorkspaceSurfaceDensity;
};

type WorkspaceSurfaceFormProps = Omit<WorkspaceSurfaceBaseProps, "as"> & {
  as: "form";
} & FormHTMLAttributes<HTMLFormElement>;

type WorkspaceSurfaceNonFormProps = WorkspaceSurfaceBaseProps & {
  as?: Exclude<WorkspaceSurfaceElement, "form">;
} & HTMLAttributes<HTMLElement>;

type WorkspaceSurfaceProps = WorkspaceSurfaceFormProps | WorkspaceSurfaceNonFormProps;

export function WorkspaceSurface({
  as,
  children,
  className = "",
  density = "normal",
  ...props
}: WorkspaceSurfaceProps) {
  const surfaceClassName = cn(workspaceSurfaceClassName, workspaceSurfaceDensityClassNames[density], className);

  if (as === "form") {
    return (
      <form className={surfaceClassName} {...(props as FormHTMLAttributes<HTMLFormElement>)}>
        {children}
      </form>
    );
  }

  if (as === "nav") {
    return (
      <nav className={surfaceClassName} {...(props as HTMLAttributes<HTMLElement>)}>
        {children}
      </nav>
    );
  }

  if (as === "aside") {
    return (
      <aside className={surfaceClassName} {...(props as HTMLAttributes<HTMLElement>)}>
        {children}
      </aside>
    );
  }

  if (as === "div") {
    return (
      <div className={surfaceClassName} {...(props as HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <section className={surfaceClassName} {...(props as HTMLAttributes<HTMLElement>)}>
      {children}
    </section>
  );
}

export function FieldLabel({ children, className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement> & { children: ReactNode }) {
  return (
    <label className={cn(fieldStackClassName, className)} {...props}>
      {children}
    </label>
  );
}

export function Button({
  asChild = false,
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: ButtonVariant }) {
  const nextClassName = cn(buttonBaseClassName, buttonVariantClassNames[variant], className);
  if (asChild && isValidElement<{ className?: string }>(children)) {
    return cloneElement(children as ReactElement<{ className?: string }>, {
      className: cn(nextClassName, children.props.className),
    });
  }

  return (
    <button className={nextClassName} {...props}>
      {children}
    </button>
  );
}

export function IconButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button className={cn(iconButtonBaseClassName, className)} {...props}>
      {children}
    </button>
  );
}

export function Panel({ children, className = "", ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section
      className={cn(
        "panel",
        "grid",
        "gap-3",
        "rounded-(--radius-lg)",
        "border",
        "border-(--color-border)",
        "bg-(--color-surface)",
        "p-4",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return <span className={cn(badgeBaseClassName, badgeToneClassNames[tone], className)}>{children}</span>;
}
