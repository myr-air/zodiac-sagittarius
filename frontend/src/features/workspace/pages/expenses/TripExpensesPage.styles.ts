import {
  workspaceCopyFeedbackFrameClassName,
  workspaceCopyFeedbackStatusClassName,
} from "@/src/shared/components/copy-feedback";
import { workspaceFieldClassName } from "@/src/shared/components/workspace-form-field";
import {
  workspaceResponsiveInlinePanelResetClassName,
  workspaceResponsivePanelResetClassName,
} from "@/src/shared/components/workspace-surface";
import {
  workspaceDialogActionsClassName,
  workspaceDialogBackdropClassName,
  workspaceDialogFormClassName,
  workspaceDialogGridClassName,
  workspaceDialogHeaderClassName,
  workspaceDialogPanelClassName,
} from "@/src/shared/components/workspace-dialog";

export const expensesPageClassName = "expenses-page grid min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 bg-transparent px-6 py-[22px] pb-7 max-[1199px]:min-h-[calc(100dvh-48px)] max-[1199px]:gap-0 max-[1199px]:px-0 max-[1199px]:py-0 max-[1199px]:pb-0";
export const expensesSummaryClassName = "expenses-summary grid grid-cols-4 gap-3 max-[1199px]:grid-cols-2 max-[1199px]:gap-0 max-[767px]:grid-cols-1";
export const statClassName = `expense-stat grid min-h-[104px] gap-1 rounded-(--radius-md) border border-[color-mix(in_srgb,var(--color-primary-border)_52%,var(--color-border))] bg-[linear-gradient(145deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-primary-soft)_42%,var(--color-surface))_100%)] p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] ${workspaceResponsivePanelResetClassName} [&_.icon]:text-(--color-primary) [&>span]:text-xs [&>span]:font-bold [&>span]:text-(--color-text-muted) [&>strong]:text-2xl [&>strong]:font-extrabold [&>strong]:tabular-nums [&>strong]:text-(--color-text)`;
export const contentGridClassName = "expenses-content grid min-h-0 grid-cols-[332px_minmax(0,1fr)] gap-3 max-[1199px]:grid-cols-1 max-[1199px]:gap-0";
export const panelClassName = `expenses-panel grid min-h-0 gap-3 rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route-border)_48%,var(--color-border))] bg-[linear-gradient(180deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-route-soft)_30%,var(--color-surface))_100%)] p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] ${workspaceResponsivePanelResetClassName}`;
export const panelHeadingClassName = "m-0 flex items-center gap-2 text-[14px] font-extrabold leading-5 text-(--color-text)";
export const balanceListClassName = "grid gap-2";
export const balanceRowClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-(--radius-md) border border-[color-mix(in_srgb,var(--color-border)_78%,var(--color-route-border))] bg-[rgb(255_255_255_/_0.84)] px-2.5 py-2 text-xs shadow-[0_1px_0_rgb(15_23_42_/_0.035)]";
export const settlementRowClassName = "grid grid-cols-1 items-start gap-2 rounded-(--radius-md) border border-(--color-warning-border) bg-(--color-warning-soft) px-2.5 py-2 text-xs";
export const balanceActionsClassName = "inline-flex flex-wrap items-center justify-start gap-1.5";
export const balanceNameClassName = "font-extrabold text-(--color-text)";
export const balanceMetaClassName = "text-(--color-text-muted)";
export const amountClassName = "font-extrabold tabular-nums";
export const positiveClassName = "text-[#15803d]";
export const negativeClassName = "text-[#b91c1c]";
export const commandBarClassName = `expenses-command-bar grid content-start gap-3 rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-primary-border)_52%,var(--color-border))] bg-[linear-gradient(135deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-route-soft)_54%,var(--color-surface))_100%)] p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] ${workspaceResponsivePanelResetClassName} max-[1199px]:p-3`;
export const filterGridClassName = "grid grid-cols-[minmax(180px,1fr)_minmax(150px,220px)_minmax(150px,220px)_auto] items-end gap-2 max-[1199px]:grid-cols-2 max-[767px]:grid-cols-1";
export const commandActionsClassName = "expenses-command-actions flex flex-wrap items-center gap-2 max-[767px]:[&>*]:flex-[1_1_180px]";
export const copyFeedbackClassName = `expense-copy-feedback min-h-9 rounded-(--radius-sm) bg-(--color-surface-subtle) px-3 ${workspaceCopyFeedbackFrameClassName} ${workspaceCopyFeedbackStatusClassName}`;
export const fieldClassName = workspaceFieldClassName;
export const tableWrapClassName = `expenses-table-wrap min-h-0 overflow-auto rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route-border)_42%,var(--color-border))] bg-(--color-surface) p-2 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] ${workspaceResponsiveInlinePanelResetClassName} max-[1199px]:p-0`;
export const tableClassName = "expense-ledger-table w-full min-w-[780px] border-separate border-spacing-y-2 text-left text-sm";
export const tableHeaderClassName = "sticky top-0 z-[1] bg-(--color-surface-subtle) text-[11px] font-black uppercase text-(--color-text-muted) [&_th]:px-3 [&_th]:py-2";
export const tableBodyClassName = "[&_td]:border-y [&_td]:border-[rgb(15_23_42_/_0.08)] [&_td]:bg-(--color-surface) [&_td]:px-3 [&_td]:py-3 [&_td:first-child]:rounded-l-(--radius-md) [&_td:first-child]:border-l [&_td:last-child]:rounded-r-(--radius-md) [&_td:last-child]:border-r [&_tr:hover_td]:bg-(--color-surface-subtle)";
export const tableTitleClassName = "grid gap-1 [&_strong]:text-(--color-text) [&_span]:text-xs [&_span]:text-(--color-text-muted)";
export const actionCellClassName = "inline-flex items-center gap-1.5";
export const memberLineClassName = "grid min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2";
export const avatarClassName = "inline-grid size-[34px] place-items-center rounded-full border border-white text-[11px] font-black text-white shadow-[0_6px_14px_rgb(15_23_42_/_0.16)]";
export const categoryBadgeClassName = "inline-flex min-h-6 w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-extrabold capitalize";
export const categoryDotClassName = "inline-block size-2 rounded-full";
export const ledgerAmountClassName = "inline-flex min-h-8 items-center rounded-(--radius-sm) bg-(--color-primary-soft) px-2.5 text-[13px] font-black tabular-nums text-(--color-primary-strong)";
export const dialogBackdropClassName = workspaceDialogBackdropClassName;
export const dialogClassName = `expense-dialog max-h-[min(720px,calc(100vh_-_32px))] max-w-[760px] shadow-[0_10px_18px_rgb(15_23_42_/_0.14)] ${workspaceDialogPanelClassName}`;
export const dialogHeaderClassName = workspaceDialogHeaderClassName;
export const dialogFormClassName = workspaceDialogFormClassName;
export const dialogGridClassName = workspaceDialogGridClassName;
export const splitGridClassName = "grid grid-cols-2 gap-2 max-[767px]:grid-cols-1";
export const itemizedListClassName = "grid gap-2";
export const itemizedLineClassName = "grid gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) p-2.5";
export const participantChecksClassName = "grid grid-cols-3 gap-2 max-[767px]:grid-cols-1 [&_label]:inline-flex [&_label]:items-center [&_label]:gap-2 [&_label]:text-xs [&_label]:font-bold [&_input]:size-4";
export const commentsClassName = "grid gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) p-2.5";
export const commentRowClassName = "grid gap-0.5 rounded-(--radius-sm) bg-(--color-surface) px-2.5 py-2 text-xs [&_strong]:text-(--color-text) [&_span]:text-(--color-text-muted)";
export const warningClassName = "rounded-(--radius-sm) border border-(--color-warning-border) bg-(--color-warning-soft) px-2.5 py-2 text-xs font-bold text-(--color-warning-strong)";
export const dialogActionsClassName = workspaceDialogActionsClassName;
export const scopeAuditListClassName = "grid gap-2";
export const scopeAuditRowClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-(--radius-md) border border-(--color-warning-border) bg-(--color-warning-soft) px-2.5 py-2 text-xs";
