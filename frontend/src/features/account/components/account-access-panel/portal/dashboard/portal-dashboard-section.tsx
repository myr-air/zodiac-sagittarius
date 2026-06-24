import type { AccountSession, AccountSettings, AccountTripStats } from "@/src/account/api-client";
import { Badge } from "@/src/ui";
import { useI18n } from "@/src/i18n/I18nProvider";
import { PanelHeading } from "../../primitives/account-panel-heading";
import { PortalStatSkeleton, Stat } from "../primitives/account-portal-primitives";
import {
  buildAccountPortalDashboardProfile,
  buildAccountPortalDashboardSessionBadge,
  buildAccountPortalDashboardStatRows,
} from "./account-portal-dashboard-section.model";

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
  const profile = buildAccountPortalDashboardProfile(settings, t.access.dashboard);
  const sessionBadge = buildAccountPortalDashboardSessionBadge(
    accountSession,
    t.access.dashboard,
  );
  const statRows = buildAccountPortalDashboardStatRows(stats, t.access.dashboard);

  return (
    <section className={classNames.section} id="portal-dashboard">
      <PanelHeading icon="home" title={t.access.portal.sections.dashboard.title} detail={t.access.portal.sections.dashboard.detail} />
      <div className={classNames.profileRow}>
        <span className={classNames.avatar} style={{ backgroundColor: profile.avatarColor }} aria-hidden="true">
          {profile.avatarInitial}
        </span>
        <div>
          <strong>{profile.displayName}</strong>
          <span>{profile.email}</span>
        </div>
        <Badge tone={sessionBadge.tone}>{sessionBadge.label}</Badge>
      </div>
      <div className={classNames.statGrid}>
        {isLoading && !stats ? (
          <PortalStatSkeleton />
        ) : (
          <>
            {statRows.map((stat) => (
              <Stat key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </>
        )}
      </div>
    </section>
  );
}
