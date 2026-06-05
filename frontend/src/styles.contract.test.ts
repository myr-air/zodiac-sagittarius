import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Calm Travel Ops CSS contract", () => {
  const css = readFileSync("app/globals.css", "utf8");
  const appSource = readFileSync("src/app/SagittariusApp.tsx", "utf8");
  const activityPathGraphSource = readFileSync("src/components/ActivityPathGraphDay.tsx", "utf8");
  const contextRailSource = readFileSync("src/components/ContextRail.tsx", "utf8");
  const smartTableSource = readFileSync("src/components/SmartItineraryTable.tsx", "utf8");
  const motifSource = readFileSync("src/components/motifs.tsx", "utf8");
  const motifStories = readFileSync("src/components/motifs.stories.tsx", "utf8");

  it("keeps Tailwind available while preserving global design tokens", () => {
    expect(css).toContain('@import "tailwindcss";');
    expect(css).toContain("--font-sans:");
    expect(css).toContain("--shadow-panel:");
    expect(css).toContain("--radius-lg:");
    expect(css).toMatch(/:where\(button,\s*a,\s*input,\s*select,\s*textarea\):focus-visible/);
  });

  it("keeps the production palette away from the purple Joii prototype theme", () => {
    expect(css).toContain("--color-primary: #0f766e");
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
    expect(activityPathGraphSource).toContain("bg-[var(--color-surface-subtle)]");
    expect(activityPathGraphSource).toContain("var(--color-primary)");
    expect(activityPathGraphSource).toContain("var(--color-route)");
    expect(activityPathGraphSource).toContain("var(--color-warning)");
    expect(activityPathGraphSource).toContain("var(--color-coral)");
    expect(activityPathGraphSource).not.toContain("#0f1f1b");
    expect(activityPathGraphSource).not.toContain("#db0aa7");
    expect(activityPathGraphSource).not.toContain("#18e031");
  });

  it("keeps motif motion reduced-motion safe", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\*\s*{/s);
    expect(css).not.toMatch(/\.travel-motif\s*{/s);
  });

  it("adds subtle watercolor paper texture without image assets", () => {
    expect(css).toContain("--color-paper-warm: #fffaf0");
    expect(css).toContain("--paper-grain:");
    expect(css).toContain("--watercolor-page-wash:");
    expect(css).toContain("--watercolor-surface-wash:");
    expect(css).toMatch(/body\s*{[^}]*var\(--paper-grain\)[^}]*var\(--watercolor-page-wash\)/s);
    expect(motifSource).toContain("radial-gradient(circle_at_22%_35%");
    expect(css).not.toMatch(/url\(["']?.*paper/i);
  });

  it("contains horizontal scrolling to the smart table viewport", () => {
    expect(css).toMatch(/body\s*{[^}]*overflow-x:\s*hidden/s);
    expect(appSource).toContain("planning-main h-full min-h-0 min-w-0 overflow-y-auto");
    expect(smartTableSource).toContain("table-scroll m-0 h-auto min-h-0 w-full max-w-full overflow-x-auto");
    expect(smartTableSource).toContain("smart-table w-full min-w-[1010px] table-fixed border-collapse");
  });

  it("keeps vertical scrolling on the planning shell instead of nesting table scrollbars", () => {
    expect(appSource).toContain("planning-main h-full min-h-0 min-w-0 overflow-y-auto");
    expect(smartTableSource).toContain("table-panel grid h-auto min-h-full min-w-0");
    expect(smartTableSource).toContain("overflow-visible bg-[var(--color-page)]");
    expect(smartTableSource).toContain("table-scroll m-0 h-auto min-h-0");
    expect(smartTableSource).toContain("overflow-x-auto overflow-y-hidden");
    expect(smartTableSource).toContain("[contain:paint]");
  });

  it("defines desktop, tablet, mobile, focus, and reduced-motion states", () => {
    expect(contextRailSource).toContain("max-[1199px]:static");
    expect(contextRailSource).toContain("max-[1199px]:border-l-0");
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(":where(button, a, input, select, textarea):focus-visible");
  });

  it("locks the reference cockpit dimensions for pixel QA", () => {
    expect(appSource).toContain("workspace-grid relative grid h-[calc(100vh-62px)]");
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
    expect(css).toContain("@keyframes route-marker-in");
    expect(css).toMatch(/\.ofm-marker\s*{[^}]*display:\s*grid/s);
    expect(css).toMatch(/\.timeline-stop::before\s*{[^}]*content:\s*""/s);
  });

  it("animates row drag previews, day collapse, and drawer transitions", () => {
    expect(css).toContain("@keyframes drawer-slide-in");
    expect(contextRailSource).toContain("[transition:transform_220ms_ease,opacity_180ms_ease,box-shadow_220ms_ease]");
    expect(contextRailSource).toContain("data-[state=closed]:translate-x-6");
    expect(contextRailSource).toContain("shadow-[-28px_0_54px_rgb(15_23_42_/_0.18)]");
    expect(smartTableSource).toContain("data-row cursor-pointer");
    expect(smartTableSource).toContain("data-row--drop-target translate-y-px");
    expect(css).toMatch(/\.day-group\[data-state="closed"\]\s+\.data-row td\s*{[^}]*height:\s*0/s);
  });

});
