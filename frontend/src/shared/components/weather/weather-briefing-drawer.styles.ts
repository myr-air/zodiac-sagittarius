export const drawerClassName =
  "weather-briefing-drawer fixed bottom-0 right-0 top-0 z-[50] grid w-[min(720px,78vw)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-l border-(--color-border) bg-(--color-surface) shadow-[-28px_0_70px_rgb(15_23_42_/_0.18)] transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none max-[767px]:top-auto max-[767px]:h-[88vh] max-[767px]:w-full max-[767px]:rounded-t-[24px] max-[767px]:border-l-0 max-[767px]:border-t max-[767px]:shadow-[0_-24px_70px_rgb(15_23_42_/_0.22)]";
export const drawerHeaderClassName = "grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-(--color-border) px-5 py-4";
export const drawerBodyClassName = "grid min-h-0 grid-cols-2 gap-3 overflow-auto p-5 max-[767px]:grid-cols-1";
export const briefingBlockClassName = "grid content-start gap-1 rounded-(--radius-md) border border-(--color-border) bg-(--color-surface-subtle) p-4";
export const metaClassName = "text-[11px] font-extrabold leading-4 text-(--color-text-muted)";
export const textAreaClassName = "min-h-16 rounded-(--radius-sm) border border-(--color-border) bg-white p-2 text-sm font-bold text-(--color-text)";
