export const portalSearchClassName =
  "portal-search grid min-h-[46px] grid-cols-[20px_minmax(0,1fr)] items-center gap-2.5 rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) px-3 text-(--color-text-muted) [&_input]:min-w-0 [&_input]:border-0 [&_input]:bg-transparent [&_input]:font-[inherit] [&_input]:font-[750] [&_input]:text-(--color-text) [&_input]:outline-0";

export const portalMapPreviewClassName =
  "portal-map-preview relative min-h-[220px] overflow-hidden rounded-(--radius-lg) border border-(--color-border) bg-[linear-gradient(90deg,rgb(15_23_42_/_0.06)_1px,transparent_1px),linear-gradient(0deg,rgb(15_23_42_/_0.06)_1px,transparent_1px),var(--color-surface-subtle)] bg-[length:34px_34px,34px_34px,auto] max-[767px]:min-h-[220px]";

export const portalMapPinClassName =
  "portal-map-pin absolute left-[var(--pin-x)] top-[var(--pin-y)] z-[1] grid size-[34px] place-items-center rounded-full border border-(--color-primary-border) bg-(--color-surface) text-(--color-primary-strong) shadow-[var(--shadow-soft)]";
