import { HttpResponse, http } from "msw";
import { buildExpenseSummary } from "../src/trip/expenses";
import { tripFixtureSuggestions, tripFixtureTasks } from "../src/trip/testing/fixtures/trip-fixtures";
import { seedTrip } from "../src/trip/seed";
import type { ItineraryItem, Member, Suggestion, TripParticipantSession, TripTask } from "../src/trip/types";

const storybookSession: TripParticipantSession = {
  tripId: seedTrip.id,
  memberId: seedTrip.members[0].id,
  sessionToken: "storybook-session-token",
  createdAt: "2026-05-29T00:00:00.000Z",
  expiresAt: "2026-06-28T00:00:00.000Z",
};

const storybookTasks: Array<TripTask & { tripId: string; version: number }> = tripFixtureTasks.map((task) => ({
  ...task,
  tripId: seedTrip.id,
  version: 1,
}));

const storybookItineraryItems: ItineraryItem[] = seedTrip.itineraryItems.map((item) => ({ ...item }));
const storybookSuggestions: Suggestion[] = tripFixtureSuggestions.map((suggestion) => ({ ...suggestion }));

export const mswHandlers = [
  http.get("*/api/v1/account", () => HttpResponse.json(accountSettings())),
  http.get("*/api/v1/account/trips", () => HttpResponse.json([])),
  http.get("*/api/v1/account/trip-stats", () =>
    HttpResponse.json({
      tripsTotal: 0,
      tripsOwned: 0,
      activeTrips: 0,
      tempClaimsCompleted: 0,
    }),
  ),
  http.get("*/api/v1/account/explorer", () =>
    HttpResponse.json({
      upcomingTrips: 0,
      ownedTrips: 0,
      destinationCount: 0,
      nextTrip: null,
    }),
  ),
  http.get("*/api/v1/account/to-dos", () => HttpResponse.json([])),
  http.get("*/api/v1/account/vault", () => HttpResponse.json([])),
  http.post("*/api/v1/account/trips", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      originLabel?: string;
      originCity?: string;
      originCountry?: string;
      originCountryCode?: string;
      destinationLabel?: string;
      destinationCities?: Array<Record<string, unknown>>;
      countries?: string[];
      startDate?: string;
      endDate?: string;
      joinId?: string;
    };

    return HttpResponse.json(
      {
        trip: {
          id: "storybook-created-trip",
          name: body.name ?? "Storybook Trip",
          originLabel: body.originLabel ?? "Bangkok, Thailand",
          originCity: body.originCity ?? "Bangkok",
          originCountry: body.originCountry ?? "Thailand",
          originCountryCode: body.originCountryCode ?? "TH",
          destinationLabel: body.destinationLabel ?? "Hong Kong",
          destinationCities: body.destinationCities ?? [],
          countries: body.countries ?? [],
          startDate: body.startDate ?? "2026-06-18",
          endDate: body.endDate ?? "2026-06-23",
          joinId: body.joinId ?? "0626-SZX-ZLR",
          activePlanVariantId: "plan-main",
          ownerMemberId: "storybook-owner",
          version: 1,
        },
        ownerMemberId: "storybook-owner",
        memberSession: {
          tripId: "storybook-created-trip",
          memberId: "storybook-owner",
          sessionToken: "storybook-member-session-token",
          createdAt: "2026-05-30T08:00:00.000Z",
          expiresAt: "2026-06-29T08:00:00.000Z",
        },
      },
      { status: 201 },
    );
  }),
  http.post("*/api/v1/trip-join-sessions", async ({ request }) => {
    const body = await request.json().catch(() => null) as { joinCode?: string; tripPassword?: string } | null;
    if (body?.joinCode?.trim().toUpperCase() !== seedTrip.joinId || body.tripPassword !== "dim-sum-run") {
      return HttpResponse.json({ code: "unauthenticated", message: "unauthenticated" }, { status: 401 });
    }

    return HttpResponse.json({
      trip: tripSummary(),
      claimableMembers: seedTrip.members.map(memberSummary),
      joinSessionToken: "storybook-join-session-token",
      expiresAt: "2026-05-29T00:20:00.000Z",
    });
  }),
  http.post("*/api/v1/trips/:tripId/members/:memberId/claims", ({ params }) => {
    if (params.tripId !== seedTrip.id) return HttpResponse.json({ code: "not_found", message: "not found" }, { status: 404 });

    return HttpResponse.json({
      ...storybookSession,
      memberId: String(params.memberId),
    });
  }),
  http.post("*/api/v1/trips/:tripId/member-sessions", async ({ params, request }) => {
    if (params.tripId !== seedTrip.id) return HttpResponse.json({ code: "not_found", message: "not found" }, { status: 404 });
    const body = await request.json().catch(() => null) as { memberId?: string } | null;

    return HttpResponse.json({
      ...storybookSession,
      memberId: body?.memberId ?? storybookSession.memberId,
    });
  }),
  http.get("*/api/v1/trips/:tripId", ({ params, request }) => {
    if (params.tripId !== seedTrip.id) return HttpResponse.json({ code: "not_found", message: "not found" }, { status: 404 });
    if (!request.headers.get("authorization")?.startsWith("Bearer ")) {
      return HttpResponse.json({ code: "unauthenticated", message: "unauthenticated" }, { status: 401 });
    }

    return HttpResponse.json({
      trip: tripSummary(),
      members: seedTrip.members.map(memberSummary),
      planVariants: seedTrip.planVariants.map((variant) => ({ ...variant, version: 1 })),
      itineraryItems: storybookItineraryItems.map((item) => ({
        ...item,
        coordinates: item.coordinates ?? null,
        address: item.address ?? null,
        advisories: item.advisories ?? [],
      })),
      suggestions: storybookSuggestions,
      tasks: storybookTasks,
      expenseSummary: buildExpenseSummary(seedTrip.expenses, seedTrip.members[0].id),
    });
  }),
  http.patch("*/api/v1/trips/:tripId/itinerary-items/:itemId", async ({ params, request }) => {
    if (params.tripId !== seedTrip.id) return HttpResponse.json({ code: "not_found", message: "not found" }, { status: 404 });
    const body = await request.json() as { patch?: Partial<ItineraryItem>; expectedVersion?: number };
    const index = storybookItineraryItems.findIndex((item) => item.id === params.itemId);
    if (index < 0) return HttpResponse.json({ code: "not_found", message: "not found" }, { status: 404 });
    if (body.expectedVersion !== undefined && body.expectedVersion !== storybookItineraryItems[index].version) {
      return HttpResponse.json({ code: "conflict", message: "version conflict" }, { status: 409 });
    }

    storybookItineraryItems[index] = {
      ...storybookItineraryItems[index],
      ...body.patch,
      updatedAt: new Date().toISOString(),
      version: storybookItineraryItems[index].version + 1,
    };
    return HttpResponse.json(storybookItineraryItems[index]);
  }),
  http.post("*/api/v1/trips/:tripId/suggestions", async ({ params, request }) => {
    if (params.tripId !== seedTrip.id) return HttpResponse.json({ code: "not_found", message: "not found" }, { status: 404 });
    const body = await request.json() as Partial<Suggestion>;
    const suggestion = {
      id: `storybook-suggestion-${storybookSuggestions.length + 1}`,
      tripId: seedTrip.id,
      proposerId: storybookSession.memberId,
      type: body.type ?? "edit",
      targetItemId: body.targetItemId ?? null,
      planVariantId: body.planVariantId ?? seedTrip.activePlanVariantId,
      proposedPatch: body.proposedPatch ?? {},
      sourceVersion: body.sourceVersion ?? null,
      status: "pending",
      createdAt: new Date().toISOString(),
    } satisfies Suggestion;
    storybookSuggestions.push(suggestion);
    return HttpResponse.json(suggestion, { status: 201 });
  }),
  http.patch("*/api/v1/trips/:tripId/suggestions/:suggestionId", async ({ params, request }) => {
    if (params.tripId !== seedTrip.id) return HttpResponse.json({ code: "not_found", message: "not found" }, { status: 404 });
    const body = await request.json() as { status?: "approved" | "rejected" };
    return resolveStorybookSuggestion(params.suggestionId, body.status ?? "rejected");
  }),
  http.post("*/api/v1/trips/:tripId/tasks", async ({ params, request }) => {
    if (params.tripId !== seedTrip.id) return HttpResponse.json({ code: "not_found", message: "not found" }, { status: 404 });
    const body = await request.json() as Partial<TripTask>;
    const task = {
      id: `storybook-task-${storybookTasks.length + 1}`,
      tripId: seedTrip.id,
      title: body.title ?? "Untitled task",
      status: "open",
      visibility: body.visibility ?? "private",
      kind: body.kind ?? "prep",
      createdBy: seedTrip.members[0].id,
      assigneeId: body.assigneeId ?? null,
      relatedItemId: body.relatedItemId ?? null,
      version: 1,
    } satisfies TripTask & { tripId: string; version: number };
    storybookTasks.push(task);
    return HttpResponse.json(task, { status: 201 });
  }),
  http.patch("*/api/v1/trips/:tripId/tasks/:taskId", async ({ params, request }) => {
    if (params.tripId !== seedTrip.id) return HttpResponse.json({ code: "not_found", message: "not found" }, { status: 404 });
    const body = await request.json() as { patch?: Partial<TripTask> };
    const index = storybookTasks.findIndex((task) => task.id === params.taskId);
    if (index < 0) return HttpResponse.json({ code: "not_found", message: "not found" }, { status: 404 });
    storybookTasks[index] = {
      ...storybookTasks[index],
      ...body.patch,
      version: storybookTasks[index].version + 1,
    };
    return HttpResponse.json(storybookTasks[index]);
  }),
  http.delete("*/api/v1/trips/:tripId/member-sessions/current", () => new HttpResponse(null, { status: 204 })),
];

function accountSettings() {
  return {
    profile: {
      id: "user-aom",
      displayName: "Aom",
      avatarColor: "#0f766e",
      locale: "en-US",
      timezone: "Asia/Bangkok",
      primaryEmail: "aom@example.com",
    },
    passkeys: [],
    trustedDevices: [],
  };
}

function tripSummary() {
  return {
    id: seedTrip.id,
    name: seedTrip.name,
    destinationLabel: seedTrip.destinationLabel,
    startDate: seedTrip.startDate,
    endDate: seedTrip.endDate,
    joinId: seedTrip.joinId,
    activePlanVariantId: seedTrip.activePlanVariantId,
    ownerMemberId: seedTrip.members[0].id,
    version: 1,
  };
}

function memberSummary(member: Member) {
  return {
    id: member.id,
    tripId: seedTrip.id,
    displayName: member.displayName,
    role: member.role,
    accessStatus: member.accessStatus ?? "active",
    presence: member.presence,
    color: member.color,
    userId: member.userId ?? null,
    claimedAt: member.claimedAt ?? null,
    lastSeenAt: member.lastSeenAt ?? null,
  };
}

function resolveStorybookSuggestion(suggestionId: unknown, status: "approved" | "rejected") {
  const index = storybookSuggestions.findIndex((suggestion) => suggestion.id === suggestionId);
  if (index < 0) return HttpResponse.json({ code: "not_found", message: "not found" }, { status: 404 });
  storybookSuggestions[index] = { ...storybookSuggestions[index], status };
  return HttpResponse.json(storybookSuggestions[index]);
}
