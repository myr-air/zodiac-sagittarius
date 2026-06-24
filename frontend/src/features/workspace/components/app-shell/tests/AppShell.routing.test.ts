import { describe, expect, it } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { appRoutes } from "@/src/routes/app-routes";
import { tripRoutes } from "@/src/trip/workspace/sagittarius-app/support/route-patterns";
import { resolveViewFromPath } from "../app-shell-routing";

describe("AppShell routing", () => {
  it("decodes short trip IDs in route path when resolving active view", () => {
    expect(resolveViewFromPath(appRoutes.tripItinerary(seedTrip.id), seedTrip.id, "overview")).toBe("itinerary");
    expect(resolveViewFromPath(appRoutes.tripExpenses(seedTrip.id), seedTrip.id, "overview")).toBe("expenses");
    expect(resolveViewFromPath(tripRoutes.itinerary(seedTrip.id), seedTrip.id, "overview")).toBe("itinerary");
    expect(resolveViewFromPath(tripRoutes.expenses(seedTrip.id), seedTrip.id, "overview")).toBe("expenses");
    expect(resolveViewFromPath(appRoutes.tripOverview(seedTrip.id), seedTrip.id, "overview")).toBe("overview");
  });
});
