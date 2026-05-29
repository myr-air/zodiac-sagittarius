import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button className={["button", `button--${variant}`, className].filter(Boolean).join(" ")} {...props}>
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
