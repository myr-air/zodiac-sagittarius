import type { HTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

export const travelMotifToneValues = ["route", "sunshine", "postcard"] as const;
export type TravelMotifTone = (typeof travelMotifToneValues)[number];

export const travelMotifToneClassNames: Record<TravelMotifTone, string> = {
  route: "travel-motif--route",
  sunshine: "travel-motif--sunshine text-(--color-warning)",
  postcard: "travel-motif--postcard text-(--color-primary)",
};

interface TravelMotifProps extends HTMLAttributes<HTMLDivElement> {
  tone?: TravelMotifTone;
}

export function TravelMotif({ tone = "route", className = "", ...props }: TravelMotifProps) {
  return (
    <div
      className={cn(
        "travel-motif relative min-h-[88px] min-w-[180px] text-(--color-route)",
        travelMotifToneClassNames[tone],
        className,
      )}
      aria-hidden="true"
      {...props}
    >
      <span className="absolute inset-[10px_8px_2px] rounded-full bg-[radial-gradient(circle_at_22%_35%,rgb(250_204_21_/_0.22),transparent_28%),radial-gradient(circle_at_64%_52%,rgb(56_189_248_/_0.16),transparent_34%),radial-gradient(circle_at_82%_40%,rgb(251_113_133_/_0.14),transparent_28%)]" />
      <svg className="travel-motif-path absolute inset-0 z-[1] h-full w-full overflow-visible fill-none [&_circle]:fill-(--color-surface) [&_circle]:stroke-current [&_circle]:stroke-[3] [&_path]:stroke-current [&_path]:stroke-4 [&_path]:[stroke-dasharray:8_10] [&_path]:[stroke-linecap:round]" viewBox="0 0 220 96" focusable="false">
        <path d="M16 72 C54 18 84 18 112 48 S168 84 204 28" />
        <circle cx="16" cy="72" r="7" />
        <circle cx="112" cy="48" r="6" />
        <circle cx="204" cy="28" r="8" />
      </svg>
      <span className="travel-motif-postcard absolute right-[18px] bottom-2 z-[1] block h-9 w-[54px] rotate-[-4deg] rounded-(--radius-sm) border border-(--color-warning-border) bg-(--color-postcard) shadow-[0_10px_24px_rgb(15_23_42_/_0.08)]" />
      <span className="travel-motif-pin absolute top-2 left-[34px] z-[1] block size-[22px] rotate-[-45deg] rounded-[999px_999px_999px_4px] border border-(--color-warning-border) bg-(--color-sunshine) shadow-[0_10px_24px_rgb(15_23_42_/_0.08)]" />
    </div>
  );
}

export function TimelineMotif() {
  return <TravelMotif tone="route" className="travel-motif--timeline min-w-[220px]" />;
}
