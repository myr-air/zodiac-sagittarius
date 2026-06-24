import { buildTripFixtureTask } from "../../testing/fixtures/trip-fixtures";
import type { TripTask } from "../../types";

export function task(input: Partial<TripTask> & Pick<TripTask, "id">): TripTask {
  return buildTripFixtureTask(input);
}
