"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import type { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { appRoutes } from "@/src/routes/app-routes";
import { Icon } from "@/src/ui/icons";
import { workflowStepMeta } from "./HomeLanding.meta";
import {
  homeBrandClassName,
  homeBrandMarkClassName,
  homeFeatureBandClassName,
  homeFeatureTextClassName,
  homeFeatureTitleClassName,
  homeFooterBrandClassName,
  homeFooterClassName,
  homeFooterCopyClassName,
  homeFooterLinkClassName,
  homeFooterLinksClassName,
  homeLanguageSwitchClassName,
  homeLargeButtonClassName,
  homeLinkButtonClassName,
  homeNavActionsClassName,
  homeNavClassName,
  homeNavSecondaryActionsClassName,
  homePrimaryButtonClassName,
  homeWorkflowClassName,
  homeWorkflowDetailClassName,
  homeWorkflowGridClassName,
  homeWorkflowHighlightClassName,
  homeWorkflowIconClassName,
  homeWorkflowItemClassName,
  homeWorkflowItemTextClassName,
  homeWorkflowItemTitleClassName,
  homeWorkflowNumberClassName,
  homeWorkflowTitleClassName,
  workflowToneClassNames,
} from "./HomeLanding.styles";

type HomeLandingCopy = ReturnType<typeof useI18n>["t"]["homeLanding"];

function HomeBrand({ landing }: { landing: HomeLandingCopy }) {
  return (
    <Link className={homeBrandClassName} href="/" aria-label={landing.brandHomeLabel}>
      <span className={homeBrandMarkClassName} aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <path d="M13 35 35 13M22 13h13v13" />
          <path d="M12 18c8 2 16 8 18 18" />
        </svg>
      </span>
      Joii
    </Link>
  );
}

export function HomeLandingNav({ landing }: { landing: HomeLandingCopy }) {
  return (
    <nav className={homeNavClassName} aria-label={landing.navLabel}>
      <HomeBrand landing={landing} />

      <div className={homeNavActionsClassName}>
        <div className={homeNavSecondaryActionsClassName}>
          <LanguageSwitch className={homeLanguageSwitchClassName} />
          <Link className={homeLinkButtonClassName} href={appRoutes.login()}>
            {landing.actions.login}
          </Link>
        </div>
        <Link className={cn(homePrimaryButtonClassName, "max-[420px]:col-span-full")} href={appRoutes.join()}>
          {landing.actions.tripAccess}
          <Icon name="key" />
        </Link>
      </div>
    </nav>
  );
}

export function HomeWorkflowSection({ landing }: { landing: HomeLandingCopy }) {
  return (
    <section className={homeWorkflowClassName} id="workflow" aria-labelledby="workflow-title">
      <h2 className={homeWorkflowTitleClassName} id="workflow-title">
        {landing.workflow.titleLead} <span className={homeWorkflowHighlightClassName}>{landing.workflow.titleHighlight}</span>
      </h2>
      <p className={homeWorkflowDetailClassName}>{landing.workflow.detail}</p>
      <div className={homeWorkflowGridClassName}>
        {workflowStepMeta.map((step, index) => {
          const toneClassNames = workflowToneClassNames[step.tone];

          return (
            <article className={homeWorkflowItemClassName} data-tone={step.tone} key={step.key}>
              <span className={cn(homeWorkflowNumberClassName, toneClassNames.number)}>{index + 1}</span>
              <span className={cn(homeWorkflowIconClassName, toneClassNames.icon)} aria-hidden="true">
                <Icon name={step.icon} />
              </span>
              <h3 className={homeWorkflowItemTitleClassName}>{landing.workflow.steps[step.key].title}</h3>
              <p className={homeWorkflowItemTextClassName}>{landing.workflow.steps[step.key].text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function HomeFinalCta({ landing }: { landing: HomeLandingCopy }) {
  return (
    <section className={homeFeatureBandClassName} aria-label={landing.finalCta.label}>
      <div>
        <h2 className={homeFeatureTitleClassName}>{landing.finalCta.title}</h2>
        <p className={homeFeatureTextClassName}>{landing.finalCta.detail}</p>
      </div>
      <Link className={cn(homePrimaryButtonClassName, homeLargeButtonClassName)} href={appRoutes.register()}>
        {landing.actions.createTrip}
        <Icon name="plus" />
      </Link>
    </section>
  );
}

export function HomeLandingFooter({ landing }: { landing: HomeLandingCopy }) {
  return (
    <footer className={homeFooterClassName}>
      <div className={homeFooterBrandClassName}>
        <HomeBrand landing={landing} />
        <p className={homeFooterCopyClassName}>{landing.footer.copy}</p>
      </div>

      <div className={homeFooterLinksClassName}>
        <Link className={homeFooterLinkClassName} href={appRoutes.login()}>{landing.actions.login}</Link>
        <Link className={homeFooterLinkClassName} href={appRoutes.join()}>{landing.actions.tripAccess}</Link>
        <Link className={homeFooterLinkClassName} href={appRoutes.register()}>{landing.actions.createAccount}</Link>
        <a className={homeFooterLinkClassName} href="https://github.com/GLINCKER/thesvg" target="_blank" rel="noreferrer">
          <Image src="/icons/github-thesvg.svg" alt="" width={16} height={16} />
          {landing.footer.svgSource}
        </a>
      </div>
    </footer>
  );
}
