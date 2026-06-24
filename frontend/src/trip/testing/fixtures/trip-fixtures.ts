import { buildExpenseSummary } from "../../expenses";
import { seedTrip } from "../../seed";
import type { ItineraryItem, Member, Trip, TripRole } from "../../types";
import { buildItineraryItem } from "./itinerary-item-fixtures";
import {
  tripFixtureStopNotes,
  tripFixtureSuggestions,
  tripFixtureTasks,
} from "./trip-record-fixtures";
export { buildDenseTripFixture } from "./dense-trip-fixture";
export {
  buildBookingDoc,
  buildBusTravelItineraryItem,
  buildFlightTravelItineraryItem,
  buildItineraryItem,
  buildSharedFlightBookingDoc,
} from "./itinerary-item-fixtures";
export {
  buildTripFixtureStopNote,
  buildTripFixtureSuggestion,
  buildTripFixtureTask,
  tripFixtureStopNotes,
  tripFixtureSuggestions,
  tripFixtureTasks,
} from "./trip-record-fixtures";

export type TripFixtureRole = TripRole;

function requireTripFixtureMember(
  predicate: (member: Member) => boolean,
  description: string,
): Member {
  const member = seedTrip.members.find(predicate);
  if (!member) {
    throw new Error(`Missing member test fixture: ${description}`);
  }
  return member;
}

export const tripFixture = {
  trip: seedTrip,
  planItems: seedTrip.itineraryItems.filter((item) => item.planVariantId === seedTrip.activePlanVariantId),
  suggestions: tripFixtureSuggestions,
  tasks: tripFixtureTasks,
  stopNotes: tripFixtureStopNotes,
  currentMembers: {
    owner: requireTripFixtureMember(
      (member) => member.role === "owner",
      "owner",
    ),
    organizer: requireTripFixtureMember(
      (member) => member.role === "organizer",
      "organizer",
    ),
    traveler: requireTripFixtureMember(
      (member) => member.role === "traveler",
      "traveler",
    ),
    viewer: requireTripFixtureMember(
      (member) => member.id === "member-family",
      "member-family",
    ),
  },
  expenseSummaries: {
    owner: buildExpenseSummary(seedTrip.expenses, "member-aom"),
    organizer: buildExpenseSummary(seedTrip.expenses, "member-beam"),
    traveler: buildExpenseSummary(seedTrip.expenses, "member-nam"),
    viewer: buildExpenseSummary(seedTrip.expenses, "member-family"),
  },
} as const;

export function getTripFixtureMember(role: TripFixtureRole) {
  return tripFixture.currentMembers[role];
}

export function getTripFixtureMemberById(id: string): Member {
  return requireTripFixtureMember((member) => member.id === id, id);
}

export function getTripFixtureItineraryItem(id: string): ItineraryItem {
  const item = seedTrip.itineraryItems.find((candidate) => candidate.id === id);
  if (!item) {
    throw new Error(`Missing itinerary item test fixture: ${id}`);
  }
  return item;
}

export function buildTripFixtureItineraryItem(
  overrides: Partial<ItineraryItem> = {},
): ItineraryItem {
  return buildItineraryItem({
    tripId: tripFixture.trip.id,
    planVariantId: tripFixture.trip.activePlanVariantId,
    ...overrides,
  });
}

export function buildEmptyTripFixture(): Trip {
  return {
    ...seedTrip,
    itineraryItems: [],
    expenses: [],
  };
}
