import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const apiClientRoot = join(dirname(fileURLToPath(import.meta.url)), "../../api-client");

describe("trip API response mapper structure", () => {
  it("keeps response mapping split by trip domain responsibility", () => {
    expect(existsSync(join(apiClientRoot, "api-response-cockpit-mappers.ts"))).toBe(true);
    expect(existsSync(join(apiClientRoot, "api-response-itinerary-mappers.ts"))).toBe(true);
    expect(existsSync(join(apiClientRoot, "api-response-member-mappers.ts"))).toBe(true);
    expect(existsSync(join(apiClientRoot, "api-response-planning-mappers.ts"))).toBe(true);
    expect(existsSync(join(apiClientRoot, "api-response-record-mappers.ts"))).toBe(true);
  });

  it("keeps the mapper module as a compatibility barrel inside the API client boundary", () => {
    const barrel = readFileSync(join(apiClientRoot, "api-response-mappers.ts"), "utf8");

    expect(barrel).toContain("api-response-cockpit-mappers");
    expect(barrel).toContain("api-response-itinerary-mappers");
    expect(barrel).toContain("api-response-member-mappers");
    expect(barrel).toContain("api-response-planning-mappers");
    expect(barrel).toContain("api-response-record-mappers");
    expect(barrel).not.toContain("function mapCockpitResponse");
  });
});
