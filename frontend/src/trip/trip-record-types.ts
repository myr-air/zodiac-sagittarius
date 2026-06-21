export const bookingDocTypeValues = [
  "flight",
  "train",
  "public_transport",
  "hotel",
  "insurance",
  "passport",
  "visa",
  "activity_ticket",
  "other",
] as const;
export type BookingDocType = (typeof bookingDocTypeValues)[number];

export const bookingDocStatusValues = [
  "draft",
  "needs_action",
  "booked",
  "confirmed",
  "paid",
  "cancelled",
  "expired",
] as const;
export type BookingDocStatus = (typeof bookingDocStatusValues)[number];

export const bookingDocVisibilityValues = [
  "shared",
  "sensitive",
  "private",
] as const;
export type BookingDocVisibility = (typeof bookingDocVisibilityValues)[number];

export interface BookingDocExternalLink {
  id: string;
  label: string;
  url: string;
  provider?: string | null;
  accessNote?: string | null;
}

export interface BookingDoc {
  id: string;
  tripId: string;
  tripPlanId?: string | null;
  type: BookingDocType;
  title: string;
  status: BookingDocStatus;
  visibility: BookingDocVisibility;
  ownerMemberId?: string | null;
  providerName?: string | null;
  confirmationCode?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string | null;
  priceAmount?: number | null;
  currency?: string | null;
  travelerIds: string[];
  externalLinks: BookingDocExternalLink[];
  relatedItineraryItemIds: string[];
  relatedTaskIds: string[];
  relatedExpenseIds: string[];
  noteIds: string[];
  notes?: string | null;
  createdBy: string;
  updatedAt: string;
  version: number;
}

export const tripPhotoAlbumProviderValues = [
  "google_photos",
  "icloud",
  "google_drive",
  "dropbox",
  "onedrive",
  "custom",
] as const;
export type TripPhotoAlbumProvider = (typeof tripPhotoAlbumProviderValues)[number];

export const tripPhotoAlbumAccessValues = [
  "view_only",
  "collaborative",
  "upload_request",
] as const;
export type TripPhotoAlbumAccess = (typeof tripPhotoAlbumAccessValues)[number];

export interface TripPhotoAlbumLink {
  id: string;
  tripId: string;
  title: string;
  provider: TripPhotoAlbumProvider;
  url: string;
  access: TripPhotoAlbumAccess;
  ownerMemberId?: string | null;
  relatedItineraryItemIds: string[];
  day?: string | null;
  description?: string | null;
  accessNote?: string | null;
  coverUrl?: string | null;
  createdBy: string;
  updatedAt: string;
  version: number;
}
