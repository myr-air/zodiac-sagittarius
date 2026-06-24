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
  icon?: IconName;
  label: string;
  tone?: WorkspaceSummaryStatTone;
  value: string;
  valueClassName?: string;
  valueFirst?: boolean;
  valueToneClassNames?: Partial<Record<WorkspaceSummaryStatTone, string>>;
}

export function WorkspaceSummaryStat({
  className,
  icon,
  label,
  tone = "neutral",
  value,
  valueClassName,
  valueFirst = false,
  valueToneClassNames,
}: WorkspaceSummaryStatProps) {
  const valueNode = (
    <strong className={cn(valueClassName, valueToneClassNames?.[tone])}>
      {value}
    </strong>
  );
  const labelNode = <span>{label}</span>;

  return (
    <div className={className}>
      {icon ? <Icon name={icon} /> : null}
      {valueFirst ? valueNode : labelNode}
      {valueFirst ? labelNode : valueNode}
    </div>
  );
}
