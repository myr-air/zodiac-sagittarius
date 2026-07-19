import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { landingCopy } from "../landing/landing-copy";

const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readLandingSource(relativePath: string): string {
  return readFileSync(join(frontendRoot, relativePath), "utf8");
}

/** First <a> / <Link> whose visible text equals `label`; returns its href. */
function hrefForAnchorLabel(source: string, label: string): string {
  const tagRe = /<(?:a|Link)\b([^>]*)>([\s\S]*?)<\/(?:a|Link)>/g;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(source)) !== null) {
    const attrs = match[1]!;
    const text = match[2]!.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text !== label) continue;
    const href = /href=["']([^"']+)["']/.exec(attrs);
    if (!href) {
      throw new Error(`Anchor "${label}" has no href`);
    }
    return href[1]!;
  }
  throw new Error(`No anchor labeled "${label}"`);
}

/** Href for an anchor whose children are `{copy.<key>}`. */
function hrefForCopyExpr(source: string, copyExpr: string): string {
  const tagRe = /<(?:a|Link)\b([^>]*)>([\s\S]*?)<\/(?:a|Link)>/g;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(source)) !== null) {
    const attrs = match[1]!;
    const text = match[2]!.replace(/\s+/g, " ").trim();
    if (text !== `{${copyExpr}}`) continue;
    const href = /href=["']([^"']+)["']/.exec(attrs);
    if (!href) {
      throw new Error(`Anchor {${copyExpr}} has no href`);
    }
    return href[1]!;
  }
  throw new Error(`No anchor for {${copyExpr}}`);
}

describe("landing access navigation links", () => {
  it("routes Log in and Trip access to /login and /trip-access (not hash stubs)", () => {
    const header = readLandingSource("components/landing/LandingPage.tsx");
    const footer = readLandingSource("components/landing/LandingFooter.tsx");
    const band = readLandingSource("components/landing/TripAccessBand.tsx");

    expect(hrefForCopyExpr(header, "copy.logIn")).toBe("/login");
    expect(hrefForCopyExpr(header, "copy.tripAccess")).toBe("/trip-access");
    expect(landingCopy("EN").logIn).toBe("Log in");
    expect(landingCopy("EN").tripAccess).toBe("Trip access");

    expect(hrefForAnchorLabel(footer, "Log in")).toBe("/login");
    expect(hrefForAnchorLabel(footer, "Trip access")).toBe("/trip-access");

    expect(hrefForAnchorLabel(band, "Trip access")).toBe("/trip-access");
  });
});
