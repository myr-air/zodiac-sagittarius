import { cloneElement, isValidElement } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from "react";
import { cn } from "@/src/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type BadgeTone = "neutral" | "primary" | "route" | "warning" | "success" | "danger";

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
