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
