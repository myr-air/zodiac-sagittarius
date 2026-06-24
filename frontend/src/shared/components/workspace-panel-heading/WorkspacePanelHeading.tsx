import { cn } from "@/src/lib/cn";
import { Icon, type IconName } from "@/src/ui/icons";
import {
  workspacePanelHeadingCompactClassName,
  workspacePanelHeadingOverviewClassName,
} from "./WorkspacePanelHeading.styles";

export const workspacePanelHeadingVariantValues = ["compact", "overview"] as const;

export type WorkspacePanelHeadingVariant = (typeof workspacePanelHeadingVariantValues)[number];

const workspacePanelHeadingVariantClassNames = {
  compact: workspacePanelHeadingCompactClassName,
  overview: workspacePanelHeadingOverviewClassName,
} satisfies Record<WorkspacePanelHeadingVariant, string>;

interface WorkspacePanelHeadingProps {
  className?: string;
  icon: IconName;
  id?: string;
  title: string;
  variant?: WorkspacePanelHeadingVariant;
}

export function WorkspacePanelHeading({
  className,
  icon,
  id,
  title,
  variant = "compact",
}: WorkspacePanelHeadingProps) {
  return (
    <h2 id={id} className={cn(workspacePanelHeadingVariantClassNames[variant], className)}>
      <Icon name={icon} /> {title}
    </h2>
  );
}
