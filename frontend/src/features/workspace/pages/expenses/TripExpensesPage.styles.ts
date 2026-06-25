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
  workspaceSummaryStatSurfaceClassName,
} from "@/src/shared/components/workspace-summary-stat";
import {
  workspaceDialogActionsClassName,
  workspaceDialogFormClassName,
  workspaceDialogGridClassName,
} from "@/src/shared/components/workspace-dialog";
import { workspaceBadgeFrameClassName } from "@/src/shared/components/workspace-badge";
import { workspacePanelHeadingCompactClassName } from "@/src/shared/components/workspace-panel-heading";

export const expensesPageClassName = "expenses-page grid min-h-full min-w-0 content-start gap-3 bg-[#f8fafc] px-6 py-[22px] pb-7 [--color-primary:#0f766e] [--color-primary-strong:#115e59] [--color-primary-soft:#ecfeff] [--color-primary-border:#99f6e4] [&_.button--primary]:shadow-[0_10px_20px_rgb(15_118_110_/_0.16)] max-[1199px]:min-h-[calc(100dvh-48px)] max-[1199px]:gap-0 max-[1199px]:px-0 max-[1199px]:py-0 max-[1199px]:pb-0";
export const expensesSummaryClassName = `expenses-summary ${workspaceSummaryGridFourClassName} max-[767px]:grid-cols-2`;
export const statClassName = `expense-stat ${workspaceSummaryStatSurfaceClassName} [&>strong]:tabular-nums`;
export const financeTabsClassName = `expense-finance-tabs grid min-w-0 grid-cols-3 items-center gap-1 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-1 shadow-none ${workspaceResponsiveInlinePanelResetClassName} max-[767px]:sticky max-[767px]:top-0 max-[767px]:z-[12] max-[767px]:rounded-none max-[767px]:border-x-0`;
export const financeTabClassName = "inline-flex min-h-10 min-w-0 items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap rounded-(--radius-sm) border border-transparent px-3 text-sm font-bold leading-5 text-(--color-text-muted) transition hover:bg-(--color-surface-subtle) hover:text-(--color-text) focus-visible:border-(--color-primary-border) max-[767px]:px-1.5 max-[767px]:text-xs max-[767px]:leading-4 max-[420px]:whitespace-normal";
export const financeTabActiveClassName = `${financeTabClassName} border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong)`;
export const financeViewClassName = "grid min-w-0 gap-3";
export const headerPlanSelectClassName = "grid min-w-0 gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) p-2 [&_span]:min-w-0 [&_span]:overflow-hidden [&_span]:text-ellipsis [&_span]:whitespace-nowrap [&_span]:text-[11px] [&_span]:font-black [&_span]:uppercase [&_span]:text-(--color-text-muted) [&_select]:min-w-0 [&_select]:max-w-full [&_select]:overflow-hidden [&_select]:text-ellipsis";
export const mobilePlanBarClassName = `hidden bg-(--color-surface) px-3 py-2 max-[767px]:block ${workspaceResponsiveInlinePanelResetClassName}`;
export const mobileHeaderClassName = "hidden border-b border-(--color-border) bg-(--color-surface) px-3 py-3 max-[767px]:grid [&_h1]:m-0 [&_h1]:text-xl [&_h1]:font-extrabold [&_h1]:leading-7 [&_h1]:text-(--color-text) [&_p]:m-0 [&_p]:text-sm [&_p]:font-semibold [&_p]:text-(--color-text-muted)";
export const contentGridClassName = "expenses-content grid min-h-0 grid-cols-[minmax(0,1fr)_332px] gap-3 max-[1199px]:grid-cols-1 max-[1199px]:gap-0";
export const overviewRailClassName = "expenses-overview-rail grid content-start gap-3 max-[1199px]:order-2";
export const ledgerSectionClassName = "expenses-ledger grid min-h-0 content-start gap-3 max-[1199px]:order-1 max-[767px]:pb-20";
export const panelClassName = `expenses-panel grid min-h-0 gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-4 shadow-none ${workspaceResponsivePanelResetClassName} max-[767px]:p-3`;
export const panelHeadingClassName = workspacePanelHeadingCompactClassName;
export const balanceListClassName = "grid gap-2";
export const scopeAuditListClassName = balanceListClassName;
export const expenseOverviewRowClassName = "grid gap-2 border-b border-(--color-border) px-0 py-2.5 text-xs last:border-b-0";
export const expenseOverviewWarningRowClassName = `${expenseOverviewRowClassName}`;
export const balanceRowClassName = `${expenseOverviewRowClassName} grid-cols-[minmax(0,1fr)_auto] items-center`;
export const settlementRowClassName = `${expenseOverviewWarningRowClassName} grid-cols-1 items-start`;
export const balanceActionsClassName = "inline-flex flex-wrap items-center justify-start gap-1.5";
export const decisionLaneClassName = `${panelClassName} gap-3 border-(--color-primary-border) bg-(--color-primary-soft)`;
export const decisionLaneHeaderClassName = "grid gap-1 [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-(--color-text) [&_p]:m-0 [&_p]:text-sm [&_p]:font-bold [&_p]:text-(--color-text-muted)";
export const quickCaptureFormClassName = "grid gap-2";
export const quickCaptureAmountRowClassName = "grid grid-cols-[minmax(0,1fr)_126px] gap-2 max-[420px]:grid-cols-1";
export const quickCaptureSplitClassName = "grid grid-cols-2 gap-1 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) p-1";
export const quickCaptureSplitButtonClassName = "min-h-9 rounded-(--radius-sm) border border-transparent px-2 text-xs font-black text-(--color-text-muted) transition hover:bg-(--color-surface-subtle) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)";
export const quickCaptureSplitButtonActiveClassName = "border-(--color-primary-border)! bg-(--color-primary-soft)! text-(--color-primary-strong)!";
export const quickCaptureSubmitClassName = "w-full justify-center";
export const overviewActionMenuClassName = "relative inline-grid justify-self-start";
export const overviewIconButtonClassName = "inline-grid min-h-9 min-w-9 place-items-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 text-(--color-text-muted) transition hover:border-(--color-border-strong) hover:text-(--color-text) [&_summary]:grid [&_summary]:cursor-pointer [&_summary]:list-none [&_summary]:place-items-center [&_summary::-webkit-details-marker]:hidden";
export const overviewActionMenuPanelClassName = "absolute left-0 top-[calc(100%+6px)] z-20 grid min-w-[220px] gap-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-2 shadow-[0_12px_28px_rgb(15_23_42_/_0.12)] [&_button]:w-full [&_button]:justify-start";
export const balanceNameClassName = "font-extrabold text-(--color-text)";
export const balanceMetaClassName = "text-(--color-text-muted)";
export const amountClassName = "font-extrabold tabular-nums";
export const positiveClassName = "text-[#15803d]";
export const negativeClassName = "text-[#b91c1c]";
export const summaryValueToneClassNames = {
  positive: positiveClassName,
  negative: negativeClassName,
};
export const commandBarClassName = `expenses-command-bar grid content-start gap-3 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3.5 shadow-none ${workspaceResponsivePanelResetClassName} max-[1199px]:p-3`;
export const commandBarHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 max-[767px]:grid-cols-1";
export const commandTitleGroupClassName = "grid gap-1";
export const commandTitleClassName = "m-0 text-base font-bold leading-6 text-(--color-text)";
export const commandMetaClassName = "flex flex-wrap items-center gap-2 text-xs font-semibold text-(--color-text-muted)";
export const filterGridClassName = "grid grid-cols-[minmax(150px,220px)_minmax(150px,220px)_minmax(150px,220px)_auto] items-end gap-2 max-[1199px]:grid-cols-2 max-[767px]:grid-cols-1";
export const searchRowClassName = "grid grid-cols-[minmax(240px,420px)] max-[767px]:grid-cols-1";
export const commandActionsClassName = "expenses-command-actions flex min-w-0 items-center justify-end gap-2 [&>*]:min-h-10 max-[767px]:sticky max-[767px]:bottom-3 max-[767px]:z-[18] max-[767px]:justify-start max-[767px]:rounded-(--radius-lg) max-[767px]:border max-[767px]:border-(--color-border) max-[767px]:bg-(--color-surface) max-[767px]:p-2 max-[767px]:shadow-[0_10px_24px_rgb(15_23_42_/_0.14)]";
export const commandPrimaryButtonClassName = "max-w-[180px] min-w-0 overflow-hidden text-ellipsis whitespace-nowrap max-[767px]:max-w-none max-[767px]:flex-1";
export const commandIconButtonClassName = "min-w-10 px-2.5 max-[767px]:[&_span]:sr-only";
export const commandMenuClassName = "relative";
export const commandMenuPanelClassName = "absolute right-0 top-[calc(100%+6px)] z-20 grid min-w-[220px] gap-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-2 shadow-[0_12px_28px_rgb(15_23_42_/_0.12)] [&_button]:w-full [&_button]:justify-start max-[767px]:top-auto max-[767px]:bottom-[calc(100%+6px)] max-[767px]:right-0";
export const liveStatusClassName = "inline-flex min-h-8 items-center rounded-(--radius-sm) border border-(--color-success-border) bg-(--color-success-soft) px-2.5 text-xs font-bold text-[#166534]";
export const copyFeedbackClassName = `expense-copy-feedback ${workspaceCopyFeedbackSubtleBadgeClassName}`;
export const fieldClassName = workspaceFieldClassName;
export const ledgerWorkspaceClassName = "grid min-h-0 items-start grid-cols-[minmax(0,1fr)_300px] gap-3 max-[1279px]:grid-cols-1";
export const tableWrapClassName = `expenses-table-wrap min-h-0 overflow-auto rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) shadow-none ${workspaceResponsiveInlinePanelResetClassName} max-[1199px]:p-0 max-[767px]:hidden`;
export const tableClassName = "expense-ledger-table w-full min-w-[760px] table-fixed border-collapse bg-(--color-surface) text-left text-sm";
export const tableHeaderClassName = "sticky top-0 z-[1] border-b border-(--color-border) bg-(--color-surface-subtle) text-[11px] font-black text-(--color-text-muted) [&_th]:px-3 [&_th]:py-2.5";
export const tableBodyClassName = "[&_td]:border-b [&_td]:border-(--color-border) [&_td]:bg-(--color-surface) [&_td]:px-3 [&_td]:py-3.5 [&_td]:align-middle [&_tr:hover_td]:bg-[color-mix(in_srgb,var(--color-primary-soft)_24%,var(--color-surface))]";
export const ledgerSelectedRowClassName = "[&_td]:bg-(--color-primary-soft)!";
export const tableTitleClassName = "grid min-w-0 gap-2 [&_strong]:text-(--color-text)";
export const dayGroupRowClassName = "[&_td]:border-y! [&_td]:border-(--color-route-border)! [&_td]:bg-(--color-route-soft)! [&_td]:px-3.5! [&_td]:py-2.5! [&_td]:text-xs [&_td]:font-black [&_td]:text-(--color-route) [&_td]:shadow-none! [&_strong]:tabular-nums";
export const dayGroupCellClassName = "flex min-w-0 items-center justify-between gap-3";
export const ledgerTitleLineClassName = "flex min-w-0 flex-wrap items-center gap-2";
export const ledgerRowButtonClassName = "expense-ledger-row-button flex w-full min-w-0 flex-wrap items-center gap-2 rounded-(--radius-sm) border border-transparent bg-transparent p-0 text-left transition hover:text-(--color-primary-strong) focus-visible:border-(--color-primary-border) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)";
export const ledgerTitleClassName = "min-w-0 max-w-full break-words text-[15px] font-extrabold leading-5";
export const ledgerDetailRowClassName = "[&_td]:rounded-(--radius-sm)! [&_td]:border! [&_td]:border-[color-mix(in_srgb,var(--color-route-border)_52%,var(--color-border))]! [&_td]:bg-(--color-surface-subtle)! [&_td]:px-3! [&_td]:py-2.5! [&_td]:shadow-none!";
export const ledgerDetailPanelClassName = "grid gap-2 text-xs font-semibold leading-5 text-(--color-text-muted)";
export const ledgerDetailGridClassName = "grid grid-cols-[minmax(150px,0.7fr)_minmax(220px,1fr)_minmax(280px,1.35fr)] gap-3 max-[920px]:grid-cols-1 [&_dd]:m-0 [&_dt]:text-[10px] [&_dt]:font-black [&_dt]:uppercase [&_dt]:text-(--color-text-muted)";
export const ledgerMemberListClassName = "m-0 grid list-disc gap-1 pl-4";
export const ledgerSplitCellClassName = "font-extrabold tabular-nums text-(--color-text)";
export const ledgerStopPillClassName = "inline-flex max-w-[220px] items-center rounded-full border border-(--color-border) bg-(--color-surface-subtle) px-2.5 py-1 text-xs font-bold leading-4 text-(--color-text-muted)";
export const ledgerSubAmountClassName = "mt-1 block text-[11px] font-bold tabular-nums text-(--color-text-muted)";
export const actionCellClassName = "inline-flex min-w-[84px] flex-wrap items-center justify-end gap-1.5";
export const mobileLedgerListClassName = `expense-mobile-ledger hidden gap-2.5 bg-transparent px-0 py-0 max-[767px]:grid ${workspaceResponsiveInlinePanelResetClassName}`;
export const mobileDayGroupClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-(--radius-md) border border-(--color-route-border) bg-(--color-route-soft) px-3 py-2 text-xs font-black text-(--color-route) [&_strong]:tabular-nums";
export const mobileLedgerCardClassName = "grid w-full gap-3 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3 text-left shadow-none";
export const mobileLedgerCardSelectedClassName = "border-(--color-primary-border) bg-(--color-primary-soft)";
export const mobileLedgerCardTopClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3";
export const mobileLedgerCardTitleClassName = "grid min-w-0 gap-1.5";
export const mobileLedgerCardAmountClassName = "text-right text-[15px] font-black tabular-nums text-(--color-primary-strong)";
export const mobileLedgerMetaClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-xs font-bold text-(--color-text-muted)";
export const mobileLedgerActionsClassName = "flex items-center justify-between gap-2 border-t border-(--color-border) pt-2";
export const transactionDetailBackdropClassName = "hidden max-[767px]:fixed max-[767px]:inset-0 max-[767px]:z-20 max-[767px]:block max-[767px]:bg-[rgb(15_23_42_/_0.28)]";
export const transactionDetailClassName = `expense-transaction-detail sticky top-3 grid max-h-[calc(100dvh-128px)] content-start gap-3 overflow-auto rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3.5 shadow-none max-[1279px]:static max-[767px]:fixed max-[767px]:inset-x-0 max-[767px]:bottom-0 max-[767px]:top-auto max-[767px]:z-30 max-[767px]:max-h-[86dvh] max-[767px]:rounded-t-(--radius-lg) max-[767px]:rounded-b-none max-[767px]:border-b-0 max-[767px]:shadow-[0_-14px_28px_rgb(15_23_42_/_0.08)]`;
export const transactionDetailEmptyClassName = "grid min-h-[220px] place-items-center gap-2 rounded-(--radius-md) border border-dashed border-(--color-border) bg-(--color-surface-subtle) px-4 text-center text-sm font-bold text-(--color-text-muted) max-[767px]:hidden";
export const transactionDetailHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-(--color-border) pb-3 [&_h2]:m-0 [&_h2]:min-w-0 [&_h2]:break-words [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:leading-6 [&_h2]:text-(--color-text)";
export const transactionDetailAmountClassName = "grid gap-1 rounded-(--radius-md) bg-(--color-surface-subtle) p-3 [&_strong]:text-2xl [&_strong]:font-black [&_strong]:tabular-nums [&_strong]:text-(--color-primary-strong) [&_span]:text-xs [&_span]:font-bold [&_span]:text-(--color-text-muted)";
export const transactionDetailListClassName = "m-0 grid gap-2 text-sm [&_div]:grid [&_div]:gap-1 [&_div]:border-b [&_div]:border-(--color-border) [&_div]:pb-2 [&_div:last-child]:border-b-0 [&_dt]:text-[11px] [&_dt]:font-bold [&_dt]:uppercase [&_dt]:text-(--color-text-muted) [&_dd]:m-0 [&_dd]:font-semibold [&_dd]:text-(--color-text)";
export const transactionDetailActionsClassName = "grid gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-2.5 max-[767px]:sticky max-[767px]:bottom-0 max-[767px]:z-[1]";
export const transactionDetailActionHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2";
export const transactionDetailPrimaryActionClassName = "min-h-11 w-full justify-center text-sm";
export const transactionDetailMoreActionClassName = "min-h-11 min-w-11 px-2.5";
export const transactionDetailSecondaryActionsClassName = "grid gap-2";
export const transactionDetailSecondaryActionClassName = "min-h-10 w-full justify-start px-2.5 text-xs";
export const transactionDetailDangerActionClassName = "min-h-9 w-full justify-start px-2.5 text-xs";
export const transactionDetailDisclosureClassName = "rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5 py-2 text-xs font-bold text-(--color-text-muted) [&_summary]:cursor-pointer [&_summary]:font-extrabold [&_ul]:mt-2";
export const memberLineClassName = "grid min-w-0 grid-cols-[34px_minmax(0,1fr)] items-center gap-2";
export const avatarClassName = "inline-grid size-[34px] place-items-center rounded-full border border-white text-[11px] font-black text-white shadow-[0_6px_14px_rgb(15_23_42_/_0.16)]";
export const categoryBadgeClassName = workspaceBadgeFrameClassName;
export const categoryDotClassName = "inline-block size-2 rounded-full";
export const ledgerAmountClassName = "text-[15px] font-black tabular-nums text-(--color-primary-strong)";
export const dialogClassName = "expense-dialog !max-h-[min(820px,calc(100vh_-_32px))] !max-w-4xl shadow-[0_10px_18px_rgb(15_23_42_/_0.14)]";
export const dialogFormClassName = `${workspaceDialogFormClassName} grid-rows-[minmax(0,1fr)_auto] gap-0 !overflow-hidden p-0`;
export const dialogFormScrollClassName = "grid min-h-0 gap-3 overflow-y-auto p-4 max-[767px]:p-3";
export const dialogGridClassName = workspaceDialogGridClassName;
export const dialogStackClassName = "grid gap-4";
export const dialogSectionClassName = "grid gap-2.5 border-b border-(--color-border) pb-4 last:border-b-0 last:pb-0";
export const dialogSectionHeaderClassName = "grid gap-0.5 [&_h3]:m-0 [&_h3]:text-sm [&_h3]:font-black [&_h3]:text-(--color-text) [&_p]:m-0 [&_p]:text-xs [&_p]:font-bold [&_p]:text-(--color-text-muted)";
export const dialogReviewClassName = "grid gap-2 border-t border-(--color-border) bg-(--color-surface) p-3 shadow-[0_-8px_14px_rgb(15_23_42_/_0.06)]";
export const dialogSummaryClassName = "m-0 rounded-(--radius-sm) bg-(--color-surface-subtle) px-2.5 py-2 text-xs font-bold leading-5 text-(--color-text-muted)";
export const dialogReviewActionsClassName = `${workspaceDialogActionsClassName} border-t-0 pt-0`;
export const dialogChoiceFieldClassName = "grid gap-1.5 [&_legend]:p-0 [&_legend]:text-[11px] [&_legend]:font-extrabold [&_legend]:text-(--color-text-muted)";
export const dialogPrimaryAmountRowClassName = "grid gap-2 md:grid-cols-[minmax(0,1fr)_160px]";
export const dialogSecondaryGridClassName = "grid gap-3 md:grid-cols-2";
export const dialogDisclosureClassName = "grid gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-3";
export const dialogDisclosureToggleClassName = "inline-flex min-h-9 items-center justify-between gap-3 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-left text-sm font-extrabold text-(--color-text) transition hover:border-(--color-border-strong) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)";
export const dialogDisclosureSummaryClassName = "truncate";
export const dialogDisclosureMetaClassName = "text-[11px] font-bold text-(--color-text-muted)";
export const dialogDisclosurePanelClassName = "grid gap-3 border-t border-(--color-border) pt-3";
export const dialogSegmentedControlClassName = "flex w-full flex-wrap gap-1 border-0 bg-transparent p-0";
export const dialogSegmentedItemClassName = "min-w-[88px] flex-1 px-2.5 text-[12px]";
export const dialogSegmentedItemActiveClassName = "bg-(--color-surface) text-(--color-primary-strong) shadow-[0_1px_4px_rgb(15_23_42_/_0.06)]";
export const dialogCategoryGridClassName = "grid grid-cols-3 gap-2 max-[767px]:grid-cols-1";
export const dialogCategoryButtonClassName = "grid min-h-11 content-center gap-1 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 py-2 text-left transition hover:border-(--color-border-strong) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary)";
export const dialogCategoryButtonActiveClassName = "border-(--color-primary-border)! bg-(--color-surface)! text-(--color-primary-strong)! shadow-none ring-1 ring-inset ring-(--color-primary-border)";
export const dialogCategoryButtonLabelClassName = "inline-flex items-center gap-2 text-sm font-extrabold";
export const dialogCategoryButtonMetaClassName = "text-xs font-bold text-(--color-text-muted)";
export const dialogCategoryDotLargeClassName = "inline-block size-2.5 rounded-full";
export const splitMemberFieldGridClassName = "grid gap-2 md:grid-cols-2";
export const splitMemberFieldClassName = "grid gap-1.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-2.5";
export const splitGridClassName = "grid grid-cols-2 gap-2 max-[767px]:grid-cols-1";
export const itemizedListClassName = "grid gap-2 max-[767px]:gap-2.5";
export const itemizedLineClassName = "grid gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) p-2.5 max-[767px]:p-2";
export const participantChecksClassName = "grid grid-cols-3 gap-2 max-[767px]:max-h-[168px] max-[767px]:overflow-auto max-[767px]:rounded-(--radius-sm) max-[767px]:border max-[767px]:border-(--color-border) max-[767px]:bg-(--color-surface) max-[767px]:p-2 max-[560px]:grid-cols-2 max-[380px]:grid-cols-1 [&_label]:inline-flex [&_label]:min-w-0 [&_label]:items-center [&_label]:gap-2 [&_label]:text-xs [&_label]:font-bold [&_label]:leading-4 [&_span]:min-w-0 [&_span]:break-words [&_input]:size-4 [&_input]:shrink-0";
export const commentsClassName = "grid gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) p-2.5";
export const commentRowClassName = "grid gap-0.5 rounded-(--radius-sm) bg-(--color-surface) px-2.5 py-2 text-xs [&_strong]:text-(--color-text) [&_span]:text-(--color-text-muted)";
export const warningClassName = "rounded-(--radius-sm) border border-(--color-warning-border) bg-(--color-warning-soft) px-2.5 py-2 text-xs font-bold text-(--color-warning-strong)";
export const dialogSummaryWarningClassName = `${warningClassName} m-0`;
export const scopeAuditRowClassName = `${expenseOverviewWarningRowClassName} grid-cols-[minmax(0,1fr)_auto] items-center max-[767px]:grid-cols-1 max-[767px]:items-start [&_button]:justify-self-start max-[767px]:[&_button]:w-full max-[767px]:[&_button]:justify-center`;
export const personalMetricRowClassName = `${expenseOverviewRowClassName} grid-cols-[minmax(0,1fr)_auto] items-center border-(--color-primary-border) bg-(--color-primary-soft) [&_span]:font-bold [&_span]:text-(--color-text-muted) [&_strong]:font-black [&_strong]:tabular-nums [&_strong]:text-(--color-primary-strong)`;
export const storedValueCardRowClassName = `${expenseOverviewRowClassName} grid-cols-[minmax(0,1fr)_auto] items-center border-(--color-primary-border) bg-(--color-primary-soft)`;
export const settingsHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-(--color-text) [&_p]:m-0 [&_p]:text-sm [&_p]:font-bold [&_p]:text-(--color-text-muted) max-[767px]:grid-cols-1";
export const settingsGridClassName = "grid grid-cols-2 gap-3 max-[767px]:grid-cols-1";
export const settingsActionsClassName = "flex flex-wrap items-center gap-2 [&>*]:min-h-10";
export const statementSectionClassName = "expense-statement grid min-w-0 gap-3";
export const statementHeaderClassName = `grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 ${panelClassName} max-[767px]:grid-cols-1`;
export const statementTitleClassName = "grid gap-1 [&_h2]:m-0 [&_h2]:text-lg [&_h2]:font-black [&_h2]:text-(--color-text) [&_h3]:m-0 [&_h3]:text-base [&_h3]:font-black [&_h3]:text-(--color-text) [&_p]:m-0 [&_p]:text-sm [&_p]:font-bold [&_p]:text-(--color-text-muted) max-[767px]:[&_p]:hidden";
export const statementSummaryClassName = "flex flex-wrap items-center justify-end gap-2 text-xs font-extrabold text-(--color-text-muted) max-[767px]:justify-start";
export const accountPaybackPanelClassName = `${panelClassName} gap-2.5 p-3`;
export const accountPaybackHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 max-[767px]:grid-cols-1";
export const accountPaybackListClassName = "grid gap-1";
export const accountPaybackRowClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-(--color-border) pt-2.5 first:border-t-0 first:pt-0 max-[767px]:grid-cols-1 max-[767px]:items-start";
export const accountPaybackTextClassName = "grid min-w-0 gap-1 [&_strong]:min-w-0 [&_strong]:break-words [&_strong]:text-sm [&_strong]:font-black [&_strong]:text-(--color-text) [&_span]:text-xs [&_span]:font-bold [&_span]:text-(--color-text-muted)";
export const accountPaybackMenuPanelClassName = "absolute bottom-[calc(100%+6px)] right-0 z-20 grid min-w-[220px] gap-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-2 shadow-[0_12px_28px_rgb(15_23_42_/_0.12)] [&_button]:w-full [&_button]:justify-start";
export const accountPaybackEmptyClassName = "m-0 rounded-(--radius-sm) bg-(--color-surface-subtle) px-3 py-2 text-sm font-bold text-(--color-text-muted)";
export const statementFilterBarClassName = "flex min-w-0 flex-wrap items-center gap-2 max-[767px]:flex-nowrap max-[767px]:overflow-x-auto max-[767px]:pb-1";
export const statementFilterButtonClassName = "inline-flex min-h-10 items-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) transition hover:border-(--color-border-strong) hover:text-(--color-text) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-primary) max-[767px]:min-h-10 max-[767px]:shrink-0";
export const statementFilterButtonActiveClassName = "border-(--color-primary-border)! bg-(--color-primary-soft)! text-(--color-primary-strong)!";
export const statementTableClassName = "expense-statement-table w-full min-w-[920px] table-fixed border-collapse bg-(--color-surface) text-left text-sm";
export const personalStatementSectionClassName = `${panelClassName} min-w-0 gap-3 p-0`;
export const personalStatementHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-(--color-border) p-3 max-[767px]:grid-cols-1";
export const personalStatementTableWrapClassName = `min-h-0 overflow-auto bg-(--color-surface) ${workspaceResponsiveInlinePanelResetClassName} max-[767px]:hidden`;
export const personalStatementTableClassName = "expense-personal-statement-table w-full min-w-[1060px] table-fixed border-collapse bg-(--color-surface) text-left text-sm";
export const personalStatementMobileListClassName = "hidden list-none gap-2.5 p-3 max-[767px]:grid";
export const personalStatementMobileRowClassName = "grid gap-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3";
export const personalStatementMobileTopClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3";
export const personalStatementMobileIncludedClassName = "text-xs font-bold leading-5 text-(--color-text-muted)";
export const personalStatementMobileMetaClassName = "grid gap-1.5 border-t border-(--color-border) pt-2 text-xs font-bold text-(--color-text-muted) [&_div]:grid [&_div]:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] [&_div]:gap-2 [&_dd]:m-0 [&_dd]:text-(--color-text) [&_dt]:font-black";
export const statementTableBodyClassName = "[&_td]:border-b [&_td]:border-(--color-border) [&_td]:bg-(--color-surface) [&_td]:px-3 [&_td]:py-3 [&_td]:align-middle [&_tr:hover_td]:bg-[color-mix(in_srgb,var(--color-primary-soft)_22%,var(--color-surface))]";
export const statementItemCellClassName = "grid min-w-0 gap-1 [&_strong]:truncate [&_strong]:font-black [&_strong]:text-(--color-text) [&_span]:truncate [&_span]:text-xs [&_span]:font-bold [&_span]:text-(--color-text-muted)";
export const statementMetaCellClassName = "text-xs font-bold leading-5 text-(--color-text-muted)";
export const statementAmountCellClassName = "text-right font-black tabular-nums text-(--color-primary-strong) [&_span]:mt-1 [&_span]:block [&_span]:text-[11px] [&_span]:font-bold [&_span]:text-(--color-text-muted)";
export const statementStatusCellClassName = "grid max-w-[220px] gap-1.5";
export const statementStatusClassName = "inline-flex max-w-full justify-self-start items-center rounded-full border px-2.5 py-1 text-xs font-black leading-4";
export const statementStatusReasonClassName = "text-[11px] font-semibold leading-4 text-(--color-text-muted)";
export const statementStatusReasonRowClassName = "flex min-w-0 items-center gap-1.5";
export const statementReasonTooltipClassName = "relative inline-grid size-5 shrink-0 place-items-center rounded-full border border-(--color-border) bg-(--color-surface) text-[11px] font-black italic leading-none text-(--color-text-muted) hover:border-(--color-border-strong) hover:text-(--color-text) focus-within:border-(--color-primary-border) [&_summary]:grid [&_summary]:size-full [&_summary]:cursor-pointer [&_summary]:list-none [&_summary]:place-items-center [&_summary::-webkit-details-marker]:hidden [&_span]:pointer-events-none [&_span]:absolute [&_span]:left-1/2 [&_span]:top-6 [&_span]:z-20 [&_span]:hidden [&_span]:w-[220px] [&_span]:-translate-x-1/2 [&_span]:rounded-(--radius-sm) [&_span]:border [&_span]:border-(--color-border) [&_span]:bg-(--color-surface) [&_span]:p-2 [&_span]:text-left [&_span]:text-xs [&_span]:font-bold [&_span]:not-italic [&_span]:leading-5 [&_span]:text-(--color-text) [&_span]:shadow-[0_10px_24px_rgb(15_23_42_/_0.12)] hover:[&_span]:block focus-within:[&_span]:block [&[open]_span]:block";
export const statementStatusToneClassNames = {
  needsReview: "border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning-strong)",
  noPaybackNeeded: "border-(--color-success-border) bg-(--color-success-soft) text-[#166534]",
  settlementRecorded: "border-(--color-success-border) bg-(--color-success-soft) text-[#166534]",
  recorded: "border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong)",
};
export const statementMobileListClassName = `hidden gap-2.5 max-[767px]:grid ${workspaceResponsiveInlinePanelResetClassName}`;
export const statementMobileRowClassName = "grid gap-2.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) p-3 text-left shadow-none";
export const statementMobileTopClassName = "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3";
export const statementMobileTitleClassName = "grid min-w-0 gap-1 [&_strong]:truncate [&_strong]:font-black [&_strong]:text-(--color-text) [&_span]:text-xs [&_span]:font-bold [&_span]:text-(--color-text-muted)";
export const statementMobileSummaryClassName = "flex min-w-0 items-center justify-between gap-2 text-xs font-extrabold text-(--color-text-muted) [&>span:first-child]:truncate";
export const statementMobileDetailsClassName = "border-t border-(--color-border) pt-2 text-xs font-bold text-(--color-text-muted) [&_summary]:inline-flex [&_summary]:min-h-8 [&_summary]:cursor-pointer [&_summary]:items-center [&_summary]:font-black [&_summary]:text-(--color-primary-strong)";
export const statementMobileMetaClassName = "mt-1 grid gap-1.5 text-xs font-bold text-(--color-text-muted) [&_div]:grid [&_div]:grid-cols-[88px_minmax(0,1fr)] [&_div]:gap-2 [&_dd]:m-0 [&_dd]:text-(--color-text) [&_dt]:font-black";
export const statementEmptyClassName = `${panelClassName} min-h-[180px] place-items-center text-center text-sm font-bold text-(--color-text-muted)`;
