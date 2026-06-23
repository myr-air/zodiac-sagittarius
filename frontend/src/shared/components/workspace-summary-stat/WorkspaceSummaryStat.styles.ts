import { workspaceResponsivePanelResetClassName } from "@/src/shared/components/workspace-surface";

export const workspaceSummaryGridFourClassName =
  "grid grid-cols-4 gap-3 max-[1199px]:grid-cols-2 max-[1199px]:gap-0 max-[767px]:grid-cols-1";

export const workspaceSummaryGridFiveClassName =
  "grid w-full grid-cols-5 gap-3 max-[1199px]:grid-cols-3 max-[1199px]:gap-0 max-[767px]:grid-cols-1";

const workspaceSummaryStatBaseClassName =
  `grid rounded-(--radius-md) p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] ${workspaceResponsivePanelResetClassName} [&_.icon]:text-(--color-primary) [&>span]:text-xs [&>span]:font-bold [&>span]:text-(--color-text-muted) [&>strong]:text-(--color-text)`;

export const workspaceSummaryStatSurfaceClassName =
  `${workspaceSummaryStatBaseClassName} min-h-[86px] gap-1 border border-(--color-border) bg-(--color-surface) [&>strong]:text-xl [&>strong]:font-black`;

export const workspaceSummaryStatPrimaryAccentClassName =
  `${workspaceSummaryStatBaseClassName} min-h-[104px] gap-1 border border-[color-mix(in_srgb,var(--color-primary-border)_52%,var(--color-border))] bg-[linear-gradient(145deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-primary-soft)_42%,var(--color-surface))_100%)] [&>strong]:text-2xl [&>strong]:font-extrabold [&>strong]:tabular-nums`;

export const workspaceSummaryStatRouteAccentClassName =
  `${workspaceSummaryStatBaseClassName} min-h-[126px] min-w-0 content-start gap-2 border border-[color-mix(in_srgb,var(--color-route-border)_58%,var(--color-border))] bg-[linear-gradient(145deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-primary-soft)_46%,var(--color-surface))_100%)] max-[479px]:min-h-[58px] max-[479px]:grid-cols-[28px_minmax(0,1fr)] [&>strong]:text-2xl [&>strong]:font-extrabold [&>strong]:leading-[30px] [&>strong]:tabular-nums max-[479px]:[&>strong]:col-start-2 max-[479px]:[&>strong]:justify-self-start max-[479px]:[&>strong]:text-xl max-[479px]:[&>strong]:leading-6`;

export const workspaceSummaryStatValueFirstClassName =
  "grid min-h-[66px] w-[180px] content-center gap-0.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 [&_span]:text-xs [&_span]:font-extrabold [&_span]:text-(--color-text-muted) [&_strong]:text-2xl [&_strong]:leading-7 [&_strong]:text-(--color-text)";
