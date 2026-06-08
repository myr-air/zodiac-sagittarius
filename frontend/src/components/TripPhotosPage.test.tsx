import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import type { Member, TripPhotoAlbumLink } from "@/src/trip/types";
import { TripPhotosPage, type TripPhotoAlbumInput } from "./TripPhotosPage";

const albums: TripPhotoAlbumLink[] = [
  {
    id: "album-google",
    tripId: seedTrip.id,
    title: "Google Photos group album",
    provider: "google_photos",
    url: "https://photos.app.goo.gl/group",
    access: "collaborative",
    ownerMemberId: "member-aom",
    relatedItineraryItemIds: ["item-victoria-peak"],
    day: "2026-06-18",
    description: "Shared album for everyone",
    accessNote: "Everyone can add photos",
    coverUrl: null,
    createdBy: "member-aom",
    updatedAt: "2026-06-08T00:00:00.000Z",
    version: 1,
  },
  {
    id: "album-dropbox",
    tripId: seedTrip.id,
    title: "Dropbox upload request",
    provider: "dropbox",
    url: "https://www.dropbox.com/request/example",
    access: "upload_request",
    ownerMemberId: "member-beam",
    relatedItineraryItemIds: [],
    day: null,
    description: null,
    accessNote: null,
    coverUrl: null,
    createdBy: "member-beam",
    updatedAt: "2026-06-08T00:00:00.000Z",
    version: 1,
  },
  {
    id: "album-unsafe",
    tripId: seedTrip.id,
    title: "Unsafe import",
    provider: "custom",
    url: "javascript:alert(1)",
    access: "view_only",
    ownerMemberId: null,
    relatedItineraryItemIds: [],
    day: null,
    description: null,
    accessNote: null,
    coverUrl: null,
    createdBy: "member-aom",
    updatedAt: "2026-06-08T00:00:00.000Z",
    version: 1,
  },
];

describe("TripPhotosPage", () => {
  it("renders the album hub, summary, provider filters, safe links, and inspector", () => {
    renderPage();

    expect(screen.getByRole("region", { name: "Photos & Albums" })).toBeInTheDocument();
    expect(screen.getByText("3 albums")).toBeInTheDocument();
    expect(screen.getByText("1 collaborative")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Google Photos, 1 albums" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select Google Photos group album/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Google Photos group album" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open album/i })).toHaveAttribute("href", "https://photos.app.goo.gl/group");

    expect(screen.getByRole("button", { name: /Select Unsafe import/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open Unsafe import/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Unsafe link blocked")).not.toHaveLength(0);
  });

  it("filters albums by provider", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Dropbox, 1 albums" }));

    expect(screen.getByRole("button", { name: /Select Dropbox upload request/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Google Photos group album/i })).not.toBeInTheDocument();
  });

  it("submits new albums and edits existing albums", async () => {
    const user = userEvent.setup();
    const onCreatePhotoAlbum = vi.fn();
    const onUpdatePhotoAlbum = vi.fn();
    renderPage({ onCreatePhotoAlbum, onUpdatePhotoAlbum });

    await user.click(screen.getByRole("button", { name: "Add album" }));
    let dialog = screen.getByRole("dialog", { name: "Add album" });
    fireEvent.change(within(dialog).getByLabelText("Title"), { target: { value: "iCloud family album" } });
    fireEvent.change(within(dialog).getByLabelText("Provider"), { target: { value: "icloud" } });
    fireEvent.change(within(dialog).getByLabelText("Access"), { target: { value: "view_only" } });
    fireEvent.change(within(dialog).getByLabelText("Album link"), { target: { value: "https://www.icloud.com/sharedalbum/example" } });
    fireEvent.change(within(dialog).getByLabelText("Access note"), { target: { value: "Ask Aom before sharing" } });
    await user.click(within(dialog).getByRole("checkbox", { name: /Victoria Peak/i }));
    await user.click(within(dialog).getByRole("button", { name: "Save album" }));

    expect(onCreatePhotoAlbum).toHaveBeenCalledWith(expect.objectContaining<Partial<TripPhotoAlbumInput>>({
      title: "iCloud family album",
      provider: "icloud",
      access: "view_only",
      url: "https://www.icloud.com/sharedalbum/example",
      accessNote: "Ask Aom before sharing",
      relatedItineraryItemIds: ["item-victoria-peak"],
    }));

    await user.click(screen.getAllByRole("button", { name: "Edit album" })[0]);
    dialog = screen.getByRole("dialog", { name: "Edit album" });
    fireEvent.change(within(dialog).getByLabelText("Title"), { target: { value: "Updated group album" } });
    await user.click(within(dialog).getByRole("button", { name: "Save album" }));

    expect(onUpdatePhotoAlbum).toHaveBeenCalledWith("album-google", expect.objectContaining({
      title: "Updated group album",
    }));
  });

  it("hides mutations from viewers and confirms deletion for editors", async () => {
    const user = userEvent.setup();
    const viewer = seedTrip.members.find((member) => member.role === "viewer")!;
    const onDeletePhotoAlbum = vi.fn();
    const { unmount } = renderPage({ currentMember: viewer, onDeletePhotoAlbum });

    expect(screen.queryByRole("button", { name: "Add album" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit album" })).not.toBeInTheDocument();

    unmount();
    renderPage({ onDeletePhotoAlbum });
    await user.click(screen.getAllByRole("button", { name: "Delete album" })[0]);
    expect(screen.getByRole("dialog", { name: "Delete album" })).toBeInTheDocument();
    await user.click(within(screen.getByRole("dialog", { name: "Delete album" })).getByRole("button", { name: "Delete album" }));

    expect(onDeletePhotoAlbum).toHaveBeenCalledWith("album-google");
  });
});

function renderPage(overrides: Partial<{
  currentMember: Member;
  photoAlbumLinks: TripPhotoAlbumLink[];
  onCreatePhotoAlbum: (input: TripPhotoAlbumInput) => void;
  onUpdatePhotoAlbum: (albumId: string, input: TripPhotoAlbumInput) => void;
  onDeletePhotoAlbum: (albumId: string) => void;
}> = {}) {
  return renderWithI18n(renderPageElement(overrides), { locale: "en" });
}

function renderPageElement(overrides: Partial<{
  currentMember: Member;
  photoAlbumLinks: TripPhotoAlbumLink[];
  onCreatePhotoAlbum: (input: TripPhotoAlbumInput) => void;
  onUpdatePhotoAlbum: (albumId: string, input: TripPhotoAlbumInput) => void;
  onDeletePhotoAlbum: (albumId: string) => void;
}> = {}) {
  const currentMember = overrides.currentMember ?? seedTrip.members[0];
  return (
    <TripPhotosPage
      trip={seedTrip}
      currentMember={currentMember}
      photoAlbumLinks={overrides.photoAlbumLinks ?? albums}
      canEditPhotoAlbums={currentMember.role === "owner" || currentMember.role === "organizer" || currentMember.role === "traveler"}
      onCreatePhotoAlbum={overrides.onCreatePhotoAlbum ?? vi.fn()}
      onUpdatePhotoAlbum={overrides.onUpdatePhotoAlbum ?? vi.fn()}
      onDeletePhotoAlbum={overrides.onDeletePhotoAlbum ?? vi.fn()}
    />
  );
}
