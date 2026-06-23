import { cn } from "@/src/lib/cn";
import {
  workspaceCopyFeedbackPillClassName,
} from "@/src/shared/components/copy-feedback";
import { workspaceCompactFieldGroupClassName } from "@/src/shared/components/workspace-form-field";
import {
  workspaceResponsiveInlinePanelResetClassName,
  workspaceResponsivePanelResetClassName,
} from "@/src/shared/components/workspace-surface";
import {
  workspaceSummaryGridFiveClassName,
  workspaceSummaryStatRouteAccentClassName,
} from "@/src/shared/components/workspace-summary-stat";
import {
  workspaceCompactDialogBodyClassName,
} from "@/src/shared/components/workspace-dialog";

export const membersPageClassName = "members-page";
export const memberStatGridClassName = `member-stat-grid ${workspaceSummaryGridFiveClassName}`;
export const memberStatClassName = `member-stat ${workspaceSummaryStatRouteAccentClassName}`;
export const memberCommandBarClassName = `member-command-bar grid min-w-0 gap-3 rounded-(--radius-lg) border border-[color-mix(in_srgb,var(--color-primary-border)_52%,var(--color-border))] bg-[linear-gradient(135deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-route-soft)_56%,var(--color-surface))_100%)] p-4 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:grid-cols-1 ${workspaceResponsivePanelResetClassName} max-[1199px]:p-3`;
export const memberCommandFieldsClassName = cn("member-command-fields grid min-w-0 grid-cols-3 gap-3 max-[1199px]:grid-cols-1", workspaceCompactFieldGroupClassName);
export const memberCommandActionsClassName = "member-command-actions flex min-w-0 flex-wrap items-center justify-end gap-2 max-[1199px]:justify-start max-[767px]:w-full max-[767px]:[&>*]:flex-[1_1_180px]";
export const memberCommandMetaClassName = "member-command-meta grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 max-[1199px]:grid-cols-1 [&_code]:overflow-hidden [&_code]:rounded-(--radius-sm) [&_code]:border [&_code]:border-(--color-border) [&_code]:bg-(--color-surface-muted) [&_code]:px-[9px] [&_code]:py-[7px] [&_code]:text-xs [&_code]:text-(--color-text-muted) [&_code]:text-ellipsis [&_code]:whitespace-nowrap";
export const memberResetButtonClassName = "member-filter-reset border-(--color-border) bg-(--color-surface-subtle) text-(--color-text-muted) hover:border-(--color-primary-border) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) max-[767px]:w-full";
export const inviteCopyButtonClassName = "invite-copy-button border-(--color-primary) bg-(--color-primary) text-white hover:-translate-y-px hover:shadow-[0_6px_8px_rgb(15_118_110_/_0.18)] disabled:cursor-not-allowed disabled:border-(--color-border) disabled:bg-(--color-surface-muted) disabled:text-(--color-text-muted) disabled:shadow-none";
export const memberCreateButtonClassName = "member-create-button border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong) hover:-translate-y-px hover:border-(--color-primary) hover:shadow-[0_6px_8px_rgb(15_118_110_/_0.12)] disabled:cursor-not-allowed disabled:border-(--color-border) disabled:bg-(--color-surface-muted) disabled:text-(--color-text-muted) disabled:shadow-none";
export const copyFeedbackClassName = `copy-feedback ${workspaceCopyFeedbackPillClassName}`;
export const memberCreatePanelClassName = `member-create-panel grid min-w-0 gap-3 rounded-(--radius-lg) border border-(--color-primary-border) bg-[linear-gradient(135deg,var(--color-primary-soft)_0%,rgb(255_255_255)_100%)] p-4 shadow-[0_1px_0_rgb(15_23_42_/_0.04)] max-[1199px]:grid-cols-1 ${workspaceResponsiveInlinePanelResetClassName} max-[1199px]:p-3`;
export const memberCreateFormClassName = cn("member-create-form grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(180px,240px)_auto] items-end gap-3 max-[1199px]:grid-cols-1", workspaceCompactFieldGroupClassName);
export const memberDialogClassName = cn("member-task-dialog w-[min(460px,100%)] shadow-[0_10px_18px_rgb(15_23_42_/_0.14)]", workspaceCompactFieldGroupClassName);
export const memberDialogBodyClassName = workspaceCompactDialogBodyClassName;
export const memberDialogErrorClassName = "m-0 rounded-(--radius-sm) border border-(--color-danger-border) bg-(--color-danger-soft) px-3 py-2 text-xs font-bold text-(--color-danger)";
