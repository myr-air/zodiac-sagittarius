import { WorkspacePanelHeading } from "@/src/shared/components/workspace-panel-heading";
import type { IconName } from "@/src/ui/icons";

interface OverviewPanelTitleProps {
  icon: IconName;
  title: string;
  titleId?: string;
}

export function OverviewPanelTitle({ icon, title, titleId }: OverviewPanelTitleProps) {
  return <WorkspacePanelHeading icon={icon} id={titleId} title={title} variant="overview" />;
}
