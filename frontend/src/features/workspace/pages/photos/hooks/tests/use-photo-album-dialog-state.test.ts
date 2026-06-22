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

    expect(dialogStateSource).toContain("type PhotoAlbumDialogFields");
    expect(dialogStateSource).toContain("@/src/shared/form-state");
    expect(dialogStateSource).toContain("const [formFields, setFormFields]");
    expect(dialogStateSource).toContain("function updateFormField");
    expect(dialogStateSource).not.toContain("const [title, setTitle]");
    expect(dialogStateSource).not.toContain("const [provider, setProvider]");
    expect(dialogStateSource).not.toContain(
      "const [relatedItineraryItemIds, setRelatedItineraryItemIds]",
    );
  });
});
