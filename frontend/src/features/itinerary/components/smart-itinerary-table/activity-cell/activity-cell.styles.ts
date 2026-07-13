export const activityCellClassName =
  "activity-cell relative grid min-h-[60px] min-w-0 grid-cols-[96px_minmax(0,1fr)] items-stretch gap-1.5 px-2 py-1 transition-[background,box-shadow] duration-150 data-[selected=true]:border-l-[3px] data-[selected=true]:border-l-(--color-primary) data-[details-open=true]:shadow-[inset_2px_0_0_0_var(--color-route)] max-[520px]:w-full max-[520px]:grid-cols-[72px_minmax(0,1fr)] max-[520px]:items-start max-[520px]:gap-x-1.5 max-[520px]:gap-y-0 max-[520px]:px-2 max-[520px]:py-1.5";
export const activityTimeRailClassName =
  "flex min-w-0 items-start text-[11px] font-medium leading-4 text-(--color-text-muted) max-[520px]:grid max-[520px]:justify-items-center max-[520px]:pt-0 max-[360px]:items-center";
export const activityTimeButtonClassName =
  "activity-time-button grid min-h-[52px] w-full content-start justify-items-center rounded-(--radius-sm) border border-transparent bg-transparent px-1 pt-1 text-center font-mono text-[11px] font-medium leading-4 text-(--color-text) outline-none transition-colors duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:text-(--color-route) focus:border-(--color-route-border) focus:bg-(--color-route-soft) focus:text-(--color-route) focus:ring-2 focus:ring-(--color-focus) disabled:cursor-default disabled:text-(--color-text-muted)";
export const activityTimeStartClassName = "block leading-4 font-medium";
export const activityTimeEndClassName =
  "block leading-4 font-normal text-(--color-text-muted) group-hover/activity:text-(--color-text-muted)";
export const activityTimeDurationClassName =
  "block leading-4 font-normal text-(--color-text-muted)";
export const activityTimeFlexibleClassName =
  "block leading-4 font-normal text-(--color-text-muted)";
export const activityTimeNextDayClassName =
  "block leading-4 font-extrabold text-(--color-accent)";
export const activityTypeRailClassName =
  "flex min-w-0 items-start justify-start max-[520px]:absolute max-[520px]:right-0 max-[520px]:top-0 max-[520px]:z-10";
export const activityRailColumnClassName =
  "flex flex-col min-w-0 items-center gap-0.5 max-[520px]:contents";
export const activityCompactTypePickerClassName =
  "activity-type-picker-compact !min-h-7 !h-7 !w-7 shrink-0 justify-center rounded-(--radius-sm) border-transparent bg-transparent !px-0 !py-0 text-(--color-text-muted) hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:text-(--color-route) aria-[expanded=true]:border-(--color-route-border) aria-[expanded=true]:bg-(--color-route-soft) aria-[expanded=true]:text-(--color-route) [&_.icon]:size-3.5 [&_.inline-option-picker-label]:hidden";
export const activityBodyClassName =
  "min-w-0 space-y-1 max-[520px]:col-start-2 max-[520px]:w-full max-[520px]:max-w-full";
export const activityMainLineClassName = "grid min-w-0 grid-cols-1 items-start";
export const activitySentenceClassName =
  "flex min-w-0 items-baseline gap-1 overflow-hidden whitespace-normal break-words text-sm font-normal leading-5 text-(--color-text) max-[520px]:block";
export const activityTitleInputClassName =
  "min-h-5 w-full min-w-[8ch] max-w-full shrink-0 border-0 border-b border-transparent bg-transparent px-0 py-0 text-sm font-normal leading-5 text-(--color-text) outline-none transition-colors duration-150 [field-sizing:content] placeholder:text-(--color-text-muted) hover:not-disabled:border-(--color-border) focus:border-(--color-route) focus:ring-0 disabled:cursor-default disabled:border-transparent max-[520px]:w-full max-[520px]:max-w-full";
export const activityPlaceInputClassName =
  "inline-block min-h-5 min-w-[8ch] max-w-full flex-1 border-0 border-b border-transparent bg-transparent px-0 py-0 text-xs font-normal leading-5 text-(--color-text-muted) outline-none transition-colors duration-150 [field-sizing:content] placeholder:text-(--color-text-muted) hover:not-disabled:border-(--color-border) focus:border-(--color-route) focus:ring-0 disabled:cursor-default disabled:border-transparent";
export const activityRouteLineClassName =
  "grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)] items-baseline gap-x-1.5 gap-y-0 text-xs leading-5 text-(--color-text-muted) max-[520px]:grid-cols-[auto_minmax(0,1fr)]";
export const activityRouteLabelClassName =
  "text-[10px] font-extrabold uppercase text-(--color-text-muted)";
export const activityTransportLineClassName =
  "flex min-h-5 min-w-0 items-center gap-1.5 text-xs leading-5 text-(--color-text-muted) [&_.icon]:size-3.5 [&_.icon]:text-(--color-route) max-[520px]:flex [&_span]:text-[11px] [&_span]:font-medium";
export const activityPlaceLineClassName =
  "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-baseline gap-1.5 text-xs leading-5 text-(--color-text-muted)";
export const activityIdentityClassName =
  "flex min-w-0 items-baseline gap-1";
export const activityIdentityActivityClassName =
  "flex min-w-0 items-baseline";
export const activityIdentityAtGlyphClassName =
  "shrink-0 select-none text-xs font-normal leading-5 text-(--color-text-subtle)";
export const activityIdentityPlaceClassName =
  "flex min-w-0 items-baseline";
export const activityDetailsToggleClassName =
  "inline-flex size-5 shrink-0 items-center justify-center rounded-(--radius-sm) border border-transparent bg-transparent text-(--color-text-muted) transition-colors duration-150 hover:border-(--color-border) hover:bg-(--color-surface) hover:text-(--color-text) [&_.icon]:size-3.5";
export const activityDetailsSectionClassName =
  "mt-1 min-w-0 space-y-1 pl-2 border-l border-(--color-border) text-xs leading-5 text-(--color-text-muted)";
export const activityNoteLineClassName =
  "min-w-0 truncate text-xs leading-5 text-(--color-text-muted)";
export const activityMobilePlaceInputClassName =
  "min-h-5 w-full min-w-0 truncate border-0 border-b border-transparent bg-transparent px-0 py-0 text-xs font-semibold leading-5 text-(--color-text-muted) outline-none transition-colors duration-150 placeholder:text-(--color-text-muted) hover:not-disabled:border-(--color-border) focus:border-(--color-route) focus:ring-0 disabled:cursor-default disabled:border-transparent";
export const activityActionsClassName =
  "flex shrink-0 flex-nowrap items-center justify-end gap-0.5 whitespace-nowrap max-[1023px]:hidden";
export const activityActionClusterClassName =
  "flex shrink-0 flex-nowrap items-center justify-end gap-0.5 overflow-visible whitespace-nowrap";
export const activityIconButtonClassName =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-(--radius-sm) border border-transparent bg-transparent text-(--color-text-muted) transition-colors duration-150 hover:border-(--color-border) hover:bg-(--color-surface) hover:text-(--color-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) [&_.icon]:size-3.5";
export const activityMetaClassName =
  "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1 text-[11px] font-bold leading-4 text-(--color-text-muted) max-[520px]:hidden";
export const activityMetaStatusClassName =
  "flex min-w-0 flex-wrap items-center justify-start gap-1";
export const activityTabletActionsClassName =
  "hidden size-7 shrink-0 items-center justify-center rounded-(--radius-sm) border border-transparent bg-transparent text-(--color-text-muted) transition-colors duration-150 hover:border-(--color-border) hover:bg-(--color-surface) hover:text-(--color-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) aria-[expanded=true]:border-(--color-route-border) aria-[expanded=true]:bg-(--color-route-soft) aria-[expanded=true]:text-(--color-route) max-[1279px]:inline-flex [&_.icon]:size-4";
export const activityTabletActionLayerClassName =
  "mt-1 hidden min-w-0 flex-wrap items-center justify-end gap-0.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-1 py-1 max-[1279px]:flex";
export const activityPillClassName =
  "inline-flex min-h-5 max-w-[148px] items-center gap-1 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-1.5 text-[11px] font-bold leading-4 text-(--color-text-muted)";
export const activityBookingButtonClassName =
  "inline-flex min-h-5 max-w-[164px] items-center gap-1 rounded-(--radius-sm) border px-1.5 text-[11px] font-extrabold leading-4 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50 [&_.icon]:size-3.5";
export const activityBookingButtonEmptyClassName =
  "border-(--color-border) bg-(--color-surface-subtle) text-(--color-text-muted) hover:border-(--color-border-strong) hover:bg-(--color-surface) hover:text-(--color-text)";
export const activityBookingButtonLinkedClassName =
  "border-(--color-route-border) bg-(--color-route-soft) text-(--color-route) hover:border-(--color-primary-border) hover:bg-(--color-primary-soft) hover:text-(--color-primary-strong)";
export const activityTypePickerClassName =
  "activity-type-picker !min-h-[52px] h-full w-full max-w-full shrink-0 items-start justify-start rounded-(--radius-sm) border-(--color-border) bg-(--color-surface-subtle) px-2 pt-1 text-left text-[11px] font-medium text-(--color-text-muted) hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:text-(--color-route) aria-[expanded=true]:border-(--color-route-border) aria-[expanded=true]:bg-(--color-route-soft) aria-[expanded=true]:text-(--color-route) max-[520px]:!min-h-7 max-[520px]:h-7 max-[520px]:w-7 max-[520px]:shrink-0 max-[520px]:justify-center max-[520px]:border-transparent max-[520px]:bg-transparent max-[520px]:!px-0 max-[520px]:!py-0 max-[520px]:[&_.inline-option-picker-label]:hidden [&_.icon]:size-3.5";
export const activityMobileLineClassName =
  "mobile-activity-line hidden min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 max-[520px]:grid";
export const activityMobileTypePickerClassName =
  "activity-type-picker-mobile !hidden !min-h-7 !w-7 shrink-0 justify-center rounded-(--radius-sm) border-transparent bg-transparent !px-0 !py-0 text-(--color-text-muted) hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:text-(--color-route) aria-[expanded=true]:border-(--color-route-border) aria-[expanded=true]:bg-(--color-route-soft) aria-[expanded=true]:text-(--color-route) max-[520px]:-mt-1.5 max-[520px]:!inline-flex [&_.icon]:size-3.5 [&_.inline-option-picker-label]:hidden";
export const activityMobileStatusClassName =
  "shrink-0 max-w-[82px] truncate rounded-full border border-(--color-border) bg-(--color-surface-subtle) px-1.5 text-[10px] font-extrabold leading-5 text-(--color-text-muted)";
export const subActivityListClassName =
  "sub-activity-list relative col-start-2 col-span-2 mt-1 grid min-w-0 gap-0.5 border-t border-dashed border-(--color-border) py-1.5 pl-5 before:pointer-events-none before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px before:bg-[linear-gradient(180deg,var(--color-route-border),color-mix(in_srgb,var(--color-route-border)_46%,transparent))] max-[640px]:hidden max-[520px]:col-start-1 max-[520px]:col-span-2 max-[360px]:col-span-1";
export const subActivityModalListClassName =
  "sub-activity-list grid min-w-0 gap-1";
export const subActivityLineClassName =
  "sub-activity-line relative grid min-w-0 grid-cols-[86px_minmax(0,1fr)_auto] items-center gap-1.5 rounded-(--radius-sm) px-1.5 py-1 text-xs leading-4 transition-colors duration-150 before:pointer-events-none before:absolute before:left-[-12px] before:top-[18px] before:h-px before:w-3 before:bg-(--color-route-border) hover:bg-(--color-surface-subtle) max-[760px]:grid-cols-[minmax(0,1fr)_auto]";
export const subActivityTextClassName =
  "sub-activity-text grid min-w-0 gap-0.5 text-xs font-normal leading-4 text-(--color-text)";
export const subActivityTitleInputClassName =
  "min-h-5 w-auto min-w-[8ch] max-w-full border-0 border-b border-transparent bg-transparent px-0 py-0 text-xs font-normal leading-4 text-(--color-text) outline-none transition-colors duration-150 [field-sizing:content] hover:not-disabled:border-(--color-border) focus:border-(--color-route) focus:ring-0 disabled:border-transparent";
export const subActivityActionsClassName =
  "flex min-w-0 shrink-0 flex-nowrap items-center justify-end gap-0.5 whitespace-nowrap";
export const addSubActivityButtonClassName =
  "mt-0.5 inline-flex min-h-6 w-fit items-center justify-center gap-1 rounded-(--radius-sm) border border-transparent bg-transparent px-1.5 text-[11px] font-extrabold text-(--color-route) transition-colors duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50";
export const addStopInlineButtonClassName =
  "inline-flex min-h-8 w-fit items-center justify-center gap-1.5 rounded-(--radius-sm) border border-transparent bg-transparent px-2 text-xs font-extrabold text-(--color-route) transition-colors duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50 [&_.icon]:size-3.5";
export const subActivityToggleButtonClassName =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-(--radius-sm) border border-transparent bg-transparent text-(--color-text-muted) transition-colors duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:text-(--color-route) aria-[expanded=true]:border-(--color-route-border) aria-[expanded=true]:bg-(--color-route-soft) aria-[expanded=true]:text-(--color-route) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) [&_.icon]:size-3.5";
export const subActivityModalBackdropClassName =
  "fixed inset-0 z-[70] grid place-items-end bg-[rgb(15_23_42_/_0.32)] p-3";
export const subActivityModalClassName =
  "grid max-h-[min(520px,calc(100dvh_-_24px))] w-full max-w-[420px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]";
export const subActivityModalHeaderClassName =
  "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-(--color-border) px-3 py-2.5";
export const subActivityModalTitleClassName =
  "min-w-0 text-sm font-extrabold leading-5 text-(--color-text) [&_span]:block [&_span]:truncate [&_small]:block [&_small]:text-[11px] [&_small]:font-bold [&_small]:text-(--color-text-muted)";
export const subActivityModalCloseClassName =
  "inline-flex size-8 items-center justify-center rounded-(--radius-sm) border border-transparent text-(--color-text-muted) hover:border-(--color-border) hover:bg-(--color-surface-subtle) hover:text-(--color-text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)";
export const subActivityModalBodyClassName = "min-h-0 overflow-auto p-3";
export const timeEditModalBackdropClassName =
  "fixed inset-0 z-[72] grid place-items-end bg-[rgb(15_23_42_/_0.32)] p-3 sm:place-items-center";
export const timeEditModalClassName =
  "grid w-full max-w-[380px] grid-rows-[auto_auto_auto] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]";
export const timeEditModalHeaderClassName =
  "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-(--color-border) px-3 py-2.5";
export const timeEditModalTitleClassName =
  "min-w-0 text-sm font-extrabold leading-5 text-(--color-text) [&_span]:block [&_span]:truncate [&_small]:block [&_small]:text-[11px] [&_small]:font-bold [&_small]:text-(--color-text-muted)";
export const timeEditModalBodyClassName = "grid gap-3 px-3 py-3";
export const timeEditFieldsClassName =
  "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2";
export const timeEditFieldClassName =
  "grid gap-1 text-[11px] font-extrabold leading-4 text-(--color-text-muted)";
export const timeEditInputClassName =
  "h-9 w-full rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 font-mono text-sm font-extrabold text-(--color-text) outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-(--color-text-subtle) focus:border-(--color-route-border) focus:shadow-[0_0_0_2px_rgb(191_219_254_/_0.55)] disabled:cursor-not-allowed disabled:bg-(--color-surface-muted)";
export const timeEditHelperClassName =
  "text-[11px] font-bold leading-4 text-(--color-text-muted)";
export const timeEditPreviewClassName =
  "grid gap-1 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-route-soft) px-2.5 py-2 text-xs text-(--color-route)";
export const timeEditPreviewValueClassName =
  "font-mono text-sm font-extrabold leading-5 text-(--color-text)";
export const timeEditNextDayClassName =
  "inline-flex min-h-7 w-fit items-center gap-1 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 text-[11px] font-extrabold text-(--color-text-muted) transition-colors duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:text-(--color-route) aria-[pressed=true]:border-(--color-route-border) aria-[pressed=true]:bg-(--color-route-soft) aria-[pressed=true]:text-(--color-route) disabled:cursor-not-allowed disabled:opacity-50";
export const timeEditModalFooterClassName =
  "flex items-center justify-end gap-2 border-t border-(--color-border) px-3 py-2.5";
export const timeEditCancelButtonClassName =
  "inline-flex min-h-8 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) hover:bg-(--color-surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)";
export const timeEditSaveButtonClassName =
  "inline-flex min-h-8 items-center justify-center rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-route) px-3 text-xs font-extrabold text-white hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50";
export const ticketModalBackdropClassName =
  "fixed inset-0 z-[74] grid place-items-end bg-[rgb(15_23_42_/_0.32)] p-3 sm:place-items-center";
export const ticketModalClassName =
  "grid max-h-[min(720px,calc(100dvh_-_24px))] w-full max-w-[620px] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]";
export const ticketModalHeaderClassName =
  "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-(--color-border) px-4 py-3";
export const ticketModalTitleClassName =
  "min-w-0 text-sm font-extrabold leading-5 text-(--color-text) [&_span]:block [&_span]:truncate [&_small]:block [&_small]:text-[11px] [&_small]:font-bold [&_small]:text-(--color-text-muted)";
export const ticketModalBodyClassName = "grid min-h-0 gap-3 overflow-auto px-4 py-3";
export const ticketModeToggleClassName =
  "grid grid-cols-2 gap-2 rounded-(--radius-sm) bg-(--color-surface-subtle) p-1";
export const ticketModeButtonClassName =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-(--radius-sm) border border-transparent px-2 text-xs font-extrabold text-(--color-text-muted) transition-colors duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) hover:text-(--color-route) aria-pressed:border-(--color-route-border) aria-pressed:bg-(--color-route-soft) aria-pressed:text-(--color-route)";
export const ticketExistingGridClassName = "grid gap-1.5";
export const ticketExistingOptionClassName =
  "grid min-h-11 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 py-2 text-left text-xs transition-colors duration-150 hover:border-(--color-route-border) hover:bg-(--color-route-soft) has-[:checked]:border-(--color-route-border) has-[:checked]:bg-(--color-route-soft) [&_input]:size-4 [&_strong]:block [&_strong]:truncate [&_span]:block [&_span]:truncate [&_span]:font-semibold [&_span]:text-(--color-text-muted)";
export const ticketFieldGridClassName = "grid grid-cols-2 gap-2 max-[640px]:grid-cols-1";
export const ticketFieldClassName =
  "grid min-w-0 gap-1 text-[11px] font-extrabold leading-4 text-(--color-text-muted) [&_input]:min-h-9 [&_input]:rounded-(--radius-sm) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-2.5 [&_input]:text-sm [&_textarea]:min-h-[72px] [&_textarea]:resize-y [&_textarea]:rounded-(--radius-sm) [&_textarea]:border [&_textarea]:border-(--color-border) [&_textarea]:bg-(--color-surface) [&_textarea]:px-2.5 [&_textarea]:py-2 [&_textarea]:text-sm";
export const ticketLinkedItemsClassName =
  "grid max-h-40 gap-1 overflow-auto rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) p-2";
export const ticketLinkedOptionClassName =
  "grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-(--radius-sm) px-1.5 py-1 text-xs font-semibold text-(--color-text-muted) hover:bg-(--color-surface) [&_input]:size-4 [&_span]:truncate";
export const ticketModalFooterClassName =
  "flex flex-wrap items-center justify-end gap-2 border-t border-(--color-border) px-4 py-3";
export const ticketModalUnlinkButtonClassName =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) hover:border-(--color-danger-border) hover:bg-(--color-danger-soft) hover:text-(--color-danger) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50";
export const ticketModalCancelButtonClassName =
  "inline-flex min-h-9 items-center justify-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-3 text-xs font-extrabold text-(--color-text-muted) hover:bg-(--color-surface-subtle) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)";
export const ticketModalSaveButtonClassName =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-(--radius-sm) border border-(--color-route-border) bg-(--color-route) px-3 text-xs font-extrabold text-white hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50";
export const noteModalSaveButtonClassName =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-(--radius-sm) border border-(--color-primary-border) bg-(--color-primary) px-3 text-xs font-extrabold text-white hover:bg-(--color-primary-strong) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50";
