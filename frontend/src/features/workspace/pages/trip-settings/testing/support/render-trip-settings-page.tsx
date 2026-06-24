import { vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { TripSettingsPage, type TripSettingsPageProps } from "../../TripSettingsPage";

export function renderTripSettingsPage(
  overrides: Partial<TripSettingsPageProps> = {},
) {
  const props: TripSettingsPageProps = {
    canEdit: true,
    currentMember: seedTrip.members[0],
    trip: seedTrip,
    onSave: vi.fn(),
    ...overrides,
  };

  renderWithI18n(<TripSettingsPage {...props} />, { locale: "en" });
  return props;
}
