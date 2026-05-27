import type { SVGProps } from "react";

type IconName =
  | "calendar"
  | "chevronLeft"
  | "chevronRight"
  | "clock"
  | "layout"
  | "lightbulb"
  | "map"
  | "panel"
  | "plus"
  | "route"
  | "table"
  | "users"
  | "wallet"
  | "warning";

export function Icon({ name, className, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  const common = {
    className: ["icon", className].filter(Boolean).join(" "),
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    ...props,
  };

  if (name === "calendar") {
    return <svg {...common}><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /></svg>;
  }
  if (name === "chevronLeft") return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>;
  if (name === "chevronRight") return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  if (name === "layout") return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 3v18M3 9h18" /></svg>;
  if (name === "lightbulb") return <svg {...common}><path d="M9 18h6M10 22h4M8.5 14.5a6 6 0 1 1 7 0c-.9.7-1.5 1.7-1.5 2.5h-4c0-.8-.6-1.8-1.5-2.5Z" /></svg>;
  if (name === "map") return <svg {...common}><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" /><path d="M9 3v15M15 6v15" /></svg>;
  if (name === "panel") return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "route") return <svg {...common}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h5a3 3 0 0 1 0 6h-2a3 3 0 0 0 0 6h5" /></svg>;
  if (name === "table") return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 10v10M15 10v10" /></svg>;
  if (name === "users") return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  if (name === "wallet") return <svg {...common}><path d="M20 7H5a3 3 0 0 0 0 6h15v6H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h13a2 2 0 0 1 2 2v1Z" /><path d="M16 13h.01" /></svg>;
  return <svg {...common}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>;
}
