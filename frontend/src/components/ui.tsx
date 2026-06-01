import { cloneElement, isValidElement } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from "react";

export function Button({
  asChild = false,
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  const nextClassName = ["button", `button--${variant}`, className].filter(Boolean).join(" ");
  if (asChild && isValidElement<{ className?: string }>(children)) {
    return cloneElement(children as ReactElement<{ className?: string }>, {
      className: [nextClassName, children.props.className].filter(Boolean).join(" "),
    });
  }

  return (
    <button className={nextClassName} {...props}>
      {children}
    </button>
  );
}

export function Panel({ children, className = "", ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={["panel", className].filter(Boolean).join(" ")} {...props}>
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
  tone?: "neutral" | "primary" | "route" | "warning" | "success" | "danger";
  className?: string;
}) {
  return <span className={["badge", `badge--${tone}`, className].filter(Boolean).join(" ")}>{children}</span>;
}
