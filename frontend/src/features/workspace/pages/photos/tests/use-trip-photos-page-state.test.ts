import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const photosPageDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readPhotosPageSource(fileName: string) {
  return readFileSync(join(photosPageDir, fileName), "utf8");
}

describe("trip photos page state structure", () => {
  it("keeps browser and modal transitions grouped in the page state model", () => {
    const pageStateSource = readPhotosPageSource(
      "use-trip-photos-page-state.ts",
    );
    const photoPageStateSource = readPhotosPageSource("model/photo-page-state.ts");

    expect(pageStateSource).toContain("initialPhotoAlbumBrowserState");
    expect(pageStateSource).toContain("initialPhotoAlbumModalState");
    expect(pageStateSource).toContain("updatePhotoAlbumBrowserState");
    expect(pageStateSource).toContain("updatePhotoAlbumModalState");
    expect(pageStateSource).toContain("const [browserState, setBrowserState]");
    expect(pageStateSource).toContain("const [modalState, setModalState]");
    expect(pageStateSource).not.toContain("const [activeProvider, setActiveProvider]");
    expect(pageStateSource).not.toContain("const [dialogAlbum, setDialogAlbum]");
    expect(photoPageStateSource).toContain("export interface PhotoAlbumBrowserState");
    expect(photoPageStateSource).toContain("export interface PhotoAlbumModalState");
    expect(photoPageStateSource).toContain(
      "export function initialPhotoAlbumBrowserState",
    );
    expect(photoPageStateSource).toContain(
      "export function updatePhotoAlbumBrowserState",
    );
  });
});
