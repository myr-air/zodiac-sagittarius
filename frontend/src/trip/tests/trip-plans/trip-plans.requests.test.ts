import { describe, expect, it } from "vitest";
import {
  buildCreateTripPlanRequest,
  buildPatchTripPlanStatusRequest,
  buildRenameTripPlanRequest,
  buildSetMainTripPlanRequest,
} from "@/src/trip/trip-plans";
import { plan } from "./trip-plans.test-support";

describe("trip plan API requests", () => {
  it("builds Trip Plan API requests", () => {
    const currentPlan = plan({
      id: "plan-rain",
      name: "Rain plan",
      status: "draft",
      version: 8,
    });

    expect(buildSetMainTripPlanRequest("mutation-set-main")).toEqual({
      clientMutationId: "mutation-set-main",
    });
    expect(
      buildPatchTripPlanStatusRequest(
        currentPlan,
        "backup",
        "mutation-status",
      ),
    ).toEqual({
      clientMutationId: "mutation-status",
      expectedVersion: 8,
      patch: { status: "backup" },
    });
    expect(
      buildRenameTripPlanRequest(
        plan({ id: "plan-unversioned" }),
        "Updated name",
        "mutation-rename",
      ),
    ).toEqual({
      clientMutationId: "mutation-rename",
      expectedVersion: 1,
      patch: { name: "Updated name" },
    });
    expect(buildCreateTripPlanRequest("Museum day", "mutation-create")).toEqual({
      clientMutationId: "mutation-create",
      name: "Museum day",
      status: "draft",
      creationMode: "blank",
      description: "",
    });
  });
});
