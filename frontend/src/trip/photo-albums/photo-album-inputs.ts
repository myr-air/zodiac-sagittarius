import type { TripPhotoAlbumLink } from "../types";

export type PhotoAlbumInputForApi = Pick<
  TripPhotoAlbumLink,
  "access" | "provider" | "relatedItineraryItemIds" | "title" | "url"
> &
  Partial<
    Pick<
      TripPhotoAlbumLink,
      "accessNote" | "coverUrl" | "day" | "description" | "ownerMemberId"
    >
  >;
