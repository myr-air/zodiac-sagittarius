export const stripClassName =
  "weather-forecast-strip relative z-[1] mx-auto -mt-[18px] mb-3 w-[94%] overflow-hidden rounded-b-(--radius-lg) border border-t-0 border-(--color-border) bg-(--color-surface) px-4 pb-3 pt-8 shadow-[0_10px_22px_rgb(55_47_38_/_0.045)] max-[767px]:-mt-2 max-[767px]:w-[96%] max-[767px]:px-3 max-[767px]:pt-5";
export const rowClassName =
  "weather-forecast-row flex min-w-0 gap-3 overflow-x-auto whitespace-nowrap pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-[767px]:gap-2.5 max-[767px]:snap-x max-[767px]:snap-mandatory";
export const segmentClassName =
  "weather-forecast-segment grid min-w-[128px] cursor-pointer justify-items-center gap-1.5 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) px-2.5 py-2 text-center font-inherit text-(--color-text) transition-[border-color,background,box-shadow] duration-200 hover:border-(--color-route-border) hover:bg-(--color-surface) focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[rgb(191_219_254_/_0.72)] max-[767px]:w-[118px] max-[767px]:min-w-[118px] max-[767px]:shrink-0 max-[767px]:snap-center";
export const selectedClassName = "weather-forecast-segment--selected border-(--color-route-border) bg-(--color-route-soft) shadow-[0_2px_8px_rgb(37_99_235_/_0.10)]";
export const dayClassName = "text-[12px] font-black leading-4 inline-flex min-h-6 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface-subtle) px-2";
export const iconClassName = "weather-forecast-icon grid size-9 place-items-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-route) [&_.icon]:size-5";
export const tempClassName = "weather-forecast-temp inline-flex items-baseline justify-center gap-1.5 leading-none";
export const tempHighClassName = "weather-forecast-temp-high text-[16px] font-black text-(--color-text)";
export const tempLowClassName = "weather-forecast-temp-low text-[16px] font-bold text-(--color-text-muted)";
export const solarClassName = "weather-forecast-solar inline-flex items-center justify-center gap-1 text-[11px] font-extrabold leading-4 text-(--color-text-muted)";
export const pendingClassName = "weather-forecast-pending text-[12px] font-black leading-4 text-(--color-text-muted)";
export const emptyClassName = "weather-forecast-empty-state rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) px-4 py-3 text-xs font-black text-(--color-text-muted)";
