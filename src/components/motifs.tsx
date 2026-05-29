import type { HTMLAttributes } from "react";

type MotifTone = "route" | "sunshine" | "postcard";

interface TravelMotifProps extends HTMLAttributes<HTMLDivElement> {
  tone?: MotifTone;
}

export function TravelMotif({ tone = "route", className = "", ...props }: TravelMotifProps) {
  return (
    <div className={["travel-motif", `travel-motif--${tone}`, className].filter(Boolean).join(" ")} aria-hidden="true" {...props}>
      <svg className="travel-motif-path" viewBox="0 0 220 96" focusable="false">
        <path d="M16 72 C54 18 84 18 112 48 S168 84 204 28" />
        <circle cx="16" cy="72" r="7" />
        <circle cx="112" cy="48" r="6" />
        <circle cx="204" cy="28" r="8" />
      </svg>
      <span className="travel-motif-postcard" />
      <span className="travel-motif-pin" />
    </div>
  );
}

export function TimelineMotif() {
  return <TravelMotif tone="route" className="travel-motif--timeline" />;
}
