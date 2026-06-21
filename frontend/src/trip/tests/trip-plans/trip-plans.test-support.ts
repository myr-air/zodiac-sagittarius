import { seedTrip } from "@/src/trip/seed";
import type { PlanVariant } from "@/src/trip/types";

export function plan(input: Partial<PlanVariant> & Pick<PlanVariant, "id">): PlanVariant {
  return {
    tripId: seedTrip.id,
    name: input.id,
    kind: "draft",
    description: "",
    ...input,
  };
}
