export const accountProfile = {
  id: "user-aom",
  displayName: "Aom",
  avatarColor: "#0f766e",
  locale: "th-TH",
  timezone: "Asia/Bangkok",
  primaryEmail: "aom@example.test",
};

export const accountTrip = {
  id: "trip-id",
  name: "Seoul Spring",
  destinationLabel: "Seoul",
  countries: ["South Korea"],
  startDate: "2026-06-01",
  endDate: "2026-06-05",
  role: "owner" as const,
  memberId: "member-owner",
  ownerMemberId: "member-owner",
  joinedAt: "2026-05-30T08:00:00.000Z",
  isOwner: true,
};

export const accountExplorer = {
  upcomingTrips: 1,
  ownedTrips: 1,
  destinationCount: 1,
  nextTrip: accountTrip,
};

export const accountTodo = {
  id: "todo-1",
  tripId: "trip-id",
  tripName: "Seoul Spring",
  title: "Book train",
  status: "open",
  visibility: "shared",
  kind: "booking",
  assigneeId: null,
  relatedItemId: null,
  version: 1,
};

export const accountVaultItem = {
  id: "vault-1",
  tripId: null,
  tripName: null,
  kind: "file",
  title: "Tickets",
  detail: "PDF copy",
  externalUrl: "https://example.test/tickets.pdf",
  source: "vault",
  createdAt: "2026-05-30T08:00:00.000Z",
};

export const accountTripCreateRequest = {
  name: "Seoul Spring",
  originLabel: "Bangkok, Thailand",
  originCity: "Bangkok",
  originCountry: "Thailand",
  originCountryCode: "TH",
  destinationLabel: "Seoul",
  destinationCities: [{
    city: "Seoul",
    country: "South Korea",
    countryCode: "KR",
    timezone: "Asia/Seoul",
    latitude: 37.5665,
    longitude: 126.978,
  }],
  countries: ["South Korea"],
  startDate: "2026-06-01",
  endDate: "2026-06-05",
  ownerDisplayName: "Aom",
  joinId: "SEOUL-2026",
  joinPassword: "spring-password",
};

export const accountTripCreateResponse = {
  trip: {
    id: "trip-id",
    name: "Seoul Spring",
    originLabel: "Bangkok, Thailand",
    originCity: "Bangkok",
    originCountry: "Thailand",
    originCountryCode: "TH",
    destinationLabel: "Seoul",
    destinationCities: [{
      city: "Seoul",
      country: "South Korea",
      countryCode: "KR",
      timezone: "Asia/Seoul",
      latitude: 37.5665,
      longitude: 126.978,
    }],
    countries: ["South Korea"],
    startDate: "2026-06-01",
    endDate: "2026-06-05",
    joinId: "SEOUL-2026",
    activePlanVariantId: "plan-main",
    ownerMemberId: "member-owner",
    version: 1,
  },
  ownerMemberId: "member-owner",
  memberSession: {
    tripId: "trip-id",
    memberId: "member-owner",
    sessionToken: "member-session",
    createdAt: "2026-05-30T08:00:00.000Z",
    expiresAt: "2026-06-29T08:00:00.000Z",
  },
};

export { jsonResponse } from "@/src/testing/json-response";
