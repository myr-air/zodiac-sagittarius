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
    const dialogActionsSource = readBookingsDocsHookSource(
      "useBookingDialogActions.ts",
    );

    expect(dialogStateSource).toContain("type BookingDialogFields");
    expect(dialogStateSource).toContain("@/src/shared/hooks/use-form-fields");
    expect(dialogStateSource).toContain("useFormFields<BookingDialogFields>");
    expect(dialogStateSource).toContain("updateField: updateFormField");
    expect(dialogStateSource).toContain("function toggleFormFieldId");
    expect(dialogStateSource).toContain("useBookingDialogActions");
    expect(dialogStateSource).not.toContain("buildBookingDialogSubmitInput");
    expect(dialogStateSource).not.toContain("function submit");
    expect(dialogActionsSource).toContain("export function useBookingDialogActions");
    expect(dialogActionsSource).toContain("function submit");
    expect(dialogActionsSource).toContain("buildBookingDialogSubmitInput");
    expect(dialogStateSource).not.toContain("const [title, setTitle]");
    expect(dialogStateSource).not.toContain("const [travelerIds, setTravelerIds]");
    expect(dialogStateSource).not.toContain(
      "const [relatedItineraryItemIds, setRelatedItineraryItemIds]",
    );
  });
});
