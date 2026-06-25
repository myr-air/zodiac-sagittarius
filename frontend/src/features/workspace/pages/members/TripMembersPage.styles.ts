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
  workspaceCompactDialogBodyClassName,
} from "@/src/shared/components/workspace-dialog";

export const membersPageClassName = "members-page grid-rows-[auto_auto_auto_minmax(0,1fr)]";
export const memberStatGridClassName = "member-stat-grid grid grid-cols-5 gap-2 max-[1199px]:grid-cols-3 max-[767px]:flex max-[767px]:snap-x max-[767px]:overflow-x-auto max-[767px]:pb-1 max-[767px]:[scrollbar-width:none] max-[767px]:[&::-webkit-scrollbar]:hidden";
export const memberStatClassName = "member-stat grid min-h-14 grid-cols-[24px_minmax(0,1fr)] items-center gap-x-2 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) px-3 py-2 text-left shadow-none max-[767px]:min-w-[116px] max-[767px]:snap-start max-[767px]:grid-cols-[20px_minmax(0,1fr)] max-[767px]:px-2.5 max-[767px]:py-1.5 [&_.icon]:row-span-2 [&_.icon]:text-(--color-primary) [&>span]:text-[11px] [&>span]:font-bold [&>span]:leading-4 [&>span]:text-(--color-text-muted) [&>strong]:text-sm [&>strong]:font-black [&>strong]:leading-5 [&>strong]:tabular-nums [&>strong]:text-(--color-text)";
export const memberCommandBarClassName = `member-command-bar grid min-w-0 gap-2 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3 shadow-none max-[1199px]:grid-cols-1 max-[767px]:gap-1.5 max-[767px]:p-2.5 ${workspaceResponsivePanelResetClassName}`;
export const memberCommandFieldsClassName = cn("member-command-fields grid min-w-0 grid-cols-[minmax(220px,1.5fr)_minmax(160px,1fr)_minmax(160px,1fr)] gap-2 max-[1199px]:grid-cols-1", workspaceCompactFieldGroupClassName);
export const memberCommandActionsClassName = "member-command-actions flex min-w-0 flex-wrap items-center justify-end gap-2 max-[1199px]:justify-start max-[767px]:w-full max-[767px]:[&>*]:flex-[1_1_180px]";
export const memberCommandMetaClassName = "member-command-meta grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 max-[1199px]:grid-cols-1 max-[767px]:rounded-(--radius-md) max-[767px]:border max-[767px]:border-(--color-border) max-[767px]:bg-(--color-surface-subtle) max-[767px]:p-2 [&_code]:overflow-hidden [&_code]:rounded-(--radius-sm) [&_code]:border [&_code]:border-(--color-border) [&_code]:bg-(--color-surface-muted) [&_code]:px-[9px] [&_code]:py-[7px] [&_code]:text-xs [&_code]:text-(--color-text-muted) [&_code]:text-ellipsis [&_code]:whitespace-nowrap max-[767px]:[&_code]:py-1.5 max-[767px]:[&_code]:text-[11px]";
export const memberResetButtonClassName = "member-filter-reset border-(--color-border) bg-(--color-surface-subtle) text-(--color-text-muted) hover:border-(--color-primary-border) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong) max-[767px]:w-full";
export const inviteCopyButtonClassName = "invite-copy-button border-(--color-primary) bg-(--color-primary) text-white disabled:cursor-not-allowed disabled:border-(--color-border) disabled:bg-(--color-surface-muted) disabled:text-(--color-text-muted) disabled:shadow-none";
export const memberCreateButtonClassName = "member-create-button border-(--color-primary-border) bg-(--color-primary-soft) text-(--color-primary-strong) hover:border-(--color-primary) disabled:cursor-not-allowed disabled:border-(--color-border) disabled:bg-(--color-surface-muted) disabled:text-(--color-text-muted) disabled:shadow-none";
export const copyFeedbackClassName = `copy-feedback ${workspaceCopyFeedbackPillClassName}`;
export const memberCreatePanelClassName = `member-create-panel grid min-w-0 gap-2 rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-3 shadow-none max-[1199px]:grid-cols-1 ${workspaceResponsiveInlinePanelResetClassName}`;
export const memberCreateFormClassName = cn("member-create-form grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(180px,240px)_auto] items-end gap-2 max-[1199px]:grid-cols-1", workspaceCompactFieldGroupClassName);
export const memberDialogClassName = cn("member-task-dialog w-[min(460px,100%)] shadow-[0_10px_18px_rgb(15_23_42_/_0.14)]", workspaceCompactFieldGroupClassName);
export const memberDialogBodyClassName = workspaceCompactDialogBodyClassName;
export const memberDialogErrorClassName = "m-0 rounded-(--radius-sm) border border-(--color-danger-border) bg-(--color-danger-soft) px-3 py-2 text-xs font-bold text-(--color-danger)";
