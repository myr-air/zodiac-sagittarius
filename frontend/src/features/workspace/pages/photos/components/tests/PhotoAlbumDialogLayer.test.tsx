import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { seedTrip } from "@/src/trip/seed";
import { photoCopy } from "../../content/TripPhotosPage.copy";
import { photoAlbumPageTestAlbums } from "../../testing/fixtures/photo-album-page-fixtures";
import { PhotoAlbumDialogLayer } from "../PhotoAlbumDialogLayer";

const baseProps = {
  copy: photoCopy.en,
  currentMember: seedTrip.members[0],
  deleteAlbum: null,
  dialogAlbum: null,
  trip: seedTrip,
  onCancelDelete: vi.fn(),
  onCancelDialog: vi.fn(),
  onConfirmDelete: vi.fn(),
  onSubmitAlbum: vi.fn(),
};

describe("PhotoAlbumDialogLayer", () => {
  it("does not render dialogs without active album targets", () => {
    render(<PhotoAlbumDialogLayer {...baseProps} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the album form dialog for a new album target", () => {
    render(<PhotoAlbumDialogLayer {...baseProps} dialogAlbum="new" />);

    expect(
      screen.getByRole("dialog", { name: /add album/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^title$/i)).toBeInTheDocument();
  });

  it("renders delete confirmation for a delete album target", () => {
    render(
      <PhotoAlbumDialogLayer
        {...baseProps}
        deleteAlbum={photoAlbumPageTestAlbums[0]}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: /delete album/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Google Photos group album/i),
    ).toBeInTheDocument();
  });
});
