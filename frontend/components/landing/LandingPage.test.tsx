/**
 * LandingPage — guest create shows join credentials before /trips/{id}.
 * DOM: bunfig.toml preloads test/happy-dom-setup.ts for RTL under bun test.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { loadMemberSession } from "@/src/landing/create-trip";
import { LandingPage } from "./LandingPage";

/** Independent literals — not recomputed from production helpers. */
const TRIP_ID = "11111111-1111-4111-8111-111111111111";
const OWNER_MEMBER_ID = "22222222-2222-4222-8222-222222222222";
const SESSION_TOKEN = "member-session-token-landing-create";
const JOIN_ID = "2607-OSAK-0002";
const JOIN_PASSWORD = "6cS3gEFQbFviYAAWmw0uths4";
const DESTINATION = "Osaka";
const CONTINUE_LABEL = "Continue to trip";
const SKIP_LABEL = "Skip for now";
const BACK_HOME_LABEL = /← Back to Joii home/i;
/** One-shot warning literals (parity with JoinCredentialsPanel). */
const WARNING_ONCE = "Password is shown once";
const WARNING_AGAIN = /won.?t appear again/i;
/** Durable pending-credentials key (parity with joii.member.session). */
const PENDING_JOIN_STORAGE_KEY = "joii.pending.join";
const MEMBER_SESSION_STORAGE_KEY = "joii.member.session";
/** Resume affordance when session exists but pending credentials are gone. */
const OPEN_TRIP_LABEL = /Open your trip/i;
const TRIP_ROUTE = `/trips/${TRIP_ID}`;

const push = vi.fn();
const originalFetch = globalThis.fetch;

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const CREATE_SUCCESS_BODY = {
  trip: { id: TRIP_ID, joinId: JOIN_ID },
  ownerMemberId: OWNER_MEMBER_ID,
  joinPassword: JOIN_PASSWORD,
  memberSession: {
    tripId: TRIP_ID,
    memberId: OWNER_MEMBER_ID,
    sessionToken: SESSION_TOKEN,
    createdAt: "2026-07-19T00:00:00Z",
    expiresAt: "2026-07-26T00:00:00Z",
  },
};

async function submitGuestCreate() {
  const user = userEvent.setup();
  const view = render(<LandingPage />);

  await user.type(
    screen.getByPlaceholderText("Destination or places"),
    DESTINATION,
  );
  await user.click(screen.getByRole("button", { name: "Start Planning" }));

  return { user, ...view };
}

describe("LandingPage guest create credentials", () => {
  beforeEach(() => {
    push.mockClear();
    window.sessionStorage.clear();
    window.localStorage.clear();
    globalThis.fetch = vi.fn(async () =>
      jsonResponse(CREATE_SUCCESS_BODY),
    ) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("after successful guest create, shows JoinCredentialsPanel before any navigation to /trips/{id}", async () => {
    await submitGuestCreate();

    await waitFor(() => {
      expect(screen.getByText(JOIN_ID)).toBeInTheDocument();
    });
    expect(screen.getByText(JOIN_PASSWORD)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: CONTINUE_LABEL }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: SKIP_LABEL })).toBeInTheDocument();

    expect(push).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalledWith(TRIP_ROUTE);
  });

  it.each([
    { label: CONTINUE_LABEL, action: "Continue" },
    { label: SKIP_LABEL, action: "Skip" },
  ])(
    "$action navigates to /trips/{id} with the stored member session still valid",
    async ({ label }) => {
      const { user } = await submitGuestCreate();

      await waitFor(() => {
        expect(screen.getByText(JOIN_ID)).toBeInTheDocument();
      });

      expect(loadMemberSession(window.sessionStorage)).toEqual({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      });
      expect(push).not.toHaveBeenCalled();

      await user.click(screen.getByRole("button", { name: label }));

      expect(push).toHaveBeenCalledWith(TRIP_ROUTE);
      expect(loadMemberSession(window.sessionStorage)).toEqual({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      });
    },
  );

  it("Continue to trip navigates to /trips/{id} and does not leave #create create UI", async () => {
    const { user } = await submitGuestCreate();

    await waitFor(() => {
      expect(screen.getByText(JOIN_ID)).toBeInTheDocument();
    });
    expect(window.location.hash).toBe("#create");

    await user.click(screen.getByRole("button", { name: CONTINUE_LABEL }));

    expect(push).toHaveBeenCalledWith(TRIP_ROUTE);
    // Clearing pendingJoin must not fall back to create stub as if create never finished
    // (hash cleared, or create hash ignored so create mode is not shown).
    expect(
      screen.queryByRole("region", { name: "Create trip entry" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Ready to start planning")).not.toBeInTheDocument();
  });

  it("Skip for now uses /trips/{id} and leaves joii.member.session in sessionStorage", async () => {
    const { user } = await submitGuestCreate();

    await waitFor(() => {
      expect(screen.getByText(JOIN_ID)).toBeInTheDocument();
    });

    expect(window.sessionStorage.getItem("joii.member.session")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: SKIP_LABEL }));

    // Same Table route as Continue — not home, portal, or a day-only path.
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(TRIP_ROUTE);
    expect(push).not.toHaveBeenCalledWith("/");
    expect(push).not.toHaveBeenCalledWith("/trips");

    // Skip must not clear the member session needed for cockpit auth.
    const raw = window.sessionStorage.getItem("joii.member.session");
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toEqual({
      tripId: TRIP_ID,
      memberId: OWNER_MEMBER_ID,
      sessionToken: SESSION_TOKEN,
      createdAt: "2026-07-19T00:00:00Z",
      expiresAt: "2026-07-26T00:00:00Z",
    });
  });

  it("after successful guest create, pending joinId/joinPassword/route survive leaving the credentials panel via durable client storage", async () => {
    const { user, unmount } = await submitGuestCreate();

    await waitFor(() => {
      expect(screen.getByText(JOIN_ID)).toBeInTheDocument();
    });
    expect(screen.getByText(JOIN_PASSWORD)).toBeInTheDocument();

    // Leave credentials panel (Back home / remount) — pendingJoin must not be React-only.
    await user.click(screen.getByRole("link", { name: BACK_HOME_LABEL }));
    unmount();

    const raw = window.sessionStorage.getItem(PENDING_JOIN_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw!)).toEqual({
      joinId: JOIN_ID,
      joinPassword: JOIN_PASSWORD,
      route: TRIP_ROUTE,
    });
  });

  it("returning to landing with pending credentials restores JoinCredentialsPanel with password and one-shot warning without a second create", async () => {
    // Credentials already durable in storage — return/remount must hydrate, not create again.
    window.sessionStorage.setItem(
      PENDING_JOIN_STORAGE_KEY,
      JSON.stringify({
        joinId: JOIN_ID,
        joinPassword: JOIN_PASSWORD,
        route: TRIP_ROUTE,
      }),
    );
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockClear();

    render(<LandingPage />);

    await waitFor(() => {
      expect(screen.getByText(JOIN_ID)).toBeInTheDocument();
    });
    expect(screen.getByText(JOIN_PASSWORD)).toBeInTheDocument();

    const warning = screen.getByRole("note");
    expect(warning).toHaveTextContent(WARNING_ONCE);
    expect(warning).toHaveTextContent(WARNING_AGAIN);

    expect(
      screen.getByRole("button", { name: CONTINUE_LABEL }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: SKIP_LABEL })).toBeInTheDocument();

    // No second create: do not show create entry or POST /public/trips.
    expect(
      screen.queryByRole("region", { name: "Create trip entry" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Ready to start planning")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("with joii.member.session and no pending credentials, shows Open your trip without re-showing the join password", async () => {
    window.sessionStorage.setItem(
      MEMBER_SESSION_STORAGE_KEY,
      JSON.stringify({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      }),
    );
    expect(window.sessionStorage.getItem(PENDING_JOIN_STORAGE_KEY)).toBeNull();

    render(<LandingPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: OPEN_TRIP_LABEL }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(JOIN_PASSWORD)).not.toBeInTheDocument();
  });

  it("Open your trip navigates to /trips/{tripId} using the stored member session without requiring a second guest create", async () => {
    window.sessionStorage.setItem(
      MEMBER_SESSION_STORAGE_KEY,
      JSON.stringify({
        tripId: TRIP_ID,
        memberId: OWNER_MEMBER_ID,
        sessionToken: SESSION_TOKEN,
        createdAt: "2026-07-19T00:00:00Z",
        expiresAt: "2026-07-26T00:00:00Z",
      }),
    );
    expect(window.sessionStorage.getItem(PENDING_JOIN_STORAGE_KEY)).toBeNull();
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockClear();

    const user = userEvent.setup();
    render(<LandingPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: OPEN_TRIP_LABEL }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: OPEN_TRIP_LABEL }));

    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(TRIP_ROUTE);
    // Resume uses the existing member session — no second POST /public/trips.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(loadMemberSession(window.sessionStorage)).toEqual({
      tripId: TRIP_ID,
      memberId: OWNER_MEMBER_ID,
      sessionToken: SESSION_TOKEN,
      createdAt: "2026-07-19T00:00:00Z",
      expiresAt: "2026-07-26T00:00:00Z",
    });
  });
});
