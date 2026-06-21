import type { ReactNode } from "react";

import {
  detailHeadingClassName,
  detailSectionClassName,
} from "./context-rail.styles";

interface ContextRailDetailSectionProps {
  ariaLabel: string;
  children: ReactNode;
  className: string;
  title: ReactNode;
}

export function ContextRailDetailSection({
  ariaLabel,
  children,
  className,
  title,
}: ContextRailDetailSectionProps) {
  return (
    <section
      className={`${detailSectionClassName} ${className}`}
      aria-label={ariaLabel}
    >
      <h3 className={detailHeadingClassName}>{title}</h3>
      {children}
    </section>
  );
}
