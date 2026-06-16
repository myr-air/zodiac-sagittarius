import { describe, expect, it } from "vitest";
import {
  createLocalTripPlan,
  legacyKindForPlanStatus,
  mergePublishedTripPlan,
  normalizeTripPlanAliases,
  normalizeTripPlanSummary,
  planStatusForLegacyKind,
  updateTripPlanInTrip,
} from "@/src/trip/trip-plans";
import { seedTrip } from "@/src/trip/seed";
import type { PlanVariant, Trip } from "@/src/trip/types";

function plan(input: Partial<PlanVariant> & Pick<PlanVariant, "id">): PlanVariant {
  return {
    tripId: seedTrip.id,
    name: input.id,
    kind: "draft",
    description: "",
    ...input,
  };
}

describe("trip plans", () => {
  it("normalizes plan aliases onto the selected main Trip Plan", () => {
    const trip: Trip = {
      ...seedTrip,
      activePlanVariantId: "plan-backup",
      mainTripPlanId: undefined,
      planVariants: [
        plan({ id: "plan-main", kind: "main" }),
        plan({ id: "plan-backup", kind: "backup" }),
      ],
      tripPlans: [
        plan({ id: "plan-backup", kind: "draft", name: "Backup alias" }),
        plan({ id: "plan-draft", kind: "split" }),
      ],
    };

    const normalized = normalizeTripPlanAliases(trip);

    expect(normalized.activePlanVariantId).toBe("plan-backup");
    expect(normalized.mainTripPlanId).toBe("plan-backup");
    expect(normalized.planVariants.map(({ id, kind, status }) => ({
      id,
      kind,
      status,
    }))).toEqual([
      { id: "plan-backup", kind: "main", status: "main" },
      { id: "plan-draft", kind: "split", status: "proposal" },
      { id: "plan-main", kind: "backup", status: "backup" },
    ]);
    expect(normalized.tripPlans).toEqual(normalized.planVariants);
  });

  it("updates an existing plan in both compatibility aliases", () => {
    const updated = updateTripPlanInTrip(seedTrip, {
      ...seedTrip.planVariants[1],
      name: "Indoor rain plan",
      status: "backup",
    });

    expect(
      updated.planVariants.find((candidate) => candidate.id === "plan-rain")
        ?.name,
    ).toBe("Indoor rain plan");
    expect(
      updated.tripPlans?.find((candidate) => candidate.id === "plan-rain")
        ?.name,
    ).toBe("Indoor rain plan");
  });

  it("adds a new plan and preserves the existing main plan", () => {
    const updated = updateTripPlanInTrip(seedTrip, {
      id: "plan-food",
      tripId: seedTrip.id,
      name: "Food crawl",
      kind: "split",
      status: "proposal",
      description: "",
    });

    expect(updated.mainTripPlanId).toBe(seedTrip.activePlanVariantId);
    expect(
      updated.planVariants.find((candidate) => candidate.id === "plan-food"),
    ).toMatchObject({ kind: "split", status: "proposal" });
    expect(updated.tripPlans).toEqual(updated.planVariants);
  });

  it("merges a published trip plan response into local Trip Plan aliases", () => {
    const nextTripVersion = (seedTrip.version ?? 1) + 1;
    const publishedMain = plan({
      id: "plan-rain",
      kind: "main",
      status: "main",
      name: "Published rain plan",
      version: 6,
    });
    const publishedTrip: Trip = {
      ...seedTrip,
      activePlanVariantId: "plan-rain",
      mainTripPlanId: "plan-rain",
      planVariants: [publishedMain],
      tripPlans: [publishedMain],
      version: nextTripVersion,
    };

    const merged = mergePublishedTripPlan(seedTrip, publishedTrip, "plan-rain");

    expect(merged.version).toBe(nextTripVersion);
    expect(merged.mainTripPlanId).toBe("plan-rain");
    expect(merged.activePlanVariantId).toBe("plan-rain");
    expect(
      merged.planVariants.find((candidate) => candidate.id === "plan-rain"),
    ).toMatchObject({
      name: "Published rain plan",
      kind: "main",
      status: "main",
      version: 6,
    });
    expect(
      merged.planVariants.find((candidate) => candidate.id === seedTrip.activePlanVariantId),
    ).toMatchObject({ kind: "backup", status: "backup" });
    expect(merged.tripPlans).toEqual(merged.planVariants);
  });

  it("keeps a locally created Trip Plan when the published trip response omits it", () => {
    const createdVariant = plan({
      id: "plan-new-local",
      name: "New local plan",
      status: "draft",
    });
    const publishedTrip: Trip = {
      ...seedTrip,
      activePlanVariantId: "",
      mainTripPlanId: undefined,
      planVariants: [],
      tripPlans: undefined,
      version: undefined,
    };

    const merged = mergePublishedTripPlan(
      seedTrip,
      publishedTrip,
      createdVariant.id,
      createdVariant,
    );

    expect(merged.version).toBe(seedTrip.version);
    expect(merged.mainTripPlanId).toBe(createdVariant.id);
    expect(merged.activePlanVariantId).toBe(createdVariant.id);
    expect(
      merged.planVariants.find((candidate) => candidate.id === createdVariant.id),
    ).toMatchObject({ kind: "main", status: "main" });
    expect(merged.tripPlans).toEqual(merged.planVariants);
  });

  it("creates a local draft Trip Plan in both compatibility aliases", () => {
    const result = createLocalTripPlan(
      seedTrip,
      "Museum day",
      (plans) => `plan-local-${plans.length + 1}`,
    );

    expect(result.tripPlanId).toBe(`plan-local-${seedTrip.planVariants.length + 1}`);
    expect(
      result.trip.planVariants.find((candidate) => candidate.id === result.tripPlanId),
    ).toEqual({
      id: result.tripPlanId,
      tripId: seedTrip.id,
      name: "Museum day",
      kind: "draft",
      status: "draft",
      description: "",
      version: 1,
    });
    expect(result.trip.tripPlans).toEqual(result.trip.planVariants);
  });

  it("preserves canonical tripPlans when creating a local draft Trip Plan", () => {
    const existingTripPlan = plan({
      id: "plan-canonical-only",
      name: "Canonical only",
    });
    const trip: Trip = {
      ...seedTrip,
      tripPlans: [existingTripPlan],
    };

    const result = createLocalTripPlan(
      trip,
      "Food day",
      () => "plan-food-day",
    );

    expect(result.trip.tripPlans?.map((candidate) => candidate.id)).toEqual([
      existingTripPlan.id,
      "plan-food-day",
    ]);
    expect(result.trip.planVariants.map((candidate) => candidate.id)).toContain("plan-food-day");
  });

  it("maps legacy plan kinds and Trip Plan statuses", () => {
    expect(planStatusForLegacyKind("split")).toBe("proposal");
    expect(planStatusForLegacyKind("backup")).toBe("backup");
    expect(legacyKindForPlanStatus("proposal")).toBe("split");
    expect(legacyKindForPlanStatus("draft")).toBe("draft");
    expect(
      normalizeTripPlanSummary(
        plan({ id: "plan-main", kind: "backup", status: "backup" }),
        "plan-main",
      ),
    ).toMatchObject({ kind: "main", status: "main" });
  });
});
