import { cloneElement, isValidElement } from "react";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactElement,
  ReactNode,
} from "react";
import { cn } from "@/src/lib/cn";

import {
  actionBarAlignClassNames,
  actionBarBaseClassName,
  badgeBaseClassName,
  badgeToneClassNames,
  buttonBaseClassName,
  buttonVariantClassNames,
  floatingActionButtonClassName,
  iconButtonBaseClassName,
  segmentedButtonClassName,
  segmentedControlClassName,
  type ActionBarAlign,
  type BadgeTone,
  type ButtonVariant,
} from "./primitive-styles";

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
