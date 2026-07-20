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
  render(<LandingPage />);

  await user.type(
    screen.getByPlaceholderText("Destination or places"),
    DESTINATION,
  );
  await user.click(screen.getByRole("button", { name: "Start Planning" }));

  return user;
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
      const user = await submitGuestCreate();

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
});
