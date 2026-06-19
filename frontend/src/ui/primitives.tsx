import { cloneElement, isValidElement } from "react";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactElement,
  ReactNode,
} from "react";
import { cn } from "@/src/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type BadgeTone = "neutral" | "primary" | "route" | "warning" | "success" | "danger";
type ActionBarAlign = "start" | "end" | "between";

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

const actionBarBaseClassName = [
  "action-bar",
  "flex",
  "min-w-0",
  "flex-wrap",
  "items-center",
  "gap-2",
];

const actionBarAlignClassNames = {
  start: ["justify-start"],
  end: ["justify-end"],
  between: ["justify-between"],
} satisfies Record<ActionBarAlign, string[]>;

const segmentedControlClassName = [
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

const segmentedButtonClassName = [
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

const floatingActionButtonClassName = [
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

export function FloatingActionButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button className={cn(floatingActionButtonClassName, className)} {...props}>
      {children}
    </button>
  );
}

export function SwapButton({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <IconButton className={cn("swap-button", "rounded-full", className)} {...props}>
      {children}
    </IconButton>
  );
}

export function ActionBar({
  align = "end",
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { align?: ActionBarAlign; children: ReactNode }) {
  return (
    <div className={cn(actionBarBaseClassName, actionBarAlignClassNames[align], className)} {...props}>
      {children}
    </div>
  );
}

export function SegmentedControl<TValue extends string>({
  "aria-label": ariaLabel,
  className = "",
  itemClassName = "",
  onChange,
  options,
  selectedItemClassName = "",
  value,
}: {
  "aria-label": string;
  className?: string;
  itemClassName?: string;
  onChange: (value: TValue) => void;
  options: Array<{ label: ReactNode; value: TValue; disabled?: boolean }>;
  selectedItemClassName?: string;
  value: TValue;
}) {
  return (
    <div className={cn(segmentedControlClassName, className)} role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          aria-pressed={option.value === value}
          className={cn(
            segmentedButtonClassName,
            itemClassName,
            option.value === value && selectedItemClassName,
          )}
          data-selected={option.value === value ? "true" : undefined}
          disabled={option.disabled}
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
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
