import { describe, expect, it } from "vitest";
import { buildItineraryExport, parseItineraryImportDocument } from "../../itinerary-import-export";
import { tripFixture } from "@/src/trip/testing/fixtures/trip-fixtures";

describe("itinerary import/export Trip Plans", () => {
  it("preserves Trip Plan metadata in export and import documents", () => {
    const tripPlans = [
      {
        ...tripFixture.trip.planVariants[0],
        kind: "main" as const,
        status: "main" as const,
        description: "Current usable plan",
        version: 7,
      },
      {
        id: "plan-client-proposal",
        tripId: tripFixture.trip.id,
        name: "Client proposal",
        kind: "split" as const,
        status: "proposal" as const,
        description: "Presented to tour guests",
        version: 2,
      },
    ];

    const exported = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: [tripFixture.planItems[0]],
      trip: {
        ...tripFixture.trip,
        activePlanVariantId: tripPlans[1].id,
        mainTripPlanId: tripPlans[0].id,
        planVariants: tripPlans,
        tripPlans,
      },
    });

    expect(exported.trip).toMatchObject({
      activePlanVariantId: "plan-client-proposal",
      mainTripPlanId: tripPlans[0].id,
      planVariants: tripPlans,
      tripPlans,
    });
    expect(parseItineraryImportDocument(JSON.stringify(exported)).trip).toMatchObject({
      activePlanVariantId: "plan-client-proposal",
      mainTripPlanId: tripPlans[0].id,
      planVariants: tripPlans,
      tripPlans,
    });
  });

  it("normalizes legacy-only Trip Plan metadata in import documents", () => {
    const legacyPlan = {
      ...tripFixture.trip.planVariants[0],
      status: undefined,
      kind: "split" as const,
      version: 3,
    };
    const payload = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: [tripFixture.planItems[0]],
      trip: tripFixture.trip,
    });
    const legacyOnlyPayload = {
      ...payload,
      trip: {
        ...payload.trip,
        tripPlans: undefined,
        planVariants: [legacyPlan],
      },
    };

    const document = parseItineraryImportDocument(JSON.stringify(legacyOnlyPayload));

    expect(document.trip.planVariants).toEqual([
      {
        ...legacyPlan,
        status: "proposal",
      },
    ]);
    expect(document.trip.tripPlans).toEqual(document.trip.planVariants);
  });

  it("normalizes canonical-only Trip Plan metadata in import documents", () => {
    const canonicalPlan = {
      ...tripFixture.trip.planVariants[0],
      kind: "main" as const,
      status: "main" as const,
      description: "Canonical Trip Plan export",
      version: 4,
    };
    const payload = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: [tripFixture.planItems[0]],
      trip: tripFixture.trip,
    });
    const canonicalOnlyPayload = {
      ...payload,
      trip: {
        ...payload.trip,
        activePlanVariantId: undefined,
        mainTripPlanId: canonicalPlan.id,
        planVariants: undefined,
        tripPlans: [canonicalPlan],
      },
    };

    const document = parseItineraryImportDocument(JSON.stringify(canonicalOnlyPayload));

    expect(document.trip).toMatchObject({
      activePlanVariantId: canonicalPlan.id,
      mainTripPlanId: canonicalPlan.id,
      planVariants: [canonicalPlan],
      tripPlans: [canonicalPlan],
    });
  });

  it("rejects mixed Trip Plan aliases when identities or versions drift", () => {
    const payload = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: [tripFixture.planItems[0]],
      trip: tripFixture.trip,
    });
    const tripPlans = payload.trip.tripPlans ?? [];
    expect(tripPlans).not.toHaveLength(0);

    expect(() =>
      parseItineraryImportDocument(
        JSON.stringify({
          ...payload,
          trip: {
            ...payload.trip,
            planVariants: [
              {
                ...tripPlans[0],
                id: "different-plan-id",
              },
            ],
          },
        }),
      ),
    ).toThrow(/unsupported itinerary import/i);

    expect(() =>
      parseItineraryImportDocument(
        JSON.stringify({
          ...payload,
          trip: {
            ...payload.trip,
            planVariants: [
              {
                ...tripPlans[0],
                version: (tripPlans[0].version ?? 0) + 1,
              },
            ],
          },
        }),
      ),
    ).toThrow(/unsupported itinerary import/i);
  });

  it("rejects mixed Trip Plan aliases when mapped kind or status drifts", () => {
    const payload = buildItineraryExport({
      exportedAt: "2026-06-04T12:00:00.000Z",
      items: [tripFixture.planItems[0]],
      trip: tripFixture.trip,
    });
    const tripPlans = payload.trip.tripPlans ?? [];
    expect(tripPlans).not.toHaveLength(0);

    expect(() =>
      parseItineraryImportDocument(
        JSON.stringify({
          ...payload,
          trip: {
            ...payload.trip,
            planVariants: [
              {
                ...tripPlans[0],
                kind: "split",
                status: "proposal",
              },
            ],
          },
        }),
      ),
    ).toThrow(/unsupported itinerary import/i);
  });
});
