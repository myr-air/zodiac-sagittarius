import { seedTripJoinId } from "../../auth";
import { seedTrip } from "../../seed";
import type { BookingDoc, TripPhotoAlbumLink } from "../../types";
import { buildDenseTripFixture, buildEmptyTripFixture, tripFixture } from "./trip-fixtures";

export const storyTripId = "trip-1";
export const storyTrip = tripFixture.trip;
export const storyMembers = tripFixture.currentMembers;
export const storyPlanItems = tripFixture.planItems;
export const storySuggestions = tripFixture.suggestions;
export const storyTasks = tripFixture.tasks;
export const storyExpenseSummaries = tripFixture.expenseSummaries;
export const ownerStoryMember = storyMembers.owner;
export const travelerStoryMember = storyMembers.traveler;
export const viewerStoryMember = storyMembers.viewer;
export const travelerMemberId = tripFixture.currentMembers.traveler.id;
export const viewerMemberId = tripFixture.currentMembers.viewer.id;

export const denseStoryTrip = buildDenseTripFixture();
export const emptyStoryTrip = buildEmptyTripFixture();
export const singleMemberStoryTrip = {
  ...storyTrip,
  members: [ownerStoryMember],
};

export const denseStoryBookingDocs: BookingDoc[] = Array.from({ length: 16 }, (_, index) => {
  const base = (seedTrip.bookingDocs ?? [])[index % (seedTrip.bookingDocs?.length || 1)] ?? {
    id: "booking-doc-fallback",
    tripId: seedTrip.id,
    type: "other",
    title: "Travel document",
    status: "draft",
    visibility: "shared",
    ownerMemberId: tripFixture.currentMembers.owner.id,
    providerName: "Shared supplier",
    confirmationCode: "REF-000",
    startsAt: `${seedTrip.startDate}T09:00:00.000Z`,
    endsAt: `${seedTrip.startDate}T10:00:00.000Z`,
    timezone: "Asia/Hong_Kong",
    priceAmount: 120,
    currency: "USD",
    travelerIds: [tripFixture.currentMembers.traveler.id],
    externalLinks: [],
    relatedItineraryItemIds: [],
    relatedTaskIds: [],
    relatedExpenseIds: [],
    noteIds: [],
    notes: "Dense Storybook coverage item for booking and document layout.",
    createdBy: tripFixture.currentMembers.owner.id,
    updatedAt: "2026-05-27T00:00:00.000Z",
    version: 1,
  } satisfies BookingDoc;

  return {
    ...base,
    id: `booking-doc-dense-${index + 1}`,
    tripId: seedTrip.id,
    title: `${base.title} ${index + 1}`,
    status: index % 5 === 0 ? "needs_action" : base.status,
    providerName: base.providerName ?? "Shared supplier",
    confirmationCode: base.confirmationCode ?? `REF-${String(index + 1).padStart(3, "0")}`,
    priceAmount: base.priceAmount ?? (index + 1) * 120,
    updatedAt: `2026-05-${String(10 + (index % 17)).padStart(2, "0")}T00:00:00.000Z`,
    version: base.version + index + 1,
  };
});

export const denseStoryPhotoAlbumLinks: TripPhotoAlbumLink[] = Array.from({ length: 18 }, (_, index) => {
  const base = tripFixture.trip.photoAlbumLinks?.[index % (tripFixture.trip.photoAlbumLinks?.length || 1)];

  return {
    id: `photo-album-dense-${index + 1}`,
    tripId: tripFixture.trip.id,
    title: base ? `${base.title} ${index + 1}` : `Shared album ${index + 1}`,
    provider: base?.provider ?? (index % 2 === 0 ? "google_photos" : "icloud"),
    url: base?.url ?? "https://photos.example.com/shared-trip",
    access: base?.access ?? (index % 3 === 0 ? "upload_request" : "collaborative"),
    ownerMemberId: base?.ownerMemberId ?? tripFixture.currentMembers.owner.id,
    relatedItineraryItemIds: base?.relatedItineraryItemIds ?? [tripFixture.planItems[index % tripFixture.planItems.length].id],
    day: base?.day ?? tripFixture.planItems[index % tripFixture.planItems.length].day,
    description: base?.description ?? "Shared photos for a busy group trip day.",
    accessNote: index % 4 === 0 ? null : (base?.accessNote ?? "Anyone with the trip link can view."),
    coverUrl: base?.coverUrl ?? null,
    createdBy: base?.createdBy ?? tripFixture.currentMembers.owner.id,
    updatedAt: base?.updatedAt ?? "2026-05-27T00:00:00.000Z",
    version: base?.version ?? 1,
  };
});

export const coverStoryPhotoAlbumLinks: TripPhotoAlbumLink[] = [
  {
    ...(tripFixture.trip.photoAlbumLinks?.[0] ?? denseStoryPhotoAlbumLinks[0]),
    id: "photo-album-cover-hong-kong",
    title: "Harbour skyline handoff",
    coverUrl: "/landing/auth/photo-hong-kong-skyline.png",
    accessNote: "Use this as the trip recap cover before everyone uploads.",
  },
  {
    ...(tripFixture.trip.photoAlbumLinks?.[1] ?? denseStoryPhotoAlbumLinks[1]),
    id: "photo-album-cover-market",
    title: "Mong Kok market uploads",
    coverUrl: "/landing/auth/photo-mong-kok-market.png",
    access: "upload_request",
    provider: "dropbox",
  },
  {
    ...(tripFixture.trip.photoAlbumLinks?.[2] ?? denseStoryPhotoAlbumLinks[2]),
    id: "photo-album-cover-fallback",
    title: "No cover fallback album",
    coverUrl: null,
    provider: "custom",
  },
];

export { seedTripJoinId };
