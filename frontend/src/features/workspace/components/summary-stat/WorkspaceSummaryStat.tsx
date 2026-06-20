import { cn } from "@/src/lib/cn";
import { Icon, type IconName } from "@/src/ui/icons";

export const workspaceSummaryStatToneValues = [
  "positive",
  "negative",
  "neutral",
] as const;
export type WorkspaceSummaryStatTone = (typeof workspaceSummaryStatToneValues)[number];

interface WorkspaceSummaryStatProps {
  className: string;
  icon: IconName;
  label: string;
  tone?: WorkspaceSummaryStatTone;
  value: string;
  valueClassName?: string;
  valueToneClassNames?: Partial<Record<WorkspaceSummaryStatTone, string>>;
}

export function WorkspaceSummaryStat({
  className,
  icon,
  label,
  tone = "neutral",
  value,
  valueClassName,
  valueToneClassNames,
}: WorkspaceSummaryStatProps) {
  return (
    <div className={className}>
      <Icon name={icon} />
      <span>{label}</span>
      <strong className={cn(valueClassName, valueToneClassNames?.[tone])}>
        {value}
      </strong>
    </div>
  );
}
