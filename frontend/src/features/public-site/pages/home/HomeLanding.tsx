"use client";

import Link from "next/link";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { appRoutes } from "@/src/routes/app-routes";
import { Icon } from "@/src/ui/icons";
import { HomeLandingPreview } from "./HomeLandingPreview";
import { HomeFinalCta, HomeLandingFooter, HomeLandingNav, HomeWorkflowSection } from "./HomeLandingSections";
import {
  homeAvatarStackClassName,
  homeHeroActionsClassName,
  homeHeroClassName,
  homeHeroCopyClassName,
  homeHeroDetailClassName,
  homeHeroRouteClassName,
  homeHeroTitleClassName,
  homeLargeButtonClassName,
  homePageClassName,
  homePrimaryButtonClassName,
  homeSecondaryButtonClassName,
  homeSocialProofClassName,
  homeSocialProofTextClassName,
  homeTitleSceneClassName,
} from "./HomeLanding.styles";

export function HomeLanding() {
  const { t } = useI18n();
  const landing = t.homeLanding;

  return (
    <main className={homePageClassName} aria-labelledby="home-title">
      <HomeLandingNav landing={landing} />

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

        <HomeLandingPreview landing={landing} />
      </section>

      <HomeWorkflowSection landing={landing} />
      <HomeFinalCta landing={landing} />
      <HomeLandingFooter landing={landing} />
    </main>
  );
}
