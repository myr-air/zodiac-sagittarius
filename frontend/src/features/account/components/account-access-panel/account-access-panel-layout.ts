import { cn } from "@/src/lib/cn";
import { accountStepSummaryClassName, buildAccountAuthCardClassName } from "./account-email-login-styles";

export const accountAvatarClassName = "person-avatar grid size-[30px] place-items-center rounded-full text-xs font-extrabold text-white";
export const accountToastStackClassName =
  "account-toast-stack pointer-events-none fixed bottom-6 right-[clamp(18px,4vw,44px)] z-[50] grid w-[min(420px,calc(100vw_-_40px))] gap-2.5 max-[767px]:inset-x-[18px] max-[767px]:bottom-5 max-[767px]:w-auto [&_.account-success]:pointer-events-auto [&_.account-success]:min-h-12 [&_.account-success]:w-full [&_.account-success]:justify-start [&_.account-success]:rounded-(--radius-lg) [&_.account-success]:bg-(--color-success-soft) [&_.account-success]:shadow-[0_10px_22px_rgb(15_23_42_/_0.1)] [&_.join-alert]:pointer-events-auto [&_.join-alert]:min-h-12 [&_.join-alert]:w-full [&_.join-alert]:justify-start [&_.join-alert]:rounded-(--radius-lg) [&_.join-alert]:bg-(--color-danger-soft) [&_.join-alert]:shadow-[0_10px_22px_rgb(15_23_42_/_0.1)] [&>*]:account-toast-item";
export const accountPageClassName =
  "account-page min-h-screen bg-[var(--paper-grain),var(--watercolor-page-wash),var(--color-page)] p-7";
export const accountEntryPageClassName =
  "account-page--entry grid min-h-[100dvh] items-start overflow-x-clip bg-(--color-page) p-[clamp(18px,4vw,44px)] min-[1100px]:items-center max-[767px]:p-0";
export const accountTripAccessPageClassName =
  "account-page--trip-access grid items-center overflow-x-clip bg-(--color-page) p-[clamp(18px,4vw,42px)] max-[767px]:items-start max-[767px]:p-3.5";
export const accountPortalPageClassName = "account-page--portal overflow-x-clip pt-[18px] max-[767px]:p-3.5";
export const accountPortalNewTripPageClassName =
  "account-page--portal-new-trip !bg-(--color-page) !pt-3.5 max-[767px]:!p-2.5 [&_.account-dashboard]:!block [&_.account-hero]:hidden [&_.portal-content]:!block [&_.portal-content]:!min-h-0 [&_.portal-nav]:hidden";
export const accountShellClassName = "account-shell relative mx-auto grid w-[min(100%,1180px)] gap-4 [&>*]:relative";
export const accountPortalShellClassName = "gap-3.5";
export const accountPortalNewTripShellClassName = "!w-[min(100%,1488px)] !gap-0 max-[767px]:!w-full";
export const accountTripAccessShellClassName = "w-[min(100%,1120px)]";
export const accountEntryShellClassName =
  "account-shell--entry relative !w-[min(100%,520px)] grid-cols-1 grid-rows-[auto_auto] items-start gap-3.5 min-[1100px]:!w-[min(100%,1240px)] min-[1100px]:grid-cols-[minmax(560px,1.04fr)_minmax(380px,0.96fr)] min-[1100px]:grid-rows-[auto_auto_1fr] min-[1100px]:items-center min-[1100px]:gap-x-7 max-[767px]:!w-full max-[767px]:gap-0";
export const tripAccessLanguageSwitchClassName =
  "trip-access-language-switch !right-4 !top-4 !z-[5] !m-0 !w-fit !bg-(--color-surface) !shadow-[0_8px_18px_rgb(15_23_42_/_0.06)] max-[767px]:!right-[26px] max-[767px]:!top-[26px]";
export const backHomeButtonClassName =
  "back-home-button inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] px-3 py-1.5 text-[0.78rem] font-[850] text-(--color-text-muted) no-underline transition-all duration-150 hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) hover:border-(--color-primary-border) hover:shadow-[0_8px_18px_rgb(194_79_22_/_0.08)] focus-visible:bg-(--color-route-soft) focus-visible:text-(--color-route) focus-visible:border-(--color-route-border)";
export const accountEntryBackHomeClassName =
  "account-entry-back-home !absolute !left-11 !top-11 !z-[2] !m-0 !w-fit !bg-(--color-surface) !shadow-[0_8px_18px_rgb(15_23_42_/_0.06)] max-[767px]:!left-[18px] max-[767px]:!top-[18px]";
export const tripAccessBackHomeClassName =
  "trip-access-back-home !absolute !left-4 !top-4 !z-[5] !m-0 !w-fit !bg-(--color-surface) !shadow-[0_8px_18px_rgb(15_23_42_/_0.06)] max-[767px]:!left-[26px] max-[767px]:!top-[26px]";
export const accountHeroClassName =
  "account-hero relative grid grid-cols-[52px_minmax(0,1fr)] items-start gap-3.5 overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-[18px] shadow-[var(--shadow-soft)] [.account-shell--entry_&]:col-start-1 [.account-shell--entry_&]:row-span-3 [.account-shell--entry_&]:row-start-1 [.account-shell--entry_&]:min-h-[clamp(560px,76vh,680px)] [.account-shell--entry_&]:grid-rows-[auto_auto_1fr] [.account-shell--entry_&]:content-between [.account-shell--entry_&]:overflow-visible [.account-shell--entry_&]:border-transparent [.account-shell--entry_&]:bg-transparent [.account-shell--entry_&]:p-[clamp(44px,6vw,64px)] [.account-shell--entry_&]:shadow-none max-[767px]:[.account-shell--entry_&]:col-start-1 max-[767px]:[.account-shell--entry_&]:row-start-2 max-[767px]:[.account-shell--entry_&]:min-h-0 max-[767px]:[.account-shell--entry_&]:grid-cols-[52px_minmax(0,1fr)] max-[767px]:[.account-shell--entry_&]:gap-3.5 max-[767px]:[.account-shell--entry_&]:overflow-hidden max-[767px]:[.account-shell--entry_&]:p-5 max-[767px]:[.account-shell--entry_&]:pt-5 max-[767px]:[.account-shell--entry_&]:hidden [.account-shell--entry_&>*]:z-[1] [.account-shell--entry_&>div>p:not(.join-eyebrow):not(.account-entry-brand-tagline)]:max-w-[330px] max-[767px]:[.account-shell--entry_&>div>p:not(.join-eyebrow):not(.account-entry-brand-tagline)]:max-w-none max-[767px]:[.account-shell--entry_&>div>p:not(.join-eyebrow):not(.account-entry-brand-tagline)]:text-[13px] max-[767px]:[.account-shell--entry_&>div>p:not(.join-eyebrow):not(.account-entry-brand-tagline)]:leading-5 [&_h1]:m-0 [&_h1]:text-3xl [&_h1]:leading-[38px] [&_h1]:text-(--color-text) [.account-shell--entry_&_.join-mark]:absolute [.account-shell--entry_&_.join-mark]:left-11 [.account-shell--entry_&_.join-mark]:top-[108px] max-[767px]:[.account-shell--entry_&_.join-mark]:relative max-[767px]:[.account-shell--entry_&_.join-mark]:inset-auto [.account-shell--entry_&_.join-mark+div]:absolute [.account-shell--entry_&_.join-mark+div]:left-[116px] [.account-shell--entry_&_.join-mark+div]:top-[118px] [.account-shell--entry_&_.join-mark+div]:w-[400px] max-[767px]:[.account-shell--entry_&_.join-mark+div]:relative max-[767px]:[.account-shell--entry_&_.join-mark+div]:inset-auto max-[767px]:[.account-shell--entry_&_.join-mark+div]:w-auto [.account-shell--entry_&_.account-travel-collage]:absolute [.account-shell--entry_&_.account-travel-collage]:col-span-full [.account-shell--entry_&_.account-travel-collage]:row-span-full [.account-shell--entry_&_.account-travel-collage]:right-[clamp(-70px,-5vw,-52px)] [.account-shell--entry_&_.account-travel-collage]:top-[118px] [.account-shell--entry_&_.account-travel-collage]:z-[1] [.account-shell--entry_&_.account-travel-collage]:h-[590px] [.account-shell--entry_&_.account-travel-collage]:w-[330px] [.account-shell--entry_&_.account-travel-collage]:pointer-events-none max-[767px]:[.account-shell--entry_&_.account-travel-collage]:hidden [.account-shell--entry_&_h1]:mt-7 [.account-shell--entry_&_h1]:max-w-[400px] [.account-shell--entry_&_h1]:text-[clamp(40px,3.6vw,52px)] [.account-shell--entry_&_h1]:leading-[1.08] max-[767px]:[.account-shell--entry_&_h1]:mt-2 max-[767px]:[.account-shell--entry_&_h1]:max-w-none max-[767px]:[.account-shell--entry_&_h1]:text-3xl max-[767px]:[.account-shell--entry_&_h1]:leading-[34px] [&_p:not(.join-eyebrow)]:mt-1 [&_p:not(.join-eyebrow)]:mb-0 [&_p:not(.join-eyebrow)]:max-w-[720px] [&_p:not(.join-eyebrow)]:text-sm [&_p:not(.join-eyebrow)]:leading-[22px] [&_p:not(.join-eyebrow)]:text-(--color-text-muted)";
export const accountPortalHeroClassName =
  "grid-cols-[40px_minmax(0,1fr)_auto] !items-center px-3.5 py-3 max-[767px]:grid-cols-[36px_minmax(0,1fr)_auto] max-[767px]:p-3 [&_.join-eyebrow]:hidden [&_h1]:!text-[22px] [&_h1]:!leading-7 [&_p:not(.join-eyebrow)]:hidden";
export const accountPortalHeroMarkClassName = "!size-10 max-[767px]:!size-9";
export const accountPortalLanguageSwitchClassName =
  "col-start-3 row-start-1 !m-0 self-center justify-self-end max-[767px]:[&_.language-switch-option]:min-w-[34px]";
export const accountHeroMarkClassName = "join-mark account-hero-mark grid size-[52px] place-items-center rounded-(--radius-md) bg-(--color-primary) text-white [&_.icon]:size-6";
export const accountHeroEyebrowClassName = "join-eyebrow mb-0.5 mt-0 text-xs font-extrabold uppercase tracking-normal text-(--color-primary-strong)";
export const accountEntryBrandTaglineClassName =
  "account-entry-brand-tagline m-0 text-[13px] font-bold leading-[18px] text-(--color-primary-strong)";
export const accountCardClassName =
  "account-card grid gap-3.5 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-4 shadow-[var(--shadow-soft)]";
export const portalLoadingCardClassName = cn(accountCardClassName, "portal-loading-card col-span-2 min-h-[220px] max-[767px]:col-auto");
export const accountModeTabsClassName =
  "account-mode-tabs inline-grid w-[min(100%,420px)] grid-cols-2 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-1";
export const accountTabClassName =
  "account-tab inline-flex min-h-[42px] items-center justify-center gap-2 rounded-(--radius-md) border-0 bg-transparent font-extrabold text-(--color-text-muted) transition-[background,color] duration-[180ms] ease-out";
export const accountTabActiveClassName = "account-tab--active bg-(--color-primary-soft) text-(--color-primary-strong)";
export const accountDashboardClassName = "account-dashboard grid grid-cols-[220px_minmax(0,1fr)] items-start gap-3.5 max-[767px]:grid-cols-1";
export const portalContentClassName = "portal-content grid min-h-[460px] grid-cols-2 items-start gap-2.5 max-[767px]:min-h-[520px] max-[767px]:grid-cols-1";
export const portalProfileCardClassName = cn(accountCardClassName, "account-profile-card col-span-2 max-[767px]:col-auto");
export const portalHistoryCardClassName = cn(accountCardClassName, "account-history col-span-2 max-[767px]:col-auto");
export const portalNewTripCardClassName =
  "portal-new-trip-card !gap-[18px] !min-h-[calc(100vh-28px)] !overflow-visible !rounded-[16px] !border !border-[rgb(226_232_240_/_0.72)] !bg-[#ffffff] !p-[18px] !shadow-[0_12px_28px_rgb(15_23_42_/_0.07)] max-[767px]:!min-h-[calc(100vh-20px)] max-[767px]:!rounded-none max-[767px]:!border-0 max-[767px]:!p-0 max-[767px]:!shadow-none";
export const tripBuilderTopbarClassName =
  "trip-builder-topbar grid grid-cols-[132px_minmax(0,1fr)_auto] items-center gap-7 pb-[18px] max-[767px]:grid-cols-[1fr_auto] max-[767px]:gap-2.5 [&>.badge]:mt-2 [&>.badge]:justify-self-end [&>.button]:min-h-[58px] [&>.button]:rounded-[9px] [&>.button]:bg-[rgb(255_255_255_/_0.88)] [&>.button]:shadow-[0_8px_24px_rgb(15_23_42_/_0.04)] max-[767px]:[&>.button]:w-auto max-[767px]:[&>.button]:min-w-[118px] [&>.trip-builder-title]:grid [&>.trip-builder-title]:min-w-0 [&>.trip-builder-title]:justify-self-start [&>.trip-builder-title]:gap-0.5 [&>.trip-builder-title]:text-left max-[767px]:[&>.trip-builder-title]:col-span-full [&>.trip-builder-title>span]:hidden [&>.trip-builder-title>strong]:inline-flex [&>.trip-builder-title>strong]:items-center [&>.trip-builder-title>strong]:gap-2.5 [&>.trip-builder-title>strong]:text-[30px] [&>.trip-builder-title>strong]:leading-[34px] [&>.trip-builder-title>strong]:text-(--color-text) max-[767px]:[&>.trip-builder-title>strong]:text-[28px] max-[767px]:[&>.trip-builder-title>strong]:leading-8 [&>.trip-builder-title>small]:mt-2 [&>.trip-builder-title>small]:block [&>.trip-builder-title>small]:max-w-[420px] [&>.trip-builder-title>small]:text-[13px] [&>.trip-builder-title>small]:font-[650] [&>.trip-builder-title>small]:leading-[18px] [&>.trip-builder-title>small]:text-(--color-text-muted) max-[767px]:[&>.trip-builder-title>small]:max-w-[260px] max-[767px]:[&>.trip-builder-title>small]:text-[11px]";
export const portalFeatureCardClassName = cn(accountCardClassName, "portal-feature-card col-span-2 max-[767px]:col-auto");
export const portalSettingsCardClassName = cn(accountCardClassName, "account-settings-card col-span-2 max-[767px]:col-auto");
export const accountStatGridClassName = "account-stat-grid grid grid-cols-2 gap-2.5 max-[767px]:grid-cols-1";
export const accountSettingsGridClassName = "account-settings-grid grid grid-cols-2 gap-2.5";
export const portalSectionToplineClassName =
  "portal-section-topline flex min-w-0 items-start justify-between gap-3 max-[767px]:flex-wrap [&_.account-panel-heading]:flex-auto [&>.button]:max-[767px]:w-full [&>button]:max-[767px]:w-full";
export const accountProfileRowClassName =
  "account-profile-row flex min-w-0 items-center gap-3 max-[767px]:flex-wrap max-[767px]:items-start [&>.badge]:ml-auto max-[767px]:[&>.badge]:ml-0 [&>div]:max-[767px]:min-w-0 [&_span]:text-[13px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) max-[767px]:[&_span]:[overflow-wrap:anywhere] [&_strong]:block [&_strong]:text-(--color-text)";
export const accountEmptyClassName = "account-empty text-[13px] leading-5 text-(--color-text-muted)";
export const settingsProfilePreviewClassName = "settings-profile-preview grid grid-cols-[46px_minmax(0,1fr)] items-center gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface-subtle) p-3.5 [&_span]:block [&_span]:text-[13px] [&_span]:leading-5 [&_span]:text-(--color-text-muted) [&_strong]:block [&_strong]:text-(--color-text)";
export const accountDeviceListClassName = "account-device-list grid gap-2";
export const accountDeviceRowClassName =
  "account-device-row flex min-w-0 items-center justify-between gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 max-[767px]:flex-wrap max-[767px]:items-start [&>.button]:w-auto [&>.button]:min-w-[124px] [&>.button]:shrink-0 max-[767px]:[&>.button]:w-full [&>div]:max-[767px]:min-w-0 [&_span]:block [&_span]:text-xs [&_span]:leading-[18px] [&_span]:text-(--color-text-muted) max-[767px]:[&_span]:[overflow-wrap:anywhere] [&_strong]:block";
export const accountFormClassName =
  "account-form [&_input]:min-h-[46px] [&_input]:w-full [&_input]:rounded-(--radius-md) [&_input]:border [&_input]:border-(--color-border-strong) [&_input]:bg-(--color-surface) [&_input]:px-3 [&_input]:text-(--color-text) [&_input]:transition-[border-color,box-shadow,background] [&_input]:duration-[180ms] [&_input]:ease-out [&_input:focus]:border-(--color-route-border) [&_input:focus]:shadow-[0_0_0_4px_rgb(191_219_254_/_0.45)] [&_input:hover]:border-[color-mix(in_srgb,var(--color-primary)_36%,var(--color-border-strong))] [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[13px] [&_label]:font-bold [&_label]:text-(--color-text-muted) [&_select]:min-h-[46px] [&_select]:w-full [&_select]:rounded-(--radius-md) [&_select]:border [&_select]:border-(--color-border-strong) [&_select]:bg-(--color-surface) [&_select]:px-3 [&_select]:text-(--color-text) [&_select]:transition-[border-color,box-shadow,background] [&_select]:duration-[180ms] [&_select]:ease-out [&_select:focus]:border-(--color-route-border) [&_select:focus]:shadow-[0_0_0_4px_rgb(191_219_254_/_0.45)] [&_select:hover]:border-[color-mix(in_srgb,var(--color-primary)_36%,var(--color-border-strong))]";
export const accountTwoColClassName =
  "account-two-col grid grid-cols-2 gap-2.5 max-[767px]:grid-cols-1 [&_label]:grid [&_label]:gap-1.5 [&_label]:text-[13px] [&_label]:font-bold [&_label]:text-(--color-text-muted)";
export const accountSettingsFormClassName = cn(accountFormClassName, "account-settings-form grid gap-3");
export const accountAuthCardClassName = buildAccountAuthCardClassName(accountCardClassName, accountFormClassName);

export const accountPortalDashboardClassNames = {
  avatar: accountAvatarClassName,
  dashboard: accountDashboardClassName,
  deviceList: accountDeviceListClassName,
  deviceRow: accountDeviceRowClassName,
  empty: accountEmptyClassName,
  featureCard: portalFeatureCardClassName,
  historyCard: portalHistoryCardClassName,
  newTripCard: portalNewTripCardClassName,
  portalContent: portalContentClassName,
  profileCard: portalProfileCardClassName,
  profileRow: accountProfileRowClassName,
  sectionTopline: portalSectionToplineClassName,
  settingsCard: portalSettingsCardClassName,
  settingsForm: accountSettingsFormClassName,
  settingsGrid: accountSettingsGridClassName,
  settingsProfilePreview: settingsProfilePreviewClassName,
  statGrid: accountStatGridClassName,
  stepSummary: accountStepSummaryClassName,
  tripBuilderTopbar: tripBuilderTopbarClassName,
  twoCol: accountTwoColClassName,
};
