import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const photosPageDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readPhotosPageSource(fileName: string) {
  return readFileSync(join(photosPageDir, fileName), "utf8");
}

describe("trip photos page state structure", () => {
  it("keeps browser and modal state grouped inside the page state hook", () => {
    const pageStateSource = readPhotosPageSource(
      "use-trip-photos-page-state.ts",
    );

    expect(pageStateSource).toContain("PhotoAlbumBrowserState");
    expect(pageStateSource).toContain("PhotoAlbumModalState");
    expect(pageStateSource).toContain("const [browserState, setBrowserState]");
    expect(pageStateSource).toContain("const [modalState, setModalState]");
    expect(pageStateSource).toContain("function updateBrowserState");
    expect(pageStateSource).toContain("function updateModalState");
    expect(pageStateSource).not.toContain("const [activeProvider, setActiveProvider]");
    expect(pageStateSource).not.toContain("const [dialogAlbum, setDialogAlbum]");
  });
});
