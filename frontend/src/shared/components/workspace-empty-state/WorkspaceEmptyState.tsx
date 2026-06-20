import { cn } from "@/src/lib/cn";

interface WorkspaceEmptyStateProps {
  title: string;
  detail: string;
  className?: string;
}

export function WorkspaceEmptyState({ title, detail, className }: WorkspaceEmptyStateProps) {
  return (
    <div className={cn("grid place-items-center p-5 text-center", className)}>
      <div className="grid max-w-[360px] gap-1">
        <strong className="text-(--color-text)">{title}</strong>
        <span className="text-sm font-medium leading-6 text-(--color-text-muted)">{detail}</span>
      </div>
    </div>
  );
}
