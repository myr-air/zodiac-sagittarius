"use client";

import Link from "next/link";
import type { PortalSection } from "@/src/shared/portal";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { Icon } from "@/src/ui/icons";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { getPortalNavItems } from "../account-access-panel-support";

const portalNavClassName =
  "portal-nav sticky top-4 grid gap-3.5 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3 shadow-[var(--shadow-soft)] max-[767px]:static max-[767px]:gap-2.5 max-[767px]:p-2.5";
const portalNavBrandClassName =
  "portal-nav-brand flex min-w-0 items-center gap-2.5 max-[767px]:px-1 max-[767px]:pt-0.5 [&_span]:block [&_span]:min-w-0 [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap [&_span]:text-xs [&_span]:font-[750] [&_span]:text-(--color-text-muted) [&_strong]:block [&_strong]:min-w-0 [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-(--color-text)";
const portalNavLinksClassName =
  "portal-nav-links grid gap-2.5 max-[767px]:-mx-1 max-[767px]:flex max-[767px]:flex-nowrap max-[767px]:gap-2 max-[767px]:overflow-x-auto max-[767px]:overscroll-x-contain max-[767px]:px-1 max-[767px]:pb-0.5 max-[767px]:[scrollbar-width:none] max-[767px]:[&::-webkit-scrollbar]:hidden max-[767px]:[mask-image:linear-gradient(to_right,#000_82%,transparent)]";
const portalNavLinkClassName =
  "portal-nav-link flex min-h-[42px] w-full items-center gap-2.5 rounded-(--radius-md) border border-transparent bg-transparent px-2.5 text-left text-[13px] font-[850] text-(--color-text-muted) no-underline transition-[border-color,background,color,box-shadow,transform] duration-[180ms] ease-out hover:translate-x-0.5 hover:border-(--color-primary-border) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) hover:shadow-[0_8px_18px_rgb(194_79_22_/_0.08)] focus-visible:translate-x-0.5 focus-visible:border-(--color-route-border) focus-visible:bg-(--color-route-soft) focus-visible:text-(--color-route) focus-visible:shadow-[0_8px_18px_rgb(191_219_254_/_0.36)] max-[767px]:w-auto max-[767px]:min-w-[116px] max-[767px]:shrink-0 max-[767px]:justify-center max-[767px]:hover:translate-x-0 max-[767px]:focus-visible:translate-x-0";
const portalNavLinkActiveClassName = "portal-nav-link--active border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong)";

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
