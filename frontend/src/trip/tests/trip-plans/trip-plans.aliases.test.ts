import { describe, expect, it } from "vitest";
import {
  legacyKindForPlanStatus,
  mergePublishedTripPlan,
  normalizeTripPlanAliases,
  normalizeTripPlanSummary,
  planStatusForLegacyKind,
  setLocalMainTripPlan,
  tripPlanAliasesMatch,
  updateTripPlanInTrip,
} from "@/src/trip/trip-plans";
import { seedTrip } from "@/src/trip/seed";
import type { Trip } from "@/src/trip/types";
import { plan } from "./trip-plans.test-support";

describe("trip plan aliases", () => {
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

  it("sets the local main Trip Plan across aliases and normalized statuses", () => {
    const updated = setLocalMainTripPlan(seedTrip, "plan-rain");

    expect(updated.activePlanVariantId).toBe("plan-rain");
    expect(updated.mainTripPlanId).toBe("plan-rain");
    expect(
      updated.planVariants.find((candidate) => candidate.id === "plan-rain"),
    ).toMatchObject({ kind: "main", status: "main" });
    expect(
      updated.planVariants.find(
        (candidate) => candidate.id === seedTrip.activePlanVariantId,
      ),
    ).toMatchObject({ kind: "backup", status: "backup" });
    expect(updated.tripPlans).toEqual(updated.planVariants);
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

  it("compares canonical and legacy Trip Plan aliases from one shared rule", () => {
    const canonical = [
      plan({ id: "plan-main", kind: "main", status: "main", version: 2 }),
      plan({ id: "plan-rain", kind: "split", status: "proposal", version: 3 }),
    ];
    const legacy = canonical.map((tripPlan) => ({ ...tripPlan }));

    expect(tripPlanAliasesMatch(canonical, legacy)).toBe(true);
    expect(tripPlanAliasesMatch(canonical, [
      legacy[0]!,
      { ...legacy[1]!, version: 4 },
    ])).toBe(false);
    expect(tripPlanAliasesMatch(canonical, [
      legacy[0]!,
      { ...legacy[1]!, kind: "backup", status: "backup" },
    ])).toBe(false);
  });
});
