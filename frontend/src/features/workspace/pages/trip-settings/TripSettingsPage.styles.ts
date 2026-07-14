import { cn } from "@/src/lib/cn";
import { fieldControlClassName } from "@/src/ui";

export const pageClassName = "trip-settings-page";
export const shellClassName = "grid w-full gap-3 max-[1199px]:gap-0";
export const contentGridClassName =
  "content-grid grid grid-cols-[minmax(0,1fr)_340px] gap-3 max-[1199px]:grid-cols-1 max-[1199px]:gap-0 max-[920px]:grid-cols-1";
export const formClassName = "grid gap-3.5";
export const fieldGridClassName = "field-grid grid grid-cols-2 gap-3 max-[767px]:grid-cols-1";
export const inputClassName = cn(fieldControlClassName, "focus:border-(--color-primary-border) focus:shadow-[0_0_0_3px_var(--color-primary-soft)]");
export const sideCardClassName = "grid content-start gap-3 bg-(--color-surface) max-[1199px]:border-t-0";
export const impactLineClassName =
  "trip-settings-impact-row grid grid-cols-[20px_minmax(0,1fr)] items-start gap-x-2 border-t border-(--color-border) py-3 text-[13px] leading-5 text-(--color-text-muted) first:border-t-0 first:pt-0 last:pb-0 [&_.icon]:mt-0.5 [&_.icon]:size-4 [&_.icon]:text-(--color-primary-strong)";
export const impactRowTitleClassName = "block text-xs font-black text-(--color-text)";
export const impactRowBodyClassName = "block font-semibold text-(--color-text-muted)";
export const actionRowClassName =
  "flex items-center justify-end gap-2 pt-1 max-[767px]:grid max-[767px]:grid-cols-1";
export const messageClassName = "text-[13px] font-bold leading-5";
export const errorClassName = "text-[#b91c1c]";
export const successClassName = "text-[#15803d]";
