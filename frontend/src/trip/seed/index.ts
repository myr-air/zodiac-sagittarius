import type { Trip } from "../types";
import { hashLocalSecret, seedTripJoinId, seedTripJoinPassword } from "../auth";
import { createSeedItineraryItems } from "./seed-itinerary-items";
import { createSeedRecords } from "./seed-records";

const tripId = "018f4e80-5788-7de0-a45c-8a555d17fc2d";
const mainPlanId = "plan-main";
const updatedAt = "2026-05-27T00:00:00.000Z";

const { bookingDocs, expenses, photoAlbumLinks } = createSeedRecords({ tripId, updatedAt });

export const seedTrip: Trip = {
  id: tripId,
  joinId: seedTripJoinId,
  joinPasswordHash: hashLocalSecret(seedTripJoinPassword),
  name: "Hong Kong + Shenzhen Trip",
  destinationLabel: "Hong Kong + Shenzhen",
  countries: ["Hong Kong", "China"],
  startDate: "2026-06-18",
  endDate: "2026-06-23",
  activePlanVariantId: mainPlanId,
  planVariants: [
    { id: mainPlanId, tripId, name: "แผนหลัก (V1)", kind: "main", description: "Published working plan for the group." },
    { id: "plan-rain", tripId, name: "แผนฝนตก", kind: "backup", description: "Indoor-heavy route for storm windows." },
    { id: "plan-draft", tripId, name: "ร่างปรับเวลา", kind: "draft", description: "Scratch space before publishing changes." },
  ],
  members: [
    { id: "member-aom", displayName: "Demo Traveler", role: "owner", presence: "online", color: "#0f766e" },
    { id: "member-beam", displayName: "Travel Mate", role: "organizer", presence: "online", color: "#2563eb" },
    { id: "member-nam", displayName: "Explorer Friend", role: "traveler", presence: "away", color: "#f97316" },
    { id: "member-family", displayName: "Family Member", role: "viewer", presence: "online", color: "#64748b" },
    { id: "member-viewer", displayName: "Read-only Preview", role: "viewer", presence: "offline", color: "#94a3b8" },
  ],
  itineraryItems: createSeedItineraryItems({ tripId, mainPlanId, updatedAt }),
  bookingDocs,
  photoAlbumLinks,
  expenses,
};
