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

  it("contains horizontal scrolling to the smart table viewport", () => {
    expect(css).toMatch(/body\s*{[^}]*overflow-x:\s*hidden/s);
    expect(css).toMatch(/\.table-scroll\s*{[^}]*overflow-x:\s*auto/s);
    expect(css).toMatch(/\.smart-table\s*{[^}]*min-width:\s*920px/s);
  });

  it("defines desktop, tablet, mobile, focus, and reduced-motion states", () => {
    expect(css).toContain("@media (max-width: 1199px)");
    expect(css).toContain("@media (max-width: 767px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(":where(button, a, input, select, textarea):focus-visible");
  });
});
