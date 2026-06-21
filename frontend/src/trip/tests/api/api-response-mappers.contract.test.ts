import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const tripRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

describe("trip API response mapper structure", () => {
  it("keeps response mapping split by trip domain responsibility", () => {
    expect(existsSync(join(tripRoot, "api-response-cockpit-mappers.ts"))).toBe(true);
    expect(existsSync(join(tripRoot, "api-response-itinerary-mappers.ts"))).toBe(true);
    expect(existsSync(join(tripRoot, "api-response-member-mappers.ts"))).toBe(true);
    expect(existsSync(join(tripRoot, "api-response-planning-mappers.ts"))).toBe(true);
    expect(existsSync(join(tripRoot, "api-response-record-mappers.ts"))).toBe(true);
  });

  it("keeps the legacy mapper module as a compatibility barrel", () => {
    const barrel = readFileSync(join(tripRoot, "api-response-mappers.ts"), "utf8");

    expect(barrel).toContain("api-response-cockpit-mappers");
    expect(barrel).toContain("api-response-itinerary-mappers");
    expect(barrel).toContain("api-response-member-mappers");
    expect(barrel).toContain("api-response-planning-mappers");
    expect(barrel).toContain("api-response-record-mappers");
    expect(barrel).not.toContain("function mapCockpitResponse");
  });
});
