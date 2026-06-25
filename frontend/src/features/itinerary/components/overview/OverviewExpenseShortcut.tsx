import { OverviewPanelTitle } from "./OverviewPanelTitle";
import { overviewPanelButtonClassName, overviewPanelClassName } from "./overview-page.styles";
import { Icon } from "@/src/ui/icons";

interface OverviewExpenseShortcutProps {
  icon: "wallet" | "plus";
  title: string;
  value: React.ReactNode;
  detail: string;
  onClick: () => void;
  ariaLabel?: string;
  titleId?: string;
}

export function OverviewExpenseShortcut({
  icon,
  title,
  value,
  detail,
  onClick,
  ariaLabel,
  titleId,
}: OverviewExpenseShortcutProps) {
  return (
    <button
      className={`${overviewPanelClassName} ${overviewPanelButtonClassName}`}
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <OverviewPanelTitle icon={icon} title={title} titleId={titleId} />
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary)">
          <Icon name="chevronRight" className="size-4" />
        </span>
      </div>
      <strong className="max-w-[24ch]">{value}</strong>
      <span className="max-w-[32ch]">{detail}</span>
    </button>
  );
}
