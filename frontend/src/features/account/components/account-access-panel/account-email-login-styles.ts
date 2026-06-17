import { cn } from "@/src/lib/cn";

export type AuthTransitionDirection = "forward" | "back" | "mode";

export const accountEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const accountCheckClassName =
  "account-check grid grid-cols-[auto_minmax(0,1fr)] items-center [&_input]:min-h-[18px] [&_input]:w-[18px]";
export const accountFieldClassName = "account-field grid gap-1.5";
export const accountFieldHintClassName = "account-field-hint m-0 text-xs font-[650] leading-[18px] text-(--color-text-muted)";
export const accountLoginFlowClassName = "account-login-flow grid w-[min(100%,560px)] justify-self-center gap-3";
export const accountEntryLoginFlowClassName =
  "relative row-start-2 w-full self-start justify-self-center gap-[22px] rounded-(--radius-lg) border border-(--color-border) bg-(--color-surface) p-[clamp(22px,3vw,34px)] pt-[70px] shadow-[0_14px_34px_rgb(15_23_42_/_0.1)] min-[1100px]:col-start-2 min-[1100px]:row-start-3 min-[1100px]:w-[min(100%,520px)] max-[767px]:row-start-1 max-[767px]:min-h-[100dvh] max-[767px]:rounded-none max-[767px]:border-0 max-[767px]:p-[18px] max-[767px]:pt-[92px] max-[767px]:shadow-none";
export const accountStepKickerClassName = "account-step-kicker block text-xs font-[850] leading-[18px] text-(--color-text-muted)";
export const accountStepStageClassName =
  "account-step-stage grid gap-4 overflow-visible [animation-duration:260ms] [animation-fill-mode:both] [animation-timing-function:cubic-bezier(0.2,0.72,0.28,1)] motion-reduce:animate-none";
export const accountStepStageDirectionClassNames = {
  back: "account-step-stage--back animate-[account-step-in-back]",
  forward: "account-step-stage--forward animate-[account-step-in-forward]",
  mode: "account-step-stage--mode animate-[account-step-in-mode] [animation-duration:190ms] [animation-timing-function:cubic-bezier(0.16,0.72,0.24,1)]",
} satisfies Record<AuthTransitionDirection, string>;
export const accountStepSummaryClassName =
  "account-step-summary grid gap-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-primary-soft) p-3 text-[13px] font-[750] text-(--color-text-muted) [&_strong]:min-w-0 [&_strong]:[overflow-wrap:anywhere] [&_strong]:text-[15px] [&_strong]:text-(--color-primary-strong)";
export const accountAlternateActionsClassName = "account-alternate-actions flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center text-[13px] font-[800] max-[520px]:grid max-[520px]:grid-cols-1";
export const accountTertiaryActionClassName =
  "account-tertiary-action inline-flex min-h-11 items-center justify-center gap-1.5 rounded-(--radius-sm) border-0 bg-transparent px-2 py-1 text-[13px] font-[850] text-(--color-primary-strong) underline-offset-4 transition-colors duration-150 hover:enabled:underline focus-visible:underline disabled:cursor-not-allowed disabled:text-(--color-text-subtle) [&_.icon]:size-4";

export function buildAccountAuthCardClassName(accountCardClassName: string, accountFormClassName: string) {
  return cn(
    accountCardClassName,
    "account-auth-card !gap-4 !overflow-visible !border-0 !bg-transparent !p-0 !shadow-none [&_.button]:min-h-11 [&_.button]:w-full",
    accountFormClassName,
  );
}
