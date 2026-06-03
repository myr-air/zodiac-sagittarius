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
  "rounded-[var(--radius-sm)]",
  "border",
  "border-[var(--color-border)]",
  "bg-[var(--color-surface)]",
  "text-[#334155]",
];

const buttonBaseClassName = [
  "button",
  "inline-flex",
  "min-h-9",
  "items-center",
  "justify-center",
  "gap-2",
  "rounded-[var(--radius-sm)]",
  "border",
  "border-transparent",
  "px-3",
  "py-[7px]",
  "text-[13px]",
  "font-extrabold",
  "no-underline",
  "transition-[background,border-color,color,box-shadow]",
  "duration-150",
  "disabled:text-[var(--color-text-subtle)]",
  "disabled:bg-[var(--color-surface-muted)]",
  "disabled:shadow-none",
];

const buttonVariantClassNames = {
  primary: [
    "button--primary",
    "bg-[var(--color-primary)]",
    "text-white",
    "shadow-[0_10px_20px_rgb(15_118_110_/_0.16)]",
    "hover:enabled:bg-[var(--color-primary-strong)]",
  ],
  secondary: [
    "button--secondary",
    "w-full",
    "border-[var(--color-border)]",
    "bg-[var(--color-surface)]",
    "text-[var(--color-primary-strong)]",
  ],
  ghost: [
    "button--ghost",
    "border-[var(--color-border)]",
    "bg-[var(--color-surface)]",
    "text-[var(--color-text-muted)]",
  ],
  danger: [
    "button--danger",
    "border-[var(--color-danger-border)]",
    "bg-[var(--color-danger-soft)]",
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
  "border-[var(--color-border)]",
  "bg-[var(--color-surface)]",
  "px-[9px]",
  "py-0.5",
  "text-[11px]",
  "font-extrabold",
  "leading-4",
  "text-[var(--color-text-muted)]",
  "whitespace-nowrap",
];

const badgeToneClassNames = {
  neutral: ["badge--neutral"],
  primary: ["badge--primary", "border-[var(--color-primary-border)]", "bg-[var(--color-primary-soft)]", "text-[var(--color-primary-strong)]"],
  route: ["badge--route", "border-[var(--color-route-border)]", "bg-[var(--color-route-soft)]", "text-[#1d4ed8]"],
  warning: ["badge--warning", "border-[var(--color-warning-border)]", "bg-[var(--color-warning-soft)]", "text-[var(--color-warning-strong)]"],
  success: ["badge--success", "border-[var(--color-success-border)]", "bg-[var(--color-success-soft)]", "text-[#15803d]"],
  danger: ["badge--danger", "border-[var(--color-danger-border)]", "bg-[var(--color-danger-soft)]", "text-[#b91c1c]"],
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
        "rounded-[var(--radius-lg)]",
        "border",
        "border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
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
