import { vi } from "vitest";
import { renderWithI18n } from "@/src/i18n/test-utils";
import { seedTrip } from "@/src/trip/seed";
import { TripMembersPage, type TripMembersPageProps } from "../../TripMembersPage";

export function renderMembersPage(
  overrides: Partial<TripMembersPageProps> = {},
) {
  const props: TripMembersPageProps = {
    trip: seedTrip,
    currentMember: seedTrip.members[0],
    canManagePeople: true,
    onChangeMemberAccessStatus: vi.fn(),
    onChangeMemberPassword: vi.fn(),
    onChangeMemberRole: vi.fn(),
    onCreateMember: vi.fn(),
    onResetMemberClaim: vi.fn(),
    onTransferOwnership: vi.fn(),
    ...overrides,
  };
  renderWithI18n(<TripMembersPage {...props} />, { locale: "th" });
  return props;
}
