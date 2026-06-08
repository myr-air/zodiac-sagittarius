# Trip Photos & Albums Design

Date: 2026-06-08
Status: Approved direction, pending implementation plan

## Goal

Add a trip `Photos` workspace page that helps travelers share trip photo
destinations without making Sagittarius responsible for storing everyone's photo
library.

The first release should be link-first. Travelers already keep photos on phones,
Google Photos, iCloud, Google Drive, Dropbox, or personal storage. Sagittarius
should become the trip cockpit for finding the right album or upload destination,
not a photo hosting product.

## Decision

Create a new page named `Photos & Albums`.

- UI label: `Photos`
- Route: `/trips/:tripId/photos`
- Planning view id: `photos`
- Primary model: `TripPhotoAlbumLink`

Sagittarius stores album metadata and external URLs only by default. It does not
upload, proxy, mirror, or cache shared trip photos in the initial release.

## Research Inputs

- Google Photos shared albums support sharing by people or link, collaboration,
  comments, link reset, and QR sharing. Link sharing is convenient but anyone
  with the link can view while it remains enabled.
- Google Photos APIs changed in 2025. The Library API is now focused on
  app-created content, removed broad readonly and sharing scopes, and the Picker
  API is the supported path when users need to select photos for third-party
  access.
- Google Photos album APIs can expose shared album metadata and shareable URLs,
  but app behavior is constrained enough that Sagittarius should not depend on a
  deep Google Photos sync for the first release.
- Dropbox supports shared folders, shared links, and file requests. It is a good
  fallback when the trip needs a simple upload destination.
- Object storage with presigned upload URLs is viable later for selected photos,
  but it adds moderation, lifecycle, cost, privacy, and deletion responsibilities.

## Product Shape

The page should feel like an operational photo sharing hub:

- shared album cards for Google Photos, iCloud, Google Drive, Dropbox, OneDrive,
  and custom links;
- a clear owner/member label for each album;
- copy link and QR-style share affordances;
- upload/access notes such as "everyone can add photos" or "ask Beam for access";
- optional relation to trip day or itinerary items;
- a small privacy statement that photos remain with the external provider.

This is not a gallery-first social feed. The value is fast access, shared
accountability, and avoiding lost links in chat.

## Entity Model

Add a `TripPhotoAlbumLink` entity.

```ts
export type TripPhotoAlbumProvider =
  | "google_photos"
  | "icloud"
  | "google_drive"
  | "dropbox"
  | "onedrive"
  | "custom";

export type TripPhotoAlbumAccess = "view_only" | "collaborative" | "upload_request";

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
```

`coverUrl` is optional and should normally be an external provider URL or a
deterministic local visual fallback. The first release should not require
persisted uploaded covers.

## Page Layout

Desktop:

- Reuse the existing app shell and route-level workspace pattern.
- Add `Photos` to the left rail near `Bookings & Docs` and `Expenses`.
- Summary strip:
  - total albums;
  - collaborative destinations;
  - upload/request destinations;
  - albums missing access notes.
- Filter/search bar:
  - search title, provider, owner, access note;
  - provider filter;
  - access type filter;
  - day filter.
- Main surface:
  - album cards in a dense, scan-friendly grid;
  - provider icon/label;
  - owner/member chip;
  - access mode;
  - related day/stop;
  - copy/open actions.
- Right inspector:
  - full URL and open/copy actions;
  - access note;
  - related itinerary items;
  - owner and created-by metadata;
  - edit/delete controls gated by permissions.

Mobile:

- Single column cards.
- Sticky or near-top add/copy actions must not be blocked by the context rail.
- Long URLs should never overflow; show provider and title first, URL only in
  detail/inspector surfaces.

## Permissions

- Owners and organizers can create, edit, and delete shared album links.
- Travelers can add album links unless the trip role policy later disables that.
- Viewers can open and copy links, but cannot mutate them.
- Sensitive personal albums are out of scope for the first release. If needed,
  use the existing Bookings & Docs sensitive visibility model in a later pass.

## Data And Storage

Initial backend storage should add a normalized table for album links. Local
mode should carry the same entity in the trip draft.

The app stores:

- provider;
- title;
- URL;
- access mode;
- member ownership metadata;
- optional day and itinerary relations;
- optional access note and external cover URL.

The app does not store:

- photo binaries;
- generated thumbnails from provider content;
- OAuth refresh tokens for Google Photos or Drive;
- mirrored album membership lists;
- EXIF/location metadata from travelers' libraries.

## Provider Handling

First release provider behavior is URL-based:

- Google Photos: store shared album link and access note. Do not attempt full
  sync or album mutation.
- iCloud: store shared album or public shared library link.
- Google Drive: store folder link, optionally marked collaborative.
- Dropbox: store shared folder or file request link.
- OneDrive: store shared folder link.
- Custom: any safe external URL.

All external URLs must pass the existing safe-link behavior before rendering as
openable anchors.

## Later Options

### Light Hosted Uploads

Add optional hosted uploads only for selected trip highlights:

- owner/organizer enables storage per trip;
- upload uses direct-to-object-storage presigned URLs;
- max file count and size limits are explicit;
- server stores metadata, object key, content type, size, uploader, and deletion
  state;
- photos have lifecycle/deletion controls.

Good use cases: trip cover, shared highlight set, group proof photos.

Bad use cases: replacing Google Photos, backing up every traveler's camera roll,
or storing long videos.

### Provider OAuth

Provider OAuth can be considered only after the link hub is proven useful. It
should start with narrow helpers such as "pick a cover photo" or "select a few
highlights", not broad library sync.

## Accessibility And Privacy

- Album cards need descriptive labels independent of provider icons.
- Copy/open buttons need clear focus states and success feedback.
- External provider and access mode must be visible before opening a link.
- The page should warn that external provider permissions control real access.
- The app must not imply that disabling a Sagittarius link record revokes access
  at Google Photos, iCloud, Drive, Dropbox, or OneDrive.

## Testing And QA

Minimum verification before completion:

- Unit coverage for the `TripPhotoAlbumLink` model and safe URL handling.
- Component tests for provider/access rendering, copy actions, permission gates,
  empty state, and edit/delete flow.
- API/local mode tests if backend storage is included in the first implementation.
- Browser QA for `/trips/:tripId/photos` on desktop and mobile:
  - open/copy link controls;
  - add/edit/delete dialog;
  - context rail interaction;
  - no console/page errors;
  - no mobile horizontal overflow.

## Non-Goals

- No full Google Photos sync.
- No automatic album creation through provider APIs.
- No server-side storage of regular trip photos.
- No photo feed, comments, likes, or face/object search.
- No provider OAuth in the first release.
- No guarantee that removing a link from Sagittarius revokes external access.

## Acceptance Criteria

- A trip member can open the Photos page from the workspace navigation.
- The page lists external photo album/upload destinations for the current trip.
- Authorized members can add, edit, and delete album links.
- Viewers can open/copy links but cannot edit them.
- Each album shows provider, owner, access mode, and access note when present.
- Local mode and API mode preserve album link records without storing photos.
- Invalid or unsafe URLs are blocked or rendered as non-openable with a clear
  validation message.
- Mobile layout stays usable without horizontal page scroll.
