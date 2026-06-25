import { describe, expect, it } from "vitest";
import { seedTrip } from "../../seed";
import {
  buildTripPlanStatusLabelSelectOptions,
  buildTripPlanStatusSelectOptions,
  buildTripPlanSelectOptions,
  defaultTripPlanId,
  findTripPlanById,
  findTripPlanOptionById,
  formatTripPlanOptionLabel,
  tripHasPlan,
  tripPlanName,
  tripPlanOptions,
  tripPlanStatusSelectValues,
} from "../../trip-plans";

describe("trip plan display", () => {
  it("centralizes canonical Trip Plan options and default ids", () => {
    const canonicalTripPlans = [
      {
        ...seedTrip.planVariants[1],
        id: "canonical-rain",
      },
    ];

    expect(tripPlanOptions({
      ...seedTrip,
      tripPlans: canonicalTripPlans,
    })).toBe(canonicalTripPlans);
    expect(tripPlanOptions({
      ...seedTrip,
      tripPlans: undefined,
    })).toBe(seedTrip.planVariants);
    expect(defaultTripPlanId({
      ...seedTrip,
      activePlanVariantId: "",
      mainTripPlanId: "",
      tripPlans: canonicalTripPlans,
    })).toBe("canonical-rain");
    expect(findTripPlanOptionById(canonicalTripPlans, "canonical-rain")).toBe(
      canonicalTripPlans[0],
    );
  });

  it("defaults to the main Trip Plan even when it is not the first option", () => {
    const backupPlan = {
      ...seedTrip.planVariants[1],
      id: "plan-backup-first",
      kind: "backup" as const,
      status: "backup" as const,
    };
    const mainPlan = {
      ...seedTrip.planVariants[0],
      id: "plan-main-second",
      kind: "main" as const,
      status: "main" as const,
    };

    expect(defaultTripPlanId({
      ...seedTrip,
      activePlanVariantId: "",
      mainTripPlanId: "",
      planVariants: [backupPlan, mainPlan],
      tripPlans: [backupPlan, mainPlan],
    })).toBe("plan-main-second");
    expect(defaultTripPlanId({
      ...seedTrip,
      activePlanVariantId: "plan-backup-first",
      mainTripPlanId: "",
      planVariants: [backupPlan, mainPlan],
      tripPlans: [backupPlan, mainPlan],
    })).toBe("plan-main-second");
  });

  it("resolves Trip Plan names from canonical tripPlans", () => {
    expect(tripPlanName(seedTrip, "plan-rain")).toBe("แผนฝนตก");
    expect(findTripPlanById(seedTrip, "plan-rain")?.name).toBe("แผนฝนตก");
  });

  it("builds select options from Trip Plan ids and names", () => {
    expect(buildTripPlanSelectOptions([
      { id: "plan-main", name: "Main Plan" },
      { id: "plan-rain", name: "Rain Plan" },
    ])).toEqual([
      { value: "plan-main", label: "Main Plan" },
      { value: "plan-rain", label: "Rain Plan" },
    ]);
  });

  it("builds Trip Plan status labels and select options from domain values", () => {
    const statusLabels = {
      main: "Main",
      proposal: "Proposal",
      draft: "Draft",
      backup: "Backup",
    };
    const plans = [
      {
        kind: "split",
        id: "split-1",
        name: "Split",
        tripId: "trip-1",
        description: "",
        status: "proposal",
      },
    ] as const;

    expect(tripPlanStatusSelectValues).toEqual([
      "main",
      "draft",
      "backup",
      "proposal",
    ]);
    expect(formatTripPlanOptionLabel(plans[0], statusLabels)).toBe("Split - Proposal");
    expect(buildTripPlanStatusLabelSelectOptions(plans, statusLabels)).toEqual([
      { value: "split-1", label: "Split - Proposal" },
    ]);
    expect(buildTripPlanStatusSelectOptions(statusLabels)).toEqual([
      { value: "main", label: "Main", disabled: true },
      { value: "draft", label: "Draft" },
      { value: "backup", label: "Backup" },
      { value: "proposal", label: "Proposal" },
    ]);
  });

  it("falls back to legacy planVariants when canonical tripPlans are omitted", () => {
    expect(tripPlanName({ ...seedTrip, tripPlans: undefined }, "plan-rain")).toBe("แผนฝนตก");
  });

  it("keeps unknown and unassigned plan ids readable", () => {
    expect(tripPlanName(seedTrip, "missing-plan")).toBe("missing-plan");
    expect(tripPlanName(seedTrip, null)).toBe("Unassigned");
    expect(tripPlanName(seedTrip, undefined, "No plan")).toBe("No plan");
    expect(findTripPlanById(seedTrip, null)).toBeNull();
    expect(findTripPlanOptionById(seedTrip.planVariants, "missing-plan")).toBeNull();
    expect(tripHasPlan(seedTrip, "plan-rain")).toBe(true);
    expect(tripHasPlan(seedTrip, "missing-plan")).toBe(false);
  });
});
