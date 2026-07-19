import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

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

describe("landing access navigation links", () => {
  it("routes Log in and Trip access to /login and /trip-access (not hash stubs)", () => {
    const header = readLandingSource("components/landing/LandingPage.tsx");
    const footer = readLandingSource("components/landing/LandingFooter.tsx");
    const band = readLandingSource("components/landing/TripAccessBand.tsx");

    expect(hrefForAnchorLabel(header, "Log in")).toBe("/login");
    expect(hrefForAnchorLabel(header, "Trip access")).toBe("/trip-access");

    expect(hrefForAnchorLabel(footer, "Log in")).toBe("/login");
    expect(hrefForAnchorLabel(footer, "Trip access")).toBe("/trip-access");

    expect(hrefForAnchorLabel(band, "Trip access")).toBe("/trip-access");
  });
});
