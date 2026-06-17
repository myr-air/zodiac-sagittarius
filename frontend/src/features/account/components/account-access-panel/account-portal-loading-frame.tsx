"use client";

import type { PortalSection } from "@/src/shared/portal";
import { useI18n } from "@/src/i18n/I18nProvider";
import { getLatestAccountPortalDataCache } from "./account-access-panel-support";
import { AccountPortalNav } from "./account-portal-nav";
import {
  portalSkeletonBlockClassName,
  portalSkeletonLineClassName,
  portalSkeletonTitleClassName,
} from "./account-portal-primitives";

export interface AccountPortalLoadingFrameClassNames {
  dashboard: string;
  loadingCard: string;
  content: string;
}

export function AccountPortalLoadingFrame({
  classNames,
  portalSection,
}: {
  classNames: AccountPortalLoadingFrameClassNames;
  portalSection: PortalSection;
}) {
  const { t } = useI18n();
  const cachedEmail = getLatestAccountPortalDataCache()?.settings?.profile.primaryEmail ?? t.access.dashboard.noEmail;

  return (
    <div className={classNames.dashboard} id="account-portal" aria-busy="true">
      <AccountPortalNav activeSection={portalSection} email={cachedEmail} />
      <div className={classNames.content}>
        <section className={classNames.loadingCard}>
          <span className={portalSkeletonTitleClassName} />
          <span className={portalSkeletonLineClassName} />
          <span className={portalSkeletonBlockClassName} />
        </section>
      </div>
    </div>
  );
}
