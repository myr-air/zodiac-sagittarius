export const rootClassName = [
  "language-switch",
  "relative",
  "inline-flex",
  "w-fit",
  "max-w-full",
  "items-center",
];

export const triggerClassName = [
  "language-switch-trigger",
  "inline-flex",
  "min-h-10",
  "min-w-10",
  "max-w-full",
  "items-center",
  "justify-center",
  "gap-1.5",
  "rounded-(--radius-md)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "px-3",
  "text-[12px]",
  "font-extrabold",
  "leading-4",
  "text-(--color-text)",
  "shadow-[0_1px_2px_rgb(15_23_42_/_0.06)]",
  "transition-[background,border-color,box-shadow]",
  "duration-150",
  "hover:border-(--color-primary-border)",
  "hover:bg-(--color-primary-soft)",
  "focus-visible:outline-none",
  "focus-visible:border-(--color-primary)",
  "focus-visible:ring-2",
  "focus-visible:ring-[rgb(15_118_110_/_0.16)]",
  "data-[open=true]:border-(--color-primary-border)",
  "data-[open=true]:bg-(--color-primary-soft)",
  "data-[open=true]:text-(--color-primary-strong)",
  "[&_.icon]:size-[15px]",
];

export const menuClassName = [
  "language-switch-menu",
  "fixed",
  "z-50",
  "grid",
  "w-[min(320px,calc(100vw-24px))]",
  "max-w-[calc(100vw-24px)]",
  "gap-3",
  "rounded-(--radius-md)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "p-3",
  "shadow-[0_14px_30px_rgb(15_23_42_/_0.14)]",
];

export const menuHeaderClassName = "grid gap-1 border-b border-(--color-border) pb-2";
export const menuTitleClassName = "text-[13px] font-extrabold leading-5 text-(--color-text)";
export const menuSummaryClassName = "text-[11px] font-bold leading-4 text-(--color-text-muted)";
export const sectionClassName = ["grid", "gap-2"];
export const sectionLabelClassName = "text-[11px] font-extrabold leading-4 text-(--color-text-muted)";
export const optionGridClassName = "grid grid-cols-2 gap-2";

export const optionClassName = [
  "language-switch-option",
  "grid",
  "min-h-[44px]",
  "grid-cols-[minmax(0,1fr)_auto]",
  "items-center",
  "gap-2",
  "rounded-(--radius-md)",
  "border",
  "border-(--color-border)",
  "bg-(--color-surface)",
  "px-2.5",
  "text-left",
  "text-[12px]",
  "font-extrabold",
  "text-(--color-text)",
  "shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]",
  "transition-[background,border-color,color,box-shadow]",
  "duration-150",
  "hover:border-(--color-primary-border)",
  "hover:bg-(--color-primary-soft)",
  "focus-visible:outline-none",
  "focus-visible:border-(--color-primary)",
  "focus-visible:ring-2",
  "focus-visible:ring-[rgb(15_118_110_/_0.14)]",
];

export const activeOptionClassName = [
  "language-switch-option--active",
  "border-(--color-primary-border)",
  "bg-(--color-primary-soft)",
  "text-(--color-primary-strong)",
  "shadow-none",
  "[&_.language-switch-option-detail]:text-current",
  "[&_.language-switch-option-meta]:text-current",
];

export const optionDetailClassName = "language-switch-option-detail block truncate text-[11px] font-bold leading-4 text-(--color-text-muted)";
export const optionMetaClassName = "language-switch-option-meta inline-flex size-5 items-center justify-center rounded-full bg-(--color-surface-subtle) text-[11px] font-black leading-none text-(--color-text-muted)";
export const checkClassName = "text-(--color-primary) opacity-0 data-[active=true]:opacity-100";
export const activeCurrencyIconClassName = "language-switch-option-meta text-(--color-primary) [&_.icon]:size-4";
export const MENU_WIDTH = 320;
export const MENU_GAP = 8;
export const VIEWPORT_MARGIN = 12;
