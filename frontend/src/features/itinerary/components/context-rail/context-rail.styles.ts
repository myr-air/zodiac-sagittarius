export const suggestionListClassName = "suggestion-list grid gap-1.5";
export const suggestionItemBaseClassName =
  "suggestion-item grid grid-cols-[18px_minmax(0,1fr)] gap-2 text-xs leading-4 text-(--color-text-muted) [&_.icon]:size-4 [&>div]:grid [&>div]:gap-0.5 [&_strong]:font-semibold [&_strong]:text-(--color-text) [&_span]:text-(--color-text-muted)";
export const suggestionItemToneClassNames = {
  conflicted: "suggestion-item--conflicted [&_.icon]:text-(--color-warning)",
  pending: "suggestion-item--pending [&_.icon]:text-(--color-success)",
} satisfies Record<"conflicted" | "pending", string>;
export const suggestionActionsClassName =
  "suggestion-actions mt-1.5 flex flex-wrap gap-1.5";
export const suggestionActionButtonClassName =
  "min-h-8 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 text-[11px] font-extrabold text-(--color-primary-strong)";
export const conflictRowClassName =
  "conflict-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 text-[11px] leading-4 text-(--color-warning-strong)";
export const conflictSummaryClassName =
  "inline-flex items-center gap-1.5 [&_.icon]:text-(--color-warning)";
export const moduleListClassName = "grid list-none gap-2 p-0 m-0";
export const contextRailSurfaceItemClassName =
  "rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface-subtle) px-2.5";
export const noteItemClassName =
  `stop-note-item grid gap-1 py-[9px] ${contextRailSurfaceItemClassName} [&>p]:m-0 [&>p]:text-[11px] [&>p]:font-bold [&>p]:leading-4 [&>p]:text-(--color-text-muted) [&_strong]:text-xs [&_strong]:font-extrabold [&_strong]:leading-4 [&_strong]:text-(--color-text)`;
export const noteHeaderClassName =
  "stop-note-header flex items-center justify-between gap-2";
export const noteActionsClassName =
  "stop-note-actions inline-flex items-center gap-1.5";
export const noteActionButtonClassName =
  "inline-grid size-8 cursor-pointer place-items-center rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) text-(--color-text-muted) hover:border-(--color-primary) hover:text-(--color-primary-strong) focus-visible:border-(--color-primary) focus-visible:text-(--color-primary-strong) focus-visible:outline-none [&_.icon]:size-[15px]";
export const noteEditFormClassName = "stop-note-edit-form grid gap-2";
export const noteEditLabelClassName = "grid gap-1.5";
export const noteEditTextareaClassName =
  "min-h-20 resize-y rounded-(--radius-md) border border-(--color-border-strong) bg-(--color-surface) px-2.5 py-[9px] text-(--color-text)";
export const noteEditActionsClassName =
  "stop-note-edit-actions inline-flex items-center gap-1.5";
export const noteFormClassName = "stop-note-form grid gap-2";
export const noteFormLabelClassName =
  "grid gap-[5px] [&>span]:text-[11px] [&>span]:font-black [&>span]:text-(--color-text-muted)";
export const noteFormTextareaClassName =
  "min-h-[70px] w-full resize-y rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2.5 py-2 text-xs leading-[17px] text-(--color-text)";
export const noteAuthorClassName =
  "stop-note-author m-0 text-[11px] font-bold leading-4 text-(--color-text-muted)";
export const bookingAdvisoryClassName =
  "booking-advisory inline-flex w-fit items-center gap-1.5 rounded-full border border-(--color-warning-border) bg-(--color-warning-soft) px-2 py-1 text-[11px] font-black text-(--color-warning-strong) [&_.icon]:size-3.5";
export const bookingTaskClassName =
  `stop-booking-task grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1 py-[9px] ${contextRailSurfaceItemClassName} data-[status=done]:[&_span]:text-(--color-text-muted) data-[status=done]:[&_span]:line-through`;
export const bookingDocClassName =
  `stop-booking-doc grid gap-1 py-[9px] text-xs ${contextRailSurfaceItemClassName} [&_strong]:font-extrabold [&_strong]:leading-4 [&_strong]:text-(--color-text) [&_span]:text-[11px] [&_span]:font-bold [&_span]:leading-4 [&_span]:text-(--color-text-muted)`;
export const bookingDocTypeSelectClassName =
  "min-h-8 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 text-[11px] font-extrabold text-(--color-text) outline-none focus:border-(--color-route-border) focus:shadow-[0_0_0_2px_rgb(191_219_254_/_0.55)] disabled:cursor-not-allowed disabled:opacity-60";
export const bookingDocQuickFieldClassName =
  "min-h-8 rounded-(--radius-sm) border border-(--color-border) bg-(--color-surface) px-2 text-[11px] font-bold text-(--color-text) outline-none placeholder:text-(--color-text-muted) focus:border-(--color-route-border) focus:shadow-[0_0_0_2px_rgb(191_219_254_/_0.55)] disabled:cursor-not-allowed disabled:opacity-60";
export const bookingTaskLabelClassName =
  "inline-flex min-w-0 items-center gap-2 [&_input]:size-[15px] [&_input]:accent-[var(--color-primary)] [&_span]:text-xs [&_span]:font-extrabold [&_span]:leading-4 [&_span]:text-(--color-text)";
export const bookingTaskMetaClassName =
  "text-[11px] font-bold leading-4 text-(--color-text-muted)";
export const expenseGridClassName =
  "expense-grid grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5 text-xs [&_span]:text-(--color-text-muted) [&_strong]:text-base [&_strong]:font-bold [&_strong]:leading-[21px] [&_strong]:tabular-nums";
export const expenseFormClassName =
  "expense-form grid gap-2 [&_input]:min-h-8 [&_input]:rounded-(--radius-sm) [&_input]:border [&_input]:border-(--color-border) [&_input]:bg-(--color-surface) [&_input]:px-2 [&_input]:text-xs [&_select]:min-h-8 [&_select]:rounded-(--radius-sm) [&_select]:border [&_select]:border-(--color-border) [&_select]:bg-(--color-surface) [&_select]:px-2 [&_select]:text-xs [&_label]:grid [&_label]:gap-1 [&_label>span]:text-[11px] [&_label>span]:font-black [&_label>span]:text-(--color-text-muted)";
export const expenseItemClassName =
  `expense-item grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2 text-xs ${contextRailSurfaceItemClassName}`;
export const contextRailClassName =
  "context-rail absolute right-0 top-0 z-[3] h-full min-h-0 w-[380px] max-w-[min(380px,calc(100%_-_24px))] min-w-0 translate-x-0 bg-(--color-surface) opacity-100 shadow-[-28px_0_54px_rgb(15_23_42_/_0.18)] [transition:transform_220ms_ease,opacity_180ms_ease,box-shadow_220ms_ease] will-change-[transform,opacity] data-[state=closed]:pointer-events-none data-[state=closed]:translate-x-6 data-[state=closed]:shadow-[-8px_0_18px_rgb(15_23_42_/_0)] max-[1199px]:static max-[1199px]:w-full max-[1199px]:max-w-none max-[1199px]:shadow-none";
export const contextRailOpenClassName =
  "context-rail--open animate-[drawer-slide-in_220ms_ease-out_both]";
export const contextRailClosedClassName = "context-rail--closed";
export const railInspectorClassName =
  "rail-inspector h-full min-h-0 overflow-y-auto border-l border-(--color-border) bg-(--color-surface) max-[1199px]:min-h-0 max-[1199px]:border-l-0 max-[1199px]:border-t";
export const inspectorTitleClassName =
  "inspector-title grid min-h-[50px] grid-cols-[minmax(0,1fr)_36px] items-center gap-3 px-3.5 pl-4";
export const inspectorTitleHeadingClassName =
  "m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-extrabold leading-[22px] text-(--color-text)";
export const inspectorCloseButtonClassName =
  "grid size-9 place-items-center border-0 bg-transparent text-(--color-text) [&_.icon]:rotate-180";
export const inspectorTabsClassName =
  "inspector-tabs flex h-9 gap-6 border-y border-(--color-border) px-4 max-[767px]:gap-[18px] max-[767px]:overflow-x-auto";
export const inspectorTabClassName =
  "border-0 border-b-2 border-transparent bg-transparent text-xs font-bold text-(--color-text-muted) aria-selected:border-(--color-primary) aria-selected:text-(--color-primary-strong)";
export const mapLinkClassName =
  "map-link ml-[27px] text-xs font-semibold text-(--color-route) no-underline";
export const detailMapClassName =
  "detail-map relative min-h-[105px] overflow-hidden rounded-(--radius-sm) border border-(--color-border) bg-[linear-gradient(90deg,rgb(203_213_225_/_0.7)_1px,transparent_1px),linear-gradient(0deg,rgb(203_213_225_/_0.7)_1px,transparent_1px),linear-gradient(135deg,#f8fafc,#e0f2fe)] bg-[length:37px_37px,37px_37px,auto]";
export const mapRoadBaseClassName =
  "map-road absolute h-[5px] rounded-full bg-[#fca5a5] opacity-75 origin-left";
export const mapRoadOneClassName =
  "map-road-1 left-[-15px] top-[74px] w-[230px] -rotate-[31deg]";
export const mapRoadTwoClassName =
  "map-road-2 left-[18px] top-[18px] w-[210px] rotate-[8deg] bg-[#bfdbfe]";
export const mapRoadThreeClassName =
  "map-road-3 left-[98px] top-[88px] w-[180px] -rotate-[8deg] bg-[#bae6fd]";
export const mapWaterClassName =
  "map-water absolute right-0 bottom-0 h-[69px] w-[145px] rounded-tl-full bg-[rgb(125_211_252_/_0.28)]";
export const mapPoiClassName =
  "map-poi absolute text-[11px] font-bold text-(--color-text-subtle)";
export const mapMarkerClassName =
  "map-marker absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-(--color-danger) text-white shadow-[0_10px_20px_rgb(220_38_38_/_0.22)]";
export const detailSectionClassName =
  "detail-section grid gap-1.5 border-b border-(--color-border) px-4 py-2.5";
export const detailHeadingClassName =
  "m-0 text-[13px] font-extrabold leading-[18px] text-(--color-text-muted)";
export const detailMetaLineClassName =
  "m-0 inline-flex gap-[9px] text-xs leading-4 text-(--color-text-muted) [&_.icon]:text-(--color-text-muted)";
export const detailButtonClassName = "min-h-8 py-[5px]";
export const emptyWarningClassName = "empty-warning text-(--color-text-muted)";
