import { useI18n } from "@/src/i18n/I18nProvider";
import { WorkspaceSurface } from "@/src/ui";
import { Icon } from "@/src/ui/icons";
import * as settingsStyles from "../TripSettingsPage.styles";

interface TripSettingsImpactCardProps {
  outsideStopCount: number;
}

export function TripSettingsImpactCard({ outsideStopCount }: TripSettingsImpactCardProps) {
  const { t } = useI18n();

  return (
    <WorkspaceSurface className={settingsStyles.sideCardClassName} aria-label={t.tripSettings.planImpact}>
      <h2 className="text-[16px] font-[900] text-(--color-text)">{t.tripSettings.planImpact}</h2>
      <div className={settingsStyles.impactLineClassName}>
        <Icon name={outsideStopCount ? "warning" : "check"} />
        <span>
          {outsideStopCount ? t.tripSettings.outsideStops({ count: outsideStopCount }) : t.tripSettings.noImpact}
        </span>
      </div>
    </WorkspaceSurface>
  );
}
