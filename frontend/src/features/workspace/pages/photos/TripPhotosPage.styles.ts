import {
  workspaceCopyFeedbackFrameClassName,
  workspaceCopyFeedbackStatusClassName,
} from "@/src/shared/components/copy-feedback";
import { workspaceFieldClassName } from "@/src/shared/components/workspace-form-field";
import { workspaceResponsivePanelResetClassName } from "@/src/shared/components/workspace-surface";
import {
  workspaceDeleteDialogClassName,
  workspaceCompactDialogBodyClassName,
  workspaceDialogActionsClassName,
  workspaceDialogBackdropClassName,
  workspaceDialogFormClassName,
  workspaceDialogGridClassName,
  workspaceDialogHeaderClassName,
  workspaceDialogPanelClassName,
} from "@/src/shared/components/workspace-dialog";

export const pageClassName = "trip-photos-page grid grid-rows-[auto_auto_minmax(0,1fr)] gap-3 max-[1199px]:gap-0";
export const summaryClassName = "photos-summary grid grid-cols-4 gap-3 max-[1199px]:grid-cols-2 max-[1199px]:gap-0 max-[767px]:grid-cols-1";
export const statClassName = `photos-stat grid min-h-[86px] gap-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] ${workspaceResponsivePanelResetClassName} [&_.icon]:text-(--color-primary) [&>span]:text-xs [&>span]:font-bold [&>span]:text-(--color-text-muted) [&>strong]:text-xl [&>strong]:font-black [&>strong]:text-(--color-text)`;
export const contentClassName = "photos-content grid min-h-0 grid-cols-[minmax(0,1fr)_330px] gap-3 max-[1199px]:grid-cols-1 max-[1199px]:gap-0";
export const panelClassName = "photos-panel grid min-h-0 gap-3";
export const providerGridClassName = "photos-providers grid grid-cols-7 gap-2 max-[1399px]:grid-cols-4 max-[767px]:grid-cols-2";
export const providerButtonClassName = "grid min-h-[76px] content-between gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-(--color-primary-border) hover:bg-(--color-surface-subtle) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)";
export const selectedProviderClassName = "border-(--color-primary-border) bg-(--color-primary-soft) shadow-[0_1px_0_rgb(15_23_42_/_0.04)]";
export const cardGridClassName = "photo-album-grid grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-2";
export const albumCardClassName = "photo-album-card grid min-h-[214px] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3 text-left text-sm shadow-[0_1px_0_rgb(15_23_42_/_0.04)] transition-[background-color,border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-(--color-primary-border) hover:bg-(--color-surface-subtle)";
export const selectedAlbumClassName = "border-(--color-primary-border) bg-(--color-primary-soft) shadow-[0_1px_0_rgb(15_23_42_/_0.04)]";
export const albumCoverClassName = "photo-album-cover min-h-[74px] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) bg-cover bg-center";
export const inspectorClassName = "photos-inspector sticky top-3 grid max-h-[calc(100vh-92px)] content-start gap-3 overflow-auto max-[1199px]:static max-[1199px]:max-h-none";
export const inspectorSectionClassName = "grid gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 text-sm";
export const copyFeedbackClassName = `photo-copy-feedback min-h-8 rounded-(--radius-sm) bg-(--color-surface) px-2 ${workspaceCopyFeedbackFrameClassName} ${workspaceCopyFeedbackStatusClassName}`;
export const dialogBackdropClassName = workspaceDialogBackdropClassName;
export const dialogClassName = `photos-dialog max-h-[min(720px,calc(100vh_-_32px))] max-w-[720px] shadow-[0_14px_34px_rgb(15_23_42_/_0.16)] ${workspaceDialogPanelClassName}`;
export const dialogHeaderClassName = workspaceDialogHeaderClassName;
export const dialogFormClassName = workspaceDialogFormClassName;
export const dialogGridClassName = workspaceDialogGridClassName;
export const fieldClassName = workspaceFieldClassName;
export const dialogActionsClassName = workspaceDialogActionsClassName;
export const deleteDialogClassName = workspaceDeleteDialogClassName;
export const deleteDialogBodyClassName = workspaceCompactDialogBodyClassName;
