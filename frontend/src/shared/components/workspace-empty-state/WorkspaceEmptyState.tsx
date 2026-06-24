import { cn } from "@/src/lib/cn";
import type { ReactNode } from "react";

interface WorkspaceEmptyStateProps {
  action?: ReactNode;
  className?: string;
  detail: string;
  icon?: ReactNode;
  title: string;
}

export function WorkspaceEmptyState({
  action,
  className,
  detail,
  icon,
  title,
}: WorkspaceEmptyStateProps) {
  return (
    <div className={cn("grid place-items-center p-5 text-center", className)}>
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <div className="grid max-w-[360px] gap-1">
        <strong className="text-(--color-text)">{title}</strong>
        <p className="m-0 text-sm font-medium leading-6 text-(--color-text-muted)">{detail}</p>
      </div>
      {action}
    </div>
  );
}
