import type { AccountSession, AccountSettings, AccountTripStats } from "@/src/account/api-client";
import { Badge } from "@/src/ui";
import { useI18n } from "@/src/i18n/I18nProvider";
import { PanelHeading } from "../primitives/account-panel-heading";
import { PortalStatSkeleton, Stat } from "./account-portal-primitives";

interface PortalDashboardSectionClassNames {
  avatar: string;
  profileRow: string;
  section: string;
  statGrid: string;
}

export function PortalDashboardSection({
  accountSession,
  classNames,
  isLoading,
  settings,
  stats,
}: {
  accountSession: AccountSession;
  classNames: PortalDashboardSectionClassNames;
  isLoading: boolean;
  settings: AccountSettings | null;
  stats: AccountTripStats | null;
}) {
  const { t } = useI18n();
  const sessionKindLabel = accountSession.kind === "trusted" ? t.access.dashboard.sessionKinds.trusted : t.access.dashboard.sessionKinds.temporary;

  return (
    <section className={classNames.section} id="portal-dashboard">
      <PanelHeading icon="home" title={t.access.portal.sections.dashboard.title} detail={t.access.portal.sections.dashboard.detail} />
      <div className={classNames.profileRow}>
        <span className={classNames.avatar} style={{ backgroundColor: settings?.profile.avatarColor ?? "#c2410c" }} aria-hidden="true">
          {(settings?.profile.displayName ?? t.access.dashboard.fallbackName).slice(0, 1)}
        </span>
        <div>
          <strong>{settings?.profile.displayName ?? t.access.dashboard.fallbackName}</strong>
          <span>{settings?.profile.primaryEmail ?? t.access.dashboard.noEmail}</span>
        </div>
        <Badge tone={accountSession.kind === "trusted" ? "success" : "warning"}>{sessionKindLabel}</Badge>
      </div>
      <div className={classNames.statGrid}>
        {isLoading && !stats ? (
          <PortalStatSkeleton />
        ) : (
          <>
            <Stat label={t.access.dashboard.stats.trips} value={stats?.tripsTotal ?? 0} />
            <Stat label={t.access.dashboard.stats.owned} value={stats?.tripsOwned ?? 0} />
            <Stat label={t.access.dashboard.stats.active} value={stats?.activeTrips ?? 0} />
            <Stat label={t.access.dashboard.stats.claims} value={stats?.tempClaimsCompleted ?? 0} />
          </>
        )}
      </div>
    </section>
  );
}
