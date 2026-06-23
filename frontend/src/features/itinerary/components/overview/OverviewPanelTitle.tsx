import { Icon, type IconName } from "@/src/ui/icons";
import { overviewPanelTitleClassName } from "./overview-page.styles";

interface OverviewPanelTitleProps {
  icon: IconName;
  title: string;
  titleId?: string;
}

export function OverviewPanelTitle({ icon, title, titleId }: OverviewPanelTitleProps) {
  return (
    <div className={overviewPanelTitleClassName}>
      <Icon name={icon} />
      <h2 id={titleId}>{title}</h2>
    </div>
  );
}
