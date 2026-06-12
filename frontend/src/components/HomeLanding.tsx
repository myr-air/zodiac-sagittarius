"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageSwitch } from "@/src/i18n/LanguageSwitch";
import { useI18n } from "@/src/i18n/I18nProvider";
import { cn } from "@/src/lib/cn";
import { appRoutes } from "@/src/routes/app-routes";
import { Icon } from "./icons";

const workflowStepMeta = [
  {
    key: "invite",
    icon: "users",
    tone: "coral",
  },
  {
    key: "plan",
    icon: "list",
    tone: "sand",
  },
  {
    key: "travel",
    icon: "wallet",
    tone: "sky",
  },
] satisfies Array<{ key: "invite" | "plan" | "travel"; icon: "users" | "list" | "wallet"; tone: "coral" | "sand" | "sky" }>;

const previewDayKeys = ["first", "second", "third"] as const;
const checklistKeys = ["flights", "hotel", "cash", "packing"] as const;
const checkedChecklistKeys = new Set<(typeof checklistKeys)[number]>(["flights", "hotel", "cash"]);
const workflowToneClassNames = {
  coral: {
    number: "bg-(--color-primary) text-white shadow-[0_14px_24px_rgb(194_79_22_/_0.22)]",
    icon: "bg-(--color-primary-soft) text-(--color-primary-strong)",
  },
  sand: {
    number: "bg-[#d4cab0] text-[#4c4733] shadow-[0_14px_24px_rgb(97_92_71_/_0.18)]",
    icon: "bg-[#f5f3ed] text-[#7b745e]",
  },
  sky: {
    number: "bg-(--color-route) text-white shadow-[0_14px_24px_rgb(37_99_235_/_0.18)]",
    icon: "bg-(--color-route-soft) text-(--color-route)",
  },
} satisfies Record<(typeof workflowStepMeta)[number]["tone"], { number: string; icon: string }>;

const homeNavClassName =
  "home-nav mx-auto grid min-h-[82px] w-[min(100%_-_40px,1320px)] grid-cols-[minmax(0,1fr)_auto] items-center gap-6 max-[1120px]:grid-cols-[1fr_auto] max-[760px]:min-h-0 max-[760px]:w-[min(100%_-_28px,1320px)] max-[760px]:grid-cols-1 max-[760px]:gap-3.5 max-[760px]:py-[18px]";
const homeBrandClassName =
  "home-brand inline-flex w-fit items-center gap-[11px] justify-self-start whitespace-nowrap text-2xl font-[850] leading-none text-(--color-primary) no-underline max-[760px]:text-[21px]";
const homeBrandMarkClassName =
  "home-brand-mark grid size-[42px] place-items-center [&_svg]:size-10 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[2.4] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_path:last-child]:stroke-(--color-sunshine)";
const homeNavActionsClassName =
  "home-nav-actions flex items-center gap-3 max-[760px]:grid max-[760px]:grid-cols-[auto_minmax(86px,0.7fr)_minmax(132px,1fr)] max-[760px]:gap-2.5 max-[420px]:grid-cols-[auto_minmax(0,1fr)]";
const homeNavSecondaryActionsClassName = "home-nav-secondary-actions inline-flex items-center gap-2.5 max-[760px]:contents";
const homeLanguageSwitchClassName =
  "home-language-switch min-h-[42px] border-[color-mix(in_srgb,var(--color-primary)_36%,white)] bg-[rgb(255_255_255_/_0.86)] shadow-[0_10px_22px_rgb(194_79_22_/_0.08)] [&_.language-switch-option--active]:bg-(--color-primary) [&_.language-switch-option--active]:text-white";

const homePageClassName =
  "home-page min-h-screen overflow-hidden bg-[linear-gradient(180deg,rgb(255_255_255_/_0.88),rgb(255_247_237_/_0.42)_54%,rgb(239_246_255_/_0.24)),linear-gradient(90deg,rgb(37_99_235_/_0.06)_1px,transparent_1px),linear-gradient(0deg,rgb(37_99_235_/_0.055)_1px,transparent_1px),radial-gradient(720px_420px_at_13%_31%,rgb(194_79_22_/_0.15),transparent_72%),radial-gradient(620px_360px_at_86%_18%,rgb(251_113_133_/_0.13),transparent_70%),radial-gradient(760px_430px_at_74%_88%,rgb(250_204_21_/_0.12),transparent_72%),var(--paper-grain),var(--color-page)] [background-size:auto,112px_112px,112px_112px,auto,auto,auto,140px_140px,auto] max-[760px]:overflow-x-hidden";
const homeHeroClassName =
  "home-hero relative mx-auto grid min-h-[760px] w-[min(100%_-_40px,1320px)] grid-cols-[minmax(320px,0.82fr)_minmax(620px,1.18fr)] items-center gap-14 max-[1120px]:grid-cols-1 max-[1120px]:gap-5 max-[1120px]:pt-[34px] max-[760px]:min-h-0 max-[760px]:w-[min(100%_-_28px,1320px)] max-[760px]:pt-5";
const homeButtonBaseClassName =
  "inline-flex min-h-[42px] items-center justify-center rounded-(--radius-md) text-sm font-[780] leading-[18px] no-underline transition-[transform,border-color,background,color,box-shadow] duration-[180ms] ease-out active:translate-y-0 max-[760px]:w-full max-[760px]:px-3 max-[760px]:text-center [&_.icon]:size-[18px] [&_.icon]:shrink-0";
const homeLinkButtonClassName = cn(
  "home-link-button",
  homeButtonBaseClassName,
  "border border-[color-mix(in_srgb,var(--color-primary)_68%,white)] bg-[rgb(255_255_255_/_0.82)] px-[18px] text-(--color-primary-strong) hover:border-(--color-primary) hover:bg-(--color-primary-soft) hover:shadow-[0_12px_24px_rgb(194_79_22_/_0.1)]",
);
const homePrimaryButtonClassName = cn(
  "home-primary-button",
  homeButtonBaseClassName,
  "gap-2.5 border border-(--color-primary) bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-strong))] px-[18px] text-white shadow-[0_16px_28px_rgb(194_79_22_/_0.2)] hover:-translate-y-px hover:shadow-[0_18px_32px_rgb(194_79_22_/_0.24)]",
);
const homeSecondaryButtonClassName = cn(
  "home-secondary-button",
  homeButtonBaseClassName,
  "gap-3 border border-[color-mix(in_srgb,var(--color-route)_40%,white)] bg-[rgb(255_255_255_/_0.82)] px-6 text-(--color-route) hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:shadow-[0_12px_24px_rgb(37_99_235_/_0.1)]",
);
const homeLargeButtonClassName = "home-large-button min-h-14 px-[26px] max-[760px]:min-h-[50px]";

const homeHeroCopyClassName = "home-hero-copy relative z-[2] pb-11 max-[1120px]:pb-0";
const homeHeroRouteClassName =
  "home-hero-route pointer-events-none absolute left-0 top-[92px] z-0 h-[420px] w-full max-w-none overflow-visible max-[760px]:top-[236px] max-[760px]:h-[260px] [&_path]:fill-none [&_path]:[filter:drop-shadow(0_14px_18px_rgb(37_99_235_/_0.07))] [&_path]:[stroke-linecap:round] [&_path]:[stroke-width:3] [&_path]:[stroke:rgb(37_99_235_/_0.2)] max-[760px]:[&_path]:[stroke-width:2] max-[760px]:[&_path]:[stroke:rgb(37_99_235_/_0.16)]";
const homeTitleSceneClassName = "home-title-scene relative isolate";
const homeHeroTitleClassName =
  "home-hero-title relative z-[1] m-0 max-w-[610px] text-[44px] font-black leading-[1.16] text-[#102036] [text-wrap:balance] max-[1120px]:max-w-[700px] max-[760px]:text-[30px] max-[760px]:leading-[1.34] [&>span]:block";
const homeHeroDetailClassName =
  "home-hero-detail mt-[26px] mb-0 max-w-[560px] text-lg font-medium leading-8 text-(--color-text-muted) [text-wrap:pretty] max-[760px]:mt-[18px] max-[760px]:text-[15px] max-[760px]:leading-[26px]";
const homeHeroActionsClassName = "home-hero-actions mt-[34px] flex flex-wrap gap-[18px] max-[760px]:hidden";
const homeSocialProofClassName = "home-social-proof mt-12 flex items-center gap-[18px] max-[760px]:mt-7 max-[760px]:items-start";
const homeAvatarStackClassName =
  "home-avatar-stack flex [&>span]:-ml-2.5 [&>span]:grid [&>span]:size-11 [&>span]:place-items-center [&>span]:rounded-full [&>span]:border-[3px] [&>span]:border-white [&>span]:bg-(--color-postcard) [&>span]:text-xs [&>span]:font-[850] [&>span]:text-[#102036] [&>span]:shadow-[0_8px_20px_rgb(15_23_42_/_0.12)] [&>span:first-child]:ml-0 [&>span:first-child]:bg-(--color-primary-soft) [&>span:nth-child(2)]:bg-[#bfdbfe] [&>span:nth-child(3)]:bg-[#fed7aa] [&>span:last-child]:bg-(--color-primary) [&>span:last-child]:text-white";
const homeSocialProofTextClassName = "m-0 text-sm font-bold leading-[22px] text-(--color-text-muted)";

const homeProductPreviewClassName =
  "home-product-preview relative z-[1] scroll-mt-[18px] max-[1120px]:mb-[52px] max-[760px]:hidden";
const homePreviewShellClassName =
  "home-preview-shell min-w-0 overflow-hidden rounded-(--radius-lg) border border-[rgb(203_213_225_/_0.9)] bg-[rgb(255_255_255_/_0.96)] shadow-[0_24px_60px_rgb(15_23_42_/_0.18)]";
const homePreviewTopbarClassName =
  "home-preview-topbar flex min-h-[84px] items-center justify-between gap-[18px] border-b border-(--color-border) px-7 py-[22px] max-[760px]:min-h-0 max-[760px]:items-start max-[760px]:p-[18px] max-[420px]:grid";
const homePreviewTitleClassName = "m-0 block text-base font-[850] leading-[22px] text-(--color-text)";
const homePreviewMetaClassName = "mt-1 block text-[13px] font-bold text-(--color-text-subtle)";
const homePreviewFriendsClassName =
  "home-preview-friends flex items-center [&>em]:-ml-[7px] [&>em]:grid [&>em]:size-[34px] [&>em]:place-items-center [&>em]:rounded-full [&>em]:border-2 [&>em]:border-white [&>em]:bg-(--color-surface-muted) [&>em]:text-xs [&>em]:font-extrabold [&>em]:not-italic [&>em]:text-(--color-text-muted) [&>span]:-ml-[7px] [&>span]:block [&>span]:size-[34px] [&>span]:rounded-full [&>span]:border-2 [&>span]:border-white [&>span]:bg-[linear-gradient(135deg,#fed7aa,#fda4af)] [&>span:first-child]:ml-0 [&>span:nth-child(2)]:bg-[linear-gradient(135deg,#bfdbfe,#fed7aa)] [&>span:nth-child(3)]:bg-[linear-gradient(135deg,#fed7aa,#fde68a)]";
const homePreviewGridClassName = "home-preview-grid grid min-h-[492px] min-w-0 grid-cols-[168px_minmax(0,1fr)] max-[760px]:min-h-0 max-[760px]:grid-cols-1";
const homePreviewMenuClassName =
  "home-preview-menu grid min-w-0 content-start gap-2.5 border-r border-(--color-border) bg-[linear-gradient(180deg,rgb(248_250_252_/_0.9),rgb(255_255_255_/_0.74))] px-4 py-5 max-[760px]:w-full max-[760px]:max-w-full max-[760px]:grid-cols-2 max-[760px]:gap-2 max-[760px]:border-r-0 max-[760px]:border-b max-[760px]:border-(--color-border)";
const homePreviewMenuItemClassName =
  "flex min-h-[34px] items-center rounded-(--radius-md) px-3 text-xs font-[760] text-(--color-text-muted) max-[760px]:justify-center max-[760px]:text-center data-[active=true]:bg-(--color-primary-soft) data-[active=true]:text-(--color-primary-strong)";
const homePreviewMainClassName = "home-preview-main grid min-w-0 gap-[18px] p-6 max-[760px]:p-4";
const homeDayStripClassName =
  "home-day-strip grid min-w-0 grid-cols-3 gap-4 max-[760px]:w-full max-[760px]:max-w-full max-[760px]:grid-cols-2 max-[760px]:pb-1 max-[420px]:grid-cols-1";
const homeDayCardClassName =
  "home-day-card min-h-48 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-[13px] shadow-[0_12px_24px_rgb(15_23_42_/_0.045)] transition-[transform,box-shadow] duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgb(15_23_42_/_0.08)]";
const homeDayPillClassName =
  "inline-flex min-h-[22px] items-center rounded-(--radius-sm) bg-(--color-route-soft) px-[7px] text-[11px] font-[850] text-(--color-route)";
const homeDayTitleClassName = "mt-[9px] mb-0 text-[15px] font-[840] leading-5 text-(--color-text)";
const homeDayTextClassName = "mt-1 mb-0 text-[12.5px] font-semibold leading-[18px] text-(--color-text-muted)";
const homeDayImageClassName =
  "home-day-image relative mt-3 h-[86px] overflow-hidden rounded-(--radius-md) bg-[linear-gradient(180deg,rgb(255_255_255_/_0.16),rgb(15_23_42_/_0.12)),url('/landing/trip-card-strip.webp')] bg-[length:400%_100%]";
const homePreviewBottomClassName = "home-preview-bottom grid grid-cols-[minmax(0,1fr)_220px] gap-4 max-[760px]:grid-cols-1";
const homeMapCardClassName =
  "home-map-card min-h-[220px] overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-white shadow-[0_12px_24px_rgb(15_23_42_/_0.045)]";
const homeMapSvgClassName =
  "block h-full min-h-[220px] w-full bg-[linear-gradient(90deg,rgb(37_99_235_/_0.06)_1px,transparent_1px),linear-gradient(0deg,rgb(37_99_235_/_0.06)_1px,transparent_1px),#f8fbff] bg-[length:38px_38px] [&_circle]:fill-(--color-primary) [&_circle]:stroke-white [&_circle]:[stroke-width:4] [&_text]:fill-(--color-text) [&_text]:text-[13px] [&_text]:font-extrabold";
const homeMapWaterClassName = "home-map-water fill-[rgb(125_211_252_/_0.42)]";
const homeMapRouteClassName = "home-map-route fill-none stroke-(--color-sky) [stroke-linecap:round] [stroke-width:8]";
const homeChecklistCardClassName =
  "home-checklist-card grid min-w-0 content-start gap-[13px] rounded-(--radius-lg) border border-(--color-border) bg-white p-[18px] shadow-[0_12px_24px_rgb(15_23_42_/_0.045)]";
const homeChecklistHeaderClassName = "flex min-w-0 items-center justify-between gap-3.5";
const homeChecklistTitleClassName = "min-w-0 text-sm font-[850] leading-[18px] text-(--color-text)";
const homeChecklistProgressClassName = "shrink-0 whitespace-nowrap text-[11px] font-[750] leading-4 text-(--color-text-subtle)";
const homeChecklistMeterClassName = "home-checklist-meter h-2.5 w-full overflow-hidden rounded-full border-0";
const homeChecklistListClassName = "grid list-none gap-2.5 p-0 m-0";
const homeChecklistItemClassName = "home-checklist-item relative pl-6 text-[12.5px] leading-[19px]";

const homeWorkflowClassName =
  "home-workflow relative scroll-mt-[18px] bg-[linear-gradient(90deg,rgb(37_99_235_/_0.035)_1px,transparent_1px),linear-gradient(0deg,rgb(37_99_235_/_0.03)_1px,transparent_1px),linear-gradient(180deg,rgb(255_255_255_/_0.94),rgb(255_255_255_/_0.9))] bg-[length:72px_72px,72px_72px,auto] px-5 pt-[76px] pb-[86px] text-center max-[760px]:px-3.5 max-[760px]:pt-[54px] max-[760px]:pb-16";
const homeWorkflowTitleClassName = "m-0 text-[42px] font-black leading-[52px] text-(--color-text) [text-wrap:balance] max-[760px]:text-[30px] max-[760px]:leading-[38px]";
const homeWorkflowHighlightClassName = "home-workflow-highlight relative inline-block text-(--color-primary-strong)";
const homeWorkflowDetailClassName = "mx-auto mt-5 mb-0 text-xl font-[450] leading-8 text-(--color-text-muted) max-[760px]:text-base max-[760px]:leading-[26px]";
const homeWorkflowGridClassName = "home-workflow-grid mx-auto mt-[92px] grid w-[min(100%,1320px)] grid-cols-3 gap-[72px] max-[760px]:mt-[42px] max-[760px]:grid-cols-1 max-[760px]:gap-3.5";
const homeWorkflowItemClassName =
  "home-workflow-item relative grid min-h-[486px] content-center justify-items-center gap-7 rounded-(--radius-lg) border border-(--color-border) bg-[rgb(255_255_255_/_0.95)] px-12 pt-[72px] pb-14 text-center shadow-[0_14px_28px_rgb(15_23_42_/_0.06),inset_0_1px_0_rgb(255_255_255_/_0.86)] transition-[transform,box-shadow] duration-[180ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgb(15_23_42_/_0.08),inset_0_1px_0_rgb(255_255_255_/_0.86)] max-[760px]:min-h-0 max-[760px]:grid-cols-[44px_minmax(0,1fr)] max-[760px]:grid-rows-[auto_auto] max-[760px]:items-center max-[760px]:justify-items-start max-[760px]:gap-x-4 max-[760px]:gap-y-2 max-[760px]:px-5 max-[760px]:py-5 max-[760px]:text-left";
const homeWorkflowNumberClassName =
  "home-workflow-number absolute left-1/2 top-[46px] grid size-[66px] -translate-x-1/2 place-items-center rounded-full text-[26px] font-black max-[760px]:static max-[760px]:col-start-1 max-[760px]:row-span-2 max-[760px]:size-11 max-[760px]:translate-x-0 max-[760px]:text-lg";
const homeWorkflowIconClassName =
  "home-workflow-icon mt-[88px] grid size-28 place-items-center rounded-full max-[760px]:hidden [&_.icon]:size-[42px] [&_.icon]:stroke-[1.8]";
const homeWorkflowItemTitleClassName = "m-0 text-[30px] font-black leading-[38px] text-(--color-text) max-[760px]:text-2xl max-[760px]:leading-8";
const homeWorkflowItemTextClassName = "m-0 text-xl font-[450] leading-[34px] text-(--color-text-muted) max-[760px]:text-base max-[760px]:leading-[26px]";

const homeFeatureBandClassName =
  "home-feature-band mx-auto mb-[84px] mt-[54px] grid w-[min(100%_-_40px,1120px)] grid-cols-[minmax(0,1fr)_auto] items-center gap-6 rounded-(--radius-lg) border border-(--color-primary-border) bg-[var(--watercolor-surface-wash),rgb(255_255_255_/_0.92)] p-8 shadow-[var(--shadow-panel)] max-[760px]:mt-[34px] max-[760px]:w-[min(100%_-_28px,1120px)] max-[760px]:grid-cols-1 max-[760px]:p-6 max-[760px]:[&_.home-primary-button]:w-full";
const homeFeatureTitleClassName = "m-0 text-[30px] font-black leading-10 text-(--color-text) max-[760px]:text-2xl max-[760px]:leading-8";
const homeFeatureTextClassName = "mx-auto mt-2 ml-0 max-w-[760px] text-base font-[550] leading-[26px] text-(--color-text-muted)";
const homeFooterClassName =
  "home-footer mx-auto grid w-[min(100%_-_40px,1120px)] grid-cols-[minmax(0,1fr)_auto] items-center gap-6 border-t border-(--color-border) pt-7 pb-[38px] max-[760px]:w-[min(100%_-_28px,1120px)] max-[760px]:grid-cols-1 max-[760px]:items-start";
const homeFooterBrandClassName = "home-footer-brand grid gap-2.5";
const homeFooterCopyClassName = "m-0 max-w-[560px] text-sm font-[550] leading-[22px] text-(--color-text-muted)";
const homeFooterLinksClassName = "home-footer-links flex flex-wrap justify-end gap-2.5 max-[760px]:justify-start";
const homeFooterLinkClassName =
  "inline-flex min-h-9 items-center gap-2 rounded-(--radius-md) border border-(--color-border) bg-[rgb(255_255_255_/_0.74)] px-3 text-[13px] font-[760] text-(--color-text-muted) transition-[border-color,color,background] duration-[180ms] ease-out hover:border-(--color-primary-border) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) [&_img]:size-4 [&_img]:shrink-0";

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
          <Link className={cn(homePrimaryButtonClassName, "max-[420px]:col-span-full")} href="/join">
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
            <Link className={cn(homeSecondaryButtonClassName, homeLargeButtonClassName)} href="/join">
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
          <Link className={homeFooterLinkClassName} href="/join">{landing.actions.tripAccess}</Link>
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
