"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { appRoutes } from "@/src/trip/workspace/sagittarius-app/support";
import { Icon } from "@/src/ui/icons";
import {
  checkedChecklistKeys,
  checklistKeys,
  previewDayKeys,
  workflowStepMeta,
} from "./HomeLanding.meta";
import {
  homeAvatarStackClassName,
  homeBrandClassName,
  homeBrandMarkClassName,
  homeChecklistCardClassName,
  homeChecklistHeaderClassName,
  homeChecklistItemClassName,
  homeChecklistListClassName,
  homeChecklistMeterClassName,
  homeChecklistProgressClassName,
  homeChecklistTitleClassName,
  homeDayCardClassName,
  homeDayImageClassName,
  homeDayPillClassName,
  homeDayStripClassName,
  homeDayTextClassName,
  homeDayTitleClassName,
  homeFeatureBandClassName,
  homeFeatureTextClassName,
  homeFeatureTitleClassName,
  homeFooterBrandClassName,
  homeFooterClassName,
  homeFooterCopyClassName,
  homeFooterLinkClassName,
  homeFooterLinksClassName,
  homeHeroActionsClassName,
  homeHeroClassName,
  homeHeroCopyClassName,
  homeHeroDetailClassName,
  homeHeroRouteClassName,
  homeHeroTitleClassName,
  homeLanguageSwitchClassName,
  homeLargeButtonClassName,
  homeLinkButtonClassName,
  homeMapCardClassName,
  homeMapRouteClassName,
  homeMapSvgClassName,
  homeMapWaterClassName,
  homeNavActionsClassName,
  homeNavClassName,
  homeNavSecondaryActionsClassName,
  homePageClassName,
  homePreviewBottomClassName,
  homePreviewFriendsClassName,
  homePreviewGridClassName,
  homePreviewMainClassName,
  homePreviewMenuClassName,
  homePreviewMenuItemClassName,
  homePreviewMetaClassName,
  homePreviewShellClassName,
  homePreviewTitleClassName,
  homePreviewTopbarClassName,
  homePrimaryButtonClassName,
  homeProductPreviewClassName,
  homeSecondaryButtonClassName,
  homeSocialProofClassName,
  homeSocialProofTextClassName,
  homeTitleSceneClassName,
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

export function HomeLanding() {
  const { t } = useI18n();
  const landing = t.homeLanding;

  return (
    <main className={homePageClassName} aria-labelledby="home-title">
      <nav className={homeNavClassName} aria-label={landing.navLabel}>
        <Link className={homeBrandClassName} href="/" aria-label={landing.brandHomeLabel}>
          <span className={homeBrandMarkClassName} aria-hidden="true">
            <svg viewBox="0 0 48 48">
              <path d="M13 35 35 13M22 13h13v13" />
              <path d="M12 18c8 2 16 8 18 18" />
            </svg>
          </span>
          Joii
        </Link>

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

      <section className={homeHeroClassName} aria-labelledby="home-title">
        <svg className={homeHeroRouteClassName} viewBox="0 0 1440 420" aria-hidden="true" focusable="false">
          <path d="M-48 260C170 132 364 116 548 178C738 242 876 244 1038 182C1168 132 1306 88 1488 76" />
        </svg>
        <div className={homeHeroCopyClassName}>
          <div className={homeTitleSceneClassName}>
            <h1 className={homeHeroTitleClassName} id="home-title">
              <span>{landing.hero.titleLines.first}</span>
              {" "}
              <span>{landing.hero.titleLines.second}</span>
            </h1>
          </div>
          <p className={homeHeroDetailClassName}>{landing.hero.detail}</p>

          <div className={homeHeroActionsClassName}>
            <Link className={cn(homePrimaryButtonClassName, homeLargeButtonClassName)} href={appRoutes.register()}>
              {landing.actions.startPlanning}
              <Icon name="route" />
            </Link>
            <Link className={cn(homeSecondaryButtonClassName, homeLargeButtonClassName)} href={appRoutes.join()}>
              {landing.actions.joinTrip}
              <Icon name="key" />
            </Link>
          </div>

          <div className={homeSocialProofClassName} aria-label={landing.hero.socialLabel}>
            <div className={homeAvatarStackClassName} aria-hidden="true">
              <span>MA</span>
              <span>NO</span>
              <span>BE</span>
              <span>+8</span>
            </div>
            <p className={homeSocialProofTextClassName}>{landing.hero.socialProof}</p>
          </div>
        </div>

        <div className={homeProductPreviewClassName} id="features" aria-label={landing.preview.label}>
          <div className={homePreviewShellClassName}>
            <div className={homePreviewTopbarClassName}>
              <div>
                <p className={homePreviewTitleClassName}>{landing.preview.tripTitle}</p>
                <strong className={homePreviewMetaClassName}>{landing.preview.tripMeta}</strong>
              </div>
              <div className={homePreviewFriendsClassName} aria-hidden="true">
                <span />
                <span />
                <span />
                <em>+2</em>
              </div>
            </div>

            <div className={homePreviewGridClassName}>
              <div className={homePreviewMenuClassName} aria-label={landing.preview.sectionsLabel} role="list">
                <span className={homePreviewMenuItemClassName} data-active="true" role="listitem">{landing.preview.sections.overview}</span>
                <span className={homePreviewMenuItemClassName} role="listitem">{landing.preview.sections.itinerary}</span>
                <span className={homePreviewMenuItemClassName} role="listitem">{landing.preview.sections.map}</span>
                <span className={homePreviewMenuItemClassName} role="listitem">{landing.preview.sections.budget}</span>
                <span className={homePreviewMenuItemClassName} role="listitem">{landing.preview.sections.checklist}</span>
              </div>

              <div className={homePreviewMainClassName}>
                <div className={homeDayStripClassName}>
                  {previewDayKeys.map((dayKey, artIndex) => (
                    <article className={homeDayCardClassName} key={dayKey}>
                      <span className={homeDayPillClassName}>{landing.preview.days[dayKey].day}</span>
                      <h2 className={homeDayTitleClassName}>{landing.preview.days[dayKey].title}</h2>
                      <p className={homeDayTextClassName}>{landing.preview.days[dayKey].detail}</p>
                      <div
                        className={homeDayImageClassName}
                        style={{ backgroundPosition: `${artIndex * 33.333}% 50%` }}
                        aria-hidden="true"
                      />
                    </article>
                  ))}
                </div>

                <div className={homePreviewBottomClassName}>
                  <div className={homeMapCardClassName} aria-label={landing.preview.mapLabel}>
                    <svg className={homeMapSvgClassName} viewBox="0 0 420 220" role="img" aria-label={landing.preview.mapAria}>
                      <path className={homeMapWaterClassName} d="M280 0h140v220H244c52-42 64-83 36-132-13-23-13-52 0-88Z" />
                      <path className={homeMapRouteClassName} d="M62 158C122 92 170 77 223 113s84 29 132-20" />
                      <circle cx="62" cy="158" r="12" />
                      <circle cx="223" cy="113" r="12" />
                      <circle cx="355" cy="93" r="12" />
                      <text x="32" y="192">{landing.preview.mapStops.tokyo}</text>
                      <text x="188" y="146">{landing.preview.mapStops.yokohama}</text>
                      <text x="314" y="126">{landing.preview.mapStops.kamakura}</text>
                    </svg>
                  </div>

                  <div className={homeChecklistCardClassName}>
                    <div className={homeChecklistHeaderClassName}>
                      <strong className={homeChecklistTitleClassName}>{landing.preview.sections.checklist}</strong>
                      <span className={homeChecklistProgressClassName}>{landing.preview.checklistProgress}</span>
                    </div>
                    <meter className={homeChecklistMeterClassName} min="0" max="100" value="75">
                      75%
                    </meter>
                    <ul className={homeChecklistListClassName}>
                      {checklistKeys.map((itemKey) => (
                        <li
                          className={cn(
                            homeChecklistItemClassName,
                            checkedChecklistKeys.has(itemKey)
                              ? "line-through text-(--color-text-subtle) font-medium"
                              : "text-(--color-text) font-bold",
                          )}
                          data-checked={checkedChecklistKeys.has(itemKey) ? "true" : "false"}
                          key={itemKey}
                        >
                          {landing.preview.checklistItems[itemKey]}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <footer className={homeFooterClassName}>
        <div className={homeFooterBrandClassName}>
          <Link className={homeBrandClassName} href="/" aria-label={landing.brandHomeLabel}>
            <span className={homeBrandMarkClassName} aria-hidden="true">
              <svg viewBox="0 0 48 48">
                <path d="M13 35 35 13M22 13h13v13" />
                <path d="M12 18c8 2 16 8 18 18" />
              </svg>
            </span>
            Joii
          </Link>
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
    </main>
  );
}
