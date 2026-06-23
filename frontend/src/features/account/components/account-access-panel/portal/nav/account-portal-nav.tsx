"use client";

import Link from "next/link";
import type { PortalSection } from "@/src/shared/portal";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { getPortalNavItems } from "./account-portal-nav-items";
import {
  portalNavBrandClassName,
  portalNavClassName,
  portalNavLinkActiveClassName,
  portalNavLinkClassName,
  portalNavLinksClassName,
} from "./account-portal-nav.styles";

export function AccountPortalNav({
  activeSection,
  email,
}: {
  activeSection: PortalSection;
  email: string;
}) {
  const { t } = useI18n();
  const portalNavItems = getPortalNavItems(t);

  return (
    <nav className={portalNavClassName} aria-label={t.access.portal.nav.label}>
      <div className={portalNavBrandClassName}>
        <div>
          <strong>{t.access.portal.title}</strong>
          <span>{email}</span>
        </div>
      </div>
      <div className={portalNavLinksClassName}>
        {portalNavItems.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            className={cn(portalNavLinkClassName, item.id === activeSection ? portalNavLinkActiveClassName : "")}
            aria-current={item.id === activeSection ? "page" : undefined}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </Link>
        ))}
        <Link
          href={appRoutes.portalSignOut()}
          className={cn(portalNavLinkClassName, activeSection === "sign-out" ? portalNavLinkActiveClassName : "")}
          aria-current={activeSection === "sign-out" ? "page" : undefined}
        >
          <Icon name="x" />
          <span>{t.access.dashboard.logout}</span>
        </Link>
      </div>
    </nav>
  );
}
