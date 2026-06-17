import type { TripPhotoAlbumAccess, TripPhotoAlbumProvider } from "@/src/trip/types";

export interface TripPhotoAlbumInput {
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
}
