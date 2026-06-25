import { workspaceFieldClassName } from "@/src/shared/components/workspace-form-field";
import {
  workspaceDialogActionsClassName,
  workspaceDialogFormClassName,
  workspaceDialogGridClassName,
} from "@/src/shared/components/workspace-dialog";
import { workspaceBadgeFrameClassName } from "@/src/shared/components/workspace-badge";

export const pageClassName = "bookings-docs-page grid-rows-[auto_minmax(0,1fr)] max-[767px]:min-h-[calc(100dvh-48px)]";
export const headerAsideClassName = "booking-docs-header-actions flex min-w-0 items-center justify-end gap-2";
export const headerActionRowClassName = "flex min-w-0 flex-wrap items-center justify-end gap-2 max-[767px]:w-full max-[767px]:justify-start";
export const mobileAddButtonClassName = "bookings-mobile-add-button !hidden";
export const contentClassName = "bookings-content grid min-h-0 grid-cols-[192px_minmax(0,1fr)_300px] gap-3 max-[1199px]:grid-cols-1 max-[1199px]:grid-rows-[auto_minmax(0,1fr)] max-[1199px]:gap-0 max-[767px]:grid-cols-1 max-[767px]:gap-0 max-[767px]:h-full max-[767px]:[&_.booking-inspector]:col-span-1";
export const folderRailClassName = "booking-folder-rail grid min-h-0 content-start gap-1 shadow-none max-[1199px]:grid-cols-7 max-[1199px]:content-normal max-[1199px]:gap-0 max-[1199px]:p-0 max-[767px]:grid-cols-7 max-[767px]:rounded-none max-[767px]:shadow-none";
export const folderButtonClassName = "group grid min-h-10 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 rounded-(--radius-md) border border-transparent bg-transparent px-2 py-1.5 text-left text-sm font-bold text-(--color-text-muted) transition-[background-color,border-color,color] duration-150 hover:bg-(--color-surface-subtle) hover:text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary) [&_.icon]:size-4 max-[1199px]:min-h-12 max-[1199px]:grid-cols-1 max-[1199px]:grid-rows-[20px_16px] max-[1199px]:justify-items-center max-[1199px]:gap-0 max-[1199px]:rounded-none max-[1199px]:border-0 max-[1199px]:border-b-2 max-[1199px]:border-transparent max-[1199px]:px-0 max-[1199px]:py-1.5 max-[1199px]:text-center max-[767px]:min-h-10 max-[767px]:grid-rows-[18px_12px]";
export const selectedFolderClassName = "border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong) max-[1199px]:border-b-(--color-primary) max-[1199px]:bg-transparent";
export const filePanelClassName = "bookings-file-panel grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] p-0 shadow-none max-[1199px]:min-h-[calc(100dvh-180px)] max-[767px]:h-full max-[767px]:min-h-0 max-[767px]:grid-rows-[auto_auto_minmax(0,1fr)] max-[767px]:rounded-none max-[767px]:border-0 max-[767px]:shadow-none";
export const fileToolbarClassName = "bookings-file-toolbar grid gap-2 border-b border-(--color-border) p-3 max-[1199px]:px-3 max-[1199px]:py-2 max-[767px]:gap-0 max-[767px]:px-2 max-[767px]:py-2";
export const toolbarControlsClassName = "grid grid-cols-[minmax(0,1fr)_176px] items-center gap-2 max-[767px]:grid-cols-[minmax(0,1fr)_132px] max-[767px]:gap-1.5";
export const searchInputClassName = "min-h-10 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) px-3 text-sm font-medium text-(--color-text) outline-none transition-colors placeholder:text-(--color-text-subtle) focus:border-(--color-primary) focus:bg-(--color-surface) max-[767px]:min-h-9";
export const statusFilterButtonClassName = "status-filter-button min-h-10 w-full rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-2.5 text-xs font-extrabold text-(--color-text) transition-[background,border-color,color] duration-150 hover:border-(--color-primary-border) hover:bg-(--color-surface-subtle) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary) aria-[expanded=true]:border-(--color-primary-border) aria-[expanded=true]:bg-(--color-primary-soft) max-[767px]:min-h-9 max-[767px]:px-2";
export const activeFolderBarClassName = "flex flex-wrap items-center justify-between gap-2 border-b border-(--color-border) px-3 py-2 max-[767px]:px-3 max-[767px]:py-2";
export const activeFolderDescriptionClassName = "text-xs font-semibold text-(--color-text-muted) max-[767px]:hidden";
export const fieldClassName = workspaceFieldClassName;
export const fileListClassName = "booking-file-list min-h-0 overflow-auto";
export const fileHeaderClassName = "sticky top-0 z-[1] grid min-w-[760px] grid-cols-[minmax(220px,1.7fr)_90px_100px_minmax(120px,1fr)_108px_70px] items-center gap-2 border-b border-(--color-border) bg-(--color-surface-subtle) px-3 py-2 text-[11px] font-black text-(--color-text-muted) max-[1199px]:hidden";
export const fileRowClassName = "booking-file-row booking-ticket-card grid min-w-[760px] grid-cols-[minmax(220px,1.7fr)_90px_100px_minmax(120px,1fr)_108px_70px] items-center gap-2 border-b border-(--color-border) px-3 py-2.5 text-left text-sm transition-colors hover:bg-(--color-surface-subtle) focus-within:bg-(--color-primary-soft) max-[1199px]:min-w-0 max-[1199px]:grid-cols-[minmax(0,1fr)_auto] max-[1199px]:gap-x-3 max-[1199px]:gap-y-1 max-[1199px]:px-3 max-[1199px]:py-3";
export const selectedFileRowClassName = "bg-(--color-primary-soft)";
export const lockedRowClassName = "booking-row-locked grid min-h-[46px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-(--color-border) px-3 py-2 text-sm";
export const badgeClassName = workspaceBadgeFrameClassName;
export const desktopInspectorClassName = "booking-inspector-desktop sticky top-3 grid max-h-[calc(100vh-92px)] content-start gap-3 overflow-auto shadow-none max-[1199px]:hidden";
export const inspectorClassName = "booking-inspector hidden content-start gap-3 overflow-auto shadow-none max-[1199px]:!fixed max-[1199px]:bottom-0 max-[1199px]:left-[74px] max-[1199px]:right-0 max-[1199px]:top-auto max-[1199px]:z-30 max-[1199px]:!max-h-[72vh] max-[1199px]:rounded-b-none max-[1199px]:rounded-t-(--radius-lg) max-[1199px]:border-x-0 max-[1199px]:border-b-0 max-[1199px]:p-3 max-[1199px]:pb-[calc(12px+env(safe-area-inset-bottom))] max-[1199px]:shadow-[0_-8px_16px_rgb(15_23_42_/_0.14)] max-[1199px]:transition-[transform,opacity] max-[1199px]:duration-200 max-[1199px]:ease-out max-[1199px]:grid max-[767px]:!fixed max-[767px]:bottom-0 max-[767px]:left-0 max-[767px]:transition-[transform,opacity] motion-reduce:max-[1199px]:transition-none";
export const mobileInspectorOpenClassName = "max-[1199px]:translate-y-0 max-[1199px]:opacity-100 max-[1199px]:pointer-events-auto";
export const inspectorSectionClassName = "grid gap-2 border-t border-(--color-border) pt-3 text-sm";
export const dialogClassName = "booking-dialog max-h-[min(760px,calc(100vh_-_32px))] max-w-[760px] shadow-[0_10px_18px_rgb(15_23_42_/_0.14)]";
export const dialogFormClassName = workspaceDialogFormClassName;
export const dialogGridClassName = workspaceDialogGridClassName;
export const dialogActionsClassName = workspaceDialogActionsClassName;
