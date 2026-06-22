import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const bookingsDocsHooksDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function readBookingsDocsHookSource(fileName: string) {
  return readFileSync(join(bookingsDocsHooksDir, fileName), "utf8");
}

describe("booking dialog state structure", () => {
  it("keeps form state grouped by the shared booking dialog field model", () => {
    const dialogStateSource = readBookingsDocsHookSource(
      "useBookingDialogState.ts",
    );

    expect(dialogStateSource).toContain("type BookingDialogFields");
    expect(dialogStateSource).toContain("@/src/shared/form-state");
    expect(dialogStateSource).toContain("const [formFields, setFormFields]");
    expect(dialogStateSource).toContain("function updateFormField");
    expect(dialogStateSource).toContain("function toggleFormFieldId");
    expect(dialogStateSource).not.toContain("const [title, setTitle]");
    expect(dialogStateSource).not.toContain("const [travelerIds, setTravelerIds]");
    expect(dialogStateSource).not.toContain(
      "const [relatedItineraryItemIds, setRelatedItineraryItemIds]",
    );
  });
});
