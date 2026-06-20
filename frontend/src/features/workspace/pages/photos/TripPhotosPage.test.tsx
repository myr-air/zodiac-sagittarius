import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getTripFixtureMember } from "@/src/trip/trip-fixtures";
import type { TripPhotoAlbumInput } from "./TripPhotosPage";
import { renderTripPhotosPage } from "./TripPhotosPage.test-support";

describe("TripPhotosPage", () => {
  it("renders the album hub, summary, provider filters, safe links, and inspector", () => {
    renderTripPhotosPage();

    expect(screen.getByRole("region", { name: "Photos & Albums" })).toHaveClass("trip-photos-page", "bg-transparent");
    expect(screen.getByText("3 albums").closest(".photos-stat")).toHaveClass(
      "bg-(--color-surface)",
      "rounded-(--radius-md)",
      "shadow-[0_1px_0_rgb(15_23_42_/_0.04)]",
    );
    expect(document.querySelector(".photos-panel")).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(document.querySelector(".photos-inspector")).toHaveClass("shadow-[0_1px_0_rgb(15_23_42_/_0.04)]");
    expect(screen.getByText("3 albums")).toBeInTheDocument();
    expect(screen.getByText("1 collaborative")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Google Photos, 1 albums" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select Google Photos group album/i })).toBeInTheDocument();
    const cover = screen.getByLabelText("Cover for Google Photos group album");
    expect(cover).toHaveClass("bg-(--color-surface-subtle)");
    expect(cover.className).not.toContain("linear-gradient");
    expect(cover).toHaveStyle({ backgroundImage: "url(https://images.example.test/hong-kong-album.jpg)" });
    expect(screen.getByRole("heading", { name: "Google Photos group album" })).toBeInTheDocument();
    expect(screen.getByText("photos.app.goo.gl")).toBeInTheDocument();
    expect(screen.queryByText("https://photos.app.goo.gl/group")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open album/i })).toHaveAttribute("href", "https://photos.app.goo.gl/group");

    expect(screen.getByRole("button", { name: /Select Unsafe import/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Open Unsafe import/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Unsafe link blocked")).not.toHaveLength(0);
  });

  it("filters albums by provider", async () => {
    const user = userEvent.setup();
    renderTripPhotosPage();

    await user.click(screen.getByRole("button", { name: "Dropbox, 1 albums" }));

    expect(screen.getByRole("button", { name: /Select Dropbox upload request/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Select Google Photos group album/i })).not.toBeInTheDocument();
  });

  it("submits new albums and edits existing albums", async () => {
    const user = userEvent.setup();
    const onCreatePhotoAlbum = vi.fn();
    const onUpdatePhotoAlbum = vi.fn();
    renderTripPhotosPage({ onCreatePhotoAlbum, onUpdatePhotoAlbum });

    await user.click(screen.getByRole("button", { name: "Add album" }));
    let dialog = screen.getByRole("dialog", { name: "Add album" });
    expect(dialog).toHaveClass("shadow-[0_14px_34px_rgb(15_23_42_/_0.16)]");
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
    const viewer = getTripFixtureMember("viewer");
    const onDeletePhotoAlbum = vi.fn();
    const { unmount } = renderTripPhotosPage({ currentMember: viewer, onDeletePhotoAlbum });

    expect(screen.queryByRole("button", { name: "Add album" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit album" })).not.toBeInTheDocument();

    unmount();
    renderTripPhotosPage({ onDeletePhotoAlbum });
    await user.click(screen.getAllByRole("button", { name: "Delete album" })[0]);
    expect(screen.getByRole("dialog", { name: "Delete album" })).toBeInTheDocument();
    await user.click(within(screen.getByRole("dialog", { name: "Delete album" })).getByRole("button", { name: "Delete album" }));

    expect(onDeletePhotoAlbum).toHaveBeenCalledWith("album-google");
  });
});
