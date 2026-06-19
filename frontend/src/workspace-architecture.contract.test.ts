import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const frontendRoot = resolve(testDir, "..");

describe("Sagittarius workspace architecture", () => {
  it("keeps account and trip access separated on production page routes", () => {
    expect(readFileSync(join(frontendRoot, "app/trips/new/page.tsx"), "utf8")).toContain('accessMode="account-login"');

    [
      "app/access/page.tsx",
      "app/trips/new/page.tsx",
      "app/trips/page.tsx",
      "app/portal/page.tsx",
      "app/portal/my-trips/page.tsx",
      "app/portal/explorer/page.tsx",
      "app/portal/to-dos/page.tsx",
      "app/portal/vault/page.tsx",
      "app/portal/settings/page.tsx",
      "app/portal/sign-out/page.tsx",
      "app/portal/trips/new/page.tsx",
    ].forEach((routeFile) => {
      const source = readFileSync(join(frontendRoot, routeFile), "utf8");
      expect(source).toContain("AccountApp");
      expect(source).not.toContain("SagittariusApp");
    });

    [
      "app/trips/page.tsx",
      "app/portal/page.tsx",
      "app/portal/my-trips/page.tsx",
      "app/portal/explorer/page.tsx",
      "app/portal/to-dos/page.tsx",
      "app/portal/vault/page.tsx",
      "app/portal/settings/page.tsx",
      "app/portal/sign-out/page.tsx",
      "app/portal/trips/new/page.tsx",
    ].forEach((routeFile) => {
      expect(readFileSync(join(frontendRoot, routeFile), "utf8")).toContain('accessMode="account-portal"');
    });

    [
      "app/join/page.tsx",
      "app/join/[joinCode]/page.tsx",
    ].forEach((routeFile) => {
      expect(readFileSync(join(frontendRoot, routeFile), "utf8")).toContain('accessMode="trip-access"');
    });

    const tripWorkspaceRoutes: Record<string, string> = {
      "app/trips/[tripId]/page.tsx": 'view="overview"',
      "app/trips/[tripId]/itinerary/page.tsx": 'view="itinerary"',
      "app/trips/[tripId]/map/page.tsx": 'view="map"',
      "app/trips/[tripId]/timeline/page.tsx": 'view="timeline"',
      "app/trips/[tripId]/bookings/page.tsx": 'view="bookings"',
      "app/trips/[tripId]/photos/page.tsx": 'view="photos"',
      "app/trips/[tripId]/members/page.tsx": 'view="members"',
      "app/trips/[tripId]/expenses/page.tsx": 'view="expenses"',
      "app/trips/[tripId]/settings/page.tsx": 'view="settings"',
    };

    Object.entries(tripWorkspaceRoutes).forEach(([routeFile, expectedView]) => {
      const source = readFileSync(join(frontendRoot, routeFile), "utf8");
      expect(source).toContain("TripWorkspaceApp");
      expect(source).toContain(expectedView);
      expect(source).not.toContain("SagittariusApp");
    });

    expect(readFileSync(join(frontendRoot, "src/features/workspace/components/app-shell/AppShell.tsx"), "utf8")).toContain("@/src/trip/workspace/planning-view");
    expect(readFileSync(join(frontendRoot, "src/routes/app-routes.ts"), "utf8")).toContain("@/src/trip/workspace/planning-view");
    expect(readFileSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceApp.tsx"), "utf8")).toContain(
      "@/src/trip/workspace/SagittariusApp",
    );
    expect(readFileSync(join(frontendRoot, "src/trip/workspace/TripWorkspaceApp.tsx"), "utf8")).not.toContain(
      "@/src/app/SagittariusApp",
    );
    expect(readFileSync(join(frontendRoot, "src/features/workspace/components/app-shell/AppShell.tsx"), "utf8")).not.toContain("@/src/app/SagittariusApp");
    expect(readFileSync(join(frontendRoot, "src/routes/app-routes.ts"), "utf8")).not.toContain("@/src/app/SagittariusApp");
  });
});
