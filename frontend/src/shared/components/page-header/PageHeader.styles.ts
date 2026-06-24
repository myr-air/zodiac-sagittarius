import { workspaceResponsivePanelResetClassName } from "@/src/shared/components/workspace-surface/workspace-surface.styles";

export const pageHeaderClassName = `page-header relative isolate mb-3 flex min-h-[92px] min-w-0 items-center justify-between justify-self-stretch gap-4 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-4 py-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:mb-0 max-[1199px]:grid max-[1199px]:min-h-[84px] max-[1199px]:items-center max-[1199px]:gap-3 ${workspaceResponsivePanelResetClassName} max-[1199px]:px-4 max-[1199px]:py-3 max-[767px]:hidden`;
export const pageHeaderWithAsideClassName = "max-[1199px]:grid-cols-[minmax(0,1fr)_minmax(180px,260px)]";
export const pageHeaderWithoutAsideClassName = "max-[1199px]:grid-cols-1";
export const pageHeaderCopyClassName = "page-header-copy relative z-[1] grid min-w-0 gap-1";
export const pageHeaderAsideClassName = "page-header-aside relative z-[2] min-w-0 justify-self-end max-[1199px]:w-full max-[1199px]:justify-self-stretch";
export const eyebrowClassName = "eyebrow m-0 inline-flex w-fit items-center rounded-full border border-(--color-primary-border) bg-(--color-primary-soft) px-2.5 py-0.5 text-xs font-black leading-4 text-(--color-primary-strong)";
export const titleClassName = "m-0 text-[24px] font-black leading-[31px] text-(--color-text) [text-wrap:balance] max-[1199px]:text-[21px] max-[1199px]:leading-[28px]";
export const subtitleClassName = "m-0 text-sm font-bold leading-5 text-(--color-text-muted) max-[767px]:hidden";
export const descriptionClassName = "page-header-description m-0 max-w-[560px] text-[13px] font-semibold leading-5 text-(--color-text-muted) max-[767px]:hidden";
export const metaClassName = "page-header-meta mt-1.5 inline-flex flex-wrap gap-1.5 text-xs font-extrabold text-(--color-text-muted) [&_.icon]:size-3.5 [&_.icon]:text-(--color-primary-strong) [&>span]:inline-flex [&>span]:min-h-7 [&>span]:items-center [&>span]:gap-1.5 [&>span]:rounded-(--radius-sm) [&>span]:border [&>span]:border-(--color-border) [&>span]:bg-(--color-surface-subtle) [&>span]:px-2.5 [&>span]:py-1 max-[767px]:mt-1 max-[767px]:flex-nowrap max-[767px]:gap-1.5 max-[767px]:overflow-x-auto max-[767px]:pb-0.5 max-[767px]:[scrollbar-width:none] max-[767px]:[&::-webkit-scrollbar]:hidden max-[767px]:[&>span]:min-h-6 max-[767px]:[&>span]:shrink-0 max-[767px]:[&>span]:rounded-none max-[767px]:[&>span]:border-0 max-[767px]:[&>span]:bg-transparent max-[767px]:[&>span]:px-0 max-[767px]:[&>span]:text-[11px]";
export const motifClassName = "page-header-motif relative z-[1] grid max-w-44 flex-none place-items-center opacity-90 max-[1199px]:hidden";
export const userCardClassName = "page-current-user relative z-[1] grid min-w-[220px] grid-cols-[34px_minmax(0,1fr)] items-center gap-2.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5 py-2 max-[1199px]:w-full max-[1199px]:min-w-0";
export const userAvatarClassName = "person-avatar !size-[34px]";
export const userCopyClassName = "grid min-w-0 gap-0";
export const userNameClassName = "overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-extrabold leading-[18px] text-(--color-text)";
export const userLabelClassName = "text-xs text-(--color-text-muted)";
