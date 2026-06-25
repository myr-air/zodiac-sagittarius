import {
  workspaceCopyFeedbackCompactBadgeClassName,
} from "@/src/shared/components/copy-feedback";
import { workspaceFieldClassName } from "@/src/shared/components/workspace-form-field";
import { workspaceSummaryGridFourClassName } from "@/src/shared/components/workspace-summary-stat";
import {
  workspaceDialogActionsClassName,
  workspaceDialogFormClassName,
  workspaceDialogGridClassName,
} from "@/src/shared/components/workspace-dialog";

export const pageClassName = "trip-photos-page grid grid-rows-[auto_auto_minmax(0,1fr)] gap-3 max-[1199px]:gap-0";
export const summaryClassName = `photos-summary ${workspaceSummaryGridFourClassName} [&.photos-summary]:gap-2`;
export const statClassName = "photos-stat grid min-h-14 grid-cols-[24px_minmax(0,1fr)] items-center gap-x-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2 text-left shadow-none [&_.icon]:row-span-2 [&_.icon]:text-(--color-primary) [&>span]:text-[11px] [&>span]:font-bold [&>span]:leading-4 [&>span]:text-(--color-text-muted) [&>strong]:text-sm [&>strong]:font-black [&>strong]:leading-5 [&>strong]:text-(--color-text)";
export const contentClassName = "photos-content grid min-h-0 grid-cols-[minmax(0,1fr)_300px] gap-3 max-[1199px]:grid-cols-1 max-[1199px]:gap-0";
export const panelClassName = "photos-panel grid min-h-0 content-start gap-2 shadow-none";
export const providerGridClassName = "photos-providers flex flex-wrap items-center gap-1.5";
export const providerButtonClassName = "inline-flex min-h-9 items-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 py-1.5 text-left text-xs font-extrabold text-(--color-text-muted) transition-[background-color,border-color,color] duration-150 hover:border-(--color-primary-border) hover:bg-(--color-surface-subtle) hover:text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)";
export const selectedProviderClassName = "border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong)";
export const cardGridClassName = "photo-album-grid grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-2 max-[479px]:grid-cols-1";
export const albumCardClassName = "photo-album-card grid gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-2.5 text-left text-sm shadow-none transition-[background-color,border-color] duration-150 hover:border-(--color-primary-border) hover:bg-(--color-surface-subtle)";
export const selectedAlbumClassName = "border-(--color-primary-border) bg-(--color-primary-soft)";
export const albumCoverClassName = "photo-album-cover h-[72px] w-full overflow-hidden rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) bg-cover bg-center";
export const inspectorClassName = "photos-inspector sticky top-3 grid max-h-[calc(100vh-92px)] content-start gap-3 overflow-auto shadow-none max-[1199px]:static max-[1199px]:max-h-none";
export const inspectorSectionClassName = "grid gap-1.5 border-t border-(--color-border) pt-3 text-sm first:border-t-0 first:pt-0";
export const copyFeedbackClassName = `photo-copy-feedback ${workspaceCopyFeedbackCompactBadgeClassName}`;
export const dialogClassName = "photos-dialog max-h-[min(720px,calc(100vh_-_32px))] max-w-[720px] shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]";
export const dialogFormClassName = workspaceDialogFormClassName;
export const dialogGridClassName = workspaceDialogGridClassName;
export const fieldClassName = workspaceFieldClassName;
export const dialogActionsClassName = workspaceDialogActionsClassName;
