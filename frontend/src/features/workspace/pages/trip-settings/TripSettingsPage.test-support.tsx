import { vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { TripSettingsPage } from "./TripSettingsPage";

export function renderTripSettingsPage(
  overrides: Partial<Parameters<typeof TripSettingsPage>[0]> = {},
) {
  const props: Parameters<typeof TripSettingsPage>[0] = {
    canEdit: true,
    currentMember: seedTrip.members[0],
    trip: seedTrip,
    onSave: vi.fn(),
    ...overrides,
  };

  renderWithI18n(<TripSettingsPage {...props} />, { locale: "en" });
  return props;
}
