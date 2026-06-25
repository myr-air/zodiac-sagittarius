import {
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  SagittariusApp,
} from "@/src/app/SagittariusApp";
import { accountSessionStorageKey } from "@/src/account/session-storage";
import { seedTrip } from "@/src/trip/seed";
import { portalRoutes } from "@/src/trip/workspace/sagittarius-app/support/route-patterns";
import { optionalTrailingSlashPattern } from "@/src/trip/workspace/sagittarius-app/support/route-matchers";
import {
  createApiClientForTrip,
  installLocalStorageStub,
  mockAccountPortalApiFetch,
  persistAccountSession,
  persistTripParticipantSession,
  persistTrustedAccountSession,
  render,
  resetSagittariusAppTestEnvironment,
} from "./sagittarius-app.test-support";

describe("Sagittarius cockpit account access", () => {
  beforeEach(() => {
    resetSagittariusAppTestEnvironment();
  });

  it("does not restore temporary or expired account sessions from local storage", async () => {
    const storage = installLocalStorageStub();
    persistAccountSession(storage, {
      userId: "user-temp",
      sessionToken: "temporary-account-token",
      kind: "temporary",
      createdAt: "2026-05-29T00:00:00.000Z",
      expiresAt: "2099-06-28T00:00:00.000Z",
    });

    const { unmount } = render(<SagittariusApp requireJoin />);

    expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await waitFor(() =>
      expect(storage.getItem(accountSessionStorageKey)).toBeNull(),
    );

    unmount();
    persistAccountSession(storage, {
      userId: "user-expired",
      sessionToken: "expired-account-token",
      createdAt: "2020-05-29T00:00:00.000Z",
      expiresAt: "2020-06-28T00:00:00.000Z",
    });

    render(<SagittariusApp requireJoin />);

    expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await waitFor(() =>
      expect(storage.getItem(accountSessionStorageKey)).toBeNull(),
    );
  });

  it("hydrates a trusted account session on startup and renders account mode", async () => {
    const storage = installLocalStorageStub();
    persistTrustedAccountSession(storage);
    const fetchSpy = mockAccountPortalApiFetch();

    try {
      render(<SagittariusApp requireJoin dataSource="api" />);

      expect(
        await screen.findByText("User data stats และ session status"),
      ).toBeInTheDocument();
      expect(screen.getAllByText(/Dashboard|แดชบอร์ด/).length).toBeGreaterThan(
        0,
      );
      expect(screen.getByRole("tab", { name: /^Account$/i })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByRole("tab", { name: /Temp access/i })).toHaveAttribute(
        "aria-selected",
        "false",
      );
      expect(
        screen.getByRole("link", { name: /^Settings$|^ตั้งค่า$/i }),
      ).toHaveAttribute(
        "href",
        expect.stringMatching(optionalTrailingSlashPattern(portalRoutes.settings)),
      );
      expect(screen.queryByLabelText(/Trip ID/i)).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /ส่งรหัส sign-in/i }),
      ).not.toBeInTheDocument();
      await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(7));
    } finally {
      storage.clear();
      fetchSpy.mockRestore();
    }
  });

  it("keeps account portal routes in the portal even when a trip session is persisted", async () => {
    const storage = installLocalStorageStub();
    persistTrustedAccountSession(storage);
    persistTripParticipantSession(storage);
    const fetchSpy = mockAccountPortalApiFetch({
      trips: [
        {
          id: seedTrip.id,
          name: "Portal Trip",
          destinationLabel: "Hong Kong",
          countries: ["Hong Kong"],
          startDate: "2026-06-18",
          endDate: "2026-06-23",
          role: "owner",
          memberId: seedTrip.members[0].id,
          ownerMemberId: seedTrip.members[0].id,
          joinedAt: "2026-05-30T08:00:00.000Z",
          isOwner: true,
        },
      ],
    });

    try {
      render(
        <SagittariusApp
          accessMode="account-portal"
          portalSection="trips"
          requireJoin
          dataSource="api"
          apiClient={createApiClientForTrip(seedTrip)}
        />,
      );

      expect(await screen.findByText("Portal Trip")).toBeInTheDocument();
      expect(
        screen.getByRole("navigation", { name: /Portal navigation/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("navigation", { name: /เมนูวางแผน Joii/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Command center")).not.toBeInTheDocument();
    } finally {
      storage.clear();
      fetchSpy.mockRestore();
    }
  });

});
