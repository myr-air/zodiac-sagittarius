import { seedTripJoinId } from "../../auth";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "./trip-fixtures";

export const storyTripId = "trip-1";
export const travelerMemberId = tripFixture.currentMembers.traveler.id;
export const viewerMemberId = tripFixture.currentMembers.viewer.id;

export const denseStoryTrip = buildDenseTripFixture();
export const emptyStoryTrip = buildEmptyTripFixture();
export const singleMemberStoryTrip = {
  ...tripFixture.trip,
  members: [tripFixture.currentMembers.owner],
};

export { seedTripJoinId };
