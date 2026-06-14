import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Calm Travel Ops CSS contract", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const appSource = readFileSync("src/app/SagittariusApp.tsx", "utf8");
  const accountSource = readFileSync("src/components/AccountAccessPanel.tsx", "utf8");
  const activityPathGraphSource = readFileSync("src/components/ActivityPathGraphDay.tsx", "utf8");
  const contextRailSource = readFileSync("src/components/ContextRail.tsx", "utf8");
  const smartTableSource = readFileSync("src/components/SmartItineraryTable.tsx", "utf8");
  const motifSource = readFileSync("src/components/motifs.tsx", "utf8");
  const motifStories = readFileSync("src/components/motifs.stories.tsx", "utf8");
  const sourceFiles = collectSourceFiles("src").filter((file) => !file.endsWith(".test.ts") && !file.endsWith(".test.tsx"));

  it("keeps Tailwind available while preserving global design tokens", () => {
    expect(css).toContain('@import "tailwindcss";');
    expect(css).toContain("--font-sans:");
    expect(css).toContain("--shadow-panel:");
    expect(css).toContain("--radius-lg:");
    expect(css).toMatch(/:where\(button,\s*a,\s*input,\s*select,\s*textarea\):focus-visible/);
  });

  it("uses canonical Tailwind CSS variable shorthand for simple design token utilities", () => {
    const legacyVarUtilities = sourceFiles.flatMap((file) => {
      const matches = [...readFileSync(file, "utf8").matchAll(/(?:^|[\s"'`])(?:[\w:[\]&=./>-]+:)?(?:bg|border|fill|outline|ring|ring-offset|rounded|stroke|text)-\[var\(--[\w-]+\)\]/g)];
      return matches
        .map((match) => `${file}: ${match[0].trim()}`)
        .filter((text) => !text.includes("route-marker-text-color"));
    });

    expect(legacyVarUtilities).toEqual([]);
  });

  it("keeps the production palette away from the purple Joii prototype theme", () => {
    expect(css).toContain("--color-primary: #c24f16");
    expect(css).toContain("--color-primary-soft: #fff1ea");
    expect(css).toContain("--color-route: #2563eb");
    expect(css).not.toContain("#8b5cf6");
    expect(css).not.toContain("#6b38d4");
  });

  it("defines Friendly Trip Studio accents and motif classes", () => {
    expect(css).toContain("--color-sunshine: #facc15");
    expect(css).toContain("--color-sky: #38bdf8");
    expect(css).toContain("--color-postcard: #fff7ed");
    expect(css).toContain("--color-coral: #fb7185");
    expect(motifSource).toContain("travel-motif relative min-h-[88px] min-w-[180px]");
    expect(motifSource).toContain("travel-motif-path absolute inset-0");
    expect(motifSource).toContain("travel-motif-postcard absolute");
    expect(motifStories).toContain("TimelineMotif");
  });

  it("keeps the activity path graph on the product theme palette", () => {
    expect(activityPathGraphSource).toContain("bg-(--color-surface-subtle)");
    expect(activityPathGraphSource).toContain("var(--color-primary)");
    expect(activityPathGraphSource).toContain("var(--color-route)");
    expect(activityPathGraphSource).toContain("var(--color-warning)");
    expect(activityPathGraphSource).toContain("var(--color-coral)");
    expect(activityPathGraphSource).not.toContain("#0f1f1b");
    expect(activityPathGraphSource).not.toContain("#db0aa7");
    expect(activityPathGraphSource).not.toContain("#18e031");
  });

  it("keeps interactive audit targets finger-safe without enlarging visual graph dots", () => {
    expect(activityPathGraphSource).toContain("activity-path-graph-node absolute");
    expect(activityPathGraphSource).toContain("size-9");
    expect(activityPathGraphSource).toContain("before:size-3");
    expect(appSource).toContain("workspaceToastDismissClassName");
    expect(appSource).toContain("grid size-9 shrink-0");
    expect(contextRailSource).toContain("noteActionButtonClassName");
    expect(contextRailSource).toContain("inline-grid size-8");
    expect(contextRailSource).toContain("inspectorCloseButtonClassName");
    expect(contextRailSource).toContain("grid size-9");
    expect(contextRailSource).toContain("suggestionActionButtonClassName");
    expect(contextRailSource).toContain("min-h-8");
  });

  it("keeps motif motion reduced-motion safe", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\*\s*{/s);
    expect(css).not.toMatch(/\.travel-motif\s*{/s);
  });

  it("keeps postcard texture tokens opt-in instead of applying them to the cockpit body", () => {
    expect(css).toContain("--color-paper-warm: #fffaf0");
    expect(css).toContain("--paper-grain:");
    expect(css).toContain("--watercolor-page-wash:");
    expect(css).toContain("--watercolor-surface-wash:");
    expect(css).toMatch(/body\s*{[^}]*background:\s*var\(--color-page\)/s);
    expect(css).not.toMatch(/body\s*{[^}]*var\(--paper-grain\)[^}]*var\(--watercolor-page-wash\)/s);
    expect(accountSource).toContain("account-page min-h-screen bg-[var(--paper-grain),var(--watercolor-page-wash),var(--color-page)]");
    expect(motifSource).toContain("radial-gradient(circle_at_22%_35%");
    expect(css).not.toMatch(/url\(["']?.*paper/i);
  });

  it("contains horizontal scrolling to the smart table viewport", () => {
    expect(css).toMatch(/body\s*{[^}]*overflow-x:\s*hidden/s);
    expect(css).not.toMatch(/body\s*{[^}]*padding:\s*28px/s);
    expect(appSource).toContain("planning-main h-full min-h-0 min-w-0 overflow-y-auto");
    expect(smartTableSource).toContain("table-scroll m-0 h-auto min-h-0 w-full max-w-full overflow-x-auto");
    expect(smartTableSource).toContain("smart-table w-full min-w-[520px] table-fixed border-collapse");
  });

  it("keeps vertical scrolling on the planning shell instead of nesting table scrollbars", () => {
    expect(appSource).toContain("planning-main h-full min-h-0 min-w-0 overflow-y-auto");
    expect(smartTableSource).toContain("table-panel grid h-auto min-h-full min-w-0");
    expect(smartTableSource).toContain("overflow-visible bg-transparent");
    expect(smartTableSource).toContain("table-scroll m-0 h-auto min-h-0");
    expect(smartTableSource).toContain("overflow-x-auto overflow-y-hidden");
    expect(smartTableSource).toContain("[contain:paint]");
  });

  it("renders itinerary header controls as an animated overlay", () => {
    expect(smartTableSource).toContain("allowOverflow");
    expect(smartTableSource).toContain("page-header-actions relative z-[20]");
    expect(smartTableSource).toContain("itinerary-header-controls absolute right-0 top-[calc(100%_+_8px)]");
    expect(smartTableSource).toContain("w-[min(560px,calc(100vw_-_32px))]");
    expect(smartTableSource).toContain("grid-cols-[minmax(0,1fr)_minmax(160px,196px)]");
    expect(smartTableSource).toContain("min-h-9 w-full min-w-0 rounded-(--radius-sm)");
    expect(smartTableSource).toContain("[transition:opacity_160ms_var(--motion-ease-out),transform_160ms_var(--motion-ease-out),box-shadow_160ms_var(--motion-ease-out)]");
    expect(smartTableSource).toContain("data-[state=closed]:opacity-0");
    expect(smartTableSource).toContain("motion-reduce:transition-none");
    expect(css).toContain("@keyframes itinerary-controls-popover-in");
    expect(css).toContain("@keyframes itinerary-controls-popover-out");
    expect(css).toMatch(/\.itinerary-header-controls\[data-state="open"\]\s*{[^}]*animation:\s*itinerary-controls-popover-in 160ms/s);
  });

  it("defines desktop, tablet, mobile, focus, and reduced-motion states", () => {
    expect(contextRailSource).toContain("max-[1199px]:static");
    expect(contextRailSource).toContain("max-[1199px]:border-l-0");
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(":where(button, a, input, select, textarea):focus-visible");
  });

  it("locks the reference cockpit dimensions for pixel QA", () => {
    expect(appSource).toContain("workspace-grid relative grid h-screen");
    expect(appSource).toContain("grid-cols-[minmax(0,1fr)]");
    expect(contextRailSource).toContain("context-rail absolute right-0 top-0");
    expect(contextRailSource).toContain("w-[380px]");
  });

  it("overlays the right context rail instead of shrinking the table", () => {
    expect(appSource).toContain("workspace-grid relative grid");
    expect(contextRailSource).toContain("context-rail absolute right-0 top-0");
    expect(contextRailSource).toContain("max-[1199px]:static");
  });

  it("keeps hard-to-express map and timeline CSS in globals", () => {
    expect(css).toMatch(/\.route-map-canvas::before/s);
    expect(css).toMatch(/\.route-map-canvas::after/s);
    expect(css).toMatch(/\.route-map-canvas\[data-live-map-state="ready"\]::after\s*{[^}]*display:\s*none/s);
    expect(css).toMatch(/\.route-live-map\.maplibregl-map\s*{[^}]*position:\s*absolute/s);
    expect(css).toContain("@keyframes route-marker-in");
    expect(css).toMatch(/\.ofm-marker\s*{[^}]*display:\s*grid/s);
    expect(css).toMatch(/\.timeline-stop::before\s*{[^}]*content:\s*""/s);
  });

  it("keeps drawer transitions and the blank itinerary row skeleton contract", () => {
    expect(css).toContain("@keyframes drawer-slide-in");
    expect(contextRailSource).toContain("[transition:transform_220ms_ease,opacity_180ms_ease,box-shadow_220ms_ease]");
    expect(contextRailSource).toContain("data-[state=closed]:translate-x-6");
    expect(contextRailSource).toContain("shadow-[-28px_0_54px_rgb(15_23_42_/_0.18)]");
    expect(smartTableSource).toContain("item-placeholder-row [&_td]:bg-(--color-surface)");
    expect(smartTableSource).toContain("item-placeholder-cell min-w-0 bg-(--color-surface)");
    expect(smartTableSource).toContain("item-placeholder-canvas");
  });

});

function collectSourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return collectSourceFiles(path);
    if (/\.(ts|tsx)$/.test(path)) return [path];
    return [];
  });
}
