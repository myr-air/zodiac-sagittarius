import type { TripPhotoAlbumLink } from "../types";

export type PhotoAlbumInput = Pick<
  TripPhotoAlbumLink,
  "access" | "provider" | "relatedItineraryItemIds" | "title" | "url"
> &
  Partial<
    Pick<
      TripPhotoAlbumLink,
      "accessNote" | "coverUrl" | "day" | "description" | "ownerMemberId"
    >
  >;

export type PhotoAlbumInputForApi = PhotoAlbumInput;
