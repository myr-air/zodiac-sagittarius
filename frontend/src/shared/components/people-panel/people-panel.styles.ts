import type { Member } from "@/src/trip/types";

export const peopleModuleClassName =
  "detail-section people-module grid w-full min-w-0 gap-3 rounded-(--radius-md) border border-[color-mix(in_srgb,var(--color-route-border)_48%,var(--color-border))] bg-[linear-gradient(180deg,rgb(255_255_255)_0%,color-mix(in_srgb,var(--color-route-soft)_34%,var(--color-surface))_100%)] p-3.5 shadow-[0_1px_0_rgb(15_23_42_/_0.04)]";
export const peopleHeadingClassName =
  "m-0 text-[15px] font-extrabold leading-[21px] text-(--color-text)";
export const peopleListClassName = "people-list grid min-w-0 gap-2";
export const personRowClassName =
  "person-row grid min-h-[68px] min-w-0 grid-cols-[34px_minmax(220px,1fr)_auto] items-center gap-2.5 rounded-(--radius-sm) border border-[color-mix(in_srgb,var(--color-border)_78%,var(--color-route-border))] bg-[rgb(255_255_255_/_0.82)] p-2.5 text-[11px] leading-4 text-(--color-text-muted) shadow-[0_1px_0_rgb(15_23_42_/_0.035)] data-[access-status=disabled]:bg-(--color-surface-muted) data-[access-status=disabled]:opacity-75 max-[1199px]:grid-cols-[34px_minmax(0,1fr)]";
export const personAvatarClassName =
  "person-avatar grid size-[34px] place-items-center rounded-full text-sm font-extrabold text-white";
export const memberIdentityClassName =
  "member-identity grid min-w-0 gap-1 [&_span]:text-[12px] [&_span]:font-semibold [&_span]:text-(--color-text-muted) [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_strong]:text-[13px] [&_strong]:font-extrabold [&_strong]:leading-[18px] [&_strong]:text-(--color-text)";
export const memberStatusStackClassName =
  "member-status-stack flex min-w-0 flex-wrap gap-1.5";
export const memberStatePillClassName =
  "member-state-pill inline-flex min-h-[22px] items-center rounded-full border px-2 py-0.5 text-[11px] font-extrabold leading-4";
export const memberStatePillToneClassNames = {
  active:
    "member-state-pill--active border-(--color-success-border) bg-(--color-success-soft) text-(--color-success)",
  claimed:
    "member-state-pill--claimed border-(--color-success-border) bg-(--color-success-soft) text-(--color-success)",
  disabled:
    "member-state-pill--disabled border-(--color-danger-border) bg-(--color-danger-soft) text-(--color-danger)",
  pending:
    "member-state-pill--pending border-(--color-warning-border) bg-(--color-warning-soft) text-(--color-warning-strong)",
} satisfies Record<"active" | "claimed" | "disabled" | "pending", string>;
export const memberControlsClassName =
  "member-controls flex min-w-0 flex-wrap justify-end gap-1.5 max-[1199px]:col-start-2 max-[1199px]:justify-start max-[767px]:w-full max-[767px]:[&>*]:flex-[1_1_150px]";
export const memberRoleSelectClassName =
  "member-role-select min-h-8 max-w-32 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) py-[5px] px-2.5 text-[13px] font-bold leading-5 text-(--color-text) cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary-border)";
export const resetClaimButtonClassName =
  "reset-claim-button inline-flex min-h-8 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) py-[5px] px-3 text-[13px] font-bold text-(--color-warning-strong) transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-(--color-primary) hover:shadow-[0_6px_8px_rgb(15_118_110_/_0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary-border)";
export const presencePillClassName =
  "presence-pill col-start-2 inline-flex min-h-[22px] items-center justify-center justify-self-start gap-1.5 whitespace-nowrap rounded-full px-2 text-[11px] font-extrabold leading-4 text-(--color-text-muted) before:size-1.5 before:rounded-full before:bg-(--color-text-subtle) before:content-['']";
export const presencePillToneClassNames = {
  away: "presence-pill--away before:bg-(--color-text-subtle)",
  offline: "presence-pill--offline before:bg-(--color-text-subtle)",
  online: "presence-pill--online before:bg-(--color-success)",
} satisfies Record<Member["presence"], string>;
export const membersEmptyStateClassName =
  "members-empty-state grid min-w-0 justify-items-center gap-2 rounded-(--radius-md) border border-dashed border-(--color-border-strong) bg-(--color-surface-subtle) p-7 text-center text-(--color-text-muted) [&_strong]:text-sm [&_strong]:leading-5 [&_strong]:text-(--color-text)";
