import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const photosHooksDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readPhotosHookSource(fileName: string) {
  return readFileSync(join(photosHooksDir, fileName), "utf8");
}

describe("photo album dialog state structure", () => {
  it("keeps dialog form fields grouped by the shared dialog field model", () => {
    const dialogStateSource = readPhotosHookSource("usePhotoAlbumDialogState.ts");
    const dialogActionsSource = readPhotosHookSource("usePhotoAlbumDialogActions.ts");

    expect(dialogStateSource).toContain("type PhotoAlbumDialogFields");
    expect(dialogStateSource).toContain("@/src/shared/hooks/use-form-fields");
    expect(dialogStateSource).toContain("useFormFields<PhotoAlbumDialogFields>");
    expect(dialogStateSource).toContain("updateField: updateFormField");
    expect(dialogStateSource).toContain("usePhotoAlbumDialogActions");
    expect(dialogStateSource).not.toContain("buildPhotoAlbumDialogSubmitInput");
    expect(dialogStateSource).not.toContain("async function submit");
    expect(dialogActionsSource).toContain("export function usePhotoAlbumDialogActions");
    expect(dialogActionsSource).toContain("async function submit");
    expect(dialogActionsSource).toContain("buildPhotoAlbumDialogSubmitInput");
    expect(dialogStateSource).not.toContain("const [title, setTitle]");
    expect(dialogStateSource).not.toContain("const [provider, setProvider]");
    expect(dialogStateSource).not.toContain(
      "const [relatedItineraryItemIds, setRelatedItineraryItemIds]",
    );
  });
});
