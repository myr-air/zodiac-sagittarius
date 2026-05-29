import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Calm Travel Ops CSS contract", () => {
  const css = readFileSync("app/globals.css", "utf8");

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
    expect(css).toMatch(/\.travel-motif\s*{/s);
    expect(css).toMatch(/\.travel-motif-path\s*{/s);
    expect(css).toMatch(/\.travel-motif-postcard\s*{/s);
  });

  it("keeps motif motion reduced-motion safe", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.travel-motif/s);
  });

  it("contains horizontal scrolling to the smart table viewport", () => {
    expect(css).toMatch(/body\s*{[^}]*overflow-x:\s*hidden/s);
    expect(css).toMatch(/\.planning-main\s*{[^}]*overflow-y:\s*auto/s);
    expect(css).toMatch(/\.table-scroll\s*{[^}]*overflow-x:\s*auto/s);
    expect(css).toMatch(/\.smart-table\s*{[^}]*min-width:\s*960px/s);
  });

  it("keeps vertical scrolling inside the smart table viewport", () => {
    expect(css).toMatch(/\.table-scroll\s*{[^}]*height:\s*100%/s);
    expect(css).toMatch(/\.table-scroll\s*{[^}]*overflow-y:\s*auto/s);
  });

  it("defines desktop, tablet, mobile, focus, and reduced-motion states", () => {
    expect(css).toContain("@media (max-width: 1199px)");
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(":where(button, a, input, select, textarea):focus-visible");
  });

  it("locks the reference cockpit dimensions for pixel QA", () => {
    expect(css).toMatch(/\.app-layout\s*{[^}]*grid-template-columns:\s*228px minmax\(0,\s*1fr\)/s);
    expect(css).toMatch(/\.page-header\s*{[^}]*min-height:\s*126px/s);
    expect(css).toMatch(/\.workspace-grid\s*{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
    expect(css).toMatch(/\.context-rail\s*{[^}]*width:\s*380px/s);
  });

  it("overlays the right context rail instead of shrinking the table", () => {
    expect(css).toMatch(/\.workspace-grid\s*{[^}]*position:\s*relative/s);
    expect(css).toMatch(/\.context-rail\s*{[^}]*position:\s*absolute/s);
    expect(css).toMatch(/\.context-rail\s*{[^}]*right:\s*0/s);
  });

  it("defines itinerary-driven map and timeline surfaces", () => {
    expect(css).toMatch(/\.route-map-panel\s*{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\)/s);
    expect(css).toMatch(/\.route-map-layout\s*{[^}]*height:\s*100%/s);
    expect(css).toMatch(/\.route-map-canvas\s*{[^}]*min-height:\s*520px/s);
    expect(css).toMatch(/\.map-day-filter\s*{[^}]*position:\s*absolute/s);
    expect(css).toMatch(/\.route-live-map\s*{[^}]*position:\s*absolute/s);
    expect(css).toMatch(/\.timeline-stop-button\s*{[^}]*grid-template-columns:\s*56px 34px minmax\(0,\s*1fr\)/s);
  });

  it("animates row drag previews, day collapse, and drawer transitions", () => {
    expect(css).toContain("@keyframes drawer-slide-in");
    expect(css).toMatch(/\.context-rail\s*{[^}]*transition:\s*transform 220ms ease,\s*opacity 180ms ease,\s*box-shadow 220ms ease/s);
    expect(css).toMatch(/\.context-rail\[data-state="closed"\]\s*{[^}]*transform:\s*translateX\(24px\)/s);
    expect(css).toMatch(/\.context-rail\s*{[^}]*box-shadow:\s*-28px 0 54px rgb\(15 23 42 \/ 0\.18\)/s);
    expect(css).toMatch(/\.data-row\s*{[^}]*cursor:\s*pointer/s);
    expect(css).toMatch(/\.data-row--drop-target td\s*{[^}]*box-shadow:\s*inset 0 2px 0 var\(--color-primary\)/s);
    expect(css).toMatch(/\.day-group\[data-state="closed"\]\s+\.data-row td\s*{[^}]*height:\s*0/s);
  });

  it("keeps the collapsed navigation expand control visible", () => {
    expect(css).not.toMatch(/\.side-rail\[data-collapsed="true"\]\s+\.rail-toggle\s*{[^}]*display:\s*none/s);
    expect(css).toMatch(/\.side-rail\[data-collapsed="true"\]\s+\.rail-toggle\s*{[^}]*display:\s*(inline-flex|grid|flex)/s);
  });
});
