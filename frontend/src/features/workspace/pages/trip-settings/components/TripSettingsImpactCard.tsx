import { useI18n } from "@/src/i18n/I18nProvider";
import { formatTripRange } from "@/src/shared/components/page-header";
import { WorkspaceSurface } from "@/src/ui";
import { Icon, type IconName } from "@/src/ui/icons";
import * as settingsStyles from "../TripSettingsPage.styles";

interface TripSettingsImpactCardProps {
  defaultTimezone: string;
  endDate: string;
  outsideStopCount: number;
  partySize: number;
  startDate: string;
}

export function TripSettingsImpactCard({
  defaultTimezone,
  endDate,
  outsideStopCount,
  partySize,
  startDate,
}: TripSettingsImpactCardProps) {
  const { locale, t } = useI18n();

  return (
    <WorkspaceSurface className={settingsStyles.sideCardClassName} aria-label={t.tripSettings.planImpact}>
      <h2 className="text-[16px] font-[900] text-(--color-text)">{t.tripSettings.planImpact}</h2>
      <ImpactRow
        icon="calendar"
        title={`${t.tripSettings.startDate} / ${t.tripSettings.endDate}`}
        body={formatTripRange(startDate, endDate, locale)}
      />
      <ImpactRow
        icon="users"
        title={t.tripSettings.partySize}
        body={t.dates.memberCount({ count: partySize })}
      />
      <ImpactRow
        icon="settings"
        title={t.tripSettings.defaultTimezone}
        body={defaultTimezone}
      />
      <ImpactRow
        icon={outsideStopCount ? "warning" : "check"}
        title={t.tripSettings.planImpact}
        body={outsideStopCount ? t.tripSettings.outsideStops({ count: outsideStopCount }) : t.tripSettings.noImpact}
      />
    </WorkspaceSurface>
  );
}

interface ImpactRowProps {
  body: string;
  icon: IconName;
  title: string;
}

function ImpactRow({ body, icon, title }: ImpactRowProps) {
  return (
    <div className={settingsStyles.impactLineClassName}>
      <Icon name={icon} />
      <span>
        <strong className={settingsStyles.impactRowTitleClassName}>{title}</strong>
        <span className={settingsStyles.impactRowBodyClassName}>{body}</span>
      </span>
    </div>
  );
}
