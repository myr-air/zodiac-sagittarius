import type { SVGProps } from "react";

export type IconName =
  | "alertCircle"
  | "badgeCheck"
  | "block"
  | "bus"
  | "calendar"
  | "car"
  | "check"
  | "checkCircle2"
  | "chevronDown"
  | "chevronLeft"
  | "chevronRight"
  | "circleDot"
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
  | "minusCircle"
  | "note"
  | "panel"
  | "plane"
  | "plus"
  | "redo"
  | "route"
  | "settings"
  | "ship"
  | "sun"
  | "sunrise"
  | "sunset"
  | "table"
  | "ticket"
  | "train"
  | "trash"
  | "undo"
  | "umbrella"
  | "utensils"
  | "users"
  | "wallet"
  | "walk"
  | "warning"
  | "x";

export function Icon({ name, className, ...props }: SVGProps<SVGSVGElement> & { name: IconName; title?: string }) {
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
  if (name === "badgeCheck") return <svg {...common}><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" /></svg>;
  if (name === "block") return <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>;
  if (name === "calendar") {
    return <svg {...common}><path d="M8 2v4M16 2v4M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="2" /></svg>;
  }
  if (name === "bus") return <svg {...common}><path d="M7 19v2M17 19v2" /><path d="M5 17h14" /><path d="M5 6h14l1 4v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7l1-4Z" /><path d="M8 6V3h8v3M4 11h16M8 15h.01M16 15h.01" /></svg>;
  if (name === "car") return <svg {...common}><path d="M7 17h10M6 17v2M18 17v2" /><path d="m5 12 2-5h10l2 5" /><path d="M4 12h16v5H4Z" /><path d="M8 15h.01M16 15h.01" /></svg>;
  if (name === "check") return <svg {...common}><path d="m20 6-11 11-5-5" /></svg>;
  if (name === "checkCircle2") return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
  if (name === "chevronLeft") return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>;
  if (name === "chevronRight") return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
  if (name === "chevronDown") return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
  if (name === "circleDot") return <svg {...common}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /></svg>;
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
  if (name === "minusCircle") return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /></svg>;
  if (name === "note") return <svg {...common}><path d="M4 4h16v14H7l-3 3V4Z" /></svg>;
  if (name === "panel") return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg>;
  if (name === "plane") return <svg {...common}><path d="M10.5 21 13 14l7-4a2 2 0 0 0-2-3.5l-7 4-6.5-3-1 2 5 4-3 5Z" /><path d="m14 11 4 8" /></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === "redo") return <svg {...common}><path d="m17 1 4 4-4 4" /><path d="M3 11a4 4 0 0 1 4-4h14" /><path d="M7 7h7a7 7 0 0 1 0 14H6" /></svg>;
  if (name === "route") return <svg {...common}><circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h5a3 3 0 0 1 0 6h-2a3 3 0 0 0 0 6h5" /></svg>;
  if (name === "settings") return <svg {...common}><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 1 1 4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1A2 2 0 1 1 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 1 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 1Z" /></svg>;
  if (name === "ship") return <svg {...common}><path d="M3 17h18" /><path d="M5 17 7 8h10l2 9" /><path d="M9 8V4h6v4M8 12h.01M12 12h.01M16 12h.01" /><path d="M4 20c1.5 1 3 1 4.5 0s3-1 4.5 0 3 1 4.5 0 2.5-1 3.5-.5" /></svg>;
  if (name === "sun") return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
  if (name === "sunrise") return <svg {...common}><path d="M4 18h16M6 14a6 6 0 0 1 12 0M12 2v8M8 6l4-4 4 4M4 10l1.5 1.5M20 10l-1.5 1.5" /></svg>;
  if (name === "sunset") return <svg {...common}><path d="M4 18h16M6 14a6 6 0 0 1 12 0M12 10V2M8 6l4 4 4-4M4 10l1.5 1.5M20 10l-1.5 1.5" /></svg>;
  if (name === "table") return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 10v10M15 10v10" /></svg>;
  if (name === "ticket") return <svg {...common}><path d="M3 9a3 3 0 0 0 0 6v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a3 3 0 0 0 0-6V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" /><path d="M13 5v2M13 11v2M13 17v2" /></svg>;
  if (name === "train") return <svg {...common}><rect x="5" y="3" width="14" height="14" rx="2" /><path d="M8 21h8M9 17l-2 4M15 17l2 4M8 7h8M8 11h.01M16 11h.01" /></svg>;
  if (name === "trash") return <svg {...common}><path d="M3 6h18M8 6V4h8v2M6 6l1 16h10l1-16" /><path d="M10 11v6M14 11v6" /></svg>;
  if (name === "undo") return <svg {...common}><path d="m7 1-4 4 4 4" /><path d="M21 11a4 4 0 0 0-4-4H3" /><path d="M17 7h-7a7 7 0 0 0 0 14h8" /></svg>;
  if (name === "umbrella") return <svg {...common}><path d="M3 13a9 9 0 0 1 18 0Z" /><path d="M12 13v5a2 2 0 0 0 4 0" /><path d="M4 13h16" /></svg>;
  if (name === "utensils") return <svg {...common}><path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18M21 3v18M15 3v7a4 4 0 0 0 4 4h2" /></svg>;
  if (name === "users") return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
  if (name === "wallet") return <svg {...common}><path d="M20 7H5a3 3 0 0 0 0 6h15v6H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h13a2 2 0 0 1 2 2v1Z" /><path d="M16 13h.01" /></svg>;
  if (name === "walk") return <svg {...common}><circle cx="13" cy="4" r="2" /><path d="m10 17-2 4M16 21l-2-5-3-2 1-5M7 9l5-2 4 3M12 14l-3-1" /></svg>;
  if (name === "x") return <svg {...common}><path d="M18 6 6 18M6 6l12 12" /></svg>;
  return <svg {...common}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>;
}
