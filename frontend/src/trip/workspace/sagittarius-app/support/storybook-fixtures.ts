import { seedTripJoinId } from "@/src/trip/auth";
import {
  buildDenseTripFixture,
  buildEmptyTripFixture,
  tripFixture,
} from "@/src/trip/testing/fixtures/trip-fixtures";

export const storyTripId = "trip-1";
export const travelerMemberId = tripFixture.currentMembers.traveler.id;
export const viewerMemberId = tripFixture.currentMembers.viewer.id;
export const denseTrip = buildDenseTripFixture();
export const emptyTrip = buildEmptyTripFixture();
export { seedTripJoinId };
