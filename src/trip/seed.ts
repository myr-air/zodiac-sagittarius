import type { Expense, ItineraryItem, Trip } from "./types";

const tripId = "trip-hong-kong-shenzhen";
const mainPlanId = "plan-main";
const updatedAt = "2026-05-27T00:00:00.000Z";

function item(input: Omit<ItineraryItem, "tripId" | "planVariantId" | "createdBy" | "updatedAt" | "version"> & Partial<Pick<ItineraryItem, "planVariantId" | "version">>): ItineraryItem {
  return {
    tripId,
    planVariantId: input.planVariantId ?? mainPlanId,
    createdBy: "member-aom",
    updatedAt,
    version: input.version ?? 1,
    ...input,
  };
}

function split(amount: number, memberIds = ["member-aom", "member-beam", "member-nam"]): Record<string, number> {
  const base = Math.round((amount / memberIds.length) * 100) / 100;
  return Object.fromEntries(memberIds.map((id) => [id, base]));
}

const expenses: Expense[] = [
  {
    id: "expense-dimsum",
    title: "Dim sum dinner",
    amount: 960,
    paidBy: "member-beam",
    splits: split(960),
    category: "food",
  },
  {
    id: "expense-peak-tram",
    title: "Peak Tram tickets",
    amount: 420,
    paidBy: "member-aom",
    splits: split(420),
    category: "tickets",
  },
  {
    id: "expense-octopus",
    title: "Octopus top-up",
    amount: 180,
    paidBy: "member-nam",
    splits: { "member-aom": 0, "member-beam": 0, "member-nam": 180 },
    category: "transport",
  },
];

export const seedTrip: Trip = {
  id: tripId,
  name: "Hong Kong + Shenzhen planning cockpit",
  destinationLabel: "Hong Kong + Shenzhen",
  startDate: "2026-06-18",
  endDate: "2026-06-22",
  activePlanVariantId: mainPlanId,
  planVariants: [
    { id: mainPlanId, tripId, name: "Main plan", kind: "main", description: "Published working plan for the group." },
    { id: "plan-rain", tripId, name: "Rain backup", kind: "backup", description: "Indoor-heavy route for storm windows." },
    { id: "plan-draft", tripId, name: "Draft edits", kind: "draft", description: "Scratch space before publishing changes." },
  ],
  members: [
    { id: "member-aom", displayName: "Aom", role: "owner", presence: "online", color: "#0f766e" },
    { id: "member-beam", displayName: "Beam", role: "traveler", presence: "online", color: "#2563eb" },
    { id: "member-nam", displayName: "Nam", role: "organizer", presence: "away", color: "#f97316" },
    { id: "member-viewer", displayName: "Family viewer", role: "viewer", presence: "offline", color: "#64748b" },
  ],
  itineraryItems: [
    item({
      id: "item-dmk-checkin",
      day: "2026-06-18",
      sortOrder: 100,
      startTime: "",
      activity: "Check-in at Don Mueang",
      activityType: "stay",
      place: "DMK airport",
      mapLink: "",
      durationMinutes: null,
      transportation: "",
      note: "เช็คอินและรวมตัวก่อนบิน",
    }),
    item({
      id: "item-flight-hkg",
      day: "2026-06-18",
      sortOrder: 200,
      startTime: "08:00",
      activity: "Flight DMK to HKG",
      activityType: "travel",
      place: "Hong Kong International Airport",
      mapLink: "https://maps.google.com/?q=Hong+Kong+International+Airport",
      durationMinutes: 210,
      transportation: "Flight",
      note: "Keep passports easy to reach.",
    }),
    item({
      id: "item-lan-fong-yuen",
      day: "2026-06-18",
      sortOrder: 300,
      startTime: "13:30",
      activity: "Lan Fong Yuen lunch",
      activityType: "food",
      place: "Central",
      mapLink: "https://maps.google.com/?q=Lan+Fong+Yuen",
      durationMinutes: 60,
      transportation: "Airport Express + walk",
      note: "ชานมต้นตำรับและขนมปัง",
      version: 3,
    }),
    item({
      id: "item-avenue-stars",
      day: "2026-06-18",
      sortOrder: 400,
      startTime: "14:00",
      activity: "Avenue of Stars walk",
      activityType: "attraction",
      place: "Tsim Sha Tsui promenade",
      mapLink: "https://maps.google.com/?q=Avenue+of+Stars+Hong+Kong",
      durationMinutes: 45,
      transportation: "MTR",
      note: "Overlaps lunch on purpose so validation is visible.",
    }),
    item({
      id: "item-disney",
      day: "2026-06-19",
      sortOrder: 100,
      startTime: "08:20",
      activity: "Hong Kong Disneyland",
      activityType: "experience",
      place: "Lantau Island",
      mapLink: "https://maps.google.com/?q=Hong+Kong+Disneyland",
      durationMinutes: 540,
      transportation: "MTR",
      note: "ซื้อบัตรไว้แล้ว เช็ค weather window ตอนเช้า",
    }),
    item({
      id: "item-mplus",
      day: "2026-06-20",
      sortOrder: 100,
      startTime: "10:30",
      activity: "M+ Museum",
      activityType: "attraction",
      place: "West Kowloon",
      mapLink: "https://maps.google.com/?q=M%2B+Museum",
      durationMinutes: 150,
      transportation: "MTR + walk",
      note: "Good indoor backup if rain starts early.",
    }),
    item({
      id: "item-shenzhen",
      day: "2026-06-21",
      sortOrder: 100,
      startTime: "09:00",
      activity: "Cross border to Shenzhen",
      activityType: "travel",
      place: "Futian checkpoint",
      mapLink: "https://maps.google.com/?q=Futian+Checkpoint",
      durationMinutes: 120,
      transportation: "MTR + border crossing",
      note: "ตรวจเอกสารก่อนออกจากโรงแรม",
    }),
    item({
      id: "item-depart",
      day: "2026-06-22",
      sortOrder: 100,
      startTime: "11:00",
      activity: "Pack and depart",
      activityType: "stay",
      place: "Hotel",
      mapLink: "",
      durationMinutes: 90,
      transportation: "Taxi",
      note: "Leave luggage at lobby if flight shifts.",
    }),
  ],
  expenses,
};
