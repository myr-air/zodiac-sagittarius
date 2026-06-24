import {
  workspaceCopyFeedbackSubtleBadgeClassName,
} from "@/src/shared/components/copy-feedback";
import { workspaceFieldClassName } from "@/src/shared/components/workspace-form-field";
import {
  workspaceResponsiveInlinePanelResetClassName,
  workspaceResponsivePanelResetClassName,
} from "@/src/shared/components/workspace-surface";
import {
  workspaceSummaryGridFourClassName,
  workspaceSummaryStatPrimaryAccentClassName,
} from "@/src/shared/components/workspace-summary-stat";
import {
  workspaceDialogActionsClassName,
  workspaceDialogFormClassName,
  workspaceDialogGridClassName,
} from "@/src/shared/components/workspace-dialog";
import { workspaceBadgeFrameClassName } from "@/src/shared/components/workspace-badge";
import { workspacePanelHeadingCompactClassName } from "@/src/shared/components/workspace-panel-heading";

export const expensesPageClassName = "expenses-page grid min-h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 bg-transparent px-6 py-[22px] pb-7 max-[1199px]:min-h-[calc(100dvh-48px)] max-[1199px]:gap-0 max-[1199px]:px-0 max-[1199px]:py-0 max-[1199px]:pb-0";
export const expensesSummaryClassName = `expenses-summary ${workspaceSummaryGridFourClassName}`;
export const statClassName = `expense-stat ${workspaceSummaryStatPrimaryAccentClassName}`;
export const contentGridClassName = "expenses-content grid min-h-0 grid-cols-[332px_minmax(0,1fr)] gap-3 max-[1199px]:grid-cols-1 max-[1199px]:gap-0";
export const panelClassName = `expenses-panel grid min-h-0 gap-3 rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route-border)_48%,var(--color-border))] bg-[linear-gradient(180deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-route-soft)_30%,var(--color-surface))_100%)] p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] ${workspaceResponsivePanelResetClassName}`;
export const panelHeadingClassName = workspacePanelHeadingCompactClassName;
export const balanceListClassName = "grid gap-2";
export const scopeAuditListClassName = balanceListClassName;
export const expenseOverviewRowClassName = "grid gap-2 rounded-(--radius-md) border px-2.5 py-2 text-xs";
export const expenseOverviewWarningRowClassName = `${expenseOverviewRowClassName} border-(--color-warning-border) bg-(--color-warning-soft)`;
export const balanceRowClassName = `${expenseOverviewRowClassName} grid-cols-[minmax(0,1fr)_auto] items-center border-[color-mix(in_srgb,var(--color-border)_78%,var(--color-route-border))] bg-[rgb(255_255_255_/_0.84)] shadow-[0_1px_0_rgb(15_23_42_/_0.035)]`;
export const settlementRowClassName = `${expenseOverviewWarningRowClassName} grid-cols-1 items-start`;
export const balanceActionsClassName = "inline-flex flex-wrap items-center justify-start gap-1.5";
export const balanceNameClassName = "font-extrabold text-(--color-text)";
export const balanceMetaClassName = "text-(--color-text-muted)";
export const amountClassName = "font-extrabold tabular-nums";
export const positiveClassName = "text-[#15803d]";
export const negativeClassName = "text-[#b91c1c]";
export const summaryValueToneClassNames = {
  positive: positiveClassName,
  negative: negativeClassName,
};
export const commandBarClassName = `expenses-command-bar grid content-start gap-3 rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-primary-border)_52%,var(--color-border))] bg-[linear-gradient(135deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-route-soft)_54%,var(--color-surface))_100%)] p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] ${workspaceResponsivePanelResetClassName} max-[1199px]:p-3`;
export const filterGridClassName = "grid grid-cols-[minmax(180px,1fr)_minmax(150px,220px)_minmax(150px,220px)_auto] items-end gap-2 max-[1199px]:grid-cols-2 max-[767px]:grid-cols-1";
export const commandActionsClassName = "expenses-command-actions flex flex-wrap items-center gap-2 max-[767px]:[&>*]:flex-[1_1_180px]";
export const liveStatusClassName = "inline-flex min-h-8 items-center rounded-(--radius-sm) border border-(--color-success-border) bg-(--color-success-soft) px-2.5 text-xs font-extrabold text-[#166534]";
export const copyFeedbackClassName = `expense-copy-feedback ${workspaceCopyFeedbackSubtleBadgeClassName}`;
export const fieldClassName = workspaceFieldClassName;
export const tableWrapClassName = `expenses-table-wrap min-h-0 overflow-auto rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-route-border)_42%,var(--color-border))] bg-(--color-surface) p-2 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] ${workspaceResponsiveInlinePanelResetClassName} max-[1199px]:p-0`;
export const tableClassName = "expense-ledger-table w-full min-w-[820px] border-separate border-spacing-y-2 text-left text-sm";
export const tableHeaderClassName = "sticky top-0 z-[1] bg-(--color-surface-subtle) text-[11px] font-black uppercase text-(--color-text-muted) [&_th]:px-3 [&_th]:py-2";
export const tableBodyClassName = "[&_td]:border-y [&_td]:border-[rgb(15_23_42_/_0.08)] [&_td]:bg-(--color-surface) [&_td]:px-3 [&_td]:py-3 [&_td]:align-top [&_td:first-child]:rounded-l-(--radius-md) [&_td:first-child]:border-l [&_td:last-child]:rounded-r-(--radius-md) [&_td:last-child]:border-r [&_tr:hover_td]:bg-(--color-surface-subtle)";
export const tableTitleClassName = "grid min-w-0 gap-2 [&_strong]:text-(--color-text)";
export const dayGroupRowClassName = "[&_td]:grid [&_td]:grid-cols-[minmax(0,1fr)_auto] [&_td]:items-center [&_td]:gap-3 [&_td]:rounded-(--radius-sm)! [&_td]:border! [&_td]:border-(--color-route-border)! [&_td]:bg-(--color-route-soft)! [&_td]:px-3! [&_td]:py-2! [&_td]:text-xs [&_td]:font-black [&_td]:text-(--color-route) [&_td]:shadow-none! [&_strong]:tabular-nums";
export const ledgerTitleLineClassName = "flex min-w-0 flex-wrap items-center gap-2";
export const ledgerTitleClassName = "min-w-[140px] text-sm font-black leading-5";
export const ledgerDetailRowClassName = "[&_td]:rounded-(--radius-sm)! [&_td]:border! [&_td]:border-[color-mix(in_srgb,var(--color-route-border)_52%,var(--color-border))]! [&_td]:bg-(--color-surface-subtle)! [&_td]:px-3! [&_td]:py-2.5! [&_td]:shadow-none!";
export const ledgerDetailPanelClassName = "grid gap-2 text-xs font-semibold leading-5 text-(--color-text-muted)";
export const ledgerDetailGridClassName = "grid grid-cols-[minmax(150px,0.7fr)_minmax(220px,1fr)_minmax(280px,1.35fr)] gap-3 max-[920px]:grid-cols-1 [&_dd]:m-0 [&_dt]:text-[10px] [&_dt]:font-black [&_dt]:uppercase [&_dt]:text-(--color-text-muted)";
export const ledgerMemberListClassName = "m-0 grid list-disc gap-1 pl-4";
export const ledgerSplitCellClassName = "font-bold tabular-nums text-(--color-text)";
export const ledgerStopPillClassName = "inline-flex max-w-[220px] items-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2 py-1 text-xs font-bold leading-4 text-(--color-text-muted)";
export const ledgerSubAmountClassName = "mt-1 block text-[11px] font-bold tabular-nums text-(--color-text-muted)";
export const actionCellClassName = "inline-flex min-w-[184px] flex-wrap items-center justify-end gap-1.5";
export const memberLineClassName = "grid min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2";
export const avatarClassName = "inline-grid size-[34px] place-items-center rounded-full border border-white text-[11px] font-black text-white shadow-[0_6px_14px_rgb(15_23_42_/_0.16)]";
export const categoryBadgeClassName = workspaceBadgeFrameClassName;
export const categoryDotClassName = "inline-block size-2 rounded-full";
export const ledgerAmountClassName = "inline-flex min-h-8 items-center rounded-(--radius-sm) bg-(--color-primary-soft) px-2.5 text-[13px] font-black tabular-nums text-(--color-primary-strong)";
export const dialogClassName = "expense-dialog !max-h-[min(820px,calc(100vh_-_32px))] !max-w-4xl shadow-[0_10px_18px_rgb(15_23_42_/_0.14)]";
export const dialogFormClassName = `${workspaceDialogFormClassName} gap-4 max-[767px]:p-3`;
export const dialogGridClassName = workspaceDialogGridClassName;
export const dialogStackClassName = "grid gap-4";
export const dialogSectionClassName = "grid gap-2.5 border-b border-(--color-border) pb-4 last:border-b-0 last:pb-0";
export const dialogSectionHeaderClassName = "grid gap-0.5 [&_h3]:m-0 [&_h3]:text-sm [&_h3]:font-black [&_h3]:text-(--color-text) [&_p]:m-0 [&_p]:text-xs [&_p]:font-bold [&_p]:text-(--color-text-muted)";
export const dialogReviewClassName = "sticky bottom-0 z-[1] grid gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3 shadow-[0_-8px_16px_rgb(15_23_42_/_0.08)]";
export const dialogSummaryClassName = "m-0 rounded-(--radius-sm) bg-(--color-surface-subtle) px-2.5 py-2 text-xs font-bold leading-5 text-(--color-text-muted)";
export const dialogReviewActionsClassName = `${workspaceDialogActionsClassName} border-t-0 pt-0`;
export const splitGridClassName = "grid grid-cols-2 gap-2 max-[767px]:grid-cols-1";
export const itemizedListClassName = "grid gap-2";
export const itemizedLineClassName = "grid gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) p-2.5";
export const participantChecksClassName = "grid grid-cols-3 gap-2 max-[767px]:grid-cols-1 [&_label]:inline-flex [&_label]:items-center [&_label]:gap-2 [&_label]:text-xs [&_label]:font-bold [&_input]:size-4";
export const commentsClassName = "grid gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) p-2.5";
export const commentRowClassName = "grid gap-0.5 rounded-(--radius-sm) bg-(--color-surface) px-2.5 py-2 text-xs [&_strong]:text-(--color-text) [&_span]:text-(--color-text-muted)";
export const warningClassName = "rounded-(--radius-sm) border border-(--color-warning-border) bg-(--color-warning-soft) px-2.5 py-2 text-xs font-bold text-(--color-warning-strong)";
export const dialogSummaryWarningClassName = `${warningClassName} m-0`;
export const scopeAuditRowClassName = `${expenseOverviewWarningRowClassName} grid-cols-[minmax(0,1fr)_auto] items-center`;
export const personalMetricRowClassName = `${expenseOverviewRowClassName} grid-cols-[minmax(0,1fr)_auto] items-center border-[color-mix(in_srgb,var(--color-primary-border)_58%,var(--color-border))] bg-[rgb(255_255_255_/_0.88)] [&_span]:font-bold [&_span]:text-(--color-text-muted) [&_strong]:font-black [&_strong]:tabular-nums [&_strong]:text-(--color-primary-strong)`;
