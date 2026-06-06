import type { SVGProps } from "react";

type IconName =
  | "alertCircle"
  | "calendar"
  | "check"
  | "chevronLeft"
  | "chevronRight"
  | "clock"
  | "cloud"
  | "copy"
  | "document"
  | "dots"
  | "drag"
  | "edit"
  | "export"
  | "eye"
  | "eyeOff"
  | "external"
  | "home"
  | "import"
  | "key"
  | "layout"
  | "lightbulb"
  | "list"
  | "location"
  | "map"
  | "menu"
  | "note"
  | "panel"
  | "plus"
  | "redo"
  | "route"
  | "settings"
  | "table"
  | "ticket"
  | "trash"
  | "undo"
  | "utensils"
  | "users"
  | "wallet"
  | "warning"
  | "x";

export function Icon({ name, className, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  const common = {
    className: ["icon size-[18px] shrink-0", className].filter(Boolean).join(" "),
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    ...props,
  };

  if (name === "alertCircle") return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16h.01" /></svg>;
  if (name === "calendar") {
    return <svg {...common}><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /></svg>;
  }
  if (name === "check") return <svg {...common}><path d="m20 6-11 11-5-5" /></svg>;
  if (name === "chevronLeft") return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>;
  if (name === "chevronRight") return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
  if (name === "clock") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
  if (name === "cloud") return <svg {...common}><path d="M17.5 19H7a4 4 0 0 1-.8-7.9 6 6 0 0 1 11.5-1.6A4.8 4.8 0 0 1 17.5 19Z" /><path d="m9 14 2 2 4-4" /></svg>;
  if (name === "copy") return <svg {...common}><rect x="9" y="9" width="13" height="13" rx="2" /><rect x="2" y="2" width="13" height="13" rx="2" /></svg>;
  if (name === "document") return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></svg>;
  if (name === "dots") return <svg {...common}><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>;
  if (name === "drag") return <svg {...common}><path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" /></svg>;
  if (name === "edit") return <svg {...common}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>;
  if (name === "eye") return <svg {...common}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
  if (name === "eyeOff") return <svg {...common}><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a16.7 16.7 0 0 1-3.1 4.1M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.1-.9" /></svg>;
  if (name === "export") return <svg {...common}><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 20h16" /></svg>;
  if (name === "external") return <svg {...common}><path d="M15 3h6v6M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>;
  if (name === "home") return <svg {...common}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></svg>;
  if (name === "import") return <svg {...common}><path d="M12 4v12" /><path d="m7 11 5 5 5-5" /><path d="M4 20h16" /></svg>;
  if (name === "key") return <svg {...common} data-testid="icon-key"><circle cx="7.5" cy="15.5" r="4.5" /><path d="m10.7 12.3 8.8-8.8M15 8l2 2M17.5 5.5l2 2" /></svg>;
  if (name === "layout") return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 3v18M3 9h18" /></svg>;
  if (name === "lightbulb") return <svg {...common}><path d="M9 18h6M10 22h4M8.5 14.5a6 6 0 1 1 7 0c-.9.7-1.5 1.7-1.5 2.5h-4c0-.8-.6-1.8-1.5-2.5Z" /></svg>;
  if (name === "list") return <svg {...common}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
  if (name === "location") return <svg {...common}><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
  if (name === "map") return <svg {...common}><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" /><path d="M9 3v15M15 6v15" /></svg>;
  if (name === "menu") return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
  if (name === "note") return <svg {...common}><path d="M4 4h16v14H7l-3 3V4Z" /></svg>;
  if (name === "panel") return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "redo") return <svg {...common}><path d="m17 1 4 4-4 4" /><path d="M3 11a4 4 0 0 1 4-4h14" /><path d="M7 7h7a7 7 0 0 1 0 14H6" /></svg>;
  if (name === "route") return <svg {...common}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h5a3 3 0 0 1 0 6h-2a3 3 0 0 0 0 6h5" /></svg>;
  if (name === "settings") return <svg {...common}><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" /></svg>;
  if (name === "table") return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 10v10M15 10v10" /></svg>;
  if (name === "ticket") return <svg {...common}><path d="M3 9a3 3 0 0 0 0 6v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" /><path d="M13 5v2M13 11v2M13 17v2" /></svg>;
  if (name === "trash") return <svg {...common}><path d="M3 6h18M8 6V4h8v2M6 6l1 16h10l1-16" /><path d="M10 11v6M14 11v6" /></svg>;
  if (name === "undo") return <svg {...common}><path d="m7 1-4 4 4 4" /><path d="M21 11a4 4 0 0 0-4-4H3" /><path d="M17 7h-7a7 7 0 0 0 0 14h8" /></svg>;
  if (name === "utensils") return <svg {...common}><path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M21 3v18M15 3v7a4 4 0 0 0 4 4h2" /></svg>;
  if (name === "users") return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  if (name === "wallet") return <svg {...common}><path d="M20 7H5a3 3 0 0 0 0 6h15v6H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h13a2 2 0 0 1 2 2v1Z" /><path d="M16 13h.01" /></svg>;
  if (name === "x") return <svg {...common}><path d="M18 6 6 18M6 6l12 12" /></svg>;
  return <svg {...common}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>;
}
