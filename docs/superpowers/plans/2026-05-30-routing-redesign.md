# Routing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebaseline Sagittarius frontend URLs and backend API paths before the system grows, with no backward compatibility requirement.

**Implementation status:** Completed on 2026-05-30 in branch `codex/routing-redesign`. The checklist below remains as the original execution plan; verification evidence is summarized at the end of this file.

**Architecture:** Make `docs/api-data-spec.md` the canonical contract, move the backend to one `/api/v1` namespace, keep account/current-user concerns separate from trip-owned resources, and make frontend pages trip-scoped. Existing application services and UI components should be reused; this plan changes transport paths, page routing, and contract tests before changing behavior.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, MSW, Storybook, Rust 1.95, Axum, SQLx, PostgreSQL.

---

## Review Findings

### Finding 1: Frontend URLs are not trip-scoped

Current frontend pages are global: `/`, `/itinerary`, `/map`, `/timeline`, and `/members`. They depend on client state to know which trip is active. That is workable for one demo trip but becomes fragile once users can own or join multiple trips.

**Evidence:** `frontend/app/page.tsx`, `frontend/app/itinerary/page.tsx`, `frontend/app/map/page.tsx`, `frontend/app/timeline/page.tsx`, `frontend/app/members/page.tsx`, and hardcoded nav in `frontend/src/components/AppShell.tsx`.

**Impact:** Users cannot safely deep-link, refresh, or share a URL for a specific trip view. Future account dashboard routes will compete with the current `/` overview.

**Decision:** Use `/trips/{tripId}` as the trip workspace root and make all trip views children of that path.

### Finding 2: Invite URL is generated but not consumed

`TripMembersPage` creates `/members?trip={joinId}`, but no page reads the `trip` query parameter.

**Evidence:** `frontend/src/components/TripMembersPage.tsx` builds the invite URL; route search found no `useSearchParams`, `searchParams`, or equivalent consumer.

**Impact:** Invite links look actionable but do not prefill or scope the join flow.

**Decision:** Introduce `/join/{joinCode}` and let `TripJoinGate` accept an initial join code from route params.

### Finding 3: Backend, frontend clients, and docs have drifted

The backend implements some routes, `docs/api-data-spec.md` lists more routes, and `frontend/src/trip/api-contract.ts` includes `updateMember()` even though backend does not currently route `PATCH /v1/trips/{tripId}/members/{memberId}`.

**Evidence:** `backend/crates/sagittarius-api/src/api/mod.rs`, `docs/api-data-spec.md`, `frontend/src/trip/api-contract.ts`.

**Impact:** Integration tests can pass while the written contract remains misleading. This will slow every future vertical slice.

**Decision:** Update `docs/api-data-spec.md` first, then make tests and clients derive their expectations from the new route table.

### Finding 4: API namespaces mix account-owned and trip-owned actions

Routes such as `/v1/account/trips/{tripId}/owner-transfer` and `/v1/account/trips/{tripId}/members/{memberId}/claim` are account-authenticated, but the resource being changed is trip membership or ownership.

**Evidence:** `backend/crates/sagittarius-api/src/api/mod.rs` and `frontend/src/account/api-client.ts`.

**Impact:** The URL shape will become ambiguous when trips gain invitations, ownership-transfer audit history, member management, and organization-level ownership.

**Decision:** Keep account routes for current-user views and identity devices. Move trip mutations under `/api/v1/trips/{tripId}/...`.

### Finding 5: Action endpoints are inconsistent

The current API mixes resource paths with actions: `/approve`, `/reject`, `/owner-transfer`, `/member-session/logout`, `/email-login/start`, and `/email-login/finish`.

**Evidence:** `backend/crates/sagittarius-api/src/api/mod.rs`.

**Impact:** This is not fatal, but each new workflow will invent a new style unless we choose a rule now.

**Decision:** Use resources for durable things and narrow command subresources where the action is a domain event. Examples: `PATCH /suggestions/{id}` for status changes, `POST /ownership-transfers` for owner transfer, and `DELETE /member-sessions/current` for logout.

## Target URL Spec

### Frontend URLs

| Path | Purpose | Notes |
| --- | --- | --- |
| `/` | Entry redirect | Redirect to `/trips` when signed in, otherwise show/jump to login or join entry. |
| `/login` | Account login | Email and passkey login entry. |
| `/account` | Account settings | Profile, passkeys, trusted devices. |
| `/trips` | Account trip dashboard | List owned/joined trips and create trip entry. |
| `/trips/new` | Create trip | Account-authenticated create flow. |
| `/trips/{tripId}` | Trip overview | Replaces current `/`. |
| `/trips/{tripId}/itinerary` | Itinerary table | Replaces `/itinerary`. |
| `/trips/{tripId}/map` | Route map | Replaces `/map`. |
| `/trips/{tripId}/timeline` | Timeline | Replaces `/timeline`. |
| `/trips/{tripId}/members` | Member command center | Replaces `/members`. |
| `/join/{joinCode}` | Invite/join flow | Prefills the room-level join code. |

### Backend API Base

All backend API routes use `/api/v1`.

### Health

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/health` | none | Liveness check. |

### Account Auth

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/email/challenges` | none | Start email-code login. |
| `POST` | `/api/v1/auth/email/sessions` | none | Finish email-code login and create account session. |
| `POST` | `/api/v1/auth/passkeys/options` | none | Start passkey login. |
| `POST` | `/api/v1/auth/passkeys/sessions` | none | Finish passkey login and create account session. |
| `DELETE` | `/api/v1/account/session` | account bearer | Revoke current account session. |

### Account Resources

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/account` | account bearer | Current account profile plus account settings aggregate. |
| `PATCH` | `/api/v1/account` | account bearer | Update profile settings. |
| `GET` | `/api/v1/account/trips` | account bearer | List trips visible through account identity. |
| `POST` | `/api/v1/account/trips` | account bearer | Create an account-owned trip. |
| `GET` | `/api/v1/account/trip-stats` | account bearer | Account trip summary counters. |
| `POST` | `/api/v1/account/passkeys/options` | account bearer | Start passkey registration. |
| `POST` | `/api/v1/account/passkeys` | account bearer | Finish passkey registration. |
| `DELETE` | `/api/v1/account/trusted-devices/{trustedDeviceId}` | account bearer | Revoke trusted device. |

### Join And Member Sessions

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/trip-join-sessions` | none | Validate `{ joinCode, tripPassword }` and return safe trip metadata, claimable members, and a short-lived `joinSessionToken`. |
| `POST` | `/api/v1/trips/{tripId}/members/{memberId}/claims` | join-session token | First-time member claim; returns trip member session. |
| `POST` | `/api/v1/trips/{tripId}/member-sessions` | join-session token | Existing member login; body includes `memberId` and `participantPassword`. |
| `DELETE` | `/api/v1/trips/{tripId}/member-sessions/current` | member bearer | Revoke current trip member session. |

Join sessions must be real short-lived server-side records. They prevent claim/login endpoints from accepting only a guessed `tripId`, `memberId`, and participant password.

```sql
CREATE TABLE trip_join_sessions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  join_session_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX trip_join_sessions_trip_active_idx
  ON trip_join_sessions (trip_id, expires_at DESC)
  WHERE consumed_at IS NULL;
```

### Trip Workspace

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/trips/{tripId}` | member bearer | Load full trip cockpit payload. |
| `PATCH` | `/api/v1/trips/{tripId}` | member bearer | Update trip metadata and active plan variant. |
| `GET` | `/api/v1/trips/{tripId}/members` | member bearer | List visible members. |
| `POST` | `/api/v1/trips/{tripId}/members` | member bearer | Create member. |
| `PATCH` | `/api/v1/trips/{tripId}/members/{memberId}` | member bearer | Update role, display name, or access status. |
| `POST` | `/api/v1/trips/{tripId}/members/{memberId}/claim-resets` | member bearer | Reset a guest member claim. |
| `POST` | `/api/v1/trips/{tripId}/members/{memberId}/account-links` | account bearer | Link current account to a trip member using a member session token. |
| `POST` | `/api/v1/trips/{tripId}/ownership-transfers` | member or account bearer | Transfer owner role to target member. |

### Planning Resources

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/v1/trips/{tripId}/plan-variants` | member bearer | Create plan variant. |
| `PATCH` | `/api/v1/trips/{tripId}/plan-variants/{planVariantId}` | member bearer | Update plan variant. |
| `POST` | `/api/v1/trips/{tripId}/plan-variants/{planVariantId}/publications` | member bearer | Publish plan variant. |
| `POST` | `/api/v1/trips/{tripId}/itinerary-items` | member bearer | Create itinerary item. |
| `PATCH` | `/api/v1/trips/{tripId}/itinerary-items/{itemId}` | member bearer | Patch itinerary item. |
| `DELETE` | `/api/v1/trips/{tripId}/itinerary-items/{itemId}` | member bearer | Soft-delete itinerary item. |
| `PATCH` | `/api/v1/trips/{tripId}/itinerary-items/order` | member bearer | Reorder itinerary items. |
| `POST` | `/api/v1/trips/{tripId}/suggestions` | member bearer | Create suggestion. |
| `PATCH` | `/api/v1/trips/{tripId}/suggestions/{suggestionId}` | member bearer | Change suggestion status to `approved` or `rejected`. |
| `POST` | `/api/v1/trips/{tripId}/tasks` | member bearer | Create task. |
| `PATCH` | `/api/v1/trips/{tripId}/tasks/{taskId}` | member bearer | Patch task. |
| `GET` | `/api/v1/trips/{tripId}/expenses/summary` | member bearer | Load expense summary. |
| `POST` | `/api/v1/trips/{tripId}/expenses` | member bearer | Create expense. |
| `PATCH` | `/api/v1/trips/{tripId}/expenses/{expenseId}` | member bearer | Patch expense. |
| `DELETE` | `/api/v1/trips/{tripId}/expenses/{expenseId}` | member bearer | Soft-delete expense. |

### Realtime

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1/trips/{tripId}/events/stream` | member bearer or `?token=` | WebSocket stream with `?afterEventId=` replay support. |

## Implementation Plan

### Task 1: Rebaseline Canonical Docs

**Files:**
- Modify: `docs/api-data-spec.md`
- Modify: `docs/frontend-core-freeze.md`
- Optional archive note: `docs/superpowers/specs/2026-05-29-backend-vertical-slice-design.md`
- Optional archive note: `docs/superpowers/specs/2026-05-29-account-membership-system-design.md`

- [ ] **Step 1: Update `docs/api-data-spec.md` REST API section**

Replace the current `Base path: /v1` and route tables with the Target URL Spec from this plan. Keep the storage model, role matrix, read payload, and event envelope unless a route name directly references the old path.

- [ ] **Step 2: Update WebSocket docs**

Change the endpoint from:

```text
wss://api.sagittarius.local/v1/trips/:tripId/ws
```

to:

```text
wss://api.sagittarius.local/api/v1/trips/:tripId/events/stream
```

Keep `?afterEventId=` as the replay query parameter.

- [ ] **Step 3: Update frontend freeze wording**

In `docs/frontend-core-freeze.md`, replace "page routes" as frozen surface with "existing workspace components and visual layout." Add that route paths are intentionally being rebaselined by this plan.

- [ ] **Step 4: Verify docs no longer present the old contract as canonical**

Run:

```bash
rtk rg -n "Base path: `/v1`|/v1/trips/join|/v1/trips/:tripId/ws|/members\\?trip" docs/api-data-spec.md docs/frontend-core-freeze.md
```

Expected: no matches in canonical docs.

- [ ] **Step 5: Commit**

```bash
git add docs/api-data-spec.md docs/frontend-core-freeze.md
git commit -m "docs: rebaseline routing contract"
```

### Task 2: Add Frontend Route Constants

**Files:**
- Create: `frontend/src/routes/app-routes.ts`
- Modify: `frontend/src/components/AppShell.tsx`
- Modify: `frontend/src/components/AppShell.test.tsx`
- Modify: `frontend/src/components/TripMembersPage.tsx`
- Modify: `frontend/src/components/TripMembersPage.test.tsx`

- [ ] **Step 1: Write route helper tests**

Create assertions in `frontend/src/components/AppShell.test.tsx` or a new `frontend/src/routes/app-routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { appRoutes, tripWorkspaceNavItems } from "@/src/routes/app-routes";

describe("app route helpers", () => {
  it("builds trip-scoped workspace paths", () => {
    expect(appRoutes.trips()).toBe("/trips");
    expect(appRoutes.tripOverview("trip 1")).toBe("/trips/trip%201");
    expect(appRoutes.tripItinerary("trip 1")).toBe("/trips/trip%201/itinerary");
    expect(appRoutes.tripMap("trip 1")).toBe("/trips/trip%201/map");
    expect(appRoutes.tripTimeline("trip 1")).toBe("/trips/trip%201/timeline");
    expect(appRoutes.tripMembers("trip 1")).toBe("/trips/trip%201/members");
    expect(appRoutes.join("HK-SZ-2025")).toBe("/join/HK-SZ-2025");
  });

  it("keeps workspace nav tied to a trip id", () => {
    expect(tripWorkspaceNavItems("trip-1").map((item) => item.href)).toEqual([
      "/trips/trip-1",
      "/trips/trip-1/itinerary",
      "/trips/trip-1/map",
      "/trips/trip-1/timeline",
      "/trips/trip-1/members",
    ]);
  });
});
```

- [ ] **Step 2: Run the failing route helper test**

Run:

```bash
cd frontend && rtk bun test src/routes/app-routes.test.ts
```

Expected: FAIL because `frontend/src/routes/app-routes.ts` does not exist.

- [ ] **Step 3: Add route helper implementation**

Create `frontend/src/routes/app-routes.ts`:

```ts
import type { PlanningView } from "@/src/app/SagittariusApp";

function segment(value: string): string {
  return encodeURIComponent(value);
}

export const appRoutes = {
  home: () => "/",
  login: () => "/login",
  account: () => "/account",
  trips: () => "/trips",
  newTrip: () => "/trips/new",
  join: (joinCode: string) => `/join/${segment(joinCode)}`,
  tripOverview: (tripId: string) => `/trips/${segment(tripId)}`,
  tripItinerary: (tripId: string) => `/trips/${segment(tripId)}/itinerary`,
  tripMap: (tripId: string) => `/trips/${segment(tripId)}/map`,
  tripTimeline: (tripId: string) => `/trips/${segment(tripId)}/timeline`,
  tripMembers: (tripId: string) => `/trips/${segment(tripId)}/members`,
};

export function tripWorkspaceNavItems(tripId: string): Array<{ id: PlanningView; label: string; icon: "home" | "calendar" | "map" | "list" | "users"; href: string }> {
  return [
    { id: "overview", label: "ภาพรวม", icon: "home", href: appRoutes.tripOverview(tripId) },
    { id: "itinerary", label: "แผนการเดินทาง", icon: "calendar", href: appRoutes.tripItinerary(tripId) },
    { id: "map", label: "แผนที่", icon: "map", href: appRoutes.tripMap(tripId) },
    { id: "timeline", label: "ไทม์ไลน์", icon: "list", href: appRoutes.tripTimeline(tripId) },
    { id: "members", label: "สมาชิก", icon: "users", href: appRoutes.tripMembers(tripId) },
  ];
}
```

- [ ] **Step 4: Wire AppShell to route helpers**

Remove the hardcoded `navItems` array in `frontend/src/components/AppShell.tsx`, import `appRoutes` and `tripWorkspaceNavItems`, and derive nav items with `tripWorkspaceNavItems(trip.id)`. Change the summary link to `appRoutes.tripOverview(trip.id)`.

- [ ] **Step 5: Change invite links**

In `frontend/src/components/TripMembersPage.tsx`, change:

```ts
return `${baseUrl}/members?trip=${encodeURIComponent(joinId)}`;
```

to:

```ts
return `${baseUrl}/join/${encodeURIComponent(joinId)}`;
```

- [ ] **Step 6: Run frontend route tests**

Run:

```bash
cd frontend && rtk bun test src/routes/app-routes.test.ts src/components/AppShell.test.tsx src/components/TripMembersPage.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/routes/app-routes.ts frontend/src/routes/app-routes.test.ts frontend/src/components/AppShell.tsx frontend/src/components/AppShell.test.tsx frontend/src/components/TripMembersPage.tsx frontend/src/components/TripMembersPage.test.tsx
git commit -m "feat: add trip-scoped frontend route helpers"
```

### Task 3: Restructure Next App Routes

**Files:**
- Create: `frontend/app/trips/page.tsx`
- Create: `frontend/app/trips/new/page.tsx`
- Create: `frontend/app/trips/[tripId]/page.tsx`
- Create: `frontend/app/trips/[tripId]/itinerary/page.tsx`
- Create: `frontend/app/trips/[tripId]/map/page.tsx`
- Create: `frontend/app/trips/[tripId]/timeline/page.tsx`
- Create: `frontend/app/trips/[tripId]/members/page.tsx`
- Create: `frontend/app/join/[joinCode]/page.tsx`
- Modify: `frontend/app/page.tsx`
- Delete after tests pass: `frontend/app/itinerary/page.tsx`
- Delete after tests pass: `frontend/app/map/page.tsx`
- Delete after tests pass: `frontend/app/timeline/page.tsx`
- Delete after tests pass: `frontend/app/members/page.tsx`
- Modify: `frontend/src/app/SagittariusApp.tsx`
- Modify: `frontend/src/components/TripJoinGate.tsx`
- Modify: `frontend/src/project-contract.test.ts`

- [ ] **Step 1: Write project contract expectations**

Update `frontend/src/project-contract.test.ts` to expect:

```ts
expect(existsSync(join(frontendRoot, "app/trips/[tripId]/page.tsx"))).toBe(true);
expect(existsSync(join(frontendRoot, "app/trips/[tripId]/itinerary/page.tsx"))).toBe(true);
expect(existsSync(join(frontendRoot, "app/trips/[tripId]/map/page.tsx"))).toBe(true);
expect(existsSync(join(frontendRoot, "app/trips/[tripId]/timeline/page.tsx"))).toBe(true);
expect(existsSync(join(frontendRoot, "app/trips/[tripId]/members/page.tsx"))).toBe(true);
expect(existsSync(join(frontendRoot, "app/join/[joinCode]/page.tsx"))).toBe(true);
```

Also update old assertions that require `app/page.tsx` to be the production app entry.

- [ ] **Step 2: Run project contract to verify it fails**

Run:

```bash
cd frontend && rtk bun test src/project-contract.test.ts
```

Expected: FAIL because dynamic route files do not exist.

- [ ] **Step 3: Add route-aware props**

Extend `SagittariusAppProps` in `frontend/src/app/SagittariusApp.tsx`:

```ts
interface SagittariusAppProps {
  initialView?: PlanningView;
  requireJoin?: boolean;
  dataSource?: "api" | "demo";
  apiClient?: TripApiClient;
  routeTripId?: string;
  initialJoinCode?: string;
}
```

Use `routeTripId` when loading API trip data after a persisted participant session is available. Pass `initialJoinCode` down to `TripJoinGate`.

- [ ] **Step 4: Let TripJoinGate accept an initial join code**

Add prop support in `frontend/src/components/TripJoinGate.tsx`:

```ts
interface TripJoinGateProps {
  activeTrip?: Trip;
  apiClient?: TripApiClient;
  dataSource?: "api" | "demo";
  initialJoinCode?: string;
  onJoin: (input: { trip: Trip; session: TripParticipantSession }) => void;
}
```

Initialize state with:

```ts
const [joinId, setJoinId] = useState(initialJoinCode ?? "");
```

- [ ] **Step 5: Add dynamic trip pages**

Each dynamic page should pass `params.tripId` into `SagittariusApp`.

Example for `frontend/app/trips/[tripId]/itinerary/page.tsx`:

```tsx
import { SagittariusApp } from "@/src/app/SagittariusApp";

export default async function TripItineraryPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  return <SagittariusApp initialView="itinerary" requireJoin dataSource="api" routeTripId={tripId} />;
}
```

Use the same shape for overview, map, timeline, and members with the correct `initialView`.

- [ ] **Step 6: Add join page**

Create `frontend/app/join/[joinCode]/page.tsx`:

```tsx
import { SagittariusApp } from "@/src/app/SagittariusApp";

export default async function JoinPage({ params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = await params;
  return <SagittariusApp requireJoin dataSource="api" initialJoinCode={decodeURIComponent(joinCode)} />;
}
```

- [ ] **Step 7: Add trips dashboard placeholder**

Create `frontend/app/trips/page.tsx` using existing `SagittariusApp` only if no account dashboard exists yet:

```tsx
import { SagittariusApp } from "@/src/app/SagittariusApp";

export default function TripsPage() {
  return <SagittariusApp requireJoin dataSource="api" />;
}
```

This is a temporary bridge until the account dashboard is implemented. Do not make it a marketing page.

- [ ] **Step 8: Change root page**

`frontend/app/page.tsx` should redirect to `/trips`:

```tsx
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/trips");
}
```

- [ ] **Step 9: Remove old top-level workspace pages**

Delete:

```text
frontend/app/itinerary/page.tsx
frontend/app/map/page.tsx
frontend/app/timeline/page.tsx
frontend/app/members/page.tsx
```

- [ ] **Step 10: Run frontend route contract and app tests**

Run:

```bash
cd frontend && rtk bun test src/project-contract.test.ts src/components/TripJoinGate.test.tsx src/components/SagittariusApp.test.tsx
```

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add frontend/app frontend/src/app/SagittariusApp.tsx frontend/src/components/TripJoinGate.tsx frontend/src/project-contract.test.ts frontend/src/components/TripJoinGate.test.tsx frontend/src/components/SagittariusApp.test.tsx
git commit -m "feat: move workspace to trip-scoped routes"
```

### Task 4: Add Backend Route Contract Tests

**Files:**
- Create: `backend/crates/sagittarius-api/tests/route_contract.rs`
- Modify: existing backend contract tests that hardcode old paths.

- [ ] **Step 1: Add route contract smoke tests**

Create `backend/crates/sagittarius-api/tests/route_contract.rs` with route-level expectations for the new base path:

```rust
use axum::body::Body;
use http::{Method, Request, StatusCode, header::CONTENT_TYPE};
use tower::ServiceExt;

#[tokio::test]
async fn api_v1_health_is_the_liveness_path() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(Request::builder().uri("/api/v1/health").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn old_v1_health_is_not_supported() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(Request::builder().uri("/v1/health").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn unknown_api_v1_route_returns_json_not_found() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(Request::builder().uri("/api/v1/missing").body(Body::empty()).unwrap())
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    assert!(response.headers().get(CONTENT_TYPE).unwrap().to_str().unwrap().starts_with("application/json"));
}

#[tokio::test]
async fn cors_preflight_allows_new_join_session_route() {
    let app = sagittarius_api::api::router(sagittarius_api::app::AppState::test());
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::OPTIONS)
                .uri("/api/v1/trip-join-sessions")
                .header("origin", "http://127.0.0.1:5180")
                .header("access-control-request-method", "POST")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}
```

- [ ] **Step 2: Run route contract and verify it fails**

Run:

```bash
cd backend && rtk cargo test --manifest-path crates/sagittarius-api/Cargo.toml --test route_contract
```

Expected: FAIL because `/api/v1/health` does not exist yet.

- [ ] **Step 3: Update existing backend tests**

Replace old paths in backend tests:

```text
/v1/health -> /api/v1/health
/v1/trips/join -> /api/v1/trip-join-sessions
/v1/trips/{tripId}/members/{memberId}/claim -> /api/v1/trips/{tripId}/members/{memberId}/claims
/v1/trips/{tripId}/members/{memberId}/login -> /api/v1/trips/{tripId}/member-sessions
/v1/trips/{tripId}/member-session/logout -> /api/v1/trips/{tripId}/member-sessions/current
/v1/trips/{tripId} -> /api/v1/trips/{tripId}
/v1/trips/{tripId}/ws -> /api/v1/trips/{tripId}/events/stream
/v1/itinerary-items/{itemId} -> /api/v1/trips/{tripId}/itinerary-items/{itemId}
/v1/suggestions/{suggestionId}/approve -> /api/v1/trips/{tripId}/suggestions/{suggestionId}
/v1/suggestions/{suggestionId}/reject -> /api/v1/trips/{tripId}/suggestions/{suggestionId}
/v1/tasks/{taskId} -> /api/v1/trips/{tripId}/tasks/{taskId}
```

For `PATCH` suggestion status, request bodies should be:

```json
{ "clientMutationId": "web-suggestion-resolve-1", "expectedStatus": "pending", "status": "approved" }
```

or:

```json
{ "clientMutationId": "web-suggestion-resolve-2", "expectedStatus": "pending", "status": "rejected" }
```

- [ ] **Step 4: Commit failing tests**

```bash
git add backend/crates/sagittarius-api/tests
git commit -m "test: define new backend route contract"
```

### Task 5: Add Backend Join Session Token Support

**Files:**
- Create: `backend/migrations/0003_trip_join_sessions.sql`
- Modify: `backend/crates/sagittarius-api/src/domain/types.rs`
- Modify: `backend/crates/sagittarius-api/src/app/auth.rs`
- Modify: `backend/crates/sagittarius-api/src/db/queries.rs`
- Modify: `backend/crates/sagittarius-api/src/api/join.rs`
- Modify: `backend/crates/sagittarius-api/tests/join_session_contract.rs`

- [ ] **Step 1: Add migration**

Create `backend/migrations/0003_trip_join_sessions.sql`:

```sql
CREATE TABLE trip_join_sessions (
  id uuid PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id),
  join_session_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);

CREATE INDEX trip_join_sessions_trip_active_idx
  ON trip_join_sessions (trip_id, expires_at DESC)
  WHERE consumed_at IS NULL;
```

- [ ] **Step 2: Extend join response type**

In `backend/crates/sagittarius-api/src/domain/types.rs`, add `joinSessionToken` and `expiresAt` to the join response DTO used by `POST /api/v1/trip-join-sessions`.

```rust
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct JoinTripResponse {
    pub trip: TripSummary,
    pub claimable_members: Vec<ClaimableMember>,
    pub join_session_token: String,
    pub expires_at: String,
}
```

Use the existing `format_timestamp` pattern from `backend/crates/sagittarius-api/src/app/auth.rs` when constructing `expires_at`.

- [ ] **Step 3: Add token hashing and persistence queries**

In `backend/crates/sagittarius-api/src/db/queries.rs`, add queries to insert and verify active join sessions:

```rust
pub async fn insert_trip_join_session(
    executor: impl sqlx::Executor<'_, Database = sqlx::Postgres>,
    id: Uuid,
    trip_id: Uuid,
    token_hash: &str,
    expires_at: OffsetDateTime,
) -> Result<(), sqlx::Error> {
    sqlx::query!(
        "insert into trip_join_sessions (id, trip_id, join_session_token_hash, expires_at)
         values ($1, $2, $3, $4)",
        id,
        trip_id,
        token_hash,
        expires_at,
    )
    .execute(executor)
    .await?;

    Ok(())
}
```

Add a matching lookup that returns `Some(trip_id)` only when `consumed_at IS NULL` and `expires_at > now()`. This lookup must use the token hash, not the raw token.

- [ ] **Step 4: Require join-session token for claim and login**

Update claim/login request DTOs in `backend/crates/sagittarius-api/src/api/join.rs`:

```rust
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParticipantPasswordRequest {
    pub participant_password: String,
    pub join_session_token: String,
}
```

Before calling `app::auth::claim_member` or `app::auth::login_member`, verify that `join_session_token` is active and belongs to the same `trip_id`.

- [ ] **Step 5: Add contract tests**

In `backend/crates/sagittarius-api/tests/join_session_contract.rs`, add tests:

```rust
#[tokio::test]
async fn claim_requires_active_join_session_token() {
    // POST /api/v1/trips/{tripId}/members/{memberId}/claims without joinSessionToken.
    // Expected: 401 unauthenticated.
}

#[tokio::test]
async fn join_session_token_can_claim_member() {
    // POST /api/v1/trip-join-sessions, capture joinSessionToken,
    // then POST /api/v1/trips/{tripId}/members/{memberId}/claims.
    // Expected: 200 OK with member session.
}
```

Use the existing test helper style from the same file.

- [ ] **Step 6: Run join-session tests**

Run:

```bash
cd backend && rtk cargo test --manifest-path crates/sagittarius-api/Cargo.toml --test join_session_contract
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/migrations/0003_trip_join_sessions.sql backend/crates/sagittarius-api/src backend/crates/sagittarius-api/tests/join_session_contract.rs
git commit -m "feat: require join sessions for trip member auth"
```

### Task 6: Refactor Backend Router

**Files:**
- Modify: `backend/crates/sagittarius-api/src/api/mod.rs`
- Modify: `backend/crates/sagittarius-api/src/api/account.rs`
- Modify: `backend/crates/sagittarius-api/src/api/join.rs`
- Modify: `backend/crates/sagittarius-api/src/api/itinerary.rs`
- Modify: `backend/crates/sagittarius-api/src/api/suggestions.rs`
- Modify: `backend/crates/sagittarius-api/src/api/tasks.rs`
- Modify: `backend/crates/sagittarius-api/src/api/ws.rs`
- Modify: application functions only where request DTOs must change.

- [ ] **Step 1: Nest the backend under `/api/v1`**

In `api/mod.rs`, build a versioned router:

```rust
pub fn router(state: AppState) -> Router {
    Router::new()
        .nest("/api/v1", api_v1())
        .fallback(error::not_found)
        .layer(cors_layer())
        .with_state(state)
}

fn api_v1() -> Router<AppState> {
    Router::new()
        .route("/health", get(|| async { "ok" }))
        // auth, account, trip, and realtime routes go here
}
```

Keep CORS behavior unchanged.

- [ ] **Step 2: Move auth routes**

Map:

```rust
.route("/auth/email/challenges", post(account::start_email_login))
.route("/auth/email/sessions", post(account::finish_email_login))
.route("/auth/passkeys/options", post(account::start_passkey_login))
.route("/auth/passkeys/sessions", post(account::finish_passkey_login))
```

- [ ] **Step 3: Move account routes**

Map:

```rust
.route("/account", get(account::get_settings).patch(account::update_settings))
.route("/account/session", delete(account::logout_session))
.route("/account/trips", get(account::list_trips).post(account::create_trip))
.route("/account/trip-stats", get(account::get_stats))
.route("/account/passkeys/options", post(account::start_passkey_registration))
.route("/account/passkeys", post(account::finish_passkey_registration))
.route("/account/trusted-devices/{trusted_device_id}", delete(account::revoke_trusted_device))
```

Keep `get_me` only if the code still needs a compatibility-free internal handler; do not expose `/account/me`.

- [ ] **Step 4: Move join and member session routes**

Map:

```rust
.route("/trip-join-sessions", post(join::join_trip))
.route("/trips/{trip_id}/members/{member_id}/claims", post(join::claim_member))
.route("/trips/{trip_id}/member-sessions", post(join::login_member))
.route("/trips/{trip_id}/member-sessions/current", delete(join::logout))
```

Change `login_member` request DTO to include `memberId` in the body or create a wrapper handler that extracts body member id and calls the same app service.

- [ ] **Step 5: Move trip-owned mutation routes**

Map:

```rust
.route("/trips/{trip_id}", get(trips::load_trip))
.route("/trips/{trip_id}/itinerary-items/{item_id}", patch(itinerary::patch_itinerary_item))
.route("/trips/{trip_id}/suggestions", post(suggestions::create_suggestion))
.route("/trips/{trip_id}/suggestions/{suggestion_id}", patch(suggestions::patch_suggestion))
.route("/trips/{trip_id}/tasks", post(tasks::create_task))
.route("/trips/{trip_id}/tasks/{task_id}", patch(tasks::patch_task))
.route("/trips/{trip_id}/events/stream", get(ws::trip_ws))
.route("/trips/{trip_id}/members/{member_id}/account-links", post(account::claim_member))
.route("/trips/{trip_id}/ownership-transfers", post(account::transfer_owner))
```

Where existing app services identify the trip from `item_id`, `suggestion_id`, or `task_id`, still verify it matches the path `trip_id` before applying the mutation. Return `404 not_found` or `403 forbidden`; do not silently ignore mismatches.

- [ ] **Step 6: Run backend route tests**

Run:

```bash
cd backend && rtk cargo test --manifest-path crates/sagittarius-api/Cargo.toml --test route_contract
```

Expected: PASS.

- [ ] **Step 7: Run backend contract tests**

Run:

```bash
cd backend && rtk cargo test --manifest-path crates/sagittarius-api/Cargo.toml
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add backend/crates/sagittarius-api/src backend/crates/sagittarius-api/tests
git commit -m "feat: move backend routes to api v1 contract"
```

### Task 7: Refactor Frontend API Clients

**Files:**
- Create: `frontend/src/trip/api-routes.ts`
- Create: `frontend/src/account/api-routes.ts`
- Modify: `frontend/src/trip/api-client.ts`
- Modify: `frontend/src/trip/api-client.test.ts`
- Modify: `frontend/src/trip/api-contract.ts`
- Modify: `frontend/src/trip/api-contract.test.ts`
- Modify: `frontend/src/account/api-client.ts`
- Modify: `frontend/src/account/api-client.test.ts`
- Modify: `frontend/scripts/run-local-real-api-e2e.ts`

- [ ] **Step 1: Add route helpers for backend paths**

Create `frontend/src/trip/api-routes.ts`:

```ts
function segment(value: string): string {
  return encodeURIComponent(value);
}

export const tripApiRoutes = {
  joinSessions: () => "/api/v1/trip-join-sessions",
  memberClaims: (tripId: string, memberId: string) => `/api/v1/trips/${segment(tripId)}/members/${segment(memberId)}/claims`,
  memberSessions: (tripId: string) => `/api/v1/trips/${segment(tripId)}/member-sessions`,
  currentMemberSession: (tripId: string) => `/api/v1/trips/${segment(tripId)}/member-sessions/current`,
  cockpit: (tripId: string) => `/api/v1/trips/${segment(tripId)}`,
  itineraryItem: (tripId: string, itemId: string) => `/api/v1/trips/${segment(tripId)}/itinerary-items/${segment(itemId)}`,
  suggestions: (tripId: string) => `/api/v1/trips/${segment(tripId)}/suggestions`,
  suggestion: (tripId: string, suggestionId: string) => `/api/v1/trips/${segment(tripId)}/suggestions/${segment(suggestionId)}`,
  tasks: (tripId: string) => `/api/v1/trips/${segment(tripId)}/tasks`,
  task: (tripId: string, taskId: string) => `/api/v1/trips/${segment(tripId)}/tasks/${segment(taskId)}`,
  eventStream: (tripId: string) => `/api/v1/trips/${segment(tripId)}/events/stream`,
};
```

Create `frontend/src/account/api-routes.ts`:

```ts
function segment(value: string): string {
  return encodeURIComponent(value);
}

export const accountApiRoutes = {
  emailChallenges: () => "/api/v1/auth/email/challenges",
  emailSessions: () => "/api/v1/auth/email/sessions",
  passkeyLoginOptions: () => "/api/v1/auth/passkeys/options",
  passkeyLoginSessions: () => "/api/v1/auth/passkeys/sessions",
  account: () => "/api/v1/account",
  accountSession: () => "/api/v1/account/session",
  accountTrips: () => "/api/v1/account/trips",
  accountTripStats: () => "/api/v1/account/trip-stats",
  passkeyRegistrationOptions: () => "/api/v1/account/passkeys/options",
  passkeys: () => "/api/v1/account/passkeys",
  trustedDevice: (trustedDeviceId: string) => `/api/v1/account/trusted-devices/${segment(trustedDeviceId)}`,
  memberAccountLinks: (tripId: string, memberId: string) => `/api/v1/trips/${segment(tripId)}/members/${segment(memberId)}/account-links`,
  ownershipTransfers: (tripId: string) => `/api/v1/trips/${segment(tripId)}/ownership-transfers`,
};
```

- [ ] **Step 2: Update client tests first**

Replace every expected `/v1/...` URL in `frontend/src/trip/api-client.test.ts`, `frontend/src/account/api-client.test.ts`, and `frontend/src/trip/api-contract.test.ts` with the helper-generated `/api/v1/...` paths.

- [ ] **Step 3: Run client tests to verify failure**

Run:

```bash
cd frontend && rtk bun test src/trip/api-client.test.ts src/account/api-client.test.ts src/trip/api-contract.test.ts
```

Expected: FAIL until clients are updated.

- [ ] **Step 4: Update client implementations**

Use `tripApiRoutes` and `accountApiRoutes` everywhere instead of string literals. `patchItineraryItem` and `patchTask` must accept `tripId` if the new route needs trip context:

```ts
patchTask(tripId: string, taskId: string, sessionToken: string, request: PatchTaskApiRequest): Promise<TripTask>;
patchItineraryItem(tripId: string, itemId: string, sessionToken: string, request: PatchItineraryItemApiRequest): Promise<ItineraryItem>;
approveSuggestion(tripId: string, suggestionId: string, sessionToken: string): Promise<Suggestion>;
rejectSuggestion(tripId: string, suggestionId: string, sessionToken: string): Promise<Suggestion>;
```

Update all call sites in `frontend/src/app/SagittariusApp.tsx` to pass `trip.id`.

- [ ] **Step 5: Update local e2e health path**

In `frontend/scripts/run-local-real-api-e2e.ts`, change `/v1/health` to `/api/v1/health`.

- [ ] **Step 6: Run client tests**

Run:

```bash
cd frontend && rtk bun test src/trip/api-client.test.ts src/account/api-client.test.ts src/trip/api-contract.test.ts src/components/SagittariusApp.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/trip frontend/src/account frontend/src/app/SagittariusApp.tsx frontend/scripts/run-local-real-api-e2e.ts
git commit -m "feat: update frontend clients for api v1 routes"
```

### Task 8: Update MSW And Storybook Contracts

**Files:**
- Modify: `frontend/.storybook/msw-handlers.ts`
- Modify: `frontend/src/frontend-freeze.contract.test.ts`
- Modify: Storybook stories only if route props changed.

- [ ] **Step 1: Update freeze contract expectations**

Change MSW route expectations in `frontend/src/frontend-freeze.contract.test.ts` from `/v1/...` to `/api/v1/...`.

- [ ] **Step 2: Update handlers**

Change handlers in `frontend/.storybook/msw-handlers.ts`:

```ts
http.post("*/api/v1/trip-join-sessions", ...)
http.post("*/api/v1/trips/:tripId/members/:memberId/claims", ...)
http.post("*/api/v1/trips/:tripId/member-sessions", ...)
http.get("*/api/v1/trips/:tripId", ...)
http.patch("*/api/v1/trips/:tripId/itinerary-items/:itemId", ...)
http.post("*/api/v1/trips/:tripId/suggestions", ...)
http.patch("*/api/v1/trips/:tripId/suggestions/:suggestionId", ...)
http.post("*/api/v1/trips/:tripId/tasks", ...)
http.patch("*/api/v1/trips/:tripId/tasks/:taskId", ...)
http.delete("*/api/v1/trips/:tripId/member-sessions/current", ...)
```

For suggestion resolution, inspect the request body status and call the existing resolver with `approved` or `rejected`.

- [ ] **Step 3: Run Storybook contract tests**

Run:

```bash
cd frontend && rtk bun test src/frontend-freeze.contract.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/.storybook/msw-handlers.ts frontend/src/frontend-freeze.contract.test.ts
git commit -m "test: update storybook api route mocks"
```

### Task 9: Full Verification

**Files:**
- No new files expected.

- [ ] **Step 1: Run frontend verification**

Run:

```bash
rtk make frontend-verify
```

Expected: PASS.

- [ ] **Step 2: Run backend tests**

Run:

```bash
rtk make backend-test
```

Expected: PASS.

- [ ] **Step 3: Run full verification**

Run:

```bash
rtk make verify
```

Expected: PASS.

- [ ] **Step 4: Search for stale canonical route references**

Run:

```bash
rtk rg -n '"/v1/|`/v1/|/members\\?trip|/itinerary"|/map"|/timeline"|/members"' frontend backend docs/api-data-spec.md docs/frontend-core-freeze.md
```

Expected: no stale route references in active source or canonical docs. Historical plans under `docs/superpowers/plans` may still contain old routes and do not block shipping.

- [ ] **Step 5: Commit verification cleanup**

```bash
git status --short
git add docs frontend backend
git commit -m "chore: finish routing redesign verification"
```

## Self-Review

### Spec Coverage

- Frontend URL paths are covered by Tasks 2 and 3.
- Backend API paths are covered by Tasks 1, 4, 5, 6, and 7.
- MSW/Storybook contract drift is covered by Task 8.
- Full verification is covered by Task 9.
- No backward compatibility is assumed; Task 4 explicitly asserts old `/v1/health` is unsupported.

### Remaining Product Decisions

- Whether `/trips` should become a real account dashboard in the same branch. The plan uses a temporary bridge to avoid bundling dashboard UI design into the routing migration.
- Whether suggestion approval should remain command-like. The recommended target is `PATCH /suggestions/{id}` with explicit status because it keeps one suggestion resource URL.

### Ship Recommendation

`rework`: do the routing redesign now, before more frontend pages and backend vertical slices depend on the current mixed route scheme.

## Execution Verification

Completed implementation verification:

- `cd frontend && rtk bun run test -- src/trip/api-client.test.ts src/account/api-client.test.ts src/trip/api-contract.test.ts src/components/TripJoinGate.test.tsx src/components/SagittariusApp.test.tsx src/frontend-freeze.contract.test.ts src/project-contract.test.ts` -> 90 passed.
- `cd frontend && rtk bun run typecheck` -> passed after removing stale generated `.next/dev/types`.
- `cd frontend && rtk bun run lint` -> passed.
- `cd frontend && rtk bun run test` -> 196 passed, 1 skipped.
- `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml --test route_contract --test join_session_contract --test itinerary_patch_contract --test tasks_contract --test suggestions_contract --test realtime_contract --test account_auth_contract --test account_trip_contract` -> 89 passed.
- `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/sagittarius_test rtk cargo test --manifest-path backend/crates/sagittarius-api/Cargo.toml` -> 150 passed.
- Stale-path audit found no legacy frontend route or API path references in active source/canonical docs, aside from the intentional negative test for `/v1/health`.
