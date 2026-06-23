import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const tripSettingsPageDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

function readTripSettingsPageSource(fileName: string) {
  return readFileSync(join(tripSettingsPageDir, fileName), "utf8");
}

describe("trip settings form state structure", () => {
  it("keeps form state and save actions in separate hooks", () => {
    const formStateSource = readTripSettingsPageSource(
      "hooks/use-trip-settings-form-state.ts",
    );
    const formActionsSource = readTripSettingsPageSource(
      "hooks/use-trip-settings-form-actions.ts",
    );

    expect(formStateSource).toContain("useTripSettingsFormActions");
    expect(formStateSource).toContain("initialTripSettingsFormState");
    expect(formStateSource).toContain("tripSettingsFormValueState");
    expect(formStateSource).not.toContain("normalizeTripSettingsForm");
    expect(formStateSource).not.toContain("async function submitSettings");
    expect(formActionsSource).toContain("async function submitSettings");
    expect(formActionsSource).toContain("normalizeTripSettingsForm");
    expect(formActionsSource).toContain("savingTripSettingsFormState");
    expect(formActionsSource).toContain("savedTripSettingsFormState");
    expect(formActionsSource).toContain("failedTripSettingsFormState");
  });
});
